-- =====================================================
-- Fix: Vista mejorada con todos los cálculos de costos
-- =====================================================

DROP VIEW IF EXISTS v_configuraciones_cercado_completas CASCADE;

CREATE OR REPLACE VIEW v_configuraciones_cercado_completas AS
SELECT 
  cc.*,
  -- Datos del tejido
  tc.nombre as tejido_nombre,
  tc.codigo as tejido_codigo,
  tc.calibre,
  tc.tamano_rombo,
  tc.precio_venta as precio_tejido_unitario,
  
  -- Cálculos de costos
  (tc.precio_venta * 18) as costo_tejido_total, -- 18 rollos para 180m
  
  (
    (cc.cantidad_postes_esquineros * cc.precio_poste_esquinero) +
    (cc.cantidad_postes_refuerzos * cc.precio_poste_refuerzo) +
    (cc.cantidad_postes_intermedios * cc.precio_poste_intermedio) +
    (cc.cantidad_puntales * cc.precio_puntal)
  ) as costo_postes_total,
  
  (180 * cc.hilos_pua * cc.precio_pua_por_metro) as costo_pua_total,
  
  (180 * cc.precio_mano_obra_por_metro) as costo_mano_obra_total,
  
  (180 * cc.precio_transporte_por_metro) as costo_transporte_total

FROM configuraciones_cercado cc
LEFT JOIN tejidos_configuraciones tc ON cc.tejido_config_id = tc.id;

COMMENT ON VIEW v_configuraciones_cercado_completas IS 'Vista con información completa y cálculos de costos de configuraciones de cercado';

-- Otorgar permisos
GRANT SELECT ON v_configuraciones_cercado_completas TO authenticated;
GRANT SELECT ON v_configuraciones_cercado_completas TO anon;

