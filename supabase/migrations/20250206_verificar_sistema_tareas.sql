-- =====================================================
-- Script de Verificación: Sistema de Tareas CRM
-- Fecha: 2025-02-06
-- Descripción: Verificar que el sistema de tareas esté funcionando correctamente
-- =====================================================

-- 1. Verificar que la tabla existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tareas_crm') THEN
    RAISE EXCEPTION 'ERROR: La tabla tareas_crm no existe. Debes aplicar la migración 20250206_sistema_tareas_crm.sql primero.';
  END IF;
  RAISE NOTICE '✓ Tabla tareas_crm existe';
END $$;

-- 2. Verificar que la tabla de configuración existe y tiene datos
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'configuracion_recordatorios') THEN
    RAISE EXCEPTION 'ERROR: La tabla configuracion_recordatorios no existe.';
  END IF;
  
  SELECT COUNT(*) INTO v_count FROM configuracion_recordatorios WHERE tipo_evento = 'presupuesto_enviado' AND activo = true;
  
  IF v_count = 0 THEN
    RAISE WARNING 'ADVERTENCIA: No hay configuración activa para presupuesto_enviado. El trigger no creará tareas automáticamente.';
  ELSE
    RAISE NOTICE '✓ Configuración de recordatorios existe y está activa';
  END IF;
END $$;

-- 3. Verificar que el trigger existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trg_crear_tarea_presupuesto_enviado'
  ) THEN
    RAISE EXCEPTION 'ERROR: El trigger trg_crear_tarea_presupuesto_enviado no existe. Debes aplicar la migración.';
  END IF;
  RAISE NOTICE '✓ Trigger existe';
END $$;

-- 4. Verificar que la función existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'crear_tarea_seguimiento_presupuesto'
  ) THEN
    RAISE EXCEPTION 'ERROR: La función crear_tarea_seguimiento_presupuesto no existe.';
  END IF;
  RAISE NOTICE '✓ Función existe';
END $$;

-- 5. Mostrar presupuestos enviados sin tarea
SELECT 
  'Presupuestos enviados sin tarea asociada:' as info,
  COUNT(*) as cantidad
FROM presupuestos p
WHERE p.estado = 'enviado'
  AND p.id NOT IN (
    SELECT presupuesto_id 
    FROM tareas_crm 
    WHERE presupuesto_id IS NOT NULL
  );

-- 6. Mostrar últimas tareas creadas
SELECT 
  'Últimas 5 tareas creadas:' as info,
  id,
  titulo,
  estado,
  fecha_vencimiento,
  presupuesto_id,
  cliente_id,
  creado_en
FROM tareas_crm
ORDER BY creado_en DESC
LIMIT 5;

-- 7. Mostrar estadísticas de tareas
SELECT 
  'Estadísticas de tareas:' as info,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE estado = 'pendiente') as pendientes,
  COUNT(*) FILTER (WHERE estado = 'en_progreso') as en_progreso,
  COUNT(*) FILTER (WHERE estado = 'completada') as completadas,
  COUNT(*) FILTER (WHERE estado_vencimiento = 'vencida' AND estado != 'completada') as vencidas
FROM v_tareas_crm_completas;

-- 8. Mostrar configuración actual
SELECT 
  'Configuración de recordatorios:' as info,
  tipo_evento,
  dias_desde_evento,
  titulo_plantilla,
  activo
FROM configuracion_recordatorios
WHERE tipo_evento = 'presupuesto_enviado';

