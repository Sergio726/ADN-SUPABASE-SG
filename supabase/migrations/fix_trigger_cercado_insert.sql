-- =====================================================
-- Fix: Trigger de cercado para soportar INSERT
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_actualizar_precios_cercado()
RETURNS TRIGGER AS $$
DECLARE
  v_precios RECORD;
BEGIN
  -- Solo calcular si los valores NO vienen ya calculados
  -- (Esto permite hacer INSERT con valores pre-calculados)
  
  IF NEW.precio_total_accesorios IS NULL THEN
    NEW.precio_total_accesorios := 
      (NEW.cantidad_ganchos * NEW.precio_unitario_ganchos) +
      (NEW.cantidad_planchuelas * NEW.precio_unitario_planchuelas) +
      (NEW.cantidad_torniquetes * NEW.precio_unitario_torniquetes) +
      (NEW.cantidad_esparragos * NEW.precio_unitario_esparragos) +
      (NEW.metros_alambre_ar * NEW.precio_metro_alambre_ar) +
      (NEW.kg_clavos * NEW.precio_kg_clavos) +
      (NEW.kg_alambre_negro * NEW.precio_kg_alambre_negro);
  END IF;
  
  -- Calcular totales solo si no vienen pre-calculados
  IF NEW.precio_base_180m IS NULL OR NEW.precio_por_metro_lineal IS NULL THEN
    DECLARE
      v_precio_tejido NUMERIC;
      v_costo_tejido NUMERIC;
      v_costo_postes NUMERIC;
      v_costo_pua NUMERIC;
      v_costo_mo NUMERIC;
      v_costo_trans NUMERIC;
      v_total NUMERIC;
    BEGIN
      -- Obtener precio del tejido
      SELECT precio_venta INTO v_precio_tejido
      FROM tejidos_configuraciones
      WHERE id = NEW.tejido_config_id;
      
      v_costo_tejido := COALESCE(v_precio_tejido, 0) * 18;
      
      v_costo_postes := 
        (NEW.cantidad_postes_esquineros * NEW.precio_poste_esquinero) +
        (NEW.cantidad_postes_refuerzos * NEW.precio_poste_refuerzo) +
        (NEW.cantidad_postes_intermedios * NEW.precio_poste_intermedio) +
        (NEW.cantidad_puntales * NEW.precio_puntal);
      
      v_costo_pua := 180 * NEW.hilos_pua * NEW.precio_pua_por_metro;
      v_costo_mo := 180 * NEW.precio_mano_obra_por_metro;
      v_costo_trans := 180 * NEW.precio_transporte_por_metro;
      
      v_total := v_costo_tejido + v_costo_postes + NEW.cordon_precio_total +
                 v_costo_pua + NEW.precio_total_accesorios + v_costo_mo + v_costo_trans;
      
      NEW.precio_base_180m := v_total;
      NEW.precio_por_metro_lineal := v_total / 180;
      NEW.precio_por_metro_menor_50m := (v_total / 180) * 1.30;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Fin del fix
-- =====================================================

