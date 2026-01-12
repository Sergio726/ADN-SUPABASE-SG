import { supabase } from './supabaseClient'

export type TipoAtencion = 'presencial' | 'telefonica' | 'online'
export type TipoDiaEspecial = 'feriado' | 'cierre'

export interface HorarioAtencion {
  id?: string
  tipo_atencion: TipoAtencion
  dia_semana: number // 0=Domingo, 1=Lunes, ..., 6=Sábado
  hora_inicio: string // Formato HH:MM
  hora_fin: string // Formato HH:MM
  activo: boolean
  creado_en?: string
  actualizado_en?: string
}

export interface DiaEspecial {
  id?: string
  fecha: string // Formato YYYY-MM-DD
  tipo: TipoDiaEspecial
  descripcion?: string
  activo: boolean
  creado_en?: string
}

export interface HorarioCompleto extends HorarioAtencion {
  dia_nombre: string
}

/**
 * Obtiene todos los horarios de atención
 */
export async function obtenerHorarios(): Promise<HorarioCompleto[]> {
  const { data, error } = await supabase
    .from('v_horarios_completos')
    .select('*')
    .order('tipo_atencion', { ascending: true })
    .order('dia_semana', { ascending: true })

  if (error) {
    console.error('Error al obtener horarios:', error)
    throw error
  }

  return data || []
}

/**
 * Obtiene horarios filtrados por tipo de atención
 */
export async function obtenerHorariosPorTipo(tipoAtencion: TipoAtencion): Promise<HorarioCompleto[]> {
  const { data, error } = await supabase
    .from('v_horarios_completos')
    .select('*')
    .eq('tipo_atencion', tipoAtencion)
    .order('dia_semana', { ascending: true })

  if (error) {
    console.error('Error al obtener horarios por tipo:', error)
    throw error
  }

  return data || []
}

/**
 * Guarda o actualiza un horario de atención
 */
export async function guardarHorario(horario: HorarioAtencion): Promise<HorarioAtencion> {
  if (horario.id) {
    // Actualizar
    const { data, error } = await supabase
      .from('configuracion_horarios')
      .update({
        tipo_atencion: horario.tipo_atencion,
        dia_semana: horario.dia_semana,
        hora_inicio: horario.hora_inicio,
        hora_fin: horario.hora_fin,
        activo: horario.activo,
      })
      .eq('id', horario.id)
      .select()
      .single()

    if (error) {
      console.error('Error al actualizar horario:', error)
      throw error
    }

    return data
  } else {
    // Crear
    const { data, error } = await supabase
      .from('configuracion_horarios')
      .insert({
        tipo_atencion: horario.tipo_atencion,
        dia_semana: horario.dia_semana,
        hora_inicio: horario.hora_inicio,
        hora_fin: horario.hora_fin,
        activo: horario.activo,
      })
      .select()
      .single()

    if (error) {
      console.error('Error al crear horario:', error)
      
      // Detectar error de clave duplicada (unique constraint violation)
      if (error.code === '23505' || error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
        const tipoNombre = obtenerNombreTipoAtencion(horario.tipo_atencion)
        const diaNombre = obtenerNombreDia(horario.dia_semana)
        throw new Error(`Ya existe un horario configurado para ${tipoNombre} el día ${diaNombre}. Por favor, edita el horario existente o elimínalo primero.`)
      }
      
      throw error
    }

    return data
  }
}

/**
 * Elimina un horario de atención
 */
export async function eliminarHorario(id: string): Promise<void> {
  const { error } = await supabase
    .from('configuracion_horarios')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error al eliminar horario:', error)
    throw error
  }
}

/**
 * Verifica si está en horario de atención
 */
export async function estaEnHorarioAtencion(
  tipoAtencion: TipoAtencion,
  fechaHora?: Date
): Promise<boolean> {
  // Usar fecha/hora de Argentina si no se especifica
  const fechaHoraParam = fechaHora || obtenerFechaHoraArgentina()
  
  // Convertir a string en formato ISO pero ajustado a zona horaria de Argentina
  const fechaArgentina = fechaHoraParam.toLocaleString('en-US', { 
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
  
  // Convertir a formato ISO para PostgreSQL
  // Formato: "MM/DD/YYYY, HH:MM:SS" -> "YYYY-MM-DD HH:MM:SS"
  const [fechaPart, horaPart] = fechaArgentina.split(', ')
  const [mes, dia, anio] = fechaPart.split('/')
  const fechaHoraISO = `${anio}-${mes}-${dia} ${horaPart}`

  const { data, error } = await supabase.rpc('esta_en_horario_atencion', {
    p_tipo_atencion: tipoAtencion,
    p_fecha_hora: fechaHoraISO,
  })

  if (error) {
    console.error('Error al verificar horario:', error)
    throw error
  }

  return data || false
}

/**
 * Obtiene todos los días especiales
 */
export async function obtenerDiasEspeciales(): Promise<DiaEspecial[]> {
  const { data, error } = await supabase
    .from('dias_especiales')
    .select('*')
    .order('fecha', { ascending: true })

  if (error) {
    console.error('Error al obtener días especiales:', error)
    throw error
  }

  return data || []
}

/**
 * Obtiene días especiales por rango de fechas
 */
export async function obtenerDiasEspecialesPorRango(
  fechaDesde: string,
  fechaHasta: string
): Promise<DiaEspecial[]> {
  const { data, error } = await supabase
    .from('dias_especiales')
    .select('*')
    .gte('fecha', fechaDesde)
    .lte('fecha', fechaHasta)
    .eq('activo', true)
    .order('fecha', { ascending: true })

  if (error) {
    console.error('Error al obtener días especiales por rango:', error)
    throw error
  }

  return data || []
}

/**
 * Guarda o actualiza un día especial
 */
export async function guardarDiaEspecial(diaEspecial: DiaEspecial): Promise<DiaEspecial> {
  if (diaEspecial.id) {
    // Actualizar
    const { data, error } = await supabase
      .from('dias_especiales')
      .update({
        fecha: diaEspecial.fecha,
        tipo: diaEspecial.tipo,
        descripcion: diaEspecial.descripcion,
        activo: diaEspecial.activo,
      })
      .eq('id', diaEspecial.id)
      .select()
      .single()

    if (error) {
      console.error('Error al actualizar día especial:', error)
      throw error
    }

    return data
  } else {
    // Crear
    const { data, error } = await supabase
      .from('dias_especiales')
      .insert({
        fecha: diaEspecial.fecha,
        tipo: diaEspecial.tipo,
        descripcion: diaEspecial.descripcion,
        activo: diaEspecial.activo,
      })
      .select()
      .single()

    if (error) {
      console.error('Error al crear día especial:', error)
      throw error
    }

    return data
  }
}

/**
 * Elimina un día especial
 */
export async function eliminarDiaEspecial(id: string): Promise<void> {
  const { error } = await supabase
    .from('dias_especiales')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error al eliminar día especial:', error)
    throw error
  }
}

/**
 * Obtiene el nombre del día de la semana
 */
export function obtenerNombreDia(diaSemana: number): string {
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  return dias[diaSemana] || ''
}

/**
 * Obtiene el nombre del tipo de atención
 */
export function obtenerNombreTipoAtencion(tipo: TipoAtencion): string {
  const tipos: Record<TipoAtencion, string> = {
    presencial: 'Presencial',
    telefonica: 'Telefónica',
    online: 'Online',
  }
  return tipos[tipo] || tipo
}

/**
 * Formatea una hora a formato corto (HH:00)
 */
export function formatearHoraCorta(hora: string): string {
  if (!hora) return ''
  // Si ya está en formato HH:00, retornar tal cual
  if (hora.match(/^\d{1,2}:00$/)) return hora.padStart(5, '0')
  // Extraer solo la hora (HH) y agregar :00
  const partes = hora.split(':')
  if (partes.length > 0) {
    const horaNum = parseInt(partes[0])
    if (isNaN(horaNum)) return hora
    return `${horaNum.toString().padStart(2, '0')}:00`
  }
  return hora
}

/**
 * Obtiene la fecha/hora actual en zona horaria de Argentina
 */
export function obtenerFechaHoraArgentina(): Date {
  // Crear fecha en zona horaria de Argentina
  const ahora = new Date()
  const fechaArgentina = new Date(ahora.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }))
  return fechaArgentina
}

