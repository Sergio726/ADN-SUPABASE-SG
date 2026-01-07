-- =====================================================
-- Migración: Sistema de Tareas CRM
-- Fecha: 2025-02-06
-- Descripción: Tabla y funciones para gestión de tareas y seguimiento de presupuestos
-- =====================================================

-- =====================================================
-- Tabla: tareas_crm
-- =====================================================
CREATE TABLE IF NOT EXISTS tareas_crm (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  presupuesto_id UUID REFERENCES presupuestos(id) ON DELETE SET NULL,
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT,
  asignado_a UUID REFERENCES usuarios(id),
  estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_progreso', 'completada', 'cancelada')),
  fecha_vencimiento TIMESTAMP,
  completada_en TIMESTAMP,
  creado_por UUID REFERENCES usuarios(id),
  creado_en TIMESTAMP DEFAULT NOW(),
  actualizado_en TIMESTAMP DEFAULT NOW()
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_tareas_cliente ON tareas_crm(cliente_id);
CREATE INDEX IF NOT EXISTS idx_tareas_presupuesto ON tareas_crm(presupuesto_id);
CREATE INDEX IF NOT EXISTS idx_tareas_asignado ON tareas_crm(asignado_a);
CREATE INDEX IF NOT EXISTS idx_tareas_estado ON tareas_crm(estado);
CREATE INDEX IF NOT EXISTS idx_tareas_vencimiento ON tareas_crm(fecha_vencimiento) WHERE fecha_vencimiento IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tareas_creado_por ON tareas_crm(creado_por);

-- Trigger para actualizar timestamp
CREATE OR REPLACE FUNCTION update_tareas_crm_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_tareas_crm_timestamp ON tareas_crm;
CREATE TRIGGER trg_update_tareas_crm_timestamp
  BEFORE UPDATE ON tareas_crm
  FOR EACH ROW
  EXECUTE FUNCTION update_tareas_crm_timestamp();

-- =====================================================
-- Tabla: configuracion_recordatorios
-- =====================================================
CREATE TABLE IF NOT EXISTS configuracion_recordatorios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_evento VARCHAR(50) NOT NULL UNIQUE, -- 'presupuesto_enviado', 'presupuesto_aprobado', 'cliente_inactivo'
  dias_desde_evento INTEGER NOT NULL DEFAULT 3,
  titulo_plantilla VARCHAR(200) NOT NULL,
  descripcion_plantilla TEXT,
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMP DEFAULT NOW(),
  actualizado_en TIMESTAMP DEFAULT NOW()
);

-- Insertar configuraciones por defecto
INSERT INTO configuracion_recordatorios (tipo_evento, dias_desde_evento, titulo_plantilla, descripcion_plantilla) VALUES
  ('presupuesto_enviado', 3, 'Seguimiento de presupuesto enviado', 'Recordatorio para hacer seguimiento del presupuesto {{numero_presupuesto}} enviado a {{cliente_nombre}}'),
  ('presupuesto_aprobado', 7, 'Seguimiento post-entrega', 'Recordatorio para hacer seguimiento post-entrega del presupuesto {{numero_presupuesto}}'),
  ('cliente_inactivo', 90, 'Cliente inactivo', 'Cliente {{cliente_nombre}} sin compras en los últimos 3 meses')
ON CONFLICT (tipo_evento) DO NOTHING;

-- =====================================================
-- Función: Crear tarea de seguimiento automático
-- =====================================================
CREATE OR REPLACE FUNCTION crear_tarea_seguimiento_presupuesto()
RETURNS TRIGGER AS $$
DECLARE
  v_config RECORD;
  v_titulo VARCHAR(200);
  v_descripcion TEXT;
  v_cliente_nombre VARCHAR(200);
  v_numero_presupuesto VARCHAR(50);
BEGIN
  -- Solo crear tarea si el estado cambió a 'enviado'
  IF NEW.estado = 'enviado' AND (OLD.estado IS NULL OR OLD.estado != 'enviado') THEN
    
    -- Obtener configuración de recordatorio
    SELECT * INTO v_config
    FROM configuracion_recordatorios
    WHERE tipo_evento = 'presupuesto_enviado' AND activo = true
    LIMIT 1;
    
    -- Si hay configuración activa, crear la tarea
    IF v_config IS NOT NULL THEN
      -- Obtener datos del cliente (usar cliente_id si existe, sino usar cliente_nombre)
      IF NEW.cliente_id IS NOT NULL THEN
        SELECT nombre_completo INTO v_cliente_nombre
        FROM clientes
        WHERE id = NEW.cliente_id;
      ELSE
        -- Si no hay cliente_id, usar cliente_nombre directamente
        v_cliente_nombre := NEW.cliente_nombre;
      END IF;
      
      v_numero_presupuesto := NEW.numero;
      
      -- Reemplazar variables en plantillas
      v_titulo := REPLACE(REPLACE(v_config.titulo_plantilla, '{{numero_presupuesto}}', COALESCE(v_numero_presupuesto, 'N/A')), '{{cliente_nombre}}', COALESCE(v_cliente_nombre, NEW.cliente_nombre, 'Cliente'));
      v_descripcion := REPLACE(REPLACE(v_config.descripcion_plantilla, '{{numero_presupuesto}}', COALESCE(v_numero_presupuesto, 'N/A')), '{{cliente_nombre}}', COALESCE(v_cliente_nombre, NEW.cliente_nombre, 'Cliente'));
      
      -- Solo crear la tarea si hay usuario_id (vendedor asignado)
      IF NEW.usuario_id IS NOT NULL THEN
        -- Crear la tarea
        INSERT INTO tareas_crm (
          cliente_id,
          presupuesto_id,
          titulo,
          descripcion,
          asignado_a,
          fecha_vencimiento,
          creado_por
        ) VALUES (
          NEW.cliente_id, -- Puede ser NULL si el presupuesto no tiene cliente_id
          NEW.id,
          v_titulo,
          v_descripcion,
          NEW.usuario_id, -- Asignar al vendedor que creó el presupuesto
          NOW() + (v_config.dias_desde_evento || ' days')::INTERVAL,
          NEW.usuario_id
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para crear tarea cuando se envía presupuesto
DROP TRIGGER IF EXISTS trg_crear_tarea_presupuesto_enviado ON presupuestos;
CREATE TRIGGER trg_crear_tarea_presupuesto_enviado
  AFTER INSERT OR UPDATE ON presupuestos
  FOR EACH ROW
  EXECUTE FUNCTION crear_tarea_seguimiento_presupuesto();

-- Nota: El trigger se ejecuta tanto en INSERT como en UPDATE
-- Si un presupuesto se crea directamente con estado 'enviado', también creará la tarea

-- =====================================================
-- Vista: Tareas con información relacionada
-- =====================================================
CREATE OR REPLACE VIEW v_tareas_crm_completas AS
SELECT 
  t.*,
  c.nombre_completo as cliente_nombre,
  c.telefono as cliente_telefono,
  c.email as cliente_email,
  p.numero as presupuesto_numero,
  p.total as presupuesto_total,
  p.estado as presupuesto_estado,
  u_asignado.nombre as asignado_nombre,
  u_creador.nombre as creador_nombre,
  CASE 
    WHEN t.fecha_vencimiento IS NULL THEN NULL
    WHEN t.fecha_vencimiento < NOW() AND t.estado != 'completada' THEN 'vencida'
    WHEN t.fecha_vencimiento <= NOW() + INTERVAL '1 day' AND t.estado != 'completada' THEN 'por_vencer'
    ELSE 'vigente'
  END as estado_vencimiento
FROM tareas_crm t
LEFT JOIN clientes c ON c.id = t.cliente_id
LEFT JOIN presupuestos p ON p.id = t.presupuesto_id
LEFT JOIN usuarios u_asignado ON u_asignado.id = t.asignado_a
LEFT JOIN usuarios u_creador ON u_creador.id = t.creado_por;

COMMENT ON VIEW v_tareas_crm_completas IS 'Vista completa de tareas con información relacionada de clientes, presupuestos y usuarios';

-- =====================================================
-- Función: Obtener tareas pendientes de un usuario
-- =====================================================
CREATE OR REPLACE FUNCTION obtener_tareas_pendientes_usuario(p_usuario_id UUID)
RETURNS TABLE (
  id UUID,
  titulo VARCHAR,
  descripcion TEXT,
  cliente_nombre VARCHAR,
  presupuesto_numero VARCHAR,
  fecha_vencimiento TIMESTAMP,
  estado_vencimiento TEXT,
  dias_restantes INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.titulo,
    t.descripcion,
    v.cliente_nombre,
    v.presupuesto_numero,
    t.fecha_vencimiento,
    v.estado_vencimiento,
    CASE 
      WHEN t.fecha_vencimiento IS NULL THEN NULL
      ELSE EXTRACT(DAY FROM (t.fecha_vencimiento - NOW()))::INTEGER
    END as dias_restantes
  FROM v_tareas_crm_completas v
  INNER JOIN tareas_crm t ON t.id = v.id
  WHERE t.asignado_a = p_usuario_id
    AND t.estado IN ('pendiente', 'en_progreso')
  ORDER BY 
    CASE WHEN t.fecha_vencimiento IS NULL THEN 1 ELSE 0 END,
    t.fecha_vencimiento ASC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Comentarios
-- =====================================================
COMMENT ON TABLE tareas_crm IS 'Tareas del CRM para seguimiento de clientes y presupuestos';
COMMENT ON TABLE configuracion_recordatorios IS 'Configuración de recordatorios automáticos para diferentes eventos';
COMMENT ON FUNCTION crear_tarea_seguimiento_presupuesto() IS 'Crea automáticamente una tarea de seguimiento cuando se envía un presupuesto';
COMMENT ON FUNCTION obtener_tareas_pendientes_usuario(UUID) IS 'Obtiene las tareas pendientes de un usuario ordenadas por fecha de vencimiento';

-- =====================================================
-- Fin de la migración
-- =====================================================

