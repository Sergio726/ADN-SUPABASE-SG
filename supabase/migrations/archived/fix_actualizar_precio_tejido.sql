-- =====================================================
-- Fix: Actualizar función para no usar actualizado_en en precios_venta
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
    margen = (SELECT margen_porcentaje FROM tejidos_configuraciones WHERE id = config_id)
  FROM tejidos_configuraciones tc
  WHERE tc.id = config_id
    AND pv.articulo_id = tc.articulo_id
    AND pv.vigente = true;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Fix: Trigger de actualización de precios
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

