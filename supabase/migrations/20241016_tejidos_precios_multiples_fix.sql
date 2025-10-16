-- =====================================================
-- Migración: Sistema de precios múltiples para tejidos (CORREGIDA)
-- =====================================================
-- Fecha: 2024-10-16
-- Descripción: Agregar sistema de 3 precios con porcentajes editables
-- NOTA: Esta versión NO depende de precio_alambre_base

-- =====================================================
-- 1. Renombrar columnas existentes
-- =====================================================
-- peso_kg → cantidad_alambre
ALTER TABLE tejidos_configuraciones 
RENAME COLUMN peso_kg TO cantidad_alambre;

-- mano_obra → costo_mano_obra
ALTER TABLE tejidos_configuraciones 
RENAME COLUMN mano_obra TO costo_mano_obra;

-- =====================================================
-- 2. Agregar columnas de porcentajes y nuevos precios
-- =====================================================
ALTER TABLE tejidos_configuraciones
ADD COLUMN IF NOT EXISTS margen_efectivo NUMERIC(5,2) DEFAULT 45.00,
ADD COLUMN IF NOT EXISTS margen_factura NUMERIC(5,2) DEFAULT 57.00,
ADD COLUMN IF NOT EXISTS margen_tarjeta NUMERIC(5,2) DEFAULT 65.00,
ADD COLUMN IF NOT EXISTS precio_lista NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS precio_tarjeta NUMERIC(10,2);

-- Copiar margen_porcentaje existente a margen_efectivo si existe
UPDATE tejidos_configuraciones
SET margen_efectivo = COALESCE(margen_porcentaje, 45.00)
WHERE margen_efectivo IS NULL;

COMMENT ON COLUMN tejidos_configuraciones.cantidad_alambre IS 'Kilogramos de alambre galvanizado necesarios';
COMMENT ON COLUMN tejidos_configuraciones.costo_mano_obra IS 'Costo de mano de obra de fabricación';
COMMENT ON COLUMN tejidos_configuraciones.margen_efectivo IS 'Margen sobre costo para precio efectivo (%) - Default 45%';
COMMENT ON COLUMN tejidos_configuraciones.margen_factura IS 'Margen sobre costo para precio lista/factura (%) - Default 57%';
COMMENT ON COLUMN tejidos_configuraciones.margen_tarjeta IS 'Margen sobre costo para precio tarjeta (%) - Default 65%';
COMMENT ON COLUMN tejidos_configuraciones.precio_venta IS 'Precio efectivo (sin factura) = precio_costo × (1 + margen_efectivo/100)';
COMMENT ON COLUMN tejidos_configuraciones.precio_lista IS 'Precio con factura = precio_costo × (1 + margen_factura/100)';
COMMENT ON COLUMN tejidos_configuraciones.precio_tarjeta IS 'Precio con tarjeta = precio_costo × (1 + margen_tarjeta/100)';

-- =====================================================
-- 3. Función para calcular todos los precios desde alambre
-- =====================================================
CREATE OR REPLACE FUNCTION calcular_precios_tejido_desde_alambre(
  p_cantidad_alambre NUMERIC,
  p_alambre_articulo_id INTEGER,
  p_costo_mano_obra NUMERIC,
  p_margen_efectivo NUMERIC DEFAULT 45.00,
  p_margen_factura NUMERIC DEFAULT 57.00,
  p_margen_tarjeta NUMERIC DEFAULT 65.00
)
RETURNS TABLE(
  precio_costo NUMERIC,
  precio_venta NUMERIC,
  precio_lista NUMERIC,
  precio_tarjeta NUMERIC
) AS $$
DECLARE
  v_precio_alambre NUMERIC;
  v_precio_costo NUMERIC;
BEGIN
  -- Obtener precio del alambre desde precios_venta
  SELECT precio_costo INTO v_precio_alambre
  FROM precios_venta
  WHERE articulo_id = p_alambre_articulo_id
    AND vigente = true
  ORDER BY fecha_desde DESC
  LIMIT 1;
  
  -- Si no hay precio, usar 0
  IF v_precio_alambre IS NULL THEN
    v_precio_alambre := 0;
  END IF;
  
  -- Calcular precio de costo
  v_precio_costo := (p_cantidad_alambre * v_precio_alambre) + p_costo_mano_obra;
  
  -- Retornar todos los precios calculados
  RETURN QUERY SELECT
    v_precio_costo,
    ROUND(v_precio_costo * (100 + p_margen_efectivo) / 100, 2) as precio_venta,
    ROUND(v_precio_costo * (100 + p_margen_factura) / 100, 2) as precio_lista,
    ROUND(v_precio_costo * (100 + p_margen_tarjeta) / 100, 2) as precio_tarjeta;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcular_precios_tejido_desde_alambre IS 'Calcula precio de costo, venta (efectivo), lista (factura) y tarjeta desde el artículo de alambre';

-- =====================================================
-- 4. Trigger para actualizar precios automáticamente
-- =====================================================
CREATE OR REPLACE FUNCTION actualizar_precios_tejido_completo()
RETURNS TRIGGER AS $$
DECLARE
  v_precios RECORD;
BEGIN
  -- Calcular todos los precios
  SELECT * INTO v_precios
  FROM calcular_precios_tejido_desde_alambre(
    NEW.cantidad_alambre,
    NEW.alambre_articulo_id,
    NEW.costo_mano_obra,
    COALESCE(NEW.margen_efectivo, 45.00),
    COALESCE(NEW.margen_factura, 57.00),
    COALESCE(NEW.margen_tarjeta, 65.00)
  );
  
  -- Asignar valores calculados
  NEW.precio_costo := v_precios.precio_costo;
  NEW.precio_venta := v_precios.precio_venta;
  NEW.precio_lista := v_precios.precio_lista;
  NEW.precio_tarjeta := v_precios.precio_tarjeta;
  
  -- Actualizar timestamp
  NEW.actualizado_en := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar trigger anterior si existe
DROP TRIGGER IF EXISTS trigger_actualizar_precio_tejido ON tejidos_configuraciones;
DROP TRIGGER IF EXISTS trigger_actualizar_precio_venta ON tejidos_configuraciones;

-- Crear nuevo trigger
CREATE TRIGGER trigger_actualizar_precio_tejido
  BEFORE INSERT OR UPDATE ON tejidos_configuraciones
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_precios_tejido_completo();

COMMENT ON TRIGGER trigger_actualizar_precio_tejido ON tejidos_configuraciones IS 'Calcula automáticamente precio_costo, precio_venta, precio_lista y precio_tarjeta';

-- =====================================================
-- 5. Función para actualizar todos los tejidos manualmente
-- =====================================================
CREATE OR REPLACE FUNCTION actualizar_todos_precios_tejidos()
RETURNS void AS $$
DECLARE
  v_tejido RECORD;
  v_precios RECORD;
  v_count INTEGER := 0;
BEGIN
  -- Actualizar cada tejido activo
  FOR v_tejido IN 
    SELECT * FROM tejidos_configuraciones WHERE activo = true
  LOOP
    -- Calcular precios
    SELECT * INTO v_precios
    FROM calcular_precios_tejido_desde_alambre(
      v_tejido.cantidad_alambre,
      v_tejido.alambre_articulo_id,
      v_tejido.costo_mano_obra,
      COALESCE(v_tejido.margen_efectivo, 45.00),
      COALESCE(v_tejido.margen_factura, 57.00),
      COALESCE(v_tejido.margen_tarjeta, 65.00)
    );
    
    -- Actualizar tejido
    UPDATE tejidos_configuraciones
    SET 
      precio_costo = v_precios.precio_costo,
      precio_venta = v_precios.precio_venta,
      precio_lista = v_precios.precio_lista,
      precio_tarjeta = v_precios.precio_tarjeta,
      actualizado_en = NOW()
    WHERE id = v_tejido.id;
    
    v_count := v_count + 1;
  END LOOP;
  
  RAISE NOTICE 'Precios actualizados correctamente para % tejidos', v_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION actualizar_todos_precios_tejidos IS 'Actualiza los 3 precios de todos los tejidos activos según precios actuales de alambre';

-- =====================================================
-- 6. Actualizar vista con nuevos precios
-- =====================================================
DROP VIEW IF EXISTS v_tejidos_con_precios CASCADE;

CREATE OR REPLACE VIEW v_tejidos_con_precios AS
SELECT 
  tc.*,
  a.nombre as alambre_nombre,
  pv.precio_costo as alambre_precio_kg,
  art.nombre as articulo_nombre,
  (tc.precio_venta / tc.largo) as precio_por_metro_efectivo,
  (tc.precio_lista / tc.largo) as precio_por_metro_lista,
  (tc.precio_tarjeta / tc.largo) as precio_por_metro_tarjeta,
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

COMMENT ON VIEW v_tejidos_con_precios IS 'Vista con información completa de tejidos y 3 precios (efectivo, lista, tarjeta)';

-- Otorgar permisos
GRANT SELECT ON v_tejidos_con_precios TO authenticated;
GRANT SELECT ON v_tejidos_con_precios TO anon;

-- =====================================================
-- 7. Actualizar precios existentes
-- =====================================================
-- Ejecutar actualización inicial
SELECT actualizar_todos_precios_tejidos();

-- =====================================================
-- 8. Eliminar columna antigua (opcional)
-- =====================================================
-- Puedes descomentar esta línea si quieres eliminar la columna vieja
-- ALTER TABLE tejidos_configuraciones DROP COLUMN IF EXISTS margen_porcentaje;

-- =====================================================
-- Fin de la migración
-- =====================================================

