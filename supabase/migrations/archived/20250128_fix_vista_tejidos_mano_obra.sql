-- =====================================================
-- Fix: Asegurar que v_tejidos_con_precios incluya mano_obra
-- =====================================================

DROP VIEW IF EXISTS v_tejidos_con_precios CASCADE;

CREATE OR REPLACE VIEW v_tejidos_con_precios AS
SELECT 
  tc.id,
  tc.codigo,
  tc.nombre,
  tc.descripcion,
  tc.calibre,
  tc.altura,
  tc.tamano_rombo,
  tc.largo,
  tc.cantidad_alambre,  -- Antes se llamaba peso_kg
  tc.costo_mano_obra as mano_obra,  -- Renombrado para compatibilidad con código existente
  tc.horas_fabricacion,
  tc.margen_efectivo,
  tc.margen_factura,
  tc.margen_tarjeta,
  tc.alambre_articulo_id,
  tc.precio_costo,
  tc.precio_venta,
  tc.precio_lista,
  tc.precio_tarjeta,
  tc.margen_porcentaje,
  tc.articulo_id,
  tc.categoria_calidad,
  tc.activo,
  tc.usuario_id,
  tc.creado_en,
  tc.actualizado_en,
  -- Campos adicionales de JOINs
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

COMMENT ON VIEW v_tejidos_con_precios IS 'Vista con información completa de tejidos, incluyendo mano_obra y 3 precios (efectivo, lista, tarjeta)';

-- Otorgar permisos
GRANT SELECT ON v_tejidos_con_precios TO authenticated;
GRANT SELECT ON v_tejidos_con_precios TO anon;

