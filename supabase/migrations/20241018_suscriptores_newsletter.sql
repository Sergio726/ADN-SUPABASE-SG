-- =====================================================
-- Migración: Sistema de Suscriptores Newsletter
-- Fecha: 2024-10-18
-- Descripción: Tabla para gestionar suscriptores con descuentos por teléfono
-- =====================================================

-- =====================================================
-- Tabla: suscriptores_newsletter
-- =====================================================
CREATE TABLE IF NOT EXISTS suscriptores_newsletter (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Datos de contacto
  email VARCHAR(255) NOT NULL,
  telefono VARCHAR(50),
  nombre VARCHAR(200),
  
  -- Tipo de suscripción
  tipo_suscripcion VARCHAR(20) NOT NULL CHECK (tipo_suscripcion IN ('email', 'telefono', 'ambos')),
  
  -- Descuento aplicable
  descuento_porcentaje DECIMAL(5,2) DEFAULT 0.00,
  descuento_aplicado BOOLEAN DEFAULT false,
  codigo_descuento VARCHAR(20) UNIQUE,
  
  -- Estado
  activo BOOLEAN DEFAULT true,
  verificado BOOLEAN DEFAULT false,
  
  -- Metadatos
  origen VARCHAR(50) DEFAULT 'web',
  ip_address INET,
  user_agent TEXT,
  
  -- Auditoría
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ultimo_envio TIMESTAMP WITH TIME ZONE
);

-- Índices
CREATE UNIQUE INDEX idx_suscriptores_email ON suscriptores_newsletter(email);
CREATE INDEX idx_suscriptores_telefono ON suscriptores_newsletter(telefono);
CREATE INDEX idx_suscriptores_activo ON suscriptores_newsletter(activo);
CREATE INDEX idx_suscriptores_tipo ON suscriptores_newsletter(tipo_suscripcion);
CREATE INDEX idx_suscriptores_descuento ON suscriptores_newsletter(descuento_aplicado);
CREATE INDEX idx_suscriptores_codigo ON suscriptores_newsletter(codigo_descuento);

-- Trigger para actualizar timestamp
CREATE OR REPLACE FUNCTION actualizar_suscriptores_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_suscriptores
  BEFORE UPDATE ON suscriptores_newsletter
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_suscriptores_timestamp();

-- =====================================================
-- Función para generar código de descuento
-- =====================================================
CREATE OR REPLACE FUNCTION generar_codigo_descuento()
RETURNS TEXT AS $$
DECLARE
  codigo TEXT;
  existe BOOLEAN;
BEGIN
  LOOP
    -- Generar código alfanumérico de 8 caracteres
    codigo := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Verificar si ya existe
    SELECT EXISTS(SELECT 1 FROM suscriptores_newsletter WHERE codigo_descuento = codigo) INTO existe;
    
    -- Si no existe, salir del loop
    IF NOT existe THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN codigo;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Función para crear suscriptor con descuento
-- =====================================================
CREATE OR REPLACE FUNCTION crear_suscriptor_con_descuento(
  p_email VARCHAR(255),
  p_telefono VARCHAR(50) DEFAULT NULL,
  p_nombre VARCHAR(200) DEFAULT NULL,
  p_origen VARCHAR(50) DEFAULT 'web',
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_suscriptor_id UUID;
  v_tipo_suscripcion VARCHAR(20);
  v_descuento_porcentaje DECIMAL(5,2);
  v_codigo_descuento VARCHAR(20);
  v_resultado JSON;
BEGIN
  -- Determinar tipo de suscripción y descuento
  IF p_telefono IS NOT NULL AND p_telefono != '' THEN
    v_tipo_suscripcion := 'telefono';
    v_descuento_porcentaje := 10.00;
  ELSE
    v_tipo_suscripcion := 'email';
    v_descuento_porcentaje := 0.00;
  END IF;
  
  -- Generar código de descuento si aplica
  IF v_descuento_porcentaje > 0 THEN
    v_codigo_descuento := generar_codigo_descuento();
  END IF;
  
  -- Insertar suscriptor
  INSERT INTO suscriptores_newsletter (
    email, telefono, nombre, tipo_suscripcion, 
    descuento_porcentaje, codigo_descuento,
    origen, ip_address, user_agent
  ) VALUES (
    p_email, p_telefono, p_nombre, v_tipo_suscripcion,
    v_descuento_porcentaje, v_codigo_descuento,
    p_origen, p_ip_address, p_user_agent
  ) RETURNING id INTO v_suscriptor_id;
  
  -- Preparar respuesta
  v_resultado := json_build_object(
    'id', v_suscriptor_id,
    'email', p_email,
    'telefono', p_telefono,
    'tipo_suscripcion', v_tipo_suscripcion,
    'descuento_porcentaje', v_descuento_porcentaje,
    'codigo_descuento', v_codigo_descuento,
    'mensaje', CASE 
      WHEN v_descuento_porcentaje > 0 THEN '¡Te has suscrito exitosamente! Recibiste un 10% de descuento en tu primera compra.'
      ELSE '¡Te has suscrito exitosamente! Recibirás nuestras promociones por email.'
    END
  );
  
  RETURN v_resultado;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================
ALTER TABLE suscriptores_newsletter ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserción pública (suscripciones desde web)
CREATE POLICY "Permitir suscripciones públicas" ON suscriptores_newsletter
  FOR INSERT WITH CHECK (true);

-- Política para lectura solo a usuarios autenticados
CREATE POLICY "Lectura solo para autenticados" ON suscriptores_newsletter
  FOR SELECT USING (auth.role() = 'authenticated');

-- Política para actualización solo a usuarios autenticados
CREATE POLICY "Actualización solo para autenticados" ON suscriptores_newsletter
  FOR UPDATE USING (auth.role() = 'authenticated');
