/**
 * Servicio para gestión de tareas CRM
 * Centraliza todas las operaciones CRUD de tareas
 */

import { supabase } from './supabaseClient'

export type EstadoTarea = 'pendiente' | 'en_progreso' | 'completada' | 'cancelada'

export interface TareaCRM {
  id: string
  cliente_id: string | null
  presupuesto_id: string | null
  titulo: string
  descripcion: string | null
  asignado_a: string | null
  estado: EstadoTarea
  fecha_vencimiento: string | null
  completada_en: string | null
  creado_por: string | null
  creado_en: string
  actualizado_en: string
  // Campos de la vista completa
  cliente_nombre?: string
  cliente_telefono?: string
  cliente_email?: string
  presupuesto_numero?: string
  presupuesto_total?: number
  presupuesto_estado?: string
  asignado_nombre?: string
  creador_nombre?: string
  estado_vencimiento?: 'vencida' | 'por_vencer' | 'vigente' | null
}

export interface CrearTareaData {
  cliente_id?: string
  presupuesto_id?: string
  titulo: string
  descripcion?: string
  asignado_a?: string
  fecha_vencimiento?: string
  estado?: EstadoTarea
}

export interface ActualizarTareaData {
  titulo?: string
  descripcion?: string
  asignado_a?: string
  estado?: EstadoTarea
  fecha_vencimiento?: string
}

/**
 * Obtiene todas las tareas con información relacionada
 */
export async function obtenerTareas(filtros?: {
  cliente_id?: string
  presupuesto_id?: string
  asignado_a?: string
  estado?: EstadoTarea | EstadoTarea[]
  incluir_completadas?: boolean
}): Promise<TareaCRM[]> {
  let query = supabase
    .from('v_tareas_crm_completas')
    .select('*')
    .order('fecha_vencimiento', { ascending: true, nullsFirst: false })
    .order('creado_en', { ascending: false })

  if (filtros?.cliente_id) {
    query = query.eq('cliente_id', filtros.cliente_id)
  }

  if (filtros?.presupuesto_id) {
    query = query.eq('presupuesto_id', filtros.presupuesto_id)
  }

  if (filtros?.asignado_a) {
    query = query.eq('asignado_a', filtros.asignado_a)
  }

  if (filtros?.estado) {
    if (Array.isArray(filtros.estado)) {
      query = query.in('estado', filtros.estado)
    } else {
      query = query.eq('estado', filtros.estado)
    }
  } else if (!filtros?.incluir_completadas) {
    // Por defecto, excluir completadas y canceladas
    query = query.in('estado', ['pendiente', 'en_progreso'])
  }

  const { data, error } = await query

  if (error) {
    console.error('Error al obtener tareas:', error)
    throw error
  }

  return (data || []) as TareaCRM[]
}

/**
 * Obtiene tareas pendientes de un usuario específico
 */
export async function obtenerTareasPendientesUsuario(usuarioId: string): Promise<TareaCRM[]> {
  const { data, error } = await supabase
    .rpc('obtener_tareas_pendientes_usuario', { p_usuario_id: usuarioId })

  if (error) {
    console.error('Error al obtener tareas pendientes:', error)
    throw error
  }

  return (data || []) as TareaCRM[]
}

/**
 * Obtiene una tarea por ID
 */
export async function obtenerTareaPorId(id: string): Promise<TareaCRM | null> {
  const { data, error } = await supabase
    .from('v_tareas_crm_completas')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // No encontrada
    }
    console.error('Error al obtener tarea:', error)
    throw error
  }

  return data as TareaCRM
}

/**
 * Crea una nueva tarea
 */
export async function crearTarea(datos: CrearTareaData): Promise<TareaCRM> {
  // Obtener usuario actual
  const { data: { user } } = await supabase.auth.getUser()
  
  const tareaData = {
    ...datos,
    estado: datos.estado || 'pendiente',
    creado_por: user?.id || null,
    asignado_a: datos.asignado_a || user?.id || null,
  }

  const { data, error } = await supabase
    .from('tareas_crm')
    .insert(tareaData)
    .select()
    .single()

  if (error) {
    console.error('Error al crear tarea:', error)
    throw error
  }

  // Obtener la tarea completa con información relacionada
  return await obtenerTareaPorId(data.id) || data as TareaCRM
}

/**
 * Actualiza una tarea existente
 */
export async function actualizarTarea(
  id: string,
  datos: ActualizarTareaData
): Promise<TareaCRM> {
  const updateData: any = { ...datos }

  // Si se marca como completada, agregar fecha de completado
  if (datos.estado === 'completada') {
    updateData.completada_en = new Date().toISOString()
  } else if (datos.estado) {
    // Si cambia a otro estado que no sea completada, limpiar fecha
    updateData.completada_en = null
  }

  const { error } = await supabase
    .from('tareas_crm')
    .update(updateData)
    .eq('id', id)

  if (error) {
    console.error('Error al actualizar tarea:', error)
    throw error
  }

  // Obtener la tarea actualizada
  return await obtenerTareaPorId(id) || {} as TareaCRM
}

/**
 * Marca una tarea como completada
 */
export async function completarTarea(id: string): Promise<TareaCRM> {
  return await actualizarTarea(id, { estado: 'completada' })
}

/**
 * Elimina una tarea
 */
export async function eliminarTarea(id: string): Promise<void> {
  const { error } = await supabase
    .from('tareas_crm')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error al eliminar tarea:', error)
    throw error
  }
}

/**
 * Obtiene estadísticas de tareas
 */
export async function obtenerEstadisticasTareas(filtros?: {
  asignado_a?: string
  cliente_id?: string
}): Promise<{
  total: number
  pendientes: number
  en_progreso: number
  completadas: number
  vencidas: number
  por_vencer: number
}> {
  let query = supabase
    .from('v_tareas_crm_completas')
    .select('estado, estado_vencimiento', { count: 'exact' })

  if (filtros?.asignado_a) {
    query = query.eq('asignado_a', filtros.asignado_a)
  }

  if (filtros?.cliente_id) {
    query = query.eq('cliente_id', filtros.cliente_id)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error al obtener estadísticas:', error)
    throw error
  }

  const tareas = (data || []) as Array<{ estado: EstadoTarea; estado_vencimiento: string | null }>

  return {
    total: tareas.length,
    pendientes: tareas.filter(t => t.estado === 'pendiente').length,
    en_progreso: tareas.filter(t => t.estado === 'en_progreso').length,
    completadas: tareas.filter(t => t.estado === 'completada').length,
    vencidas: tareas.filter(t => t.estado_vencimiento === 'vencida').length,
    por_vencer: tareas.filter(t => t.estado_vencimiento === 'por_vencer').length,
  }
}

