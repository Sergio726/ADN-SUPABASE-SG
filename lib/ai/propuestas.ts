import { createHmac, randomUUID, timingSafeEqual } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { NombreAccion } from './acciones'

const DURACION_PROPUESTA_MS = 15 * 60 * 1000

export interface PropuestaPendiente {
  id: string
  usuario_id: string
  accion: NombreAccion
  datos: Record<string, unknown>
  creada_en: string
  vence_en: string
  consumida_en: string | null
}

export class PropuestaInvalida extends Error {}

/**
 * La infraestructura concreta puede ser Supabase o un almacén en memoria de
 * pruebas. `consumir` tiene que ser atómico: sólo devuelve una propuesta aún
 * pendiente, vigente y perteneciente al usuario indicado.
 */
export interface AlmacenPropuestas {
  guardar(propuesta: PropuestaPendiente): Promise<PropuestaPendiente>
  consumir(id: string, usuarioId: string, ahora: string): Promise<PropuestaPendiente | null>
}

const COLUMNAS_PROPUESTA = 'id, usuario_id, accion, datos, creada_en, vence_en, consumida_en'

/** Adaptador de Supabase. El UPDATE condicional convierte el consumo en atómico. */
export function crearAlmacenPropuestasSupabase(supabase: SupabaseClient): AlmacenPropuestas {
  return {
    async guardar(propuesta) {
      const { data, error } = await supabase
        .from('asistente_propuestas')
        .insert(propuesta)
        .select(COLUMNAS_PROPUESTA)
        .single()

      if (error || !data) throw new Error(`No se pudo guardar la propuesta: ${error?.message || 'sin datos'}`)
      return data as PropuestaPendiente
    },
    async consumir(id, usuarioId, ahora) {
      const { data, error } = await supabase
        .from('asistente_propuestas')
        .update({ consumida_en: ahora })
        .eq('id', id)
        .eq('usuario_id', usuarioId)
        .is('consumida_en', null)
        .gt('vence_en', ahora)
        .select(COLUMNAS_PROPUESTA)
        .maybeSingle()

      if (error) throw new Error(`No se pudo confirmar la propuesta: ${error.message}`)
      return (data as PropuestaPendiente | null) || null
    },
  }
}

function errorConfirmacionInvalida(): never {
  throw new PropuestaInvalida('La confirmación no es válida.')
}

/** Firma el payload que el servidor calculó; el navegador no puede modificarlo. */
export function firmarPropuesta(propuesta: PropuestaPendiente, secreto: string): string {
  const payload = Buffer.from(JSON.stringify(propuesta)).toString('base64url')
  const firma = createHmac('sha256', secreto).update(payload).digest('base64url')
  return `${payload}.${firma}`
}

/** Verifica integridad, estructura y vencimiento antes de ejecutar una acción. */
export function verificarPropuestaFirmada(
  token: unknown,
  secreto: string,
  ahora = new Date().toISOString()
): PropuestaPendiente {
  if (typeof token !== 'string') errorConfirmacionInvalida()

  const partes = token.split('.')
  if (partes.length !== 2 || !partes[0] || !partes[1]) errorConfirmacionInvalida()

  const firmaEsperada = createHmac('sha256', secreto).update(partes[0]).digest()
  let firmaRecibida: Buffer
  try {
    firmaRecibida = Buffer.from(partes[1], 'base64url')
  } catch {
    return errorConfirmacionInvalida()
  }

  if (
    firmaRecibida.length !== firmaEsperada.length ||
    !timingSafeEqual(firmaRecibida, firmaEsperada)
  ) {
    errorConfirmacionInvalida()
  }

  let propuesta: unknown
  try {
    propuesta = JSON.parse(Buffer.from(partes[0], 'base64url').toString('utf8'))
  } catch {
    return errorConfirmacionInvalida()
  }

  if (
    !propuesta ||
    typeof propuesta !== 'object' ||
    typeof (propuesta as PropuestaPendiente).id !== 'string' ||
    typeof (propuesta as PropuestaPendiente).usuario_id !== 'string' ||
    !['crear_presupuesto_cercado', 'crear_cliente', 'crear_tarea'].includes(
      (propuesta as PropuestaPendiente).accion
    ) ||
    !(propuesta as PropuestaPendiente).datos ||
    typeof (propuesta as PropuestaPendiente).datos !== 'object' ||
    Array.isArray((propuesta as PropuestaPendiente).datos) ||
    typeof (propuesta as PropuestaPendiente).vence_en !== 'string' ||
    (propuesta as PropuestaPendiente).vence_en <= ahora
  ) {
    errorConfirmacionInvalida()
  }

  return propuesta as PropuestaPendiente
}

export async function crearPropuesta(
  almacen: AlmacenPropuestas,
  usuarioId: string,
  accion: NombreAccion,
  datos: Record<string, unknown>,
  ahora = new Date()
): Promise<PropuestaPendiente> {
  const creadaEn = ahora.toISOString()
  const propuesta: PropuestaPendiente = {
    id: randomUUID(),
    usuario_id: usuarioId,
    accion,
    datos,
    creada_en: creadaEn,
    vence_en: new Date(ahora.getTime() + DURACION_PROPUESTA_MS).toISOString(),
    consumida_en: null,
  }

  return almacen.guardar(propuesta)
}

export async function confirmarPropuesta(
  almacen: AlmacenPropuestas,
  propuestaId: string,
  usuarioId: string,
  ahora = new Date().toISOString()
): Promise<PropuestaPendiente> {
  const propuesta = await almacen.consumir(propuestaId, usuarioId, ahora)

  if (!propuesta) {
    throw new PropuestaInvalida('La propuesta ya fue confirmada, venció o no te pertenece.')
  }

  return propuesta
}
