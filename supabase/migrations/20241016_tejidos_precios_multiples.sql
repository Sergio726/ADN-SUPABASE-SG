-- =====================================================
-- Migración: Sistema de precios múltiples para tejidos
-- =====================================================
-- Fecha: 2024-10-16
-- Descripción: Agregar sistema de 3 precios con porcentajes editables

-- =====================================================
-- 1. Agregar columnas de porcentajes
-- =====================================================
ALTER TABLE tejidos_configuraciones
ADD COLUMN IF NOT EXISTS margen_efectivo NUMERIC(5,2) DEFAULT 45.00,
ADD COLUMN IF NOT EXISTS margen_factura NUMERIC(5,2) DEFAULT 57.00,
ADD COLUMN IF NOT EXISTS margen_tarjeta NUMERIC(5,2) DEFAULT 65.00,
ADD COLUMN IF NOT EXISTS precio_lista NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS precio_tarjeta NUMERIC(10,2);

COMMENT ON COLUMN tejidos_configuraciones.margen_efectivo IS 'Margen sobre costo para precio efectivo (%)';
COMMENT ON COLUMN tejidos_configuraciones.margen_factura IS 'Margen sobre costo para precio lista/factura (%)';
COMMENT ON COLUMN tejidos_configuraciones.margen_tarjeta IS 'Margen sobre costo para precio tarjeta (%)';
COMMENT ON COLUMN tejidos_configuraciones.precio_lista IS 'Precio con factura (precio_costo × (100 + margen_factura) / 100)';
COMMENT ON COLUMN tejidos_configuraciones.precio_tarjeta IS 'Precio con tarjeta (precio_costo × (100 + margen_tarjeta) / 100)';

-- =====================================================
-- 2. Función para calcular todos los precios
-- =====================================================
CREATE OR REPLACE FUNCTION calcular_precios_tejido(
  p_cantidad_alambre NUMERIC,
  p_precio_alambre NUMERIC,
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
  v_precio_costo NUMERIC;
BEGIN
  -- Calcular precio de costo
  v_precio_costo := (p_cantidad_alambre * p_precio_alambre) + p_costo_mano_obra;
  
  -- Retornar todos los precios calculados
  RETURN QUERY SELECT
    v_precio_costo,
    ROUND(v_precio_costo * (100 + p_margen_efectivo) / 100, 2) as precio_venta,
    ROUND(v_precio_costo * (100 + p_margen_factura) / 100, 2) as precio_lista,
    ROUND(v_precio_costo * (100 + p_margen_tarjeta) / 100, 2) as precio_tarjeta;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcular_precios_tejido IS 'Calcula precio de costo, venta (efectivo), lista (factura) y tarjeta';

-- =====================================================
-- 3. Trigger para actualizar precios automáticamente
-- =====================================================
CREATE OR REPLACE FUNCTION actualizar_precios_tejido_completo()
RETURNS TRIGGER AS $$
DECLARE
  v_precio_alambre NUMERIC;
  v_precios RECORD;
BEGIN
  -- Obtener precio actual del alambre
  SELECT precio INTO v_precio_alambre
  FROM precio_alambre_base
  ORDER BY actualizado_en DESC
  LIMIT 1;
  
  -- Si no hay precio de alambre, usar 0
  IF v_precio_alambre IS NULL THEN
    v_precio_alambre := 0;
  END IF;
  
  -- Calcular todos los precios
  SELECT * INTO v_precios
  FROM calcular_precios_tejido(
    NEW.cantidad_alambre,
    v_precio_alambre,
    NEW.costo_mano_obra,
    COALESCE(NEW.margen_efectivo, 45.00),
    COALESCE(NEW.margen_factura, 57.00),
    COALESCE(NEW.margen_tarjeta, 65.00)
  );
  
  -- Asignar valores calculados
  NEW.precio_venta := v_precios.precio_venta;
  NEW.precio_lista := v_precios.precio_lista;
  NEW.precio_tarjeta := v_precios.precio_tarjeta;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar trigger anterior si existe
DROP TRIGGER IF EXISTS trigger_actualizar_precio_tejido ON tejidos_configuraciones;

-- Crear nuevo trigger
CREATE TRIGGER trigger_actualizar_precio_tejido
  BEFORE INSERT OR UPDATE ON tejidos_configuraciones
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_precios_tejido_completo();

COMMENT ON TRIGGER trigger_actualizar_precio_tejido ON tejidos_configuraciones IS 'Calcula automáticamente precio_venta, precio_lista y precio_tarjeta';

-- =====================================================
-- 4. Función para actualizar todos los tejidos
-- =====================================================
CREATE OR REPLACE FUNCTION actualizar_todos_precios_tejidos()
RETURNS void AS $$
DECLARE
  v_precio_alambre NUMERIC;
  v_tejido RECORD;
  v_precios RECORD;
BEGIN
  -- Obtener precio actual del alambre
  SELECT precio INTO v_precio_alambre
  FROM precio_alambre_base
  ORDER BY actualizado_en DESC
  LIMIT 1;
  
  IF v_precio_alambre IS NULL THEN
    RAISE EXCEPTION 'No hay precio de alambre base configurado';
  END IF;
  
  -- Actualizar cada tejido
  FOR v_tejido IN 
    SELECT * FROM tejidos_configuraciones WHERE activo = true
  LOOP
    -- Calcular precios
    SELECT * INTO v_precios
    FROM calcular_precios_tejido(
      v_tejido.cantidad_alambre,
      v_precio_alambre,
      v_tejido.costo_mano_obra,
      COALESCE(v_tejido.margen_efectivo, 45.00),
      COALESCE(v_tejido.margen_factura, 57.00),
      COALESCE(v_tejido.margen_tarjeta, 65.00)
    );
    
    -- Actualizar tejido
    UPDATE tejidos_configuraciones
    SET 
      precio_venta = v_precios.precio_venta,
      precio_lista = v_precios.precio_lista,
      precio_tarjeta = v_precios.precio_tarjeta,
      actualizado_en = NOW()
    WHERE id = v_tejido.id;
  END LOOP;
  
  RAISE NOTICE 'Precios actualizados correctamente';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION actualizar_todos_precios_tejidos IS 'Actualiza los 3 precios de todos los tejidos activos según precio alambre actual';

-- =====================================================
-- 5. Actualizar vista con nuevos precios
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
-- 6. Actualizar precios existentes con valores por defecto
-- =====================================================
-- Ejecutar actualización inicial
SELECT actualizar_todos_precios_tejidos();

-- =====================================================
-- Fin de la migración
-- =====================================================

