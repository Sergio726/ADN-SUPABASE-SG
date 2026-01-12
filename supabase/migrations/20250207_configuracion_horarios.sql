-- =====================================================
-- Migración: Sistema de Configuración de Horarios de Atención
-- Fecha: 2025-02-07
-- Descripción: Sistema básico para gestionar horarios y días de atención
-- =====================================================

-- =====================================================
-- Tabla: configuracion_horarios
-- =====================================================
CREATE TABLE IF NOT EXISTS configuracion_horarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_atencion VARCHAR(50) NOT NULL CHECK (tipo_atencion IN ('presencial', 'telefonica', 'online')),
  dia_semana INTEGER NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6), -- 0=Domingo, 1=Lunes, ..., 6=Sábado
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMP DEFAULT NOW(),
  actualizado_en TIMESTAMP DEFAULT NOW(),
  UNIQUE(tipo_atencion, dia_semana) -- Un solo horario por tipo y día
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_configuracion_horarios_tipo_dia ON configuracion_horarios(tipo_atencion, dia_semana);
CREATE INDEX IF NOT EXISTS idx_configuracion_horarios_activo ON configuracion_horarios(activo);

-- =====================================================
-- Tabla: dias_especiales
-- =====================================================
CREATE TABLE IF NOT EXISTS dias_especiales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE NOT NULL UNIQUE,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('feriado', 'cierre')),
  descripcion TEXT,
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMP DEFAULT NOW()
);

-- Índice para búsquedas por fecha
CREATE INDEX IF NOT EXISTS idx_dias_especiales_fecha ON dias_especiales(fecha);
CREATE INDEX IF NOT EXISTS idx_dias_especiales_activo ON dias_especiales(activo);

-- =====================================================
-- Función: Actualizar timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_configuracion_horarios_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar timestamp
CREATE TRIGGER trg_update_configuracion_horarios_timestamp
  BEFORE UPDATE ON configuracion_horarios
  FOR EACH ROW
  EXECUTE FUNCTION update_configuracion_horarios_timestamp();

-- =====================================================
-- Función: Verificar si está en horario de atención
-- =====================================================
CREATE OR REPLACE FUNCTION esta_en_horario_atencion(
  p_tipo_atencion VARCHAR(50),
  p_fecha_hora TIMESTAMP DEFAULT NOW()
)
RETURNS BOOLEAN AS $$
DECLARE
  v_dia_semana INTEGER;
  v_hora_actual TIME;
  v_es_dia_especial BOOLEAN;
  v_tipo_dia_especial VARCHAR(50);
  v_horario_existe BOOLEAN;
BEGIN
  -- Convertir fecha/hora a día de la semana y hora
  -- PostgreSQL: 0=Domingo, 1=Lunes, ..., 6=Sábado
  v_dia_semana := EXTRACT(DOW FROM p_fecha_hora)::INTEGER;
  v_hora_actual := p_fecha_hora::TIME;
  
  -- Verificar si es un día especial (feriado o cierre)
  SELECT EXISTS(
    SELECT 1 
    FROM dias_especiales 
    WHERE fecha = p_fecha_hora::DATE 
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

-- =====================================================
-- Vista: Horarios completos con nombres de días
-- =====================================================
CREATE OR REPLACE VIEW v_horarios_completos AS
SELECT 
  h.id,
  h.tipo_atencion,
  h.dia_semana,
  CASE h.dia_semana
    WHEN 0 THEN 'Domingo'
    WHEN 1 THEN 'Lunes'
    WHEN 2 THEN 'Martes'
    WHEN 3 THEN 'Miércoles'
    WHEN 4 THEN 'Jueves'
    WHEN 5 THEN 'Viernes'
    WHEN 6 THEN 'Sábado'
  END AS dia_nombre,
  h.hora_inicio,
  h.hora_fin,
  h.activo,
  h.creado_en,
  h.actualizado_en
FROM configuracion_horarios h;

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================
ALTER TABLE configuracion_horarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE dias_especiales ENABLE ROW LEVEL SECURITY;

-- Política: Todos los usuarios autenticados pueden leer
CREATE POLICY "Usuarios autenticados pueden leer horarios"
  ON configuracion_horarios
  FOR SELECT
  TO authenticated
  USING (true);

-- Política: Usuarios autenticados pueden modificar horarios
CREATE POLICY "Usuarios autenticados pueden modificar horarios"
  ON configuracion_horarios
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Política: Todos los usuarios autenticados pueden leer días especiales
CREATE POLICY "Usuarios autenticados pueden leer dias_especiales"
  ON dias_especiales
  FOR SELECT
  TO authenticated
  USING (true);

-- Política: Usuarios autenticados pueden modificar días especiales
CREATE POLICY "Usuarios autenticados pueden modificar dias_especiales"
  ON dias_especiales
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- Comentarios
-- =====================================================
COMMENT ON TABLE configuracion_horarios IS 'Configuración de horarios de atención por día de la semana y tipo de atención';
COMMENT ON TABLE dias_especiales IS 'Días especiales como feriados y cierres';
COMMENT ON FUNCTION esta_en_horario_atencion IS 'Verifica si una fecha/hora está dentro del horario de atención configurado';

