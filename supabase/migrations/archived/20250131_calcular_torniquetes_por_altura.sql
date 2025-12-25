-- =====================================================
-- Migración: Calcular torniquetes según altura del tejido y hilos de púa
-- Fecha: 2025-01-31
-- Descripción: Actualiza la cantidad de torniquetes en las configuraciones
--              existentes según la altura del tejido romboidal y hilos de púa.
--              Lógica:
--              - Alambre AR: Cada hilera lleva 6 torniquetes (1 cada 30m para 180m)
--                * Altura <= 1.5m: 2 hileras = 12 torniquetes
--                * Altura = 1.8m: 3 hileras = 18 torniquetes
--                * Altura >= 2.0m: 4 hileras = 24 torniquetes
--              - Púa: Cada hilo de púa lleva 6 torniquetes (1 cada 30m para 180m)
--                * 1 hilo = 6 torniquetes
--                * 2 hilos = 12 torniquetes
--                * 3 hilos = 18 torniquetes
--                * 4 hilos = 24 torniquetes
--              - Total = Torniquetes AR + Torniquetes Púa
-- =====================================================

-- Función para calcular cantidad de hileras según altura
CREATE OR REPLACE FUNCTION calcular_hileras_alambre_ar(altura DECIMAL)
RETURNS INTEGER AS $$
BEGIN
  IF altura <= 1.5 THEN
    RETURN 2; -- 1.0m, 1.2m, 1.5m → 2 hileras
  ELSIF altura = 1.8 THEN
    RETURN 3; -- 1.8m → 3 hileras
  ELSE
    RETURN 4; -- 2.0m, 2.5m, 3.0m → 4 hileras
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calcular_hileras_alambre_ar IS 'Calcula la cantidad de hileras de alambre alta resistencia según la altura del tejido';

-- Función para calcular cantidad de torniquetes por alambre alta resistencia
CREATE OR REPLACE FUNCTION calcular_torniquetes_alambre_ar(altura DECIMAL)
RETURNS INTEGER AS $$
BEGIN
  -- Cada hilera lleva 6 torniquetes (1 cada 30m para 180m)
  RETURN calcular_hileras_alambre_ar(altura) * 6;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calcular_torniquetes_alambre_ar IS 'Calcula la cantidad de torniquetes para alambre alta resistencia según la altura del tejido (6 por hilera)';

-- Eliminar función antigua si existe (con un solo parámetro)
DROP FUNCTION IF EXISTS calcular_torniquetes(DECIMAL);

-- Función para calcular cantidad de torniquetes por hilos de púa
CREATE OR REPLACE FUNCTION calcular_torniquetes_pua(hilos_pua INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Cada hilo de púa lleva 6 torniquetes (1 cada 30m para 180m)
  RETURN hilos_pua * 6;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calcular_torniquetes_pua IS 'Calcula la cantidad de torniquetes para hilos de púa (6 por hilo)';

-- Función para calcular cantidad total de torniquetes
CREATE OR REPLACE FUNCTION calcular_torniquetes(altura DECIMAL, hilos_pua INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Suma torniquetes de alambre AR + torniquetes de púa
  RETURN calcular_torniquetes_alambre_ar(altura) + calcular_torniquetes_pua(hilos_pua);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calcular_torniquetes IS 'Calcula la cantidad total de torniquetes (alambre AR + púa)';

-- Actualizar todas las configuraciones existentes
UPDATE configuraciones_cercado
SET cantidad_torniquetes = calcular_torniquetes(altura, hilos_pua)
WHERE altura IS NOT NULL;

-- Mostrar resumen de actualización
DO $$
DECLARE
  v_total_actualizadas INTEGER;
  v_por_altura RECORD;
BEGIN
  SELECT COUNT(*) INTO v_total_actualizadas
  FROM configuraciones_cercado
  WHERE altura IS NOT NULL;
  
  RAISE NOTICE 'Total de configuraciones actualizadas: %', v_total_actualizadas;
  
  -- Mostrar distribución por altura
  FOR v_por_altura IN
    SELECT 
      altura,
      calcular_hileras_alambre_ar(altura) as hileras,
      calcular_torniquetes_alambre_ar(altura) as torniquetes_ar,
      AVG(hilos_pua)::INTEGER as hilos_pua_promedio,
      calcular_torniquetes(altura, AVG(hilos_pua)::INTEGER) as torniquetes_totales,
      COUNT(*) as cantidad
    FROM configuraciones_cercado
    WHERE altura IS NOT NULL
    GROUP BY altura
    ORDER BY altura
  LOOP
    RAISE NOTICE 'Altura %.2fm: % configuraciones → % hileras AR × 6 = % torniquetes AR + % hilos púa × 6 = % torniquetes púa = % torniquetes totales',
      v_por_altura.altura,
      v_por_altura.cantidad,
      v_por_altura.hileras,
      v_por_altura.torniquetes_ar,
      v_por_altura.hilos_pua_promedio,
      (v_por_altura.hilos_pua_promedio * 6),
      v_por_altura.torniquetes_totales;
  END LOOP;
END $$;

-- =====================================================
-- Fin de la migración
-- =====================================================

