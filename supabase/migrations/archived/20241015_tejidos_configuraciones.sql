-- =====================================================
-- Migración: Sistema de Tejidos Romboidales
-- Fecha: 2024-10-15
-- Descripción: Tabla para gestionar configuraciones de tejidos romboidales
-- =====================================================

-- Crear tabla de tejidos_configuraciones
CREATE TABLE IF NOT EXISTS tejidos_configuraciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificación
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT,
  
  -- Especificaciones técnicas
  calibre INTEGER NOT NULL CHECK (calibre IN (12, 14)),
  altura DECIMAL(3,2) NOT NULL CHECK (altura IN (1.00, 1.20, 1.50, 1.80, 2.00)),
  tamano_rombo DECIMAL(3,1) NOT NULL CHECK (tamano_rombo IN (2.0, 2.5, 3.0, 3.5)),
  largo DECIMAL(4,2) DEFAULT 10.00, -- metros
  
  -- Fabricación
  peso_kg DECIMAL(6,2) NOT NULL,
  mano_obra DECIMAL(10,2) NOT NULL,
  horas_fabricacion DECIMAL(4,2),
  
  -- Relación con alambre galvanizado (materia prima)
  alambre_articulo_id INTEGER REFERENCES articulos(id) NOT NULL,
  
  -- Precios calculados (se actualizan automáticamente)
  precio_costo DECIMAL(10,2),
  precio_venta DECIMAL(10,2),
  margen_porcentaje DECIMAL(5,2) DEFAULT 30.00,
  
  -- Relación con catálogo de artículos (se crea automáticamente)
  articulo_id INTEGER REFERENCES articulos(id),
  
  -- Categoría de calidad
  categoria_calidad VARCHAR(50) CHECK (categoria_calidad IN ('Económica', 'Standard', 'Reforzada')),
  
  -- Control
  activo BOOLEAN DEFAULT true,
  usuario_id UUID REFERENCES auth.users(id),
  creado_en TIMESTAMP DEFAULT NOW(),
  actualizado_en TIMESTAMP DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX idx_tejidos_calibre ON tejidos_configuraciones(calibre);
CREATE INDEX idx_tejidos_altura ON tejidos_configuraciones(altura);
CREATE INDEX idx_tejidos_rombo ON tejidos_configuraciones(tamano_rombo);
CREATE INDEX idx_tejidos_activo ON tejidos_configuraciones(activo);
CREATE INDEX idx_tejidos_alambre ON tejidos_configuraciones(alambre_articulo_id);
CREATE INDEX idx_tejidos_codigo ON tejidos_configuraciones(codigo);

-- Comentarios en la tabla
COMMENT ON TABLE tejidos_configuraciones IS 'Configuraciones de tejidos romboidales fabricados';
COMMENT ON COLUMN tejidos_configuraciones.codigo IS 'Código único del tejido (ej: RC14x3,5x2)';
COMMENT ON COLUMN tejidos_configuraciones.peso_kg IS 'Peso en kg de alambre galvanizado necesario';
COMMENT ON COLUMN tejidos_configuraciones.mano_obra IS 'Costo fijo de mano de obra de fabricación';
COMMENT ON COLUMN tejidos_configuraciones.precio_costo IS 'Calculado: (peso_kg × precio_alambre) + mano_obra';
COMMENT ON COLUMN tejidos_configuraciones.precio_venta IS 'Calculado: precio_costo × (1 + margen/100)';

-- =====================================================
-- Función: Calcular precio del tejido
-- =====================================================
CREATE OR REPLACE FUNCTION calcular_precio_tejido(config_id UUID)
RETURNS TABLE(
  precio_costo DECIMAL,
  precio_venta DECIMAL
) AS $$
DECLARE
  v_config RECORD;
  v_precio_alambre DECIMAL;
  v_costo DECIMAL;
  v_venta DECIMAL;
  v_margen DECIMAL;
BEGIN
  -- Obtener configuración del tejido
  SELECT * INTO v_config
  FROM tejidos_configuraciones
  WHERE id = config_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Configuración de tejido no encontrada: %', config_id;
  END IF;
  
  -- Obtener precio vigente del alambre galvanizado
  SELECT pv.precio_costo INTO v_precio_alambre
  FROM precios_venta pv
  WHERE pv.articulo_id = v_config.alambre_articulo_id
    AND pv.vigente = true
  ORDER BY pv.fecha_inicio DESC
  LIMIT 1;
  
  IF v_precio_alambre IS NULL THEN
    RAISE EXCEPTION 'No hay precio vigente para el alambre galvanizado (articulo_id: %)', v_config.alambre_articulo_id;
  END IF;
  
  -- Calcular costo: (kg × precio_alambre) + mano_obra
  v_costo := (v_config.peso_kg * v_precio_alambre) + v_config.mano_obra;
  
  -- Calcular precio de venta con margen
  v_margen := COALESCE(v_config.margen_porcentaje, 30.00);
  v_venta := v_costo * (1 + (v_margen / 100));
  
  RETURN QUERY SELECT v_costo, v_venta;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcular_precio_tejido IS 'Calcula el precio de costo y venta de un tejido basado en el precio actual del alambre';

-- =====================================================
-- Función: Actualizar precios de un tejido
-- =====================================================
CREATE OR REPLACE FUNCTION actualizar_precio_tejido(config_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_precios RECORD;
BEGIN
  -- Calcular nuevos precios
  SELECT * INTO v_precios
  FROM calcular_precio_tejido(config_id);
  
  -- Actualizar en tejidos_configuraciones
  UPDATE tejidos_configuraciones
  SET 
    precio_costo = v_precios.precio_costo,
    precio_venta = v_precios.precio_venta,
    actualizado_en = NOW()
  WHERE id = config_id;
  
  -- Si tiene un artículo asociado, actualizar también en precios_venta
  UPDATE precios_venta pv
  SET
    precio_costo = v_precios.precio_costo,
    precio_venta = v_precios.precio_venta,
    margen = NEW.margen_porcentaje
  FROM tejidos_configuraciones tc
  WHERE tc.id = config_id
    AND pv.articulo_id = tc.articulo_id
    AND pv.vigente = true;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION actualizar_precio_tejido IS 'Actualiza los precios de un tejido y su artículo asociado';

-- =====================================================
-- Trigger: Actualizar precios cuando cambia alambre
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_actualizar_precios_tejidos()
RETURNS TRIGGER AS $$
BEGIN
  -- Cuando se inserta o actualiza un precio de alambre galvanizado
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.vigente = true THEN
    
    -- Actualizar todos los tejidos que usan ese alambre
    UPDATE tejidos_configuraciones tc
    SET 
      precio_costo = calc.precio_costo,
      precio_venta = calc.precio_venta,
      actualizado_en = NOW()
    FROM LATERAL calcular_precio_tejido(tc.id) calc
    WHERE tc.alambre_articulo_id = NEW.articulo_id
      AND tc.activo = true;
    
    -- También actualizar en precios_venta si existe
    UPDATE precios_venta pv
    SET
      precio_costo = tc.precio_costo,
      precio_venta = tc.precio_venta,
      margen = tc.margen_porcentaje
    FROM tejidos_configuraciones tc
    WHERE tc.alambre_articulo_id = NEW.articulo_id
      AND pv.articulo_id = tc.articulo_id
      AND pv.vigente = true
      AND tc.activo = true;
      
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger
DROP TRIGGER IF EXISTS trg_actualizar_precios_tejidos ON precios_venta;
CREATE TRIGGER trg_actualizar_precios_tejidos
AFTER INSERT OR UPDATE ON precios_venta
FOR EACH ROW
EXECUTE FUNCTION trigger_actualizar_precios_tejidos();

COMMENT ON TRIGGER trg_actualizar_precios_tejidos ON precios_venta IS 'Actualiza automáticamente precios de tejidos cuando cambia el precio del alambre';

-- =====================================================
-- Trigger: Actualizar timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_tejidos_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_tejidos_timestamp ON tejidos_configuraciones;
CREATE TRIGGER trg_update_tejidos_timestamp
BEFORE UPDATE ON tejidos_configuraciones
FOR EACH ROW
EXECUTE FUNCTION update_tejidos_timestamp();

-- =====================================================
-- RLS Policies
-- =====================================================

-- Habilitar RLS
ALTER TABLE tejidos_configuraciones ENABLE ROW LEVEL SECURITY;

-- Policy: Lectura pública para tejidos activos
CREATE POLICY "Tejidos activos son visibles para todos"
ON tejidos_configuraciones
FOR SELECT
USING (activo = true);

-- Policy: Usuarios autenticados pueden ver todos los tejidos
CREATE POLICY "Usuarios autenticados pueden ver todos los tejidos"
ON tejidos_configuraciones
FOR SELECT
TO authenticated
USING (true);

-- Policy: Solo admins pueden insertar
CREATE POLICY "Solo admins pueden insertar tejidos"
ON tejidos_configuraciones
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = auth.uid()
    AND usuarios.rol = 'admin'
  )
);

-- Policy: Solo admins pueden actualizar
CREATE POLICY "Solo admins pueden actualizar tejidos"
ON tejidos_configuraciones
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = auth.uid()
    AND usuarios.rol = 'admin'
  )
);

-- Policy: Solo admins pueden eliminar
CREATE POLICY "Solo admins pueden eliminar tejidos"
ON tejidos_configuraciones
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = auth.uid()
    AND usuarios.rol = 'admin'
  )
);

-- =====================================================
-- Función helper: Obtener precio por metro lineal
-- =====================================================
CREATE OR REPLACE FUNCTION get_precio_tejido_por_metro(config_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_precio_rollo DECIMAL;
  v_largo DECIMAL;
BEGIN
  SELECT precio_venta, largo
  INTO v_precio_rollo, v_largo
  FROM tejidos_configuraciones
  WHERE id = config_id AND activo = true;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  RETURN v_precio_rollo / v_largo;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_precio_tejido_por_metro IS 'Retorna el precio por metro lineal de un tejido';

-- =====================================================
-- Vista: Tejidos con precios actuales
-- =====================================================
CREATE OR REPLACE VIEW v_tejidos_con_precios AS
SELECT 
  tc.*,
  a.nombre as alambre_nombre,
  pv.precio_costo as alambre_precio_kg,
  art.nombre as articulo_nombre,
  (tc.precio_venta / tc.largo) as precio_por_metro,
  CASE 
    WHEN tc.tamano_rombo = 3.5 THEN 'Económica'
    WHEN tc.tamano_rombo = 3.0 THEN 'Standard'
    ELSE 'Reforzada'
  END as calidad_sugerida
FROM tejidos_configuraciones tc
LEFT JOIN articulos a ON tc.alambre_articulo_id = a.id
LEFT JOIN precios_venta pv ON pv.articulo_id = a.id AND pv.vigente = true
LEFT JOIN articulos art ON tc.articulo_id = art.id
WHERE tc.activo = true;

COMMENT ON VIEW v_tejidos_con_precios IS 'Vista con información completa de tejidos y precios actuales';

-- =====================================================
-- Fin de la migración
-- =====================================================

