-- =====================================================
-- Migración: Actualizar precios de postes y puntales de hormigón
-- Fecha: 2025-01-31
-- Descripción: Actualiza el precio de venta (base) de postes de hormigón 
--              y puntales de hormigón al 45% de margen sobre el precio de costo
--              Fórmula: precio_venta = precio_costo * 1.45
-- =====================================================

-- Actualizar precios de postes de hormigón
UPDATE precios_venta pv
SET precio_venta = ROUND(pv.precio_costo * 1.45, 2)
FROM articulos a
WHERE pv.articulo_id = a.id
  AND pv.vigente = true
  AND (
    -- Buscar postes de hormigón por nombre
    LOWER(a.nombre) LIKE '%poste%hormigón%' OR
    LOWER(a.nombre) LIKE '%poste%hormigon%' OR
    LOWER(a.nombre) LIKE '%poste%cemento%' OR
    LOWER(a.nombre) LIKE '%poste%concreto%' OR
    (LOWER(a.nombre) LIKE '%poste%' AND LOWER(a.nombre) LIKE '%hormig%') OR
    (LOWER(a.nombre) LIKE '%poste%' AND LOWER(a.nombre) LIKE '%cemento%')
  )
  AND pv.precio_costo > 0; -- Solo actualizar si hay precio de costo válido

-- Actualizar precios de puntales de hormigón
UPDATE precios_venta pv
SET precio_venta = ROUND(pv.precio_costo * 1.45, 2)
FROM articulos a
WHERE pv.articulo_id = a.id
  AND pv.vigente = true
  AND (
    -- Buscar puntales de hormigón por nombre
    LOWER(a.nombre) LIKE '%puntal%hormigón%' OR
    LOWER(a.nombre) LIKE '%puntal%hormigon%' OR
    LOWER(a.nombre) LIKE '%puntal%cemento%' OR
    LOWER(a.nombre) LIKE '%puntal%concreto%' OR
    (LOWER(a.nombre) LIKE '%puntal%' AND LOWER(a.nombre) LIKE '%hormig%') OR
    (LOWER(a.nombre) LIKE '%puntal%' AND LOWER(a.nombre) LIKE '%cemento%')
  )
  AND pv.precio_costo > 0; -- Solo actualizar si hay precio de costo válido

-- Mostrar resumen de actualizaciones
DO $$
DECLARE
  v_postes_actualizados INTEGER;
  v_puntales_actualizados INTEGER;
BEGIN
  -- Contar postes actualizados
  SELECT COUNT(*) INTO v_postes_actualizados
  FROM precios_venta pv
  INNER JOIN articulos a ON pv.articulo_id = a.id
  WHERE pv.vigente = true
    AND (
      LOWER(a.nombre) LIKE '%poste%hormigón%' OR
      LOWER(a.nombre) LIKE '%poste%hormigon%' OR
      LOWER(a.nombre) LIKE '%poste%cemento%' OR
      LOWER(a.nombre) LIKE '%poste%concreto%' OR
      (LOWER(a.nombre) LIKE '%poste%' AND LOWER(a.nombre) LIKE '%hormig%') OR
      (LOWER(a.nombre) LIKE '%poste%' AND LOWER(a.nombre) LIKE '%cemento%')
    )
    AND pv.precio_venta = ROUND(pv.precio_costo * 1.45, 2)
    AND pv.precio_costo > 0;
  
  -- Contar puntales actualizados
  SELECT COUNT(*) INTO v_puntales_actualizados
  FROM precios_venta pv
  INNER JOIN articulos a ON pv.articulo_id = a.id
  WHERE pv.vigente = true
    AND (
      LOWER(a.nombre) LIKE '%puntal%hormigón%' OR
      LOWER(a.nombre) LIKE '%puntal%hormigon%' OR
      LOWER(a.nombre) LIKE '%puntal%cemento%' OR
      LOWER(a.nombre) LIKE '%puntal%concreto%' OR
      (LOWER(a.nombre) LIKE '%puntal%' AND LOWER(a.nombre) LIKE '%hormig%') OR
      (LOWER(a.nombre) LIKE '%puntal%' AND LOWER(a.nombre) LIKE '%cemento%')
    )
    AND pv.precio_venta = ROUND(pv.precio_costo * 1.45, 2)
    AND pv.precio_costo > 0;
  
  RAISE NOTICE 'Postes de hormigón actualizados: %', v_postes_actualizados;
  RAISE NOTICE 'Puntales de hormigón actualizados: %', v_puntales_actualizados;
END $$;

-- =====================================================
-- Consulta de verificación (opcional, comentada)
-- =====================================================
-- Para verificar los precios actualizados, ejecutar:
/*
SELECT 
  a.id,
  a.nombre,
  a.categoria,
  pv.precio_costo,
  pv.precio_venta,
  ROUND((pv.precio_venta - pv.precio_costo) / pv.precio_costo * 100, 2) as margen_porcentaje,
  CASE 
    WHEN ROUND(pv.precio_venta, 2) = ROUND(pv.precio_costo * 1.45, 2) THEN '✓ Correcto'
    ELSE '✗ Revisar'
  END as estado
FROM articulos a
INNER JOIN precios_venta pv ON a.id = pv.articulo_id
WHERE pv.vigente = true
  AND (
    LOWER(a.nombre) LIKE '%poste%hormig%' OR
    LOWER(a.nombre) LIKE '%poste%cemento%' OR
    LOWER(a.nombre) LIKE '%puntal%hormig%' OR
    LOWER(a.nombre) LIKE '%puntal%cemento%'
  )
ORDER BY a.nombre;
*/

-- =====================================================
-- Fin de la migración
-- =====================================================

