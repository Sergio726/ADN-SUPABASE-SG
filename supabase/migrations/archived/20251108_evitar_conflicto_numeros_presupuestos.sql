-- Garantizar generación de números únicos para presupuestos usando secuencias
-- Fecha: 2025-11-08

CREATE SEQUENCE IF NOT EXISTS presupuestos_num_seq_articulos;
CREATE SEQUENCE IF NOT EXISTS presupuestos_num_seq_cercado;

CREATE OR REPLACE FUNCTION generar_numero_presupuesto(p_tipo VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
  v_prefijo VARCHAR(10);
  v_year VARCHAR(4);
  v_numero BIGINT;
  v_numero_completo VARCHAR(50);
BEGIN
  v_prefijo := CASE 
    WHEN p_tipo = 'cercado' THEN 'CERC'
    WHEN p_tipo = 'articulos' THEN 'PRES'
    ELSE 'PRES'
  END;

  v_year := TO_CHAR(CURRENT_DATE, 'YYYY');

  v_numero := CASE
    WHEN p_tipo = 'cercado' THEN nextval('presupuestos_num_seq_cercado')
    ELSE nextval('presupuestos_num_seq_articulos')
  END;

  -- Ajusta el LPAD según la cantidad de dígitos deseada
  v_numero_completo := v_prefijo || '-' || v_year || '-' || LPAD(v_numero::TEXT, 3, '0');

  RETURN v_numero_completo;
END;
$$ LANGUAGE plpgsql;

-- Sincronizar secuencias con números existentes
DO $$
DECLARE
  v_max_articulos INTEGER;
  v_max_cercado INTEGER;
BEGIN
  SELECT COALESCE(MAX(SUBSTRING(numero FROM '\d+$')::int), 0)
  INTO v_max_articulos
  FROM presupuestos
  WHERE tipo = 'articulos';

  IF v_max_articulos = 0 THEN
    PERFORM setval('presupuestos_num_seq_articulos', 1, false);
  ELSE
    PERFORM setval('presupuestos_num_seq_articulos', v_max_articulos, true);
  END IF;

  SELECT COALESCE(MAX(SUBSTRING(numero FROM '\d+$')::int), 0)
  INTO v_max_cercado
  FROM presupuestos
  WHERE tipo = 'cercado';

  IF v_max_cercado = 0 THEN
    PERFORM setval('presupuestos_num_seq_cercado', 1, false);
  ELSE
    PERFORM setval('presupuestos_num_seq_cercado', v_max_cercado, true);
  END IF;
END;
$$;


