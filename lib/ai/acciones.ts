/**
 * Acciones del asistente que ESCRIBEN en la base (Fase 3).
 *
 * Ninguna se ejecuta sola. El flujo es siempre el mismo:
 *
 *   1. El modelo pide una acción → `prepararAccion()` valida y arma una
 *      propuesta con los datos ya resueltos y un resumen legible.
 *   2. La propuesta vuelve al vendedor, que la ve y confirma en la UI.
 *   3. Recién ahí `ejecutarAccion()` escribe.
 *
 * Regla que sostiene todo esto: **los importes nunca vienen del cliente**. En
 * el paso 3 se recalculan desde la base con la misma fórmula del wizard de
 * presupuestos, así que aunque alguien manipule el pedido de confirmación, el
 * total guardado sigue siendo el que corresponde.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { DefinicionTool } from './openrouter'

/** Factores por forma de pago, iguales a los del wizard de cercado. */
const FACTOR_FORMA_PAGO: Record<string, number> = {
  efectivo: 1.0,
  lista: 1.21,
  tarjeta: 1.3,
  echeq45: 1.21,
  echeq60: 1.3,
  echeq90: 1.4,
}

const FORMAS_PAGO = Object.keys(FACTOR_FORMA_PAGO)

export const NOMBRES_ACCIONES = [
  'crear_presupuesto_cercado',
  'crear_cliente',
  'crear_tarea',
] as const

export type NombreAccion = (typeof NOMBRES_ACCIONES)[number]

export function esAccion(nombre: string): nombre is NombreAccion {
  return (NOMBRES_ACCIONES as readonly string[]).includes(nombre)
}

/** Lo que se le muestra al vendedor para que confirme. */
export interface PropuestaAccion {
  accion: NombreAccion
  titulo: string
  /** Filas "campo: valor" que se muestran en la tarjeta de confirmación */
  detalle: Array<{ campo: string; valor: string }>
  advertencias?: string[]
  /** Datos ya resueltos (ids, no nombres) que se mandan al ejecutar */
  datos: Record<string, any>
}

export class AccionInvalida extends Error {}

const money = (n: number) =>
  '$' + Number(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const limpiar = (t: unknown) => String(t ?? '').replace(/[,()%*\\]/g, ' ').trim().slice(0, 120)

const palabras = (t: unknown) =>
  limpiar(t)
    .split(/\s+/)
    .filter((p) => p.length >= 2)
    .slice(0, 6)

function filtrarPorPalabras<T>(query: T, ps: string[], columnas: string[]): T {
  let resultado: any = query
  for (const palabra of ps) {
    resultado = resultado.or(columnas.map((col) => `${col}.ilike.%${palabra}%`).join(','))
  }
  return resultado
}

/** Fecha de hoy en Argentina, igual que en el wizard de presupuestos. */
function fechaArgentina(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

// ---------------------------------------------------------------- Definiciones

export const DEFINICIONES_ACCIONES: DefinicionTool[] = [
  {
    type: 'function',
    function: {
      name: 'crear_presupuesto_cercado',
      description:
        'Prepara un presupuesto de cercado en estado BORRADOR para que el vendedor lo confirme. No lo crea directamente: siempre se le muestra antes para aprobar. Usar cuando el vendedor pide explícitamente cargar o guardar un presupuesto.',
      parameters: {
        type: 'object',
        properties: {
          cliente: {
            type: 'string',
            description: 'Nombre, razón social o documento del cliente. Tiene que existir en el sistema.',
          },
          configuracion: {
            type: 'string',
            description: 'Nombre (o parte) de la configuración de cercado a presupuestar.',
          },
          metros_lineales: { type: 'number', description: 'Metros lineales de cerco.' },
          forma_pago: {
            type: 'string',
            enum: FORMAS_PAGO,
            description: 'Forma de pago. Por defecto "lista" (factura, precio base × 1,21).',
          },
          observaciones: { type: 'string', description: 'Observaciones para el presupuesto.' },
        },
        required: ['cliente', 'configuracion', 'metros_lineales'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'crear_cliente',
      description:
        'Prepara el alta de un cliente nuevo para que el vendedor la confirme. Usar cuando el cliente no existe todavía y hace falta cargarlo.',
      parameters: {
        type: 'object',
        properties: {
          nombre_completo: { type: 'string', description: 'Nombre y apellido, o nombre de fantasía.' },
          tipo_documento: { type: 'string', enum: ['DNI', 'CUIL', 'CUIT'] },
          numero_documento: { type: 'string', description: 'Número de documento, solo dígitos.' },
          telefono: { type: 'string' },
          email: { type: 'string' },
          direccion: { type: 'string' },
          ciudad: { type: 'string' },
          razon_social: { type: 'string', description: 'Solo si es una empresa.' },
        },
        required: ['nombre_completo'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'crear_tarea',
      description:
        'Prepara una tarea de seguimiento para que el vendedor la confirme. Usar para recordatorios: llamar a un cliente, hacer seguimiento de un presupuesto, pasar a visitar una obra.',
      parameters: {
        type: 'object',
        properties: {
          titulo: { type: 'string', description: 'Qué hay que hacer, en pocas palabras.' },
          descripcion: { type: 'string', description: 'Detalle de la tarea.' },
          cliente: { type: 'string', description: 'Cliente relacionado, si aplica.' },
          dias_hasta_vencimiento: {
            type: 'number',
            description: 'En cuántos días vence la tarea. Por defecto 3.',
          },
        },
        required: ['titulo'],
      },
    },
  },
]

// ------------------------------------------------------------------ Preparar

async function buscarClienteUnico(supabase: SupabaseClient, texto: string) {
  const ps = palabras(texto)
  if (!ps.length) throw new AccionInvalida('Falta indicar el cliente.')

  const { data, error } = await filtrarPorPalabras(
    supabase
      .from('clientes')
      .select('id, nombre_completo, razon_social, tipo_documento, numero_documento, telefono, email, direccion')
      .eq('activo', true),
    ps,
    ['nombre_completo', 'razon_social', 'numero_documento']
  ).limit(5)

  if (error) throw new AccionInvalida(`No se pudo buscar el cliente: ${error.message}`)
  if (!data?.length) {
    throw new AccionInvalida(
      `No encontré ningún cliente que coincida con "${texto}". Si es nuevo, hay que darlo de alta primero.`
    )
  }
  if (data.length > 1) {
    throw new AccionInvalida(
      `Hay más de un cliente que coincide con "${texto}": ${data
        .map((c) => c.nombre_completo)
        .join(', ')}. Preguntale al vendedor cuál es.`
    )
  }

  return data[0]
}

async function prepararPresupuestoCercado(
  supabase: SupabaseClient,
  args: any
): Promise<PropuestaAccion> {
  const metros = Number(args?.metros_lineales)
  if (!Number.isFinite(metros) || metros <= 0) {
    throw new AccionInvalida('Los metros lineales tienen que ser un número mayor a cero.')
  }

  const formaPago = FORMAS_PAGO.includes(args?.forma_pago) ? args.forma_pago : 'lista'
  const cliente = await buscarClienteUnico(supabase, args?.cliente)

  const ps = palabras(args?.configuracion)
  if (!ps.length) throw new AccionInvalida('Falta indicar la configuración de cercado.')

  const { data: configs, error } = await filtrarPorPalabras(
    supabase
      .from('configuraciones_cercado')
      .select('id, nombre, altura_final_cerco, altura, precio_por_metro_lineal, precio_por_metro_menor_50m, actualizado_en')
      .eq('activo', true),
    ps,
    ['nombre']
  ).limit(5)

  if (error) throw new AccionInvalida(`No se pudo buscar la configuración: ${error.message}`)
  if (!configs?.length) {
    throw new AccionInvalida(`No encontré ninguna configuración de cercado como "${args?.configuracion}".`)
  }
  if (configs.length > 1) {
    throw new AccionInvalida(
      `Hay más de una configuración que coincide: ${configs
        .map((c: any) => `${c.nombre} (${money(c.precio_por_metro_lineal)}/m)`)
        .join(' · ')}. Preguntale al vendedor cuál usar.`
    )
  }

  const config = configs[0]
  const precioMetro = Number(config.precio_por_metro_lineal) || 0

  if (!precioMetro) {
    throw new AccionInvalida(
      `La configuración "${config.nombre}" no tiene precio por metro cargado. Hay que recalcularla desde /dashboard/cercado.`
    )
  }

  // Misma fórmula que el wizard: precio base × factor de forma de pago
  const precioBase = precioMetro * metros
  const subtotal = precioBase * FACTOR_FORMA_PAGO[formaPago]

  const advertencias: string[] = []
  if (metros < 50) {
    advertencias.push(
      'El terreno tiene menos de 50 m. El presupuesto se arma con el precio por metro normal, igual que en el wizard.'
    )
  }
  const diasDesdeActualizacion = config.actualizado_en
    ? Math.floor((Date.now() - new Date(config.actualizado_en).getTime()) / 86400000)
    : null
  if (diasDesdeActualizacion != null && diasDesdeActualizacion > 30) {
    advertencias.push(
      `Los precios de esta configuración se actualizaron hace ${diasDesdeActualizacion} días. Conviene recalcularla antes de enviar.`
    )
  }

  return {
    accion: 'crear_presupuesto_cercado',
    titulo: 'Crear presupuesto de cercado (borrador)',
    detalle: [
      { campo: 'Cliente', valor: cliente.nombre_completo },
      { campo: 'Configuración', valor: config.nombre },
      { campo: 'Metros lineales', valor: `${metros} m` },
      { campo: 'Precio por metro', valor: money(precioMetro) },
      { campo: 'Forma de pago', valor: `${formaPago} (× ${FACTOR_FORMA_PAGO[formaPago]})` },
      { campo: 'Total', valor: money(subtotal) },
      { campo: 'Estado', valor: 'Borrador' },
    ],
    advertencias: advertencias.length ? advertencias : undefined,
    datos: {
      cliente_id: cliente.id,
      cercado_config_id: config.id,
      metros_lineales: metros,
      forma_pago: formaPago,
      observaciones: args?.observaciones ? String(args.observaciones).slice(0, 500) : null,
    },
  }
}

async function prepararCliente(supabase: SupabaseClient, args: any): Promise<PropuestaAccion> {
  const nombre = limpiar(args?.nombre_completo)
  if (!nombre) throw new AccionInvalida('Falta el nombre del cliente.')

  const tipoDocumento = ['DNI', 'CUIL', 'CUIT'].includes(args?.tipo_documento)
    ? args.tipo_documento
    : 'DNI'
  const numeroDocumento = String(args?.numero_documento ?? '').replace(/\D/g, '').slice(0, 20) || null

  // Aviso si ya hay alguien parecido, para no duplicar fichas
  const advertencias: string[] = []
  const { data: parecidos } = await filtrarPorPalabras(
    supabase.from('clientes').select('nombre_completo, numero_documento').eq('activo', true),
    palabras(nombre),
    ['nombre_completo', 'razon_social']
  ).limit(3)

  if (parecidos?.length) {
    advertencias.push(
      `Ya hay clientes con nombre parecido: ${parecidos.map((c: any) => c.nombre_completo).join(', ')}. Revisá que no esté duplicado.`
    )
  }
  if (!numeroDocumento) {
    advertencias.push('Se va a cargar sin número de documento.')
  }

  return {
    accion: 'crear_cliente',
    titulo: 'Dar de alta un cliente',
    detalle: [
      { campo: 'Nombre', valor: nombre },
      { campo: 'Documento', valor: numeroDocumento ? `${tipoDocumento} ${numeroDocumento}` : '—' },
      { campo: 'Teléfono', valor: limpiar(args?.telefono) || '—' },
      { campo: 'Email', valor: limpiar(args?.email) || '—' },
      { campo: 'Dirección', valor: limpiar(args?.direccion) || '—' },
      { campo: 'Ciudad', valor: limpiar(args?.ciudad) || '—' },
    ],
    advertencias: advertencias.length ? advertencias : undefined,
    datos: {
      nombre_completo: nombre,
      tipo_documento: tipoDocumento,
      numero_documento: numeroDocumento,
      telefono: limpiar(args?.telefono) || null,
      email: limpiar(args?.email) || null,
      direccion: limpiar(args?.direccion) || null,
      ciudad: limpiar(args?.ciudad) || null,
      razon_social: limpiar(args?.razon_social) || null,
    },
  }
}

async function prepararTarea(supabase: SupabaseClient, args: any): Promise<PropuestaAccion> {
  const titulo = limpiar(args?.titulo)
  if (!titulo) throw new AccionInvalida('Falta el título de la tarea.')

  const dias = Number.isFinite(Number(args?.dias_hasta_vencimiento))
    ? Math.max(0, Math.min(365, Number(args.dias_hasta_vencimiento)))
    : 3

  const vencimiento = new Date()
  vencimiento.setDate(vencimiento.getDate() + dias)

  let cliente: any = null
  if (args?.cliente) {
    cliente = await buscarClienteUnico(supabase, args.cliente)
  }

  return {
    accion: 'crear_tarea',
    titulo: 'Crear tarea de seguimiento',
    detalle: [
      { campo: 'Tarea', valor: titulo },
      { campo: 'Detalle', valor: limpiar(args?.descripcion) || '—' },
      { campo: 'Cliente', valor: cliente?.nombre_completo || '—' },
      {
        campo: 'Vence',
        valor: `${vencimiento.toLocaleDateString('es-AR')} (en ${dias} ${dias === 1 ? 'día' : 'días'})`,
      },
    ],
    datos: {
      titulo,
      descripcion: limpiar(args?.descripcion) || null,
      cliente_id: cliente?.id || null,
      fecha_vencimiento: vencimiento.toISOString(),
    },
  }
}

export async function prepararAccion(
  supabase: SupabaseClient,
  nombre: NombreAccion,
  args: any
): Promise<PropuestaAccion> {
  switch (nombre) {
    case 'crear_presupuesto_cercado':
      return prepararPresupuestoCercado(supabase, args)
    case 'crear_cliente':
      return prepararCliente(supabase, args)
    case 'crear_tarea':
      return prepararTarea(supabase, args)
    default:
      throw new AccionInvalida(`Acción desconocida: ${nombre}`)
  }
}

// ------------------------------------------------------------------ Ejecutar

export interface ResultadoAccion {
  mensaje: string
  enlace?: string
}

/**
 * Ejecuta una acción ya confirmada por el vendedor.
 *
 * Los datos que llegan son referencias (ids, metros, textos), nunca importes:
 * el precio se vuelve a leer de la base acá adentro.
 */
export async function ejecutarAccion(
  supabase: SupabaseClient,
  nombre: NombreAccion,
  datos: any,
  usuarioId: string
): Promise<ResultadoAccion> {
  if (nombre === 'crear_presupuesto_cercado') {
    const metros = Number(datos?.metros_lineales)
    const formaPago = FORMAS_PAGO.includes(datos?.forma_pago) ? datos.forma_pago : 'lista'

    if (!Number.isFinite(metros) || metros <= 0) {
      throw new AccionInvalida('Los metros lineales no son válidos.')
    }

    const { data: cliente, error: errorCliente } = await supabase
      .from('clientes')
      .select('id, nombre_completo, email, telefono, direccion')
      .eq('id', datos?.cliente_id)
      .single()

    if (errorCliente || !cliente) throw new AccionInvalida('No encontré el cliente indicado.')

    const { data: config, error: errorConfig } = await supabase
      .from('configuraciones_cercado')
      .select('id, nombre, precio_por_metro_lineal')
      .eq('id', datos?.cercado_config_id)
      .single()

    if (errorConfig || !config) throw new AccionInvalida('No encontré la configuración de cercado.')

    // El precio se recalcula acá: nunca se acepta un total del cliente
    const precioMetro = Number(config.precio_por_metro_lineal) || 0
    if (!precioMetro) throw new AccionInvalida('La configuración no tiene precio por metro cargado.')

    const subtotal = precioMetro * metros * FACTOR_FORMA_PAGO[formaPago]

    const { data: numero, error: errorNumero } = await supabase.rpc('generar_numero_presupuesto', {
      p_tipo: 'cercado',
    })

    if (errorNumero) throw new AccionInvalida(`No se pudo generar el número: ${errorNumero.message}`)

    const { data: presupuesto, error: errorPres } = await supabase
      .from('presupuestos')
      .insert({
        numero,
        tipo: 'cercado',
        cliente_id: cliente.id,
        cliente_nombre: cliente.nombre_completo,
        cliente_email: cliente.email || null,
        cliente_telefono: cliente.telefono || null,
        cliente_direccion: cliente.direccion || null,
        metros_lineales_total: metros,
        cercado_config_id: config.id,
        forma_pago: formaPago,
        subtotal,
        descuento: 0,
        incremento: 0,
        total: subtotal,
        observaciones: datos?.observaciones || 'Cargado desde el asistente. Revisar antes de enviar.',
        validez_dias: 15,
        estado: 'borrador',
        usuario_id: usuarioId,
        fecha_emision: fechaArgentina(),
      })
      .select()
      .single()

    if (errorPres) throw new AccionInvalida(`No se pudo crear el presupuesto: ${errorPres.message}`)

    const { error: errorItems } = await supabase.from('presupuestos_items').insert([
      {
        presupuesto_id: presupuesto.id,
        descripcion: config.nombre,
        cantidad: metros,
        unidad: 'metro',
        precio_unitario: precioMetro,
        precio_total: subtotal,
        orden: 1,
      },
    ])

    if (errorItems) {
      // El presupuesto quedó creado pero sin ítems: se avisa para que lo revisen
      return {
        mensaje: `Se creó el presupuesto ${numero} en borrador, pero falló la carga del ítem (${errorItems.message}). Revisalo antes de enviarlo.`,
        enlace: `/dashboard/presupuestos/${presupuesto.id}`,
      }
    }

    return {
      mensaje: `Listo: presupuesto ${numero} creado en borrador por ${money(subtotal)} para ${cliente.nombre_completo}.`,
      enlace: `/dashboard/presupuestos/${presupuesto.id}`,
    }
  }

  if (nombre === 'crear_cliente') {
    const { data, error } = await supabase
      .from('clientes')
      .insert({
        nombre_completo: String(datos?.nombre_completo || '').slice(0, 200),
        tipo_documento: ['DNI', 'CUIL', 'CUIT'].includes(datos?.tipo_documento)
          ? datos.tipo_documento
          : 'DNI',
        numero_documento: datos?.numero_documento || null,
        telefono: datos?.telefono || null,
        email: datos?.email || null,
        direccion: datos?.direccion || null,
        ciudad: datos?.ciudad || null,
        razon_social: datos?.razon_social || null,
        activo: true,
        usuario_id: usuarioId,
      })
      .select()
      .single()

    if (error) throw new AccionInvalida(`No se pudo crear el cliente: ${error.message}`)

    return {
      mensaje: `Cliente ${data.nombre_completo} dado de alta.`,
      enlace: `/dashboard/clientes/${data.id}`,
    }
  }

  if (nombre === 'crear_tarea') {
    const { data, error } = await supabase
      .from('tareas_crm')
      .insert({
        titulo: String(datos?.titulo || '').slice(0, 200),
        descripcion: datos?.descripcion || null,
        cliente_id: datos?.cliente_id || null,
        estado: 'pendiente',
        fecha_vencimiento: datos?.fecha_vencimiento || null,
        asignado_a: usuarioId,
        creado_por: usuarioId,
      })
      .select()
      .single()

    if (error) throw new AccionInvalida(`No se pudo crear la tarea: ${error.message}`)

    return { mensaje: `Tarea "${data.titulo}" creada.`, enlace: '/dashboard/tareas' }
  }

  throw new AccionInvalida(`Acción desconocida: ${nombre}`)
}
