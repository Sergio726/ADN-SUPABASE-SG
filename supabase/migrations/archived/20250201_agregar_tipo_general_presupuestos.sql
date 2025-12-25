-- =====================================================
-- Migración: Agregar tipo 'general' a presupuestos
-- Fecha: 2025-02-01
-- Descripción: Permite crear presupuestos generales con items personalizados
-- =====================================================

-- Agregar tipo 'general' a la constraint de presupuestos
ALTER TABLE presupuestos
  DROP CONSTRAINT IF EXISTS presupuestos_tipo_check;

ALTER TABLE presupuestos
  ADD CONSTRAINT presupuestos_tipo_check 
  CHECK (tipo IN ('articulos', 'cercado', 'general'));

-- Crear secuencia para presupuestos generales
CREATE SEQUENCE IF NOT EXISTS presupuestos_num_seq_general;

-- Actualizar función generar_numero_presupuesto para incluir 'general'
CREATE OR REPLACE FUNCTION generar_numero_presupuesto(p_tipo VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
  v_prefijo VARCHAR(10);
  v_year VARCHAR(4);
  v_numero BIGINT;
  v_numero_completo VARCHAR(50);
BEGIN
  -- Determinar prefijo según tipo
  v_prefijo := CASE 
    WHEN p_tipo = 'articulos' THEN 'PRES'
    WHEN p_tipo = 'cercado' THEN 'CERC'
    WHEN p_tipo = 'general' THEN 'GEN'
    ELSE 'PRES'
  END;

  -- Año actual
  v_year := TO_CHAR(CURRENT_DATE, 'YYYY');

  -- Obtener número usando secuencias
  v_numero := CASE
    WHEN p_tipo = 'cercado' THEN nextval('presupuestos_num_seq_cercado')
    WHEN p_tipo = 'general' THEN nextval('presupuestos_num_seq_general')
    ELSE nextval('presupuestos_num_seq_articulos')
  END;

  -- Generar número completo
  v_numero_completo := v_prefijo || '-' || v_year || '-' || LPAD(v_numero::TEXT, 3, '0');

  RETURN v_numero_completo;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generar_numero_presupuesto IS 'Genera número único de presupuesto (PRES-2024-001, CERC-2024-001, o GEN-2024-001)';

-- Sincronizar secuencia de general con números existentes
DO $$
DECLARE
  v_max_general INTEGER;
BEGIN
  SELECT COALESCE(MAX(SUBSTRING(numero FROM '\d+$')::int), 0)
  INTO v_max_general
  FROM presupuestos
  WHERE tipo = 'general';

  IF v_max_general = 0 THEN
    PERFORM setval('presupuestos_num_seq_general', 1, false);
  ELSE
    PERFORM setval('presupuestos_num_seq_general', v_max_general, true);
  END IF;
END;
$$;

-- Comentario
COMMENT ON COLUMN presupuestos.tipo IS 'Tipo: articulos, cercado, o general';

