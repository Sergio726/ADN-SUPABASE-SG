-- =====================================================
-- Migración: Fix y Debug del Trigger de Tareas
-- Fecha: 2025-02-06
-- Descripción: Corregir y mejorar el trigger de creación automática de tareas
-- =====================================================

-- Primero, verificar si el trigger existe y eliminarlo
DROP TRIGGER IF EXISTS trg_crear_tarea_presupuesto_enviado ON presupuestos;

-- Recrear la función con mejor manejo de errores y logging
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
      
      v_numero_presupuesto := COALESCE(NEW.numero, 'N/A');
      
      -- Reemplazar variables en plantillas
      v_titulo := REPLACE(
        REPLACE(
          v_config.titulo_plantilla, 
          '{{numero_presupuesto}}', 
          v_numero_presupuesto
        ), 
        '{{cliente_nombre}}', 
        COALESCE(v_cliente_nombre, NEW.cliente_nombre, 'Cliente')
      );
      v_descripcion := REPLACE(
        REPLACE(
          v_config.descripcion_plantilla, 
          '{{numero_presupuesto}}', 
          v_numero_presupuesto
        ), 
        '{{cliente_nombre}}', 
        COALESCE(v_cliente_nombre, NEW.cliente_nombre, 'Cliente')
      );
      
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
EXCEPTION
  WHEN OTHERS THEN
    -- En caso de error, registrar pero no fallar el trigger
    -- Esto evita que falle la actualización del presupuesto
    RAISE WARNING 'Error al crear tarea de seguimiento para presupuesto %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recrear el trigger
CREATE TRIGGER trg_crear_tarea_presupuesto_enviado
  AFTER INSERT OR UPDATE ON presupuestos
  FOR EACH ROW
  EXECUTE FUNCTION crear_tarea_seguimiento_presupuesto();

-- Función de prueba para verificar que el trigger funciona
CREATE OR REPLACE FUNCTION probar_trigger_tareas()
RETURNS TABLE (
  mensaje TEXT,
  tareas_creadas INTEGER
) AS $$
DECLARE
  v_presupuesto_id UUID;
  v_tareas_count INTEGER;
BEGIN
  -- Buscar un presupuesto con estado 'enviado' que no tenga tarea asociada
  SELECT id INTO v_presupuesto_id
  FROM presupuestos
  WHERE estado = 'enviado'
    AND id NOT IN (SELECT presupuesto_id FROM tareas_crm WHERE presupuesto_id IS NOT NULL)
  LIMIT 1;
  
  IF v_presupuesto_id IS NULL THEN
    RETURN QUERY SELECT 'No hay presupuestos enviados sin tarea'::TEXT, 0::INTEGER;
    RETURN;
  END IF;
  
  -- Simular cambio de estado (de borrador a enviado)
  UPDATE presupuestos
  SET estado = 'enviado'
  WHERE id = v_presupuesto_id
    AND estado != 'enviado';
  
  -- Contar tareas creadas
  SELECT COUNT(*) INTO v_tareas_count
  FROM tareas_crm
  WHERE presupuesto_id = v_presupuesto_id;
  
  RETURN QUERY SELECT 
    format('Trigger ejecutado. Tareas creadas: %s', v_tareas_count)::TEXT,
    v_tareas_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION crear_tarea_seguimiento_presupuesto() IS 'Crea automáticamente una tarea de seguimiento cuando se envía un presupuesto. Maneja casos donde cliente_id puede ser NULL.';
COMMENT ON FUNCTION probar_trigger_tareas() IS 'Función de prueba para verificar que el trigger de tareas funciona correctamente';

