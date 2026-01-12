-- =====================================================
-- FIX: Actualizar función para usar zona horaria de Argentina
-- Fecha: 2025-02-07
-- Descripción: Asegurar que la comparación de horarios use la zona horaria de Argentina
-- =====================================================

-- Actualizar función para usar zona horaria de Argentina
CREATE OR REPLACE FUNCTION esta_en_horario_atencion(
  p_tipo_atencion VARCHAR(50),
  p_fecha_hora TIMESTAMP DEFAULT (timezone('America/Argentina/Buenos_Aires', now()))
)
RETURNS BOOLEAN AS $$
DECLARE
  v_dia_semana INTEGER;
  v_hora_actual TIME;
  v_es_dia_especial BOOLEAN;
  v_horario_existe BOOLEAN;
  v_fecha_hora_argentina TIMESTAMP;
BEGIN
  -- Convertir la fecha/hora a zona horaria de Argentina si no viene en ese formato
  v_fecha_hora_argentina := timezone('America/Argentina/Buenos_Aires', p_fecha_hora);
  
  -- Convertir fecha/hora a día de la semana y hora
  -- PostgreSQL: 0=Domingo, 1=Lunes, ..., 6=Sábado
  v_dia_semana := EXTRACT(DOW FROM v_fecha_hora_argentina)::INTEGER;
  v_hora_actual := v_fecha_hora_argentina::TIME;
  
  -- Verificar si es un día especial (feriado o cierre)
  SELECT EXISTS(
    SELECT 1 
    FROM dias_especiales 
    WHERE fecha = v_fecha_hora_argentina::DATE 
      AND activo = true
      AND tipo = 'cierre'
  ) INTO v_es_dia_especial;
  
  -- Si es día de cierre, no está en horario
  IF v_es_dia_especial THEN
    RETURN false;
  END IF;
  
  -- Verificar si existe un horario configurado para este día y tipo
  SELECT EXISTS(
    SELECT 1 
    FROM configuracion_horarios 
    WHERE tipo_atencion = p_tipo_atencion
      AND dia_semana = v_dia_semana
      AND activo = true
  ) INTO v_horario_existe;
  
  -- Si no hay horario configurado, no está en horario
  IF NOT v_horario_existe THEN
    RETURN false;
  END IF;
  
  -- Verificar si la hora actual está dentro del rango horario
  RETURN EXISTS(
    SELECT 1 
    FROM configuracion_horarios 
    WHERE tipo_atencion = p_tipo_atencion
      AND dia_semana = v_dia_semana
      AND activo = true
      AND hora_inicio <= v_hora_actual
      AND hora_fin >= v_hora_actual
  );
END;
$$ LANGUAGE plpgsql;

