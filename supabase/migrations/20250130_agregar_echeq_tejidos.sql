-- =====================================================
-- Migración: Agregar precios y márgenes E-cheq a tejidos
-- Fecha: 2025-01-30
-- Descripción: Agrega campos para precios y márgenes de E-cheq (45, 60, 90 días) a tejidos_configuraciones
-- =====================================================

-- Agregar campos para márgenes E-cheq
ALTER TABLE tejidos_configuraciones
ADD COLUMN IF NOT EXISTS margen_echeq45 DECIMAL(5,2) DEFAULT 57.00,
ADD COLUMN IF NOT EXISTS margen_echeq60 DECIMAL(5,2) DEFAULT 65.00,
ADD COLUMN IF NOT EXISTS margen_echeq90 DECIMAL(5,2) DEFAULT 73.00;

-- Agregar campos para precios E-cheq calculados
ALTER TABLE tejidos_configuraciones
ADD COLUMN IF NOT EXISTS precio_echeq45 DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS precio_echeq60 DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS precio_echeq90 DECIMAL(10,2);

-- Comentarios
COMMENT ON COLUMN tejidos_configuraciones.margen_echeq45 IS 'Margen sobre costo para precio E-cheq 45 días (%) - Default 57%';
COMMENT ON COLUMN tejidos_configuraciones.margen_echeq60 IS 'Margen sobre costo para precio E-cheq 60 días (%) - Default 65%';
COMMENT ON COLUMN tejidos_configuraciones.margen_echeq90 IS 'Margen sobre costo para precio E-cheq 90 días (%) - Default 73%';
COMMENT ON COLUMN tejidos_configuraciones.precio_echeq45 IS 'Precio E-cheq 45 días = precio_costo × (1 + margen_echeq45/100)';
COMMENT ON COLUMN tejidos_configuraciones.precio_echeq60 IS 'Precio E-cheq 60 días = precio_costo × (1 + margen_echeq60/100)';
COMMENT ON COLUMN tejidos_configuraciones.precio_echeq90 IS 'Precio E-cheq 90 días = precio_costo × (1 + margen_echeq90/100)';

-- =====================================================
-- Actualizar función calcular_precios_tejido_desde_alambre para incluir E-cheq
-- =====================================================
CREATE OR REPLACE FUNCTION calcular_precios_tejido_desde_alambre(
  p_cantidad_alambre NUMERIC,
  p_alambre_articulo_id INTEGER,
  p_costo_mano_obra NUMERIC,
  p_margen_efectivo NUMERIC DEFAULT 45.00,
  p_margen_factura NUMERIC DEFAULT 57.00,
  p_margen_tarjeta NUMERIC DEFAULT 65.00,
  p_margen_echeq45 NUMERIC DEFAULT 57.00,
  p_margen_echeq60 NUMERIC DEFAULT 65.00,
  p_margen_echeq90 NUMERIC DEFAULT 73.00
)
RETURNS TABLE(
  precio_costo NUMERIC,
  precio_venta NUMERIC,
  precio_lista NUMERIC,
  precio_tarjeta NUMERIC,
  precio_echeq45 NUMERIC,
  precio_echeq60 NUMERIC,
  precio_echeq90 NUMERIC
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
  ORDER BY pv.fecha_inicio DESC
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
    ROUND(v_precio_costo * (100 + p_margen_tarjeta) / 100, 2) as precio_tarjeta,
    ROUND(v_precio_costo * (100 + p_margen_echeq45) / 100, 2) as precio_echeq45,
    ROUND(v_precio_costo * (100 + p_margen_echeq60) / 100, 2) as precio_echeq60,
    ROUND(v_precio_costo * (100 + p_margen_echeq90) / 100, 2) as precio_echeq90;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcular_precios_tejido_desde_alambre IS 'Calcula precio de costo, venta (efectivo), lista (factura), tarjeta y E-cheq (45, 60, 90 días) desde el artículo de alambre';

-- =====================================================
-- Actualizar trigger para calcular precios E-cheq
-- =====================================================
CREATE OR REPLACE FUNCTION actualizar_precios_tejido_completo()
RETURNS TRIGGER AS $$
DECLARE
  v_precios RECORD;
BEGIN
  -- Calcular todos los precios incluyendo E-cheq
  SELECT * INTO v_precios
  FROM calcular_precios_tejido_desde_alambre(
    NEW.cantidad_alambre,
    NEW.alambre_articulo_id,
    NEW.costo_mano_obra,
    COALESCE(NEW.margen_efectivo, 45.00),
    COALESCE(NEW.margen_factura, 57.00),
    COALESCE(NEW.margen_tarjeta, 65.00),
    COALESCE(NEW.margen_echeq45, 57.00),
    COALESCE(NEW.margen_echeq60, 65.00),
    COALESCE(NEW.margen_echeq90, 73.00)
  );
  
  -- Asignar valores calculados
  NEW.precio_costo := v_precios.precio_costo;
  NEW.precio_venta := v_precios.precio_venta;
  NEW.precio_lista := v_precios.precio_lista;
  NEW.precio_tarjeta := v_precios.precio_tarjeta;
  NEW.precio_echeq45 := v_precios.precio_echeq45;
  NEW.precio_echeq60 := v_precios.precio_echeq60;
  NEW.precio_echeq90 := v_precios.precio_echeq90;
  
  -- Actualizar timestamp
  NEW.actualizado_en := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Actualizar función para actualizar todos los tejidos
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
      COALESCE(v_tejido.margen_tarjeta, 65.00),
      COALESCE(v_tejido.margen_echeq45, 57.00),
      COALESCE(v_tejido.margen_echeq60, 65.00),
      COALESCE(v_tejido.margen_echeq90, 73.00)
    );
    
    -- Actualizar tejido
    UPDATE tejidos_configuraciones
    SET 
      precio_costo = v_precios.precio_costo,
      precio_venta = v_precios.precio_venta,
      precio_lista = v_precios.precio_lista,
      precio_tarjeta = v_precios.precio_tarjeta,
      precio_echeq45 = v_precios.precio_echeq45,
      precio_echeq60 = v_precios.precio_echeq60,
      precio_echeq90 = v_precios.precio_echeq90,
      actualizado_en = NOW()
    WHERE id = v_tejido.id;
    
    v_count := v_count + 1;
  END LOOP;
  
  RAISE NOTICE 'Precios actualizados correctamente para % tejidos', v_count;
END;
$$ LANGUAGE plpgsql;

-- Actualizar vista para incluir precios E-cheq
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
  tc.cantidad_alambre,
  tc.costo_mano_obra as mano_obra,
  tc.horas_fabricacion,
  tc.margen_efectivo,
  tc.margen_factura,
  tc.margen_tarjeta,
  tc.margen_echeq45,
  tc.margen_echeq60,
  tc.margen_echeq90,
  tc.alambre_articulo_id,
  tc.precio_costo,
  tc.precio_venta,
  tc.precio_lista,
  tc.precio_tarjeta,
  tc.precio_echeq45,
  tc.precio_echeq60,
  tc.precio_echeq90,
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

COMMENT ON VIEW v_tejidos_con_precios IS 'Vista con información completa de tejidos, incluyendo mano_obra y todos los precios (efectivo, lista, tarjeta, e-cheq 45/60/90 días)';

-- Otorgar permisos
GRANT SELECT ON v_tejidos_con_precios TO authenticated;
GRANT SELECT ON v_tejidos_con_precios TO anon;

-- =====================================================
-- Fin de la migración
-- =====================================================

