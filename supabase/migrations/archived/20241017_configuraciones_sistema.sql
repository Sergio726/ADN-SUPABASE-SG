-- =====================================================
-- MIGRACIÓN: Sistema de Configuraciones
-- Descripción: Tabla para almacenar configuraciones del sistema (SMTP, etc.)
-- =====================================================

-- Crear tabla de configuraciones
CREATE TABLE IF NOT EXISTS configuraciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo VARCHAR(50) NOT NULL, -- 'smtp', 'general', etc.
  clave VARCHAR(100) NOT NULL, -- Identificador único de la config
  
  -- Configuración SMTP
  smtp_host VARCHAR(255),
  smtp_port INTEGER,
  smtp_secure BOOLEAN DEFAULT false, -- true para SSL (465), false para TLS (587)
  smtp_usuario VARCHAR(255),
  smtp_password TEXT, -- Será cifrada en la aplicación
  email_from VARCHAR(255), -- Email remitente
  email_from_name VARCHAR(255), -- Nombre del remitente
  email_to VARCHAR(255), -- Email destinatario por defecto
  
  -- Metadatos
  activo BOOLEAN DEFAULT true,
  usuario_id UUID REFERENCES auth.users(id),
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint para evitar duplicados
  UNIQUE(tipo, clave)
);

-- Índices
CREATE INDEX idx_configuraciones_tipo ON configuraciones(tipo);
CREATE INDEX idx_configuraciones_activo ON configuraciones(activo);
CREATE INDEX idx_configuraciones_usuario ON configuraciones(usuario_id);

-- Trigger para actualizar fecha de modificación
CREATE OR REPLACE FUNCTION actualizar_fecha_configuraciones()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_configuraciones
  BEFORE UPDATE ON configuraciones
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_fecha_configuraciones();

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================

ALTER TABLE configuraciones ENABLE ROW LEVEL SECURITY;

-- Política: Solo usuarios autenticados pueden leer configuraciones
CREATE POLICY configuraciones_select_autenticado 
  ON configuraciones FOR SELECT 
  TO authenticated 
  USING (true);

-- Política: Solo usuarios autenticados pueden insertar configuraciones
CREATE POLICY configuraciones_insert_autenticado 
  ON configuraciones FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = usuario_id);

-- Política: Solo el creador puede actualizar sus configuraciones
CREATE POLICY configuraciones_update_propio 
  ON configuraciones FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);

-- Política: Solo el creador puede eliminar sus configuraciones
CREATE POLICY configuraciones_delete_propio 
  ON configuraciones FOR DELETE 
  TO authenticated 
  USING (auth.uid() = usuario_id);

-- =====================================================
-- Comentarios
-- =====================================================

COMMENT ON TABLE configuraciones IS 'Almacena configuraciones del sistema (SMTP, general, etc.)';
COMMENT ON COLUMN configuraciones.tipo IS 'Tipo de configuración: smtp, general, etc.';
COMMENT ON COLUMN configuraciones.clave IS 'Identificador único de la configuración';
COMMENT ON COLUMN configuraciones.smtp_secure IS 'true para SSL (puerto 465), false para TLS (puerto 587)';
COMMENT ON COLUMN configuraciones.smtp_password IS 'Contraseña SMTP (debe ser cifrada en la aplicación)';

