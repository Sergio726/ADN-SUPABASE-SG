-- =====================================================
-- Fix: Corregir fecha_desde a fecha_inicio en función de tejidos
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
  SELECT pv.precio_costo INTO v_precio_alambre
  FROM precios_venta pv
  WHERE pv.articulo_id = p_alambre_articulo_id
    AND pv.vigente = true
  ORDER BY pv.fecha_inicio DESC  -- ← CORREGIDO: fecha_inicio en lugar de fecha_desde
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

-- =====================================================
-- Fin del fix
-- =====================================================

