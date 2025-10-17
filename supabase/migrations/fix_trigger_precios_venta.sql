-- =====================================================
-- Fix: Trigger de precios_venta para actualizar tejidos
-- =====================================================

-- Eliminar trigger problemático si existe
DROP TRIGGER IF EXISTS trigger_actualizar_precios_tejidos ON precios_venta;
DROP FUNCTION IF EXISTS trigger_actualizar_precios_tejidos();

-- Crear versión corregida del trigger
CREATE OR REPLACE FUNCTION trigger_actualizar_precios_tejidos()
RETURNS TRIGGER AS $$
DECLARE
  v_tejido RECORD;
  v_precios RECORD;
BEGIN
  -- Solo si el artículo es un alambre galvanizado usado en tejidos
  IF NEW.articulo_id IN (7, 8) AND NEW.vigente = true THEN
    -- Actualizar cada tejido que use este alambre
    FOR v_tejido IN 
      SELECT * FROM tejidos_configuraciones 
      WHERE alambre_articulo_id = NEW.articulo_id AND activo = true
    LOOP
      -- Calcular precios para este tejido
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
        precio_venta = v_precios.precio_venta,
        precio_lista = v_precios.precio_lista,
        precio_tarjeta = v_precios.precio_tarjeta,
        actualizado_en = NOW()
      WHERE id = v_tejido.id;
    END LOOP;
    
    RAISE NOTICE 'Precios de tejidos actualizados por cambio en alambre ID %', NEW.articulo_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger AFTER INSERT/UPDATE (no BEFORE)
CREATE TRIGGER trigger_actualizar_precios_tejidos
  AFTER INSERT OR UPDATE OF precio_costo ON precios_venta
  FOR EACH ROW
  EXECUTE FUNCTION trigger_actualizar_precios_tejidos();

COMMENT ON TRIGGER trigger_actualizar_precios_tejidos ON precios_venta IS 
'Actualiza automáticamente los precios de tejidos cuando cambia el precio del alambre galvanizado';

-- =====================================================
-- Fin del fix
-- =====================================================

