-- =====================================================
-- Migración: Simplificar precios de tejidos
-- Fecha: 2025-01-31
-- Descripción: Eliminar columnas calculables y mantener solo precio_costo y precio_venta (efectivo)
-- =====================================================

-- Primero eliminar la vista que depende de las columnas
DROP VIEW IF EXISTS v_tejidos_con_precios CASCADE;

-- Eliminar columnas de precios calculados (se calcularán dinámicamente)
ALTER TABLE tejidos_configuraciones
  DROP COLUMN IF EXISTS precio_lista,
  DROP COLUMN IF EXISTS precio_tarjeta,
  DROP COLUMN IF EXISTS precio_echeq45,
  DROP COLUMN IF EXISTS precio_echeq60,
  DROP COLUMN IF EXISTS precio_echeq90;

-- Eliminar columnas de márgenes E-cheq (no necesarias, se calculan desde precio_base)
ALTER TABLE tejidos_configuraciones
  DROP COLUMN IF EXISTS margen_echeq45,
  DROP COLUMN IF EXISTS margen_echeq60,
  DROP COLUMN IF EXISTS margen_echeq90;

-- También eliminar márgenes de factura y tarjeta (ya no se usan)
ALTER TABLE tejidos_configuraciones
  DROP COLUMN IF EXISTS margen_factura,
  DROP COLUMN IF EXISTS margen_tarjeta;

-- Eliminar margen_porcentaje (columna antigua, reemplazada por margen_efectivo)
ALTER TABLE tejidos_configuraciones
  DROP COLUMN IF EXISTS margen_porcentaje;

-- Mantener solo margen_efectivo (opcional, para referencia)
-- precio_venta es el precio base (efectivo)
COMMENT ON COLUMN tejidos_configuraciones.precio_costo IS 'Precio de costo = (cantidad_alambre × precio_alambre) + costo_mano_obra';
COMMENT ON COLUMN tejidos_configuraciones.precio_venta IS 'Precio de venta en efectivo (precio base) = precio_costo × (1 + margen_efectivo/100)';

-- Eliminar todas las versiones existentes de la función (puede haber múltiples sobrecargas)
DROP FUNCTION IF EXISTS calcular_precios_tejido_desde_alambre CASCADE;

-- Crear función para calcular solo precio_costo y precio_venta (efectivo)
CREATE FUNCTION calcular_precios_tejido_desde_alambre(
  p_cantidad_alambre NUMERIC,
  p_alambre_articulo_id INTEGER,
  p_costo_mano_obra NUMERIC,
  p_margen_efectivo NUMERIC DEFAULT 45.00
)
RETURNS TABLE(
  precio_costo NUMERIC,
  precio_venta NUMERIC
) AS $$
DECLARE
  v_precio_alambre NUMERIC;
  v_precio_costo NUMERIC;
  v_precio_venta NUMERIC;
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
  
  -- Calcular precio de venta (efectivo = precio base)
  v_precio_venta := ROUND(v_precio_costo * (100 + p_margen_efectivo) / 100, 2);
  
  -- Retornar solo precio_costo y precio_venta
  RETURN QUERY SELECT v_precio_costo, v_precio_venta;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcular_precios_tejido_desde_alambre IS 'Calcula precio de costo y precio de venta en efectivo (precio base) desde el artículo de alambre';

-- Eliminar función del trigger si existe
DROP FUNCTION IF EXISTS actualizar_precios_tejido_completo() CASCADE;

-- Crear trigger para calcular solo precio_costo y precio_venta
CREATE FUNCTION actualizar_precios_tejido_completo()
RETURNS TRIGGER AS $$
DECLARE
  v_precios RECORD;
BEGIN
  -- Calcular solo precio_costo y precio_venta (efectivo)
  SELECT * INTO v_precios
  FROM calcular_precios_tejido_desde_alambre(
    NEW.cantidad_alambre,
    NEW.alambre_articulo_id,
    NEW.costo_mano_obra,
    COALESCE(NEW.margen_efectivo, 45.00)
  );
  
  -- Asignar valores calculados
  NEW.precio_costo := v_precios.precio_costo;
  NEW.precio_venta := v_precios.precio_venta;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar función si existe (puede haber versiones anteriores)
DROP FUNCTION IF EXISTS actualizar_todos_precios_tejidos() CASCADE;

-- Crear función para recalcular todos los tejidos
CREATE FUNCTION actualizar_todos_precios_tejidos()
RETURNS INTEGER AS $$
DECLARE
  v_tejido RECORD;
  v_precios RECORD;
  v_actualizados INTEGER := 0;
BEGIN
  FOR v_tejido IN 
    SELECT id, cantidad_alambre, alambre_articulo_id, costo_mano_obra, margen_efectivo
    FROM tejidos_configuraciones
    WHERE activo = true
  LOOP
    -- Calcular precios
    SELECT * INTO v_precios
    FROM calcular_precios_tejido_desde_alambre(
      v_tejido.cantidad_alambre,
      v_tejido.alambre_articulo_id,
      v_tejido.costo_mano_obra,
      COALESCE(v_tejido.margen_efectivo, 45.00)
    );
    
    -- Actualizar tejido
    UPDATE tejidos_configuraciones
    SET 
      precio_costo = v_precios.precio_costo,
      precio_venta = v_precios.precio_venta
    WHERE id = v_tejido.id;
    
    v_actualizados := v_actualizados + 1;
  END LOOP;
  
  RETURN v_actualizados;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION actualizar_todos_precios_tejidos IS 'Recalcula precio_costo y precio_venta para todos los tejidos activos';

-- Eliminar triggers antiguos si existen
DROP TRIGGER IF EXISTS trigger_actualizar_precio_tejido_completo ON tejidos_configuraciones;
DROP TRIGGER IF EXISTS trigger_actualizar_precio_tejido ON tejidos_configuraciones;
DROP TRIGGER IF EXISTS trigger_actualizar_precio_venta ON tejidos_configuraciones;

-- Crear trigger para calcular precios automáticamente
CREATE TRIGGER trigger_actualizar_precio_tejido_completo
  BEFORE INSERT OR UPDATE ON tejidos_configuraciones
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_precios_tejido_completo();

COMMENT ON TRIGGER trigger_actualizar_precio_tejido_completo ON tejidos_configuraciones IS 'Calcula automáticamente precio_costo y precio_venta (efectivo)';

-- Recrear vista v_tejidos_con_precios (después de eliminar columnas)
CREATE VIEW v_tejidos_con_precios AS
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
  tc.costo_mano_obra,
  tc.precio_costo,
  tc.precio_venta, -- Precio base (efectivo)
  tc.margen_efectivo,
  tc.horas_fabricacion,
  tc.alambre_articulo_id,
  tc.categoria_calidad,
  tc.activo,
  tc.creado_en,
  tc.actualizado_en,
  -- Precios calculados dinámicamente (no guardados)
  (tc.precio_venta * 1.21) as precio_lista, -- Factura/Lista = precio_base * 1.21
  (tc.precio_venta / tc.largo) as precio_por_metro_efectivo,
  ((tc.precio_venta * 1.21) / tc.largo) as precio_por_metro_lista
FROM tejidos_configuraciones tc;

COMMENT ON VIEW v_tejidos_con_precios IS 'Vista de tejidos con precios calculados dinámicamente. precio_venta es el precio base (efectivo), precio_lista se calcula como precio_venta * 1.21';

-- Otorgar permisos
GRANT SELECT ON v_tejidos_con_precios TO authenticated;
GRANT SELECT ON v_tejidos_con_precios TO anon;

-- =====================================================
-- Fin de la migración
-- =====================================================

