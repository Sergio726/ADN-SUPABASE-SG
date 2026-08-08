export type EstadoPresupuesto =
  | 'borrador'
  | 'enviado'
  | 'aprobado'
  | 'rechazado'
  | 'vencido'
  | 'baja'

export type TipoPresupuesto = 'articulos' | 'cercado' | 'general'

export type PeriodoPreset = 'mes' | 'mes_anterior' | 'trimestre' | 'año' | 'custom'

export type PresupuestoVentas = {
  id: string
  numero: string
  tipo: string
  estado: string
  forma_pago: string | null
  total: number
  cliente_id: string | null
  cliente_nombre: string
  usuario_id: string | null
  usuario_nombre: string
  fecha_emision: string
}

export type ItemVentas = {
  presupuesto_id: string
  descripcion: string
  cantidad: number
  precio_total: number
  unidad: string | null
}

export type RangoFechas = { desde: Date; hasta: Date }

const ESTADOS_DECIDIDOS = new Set<string>(['enviado', 'aprobado', 'rechazado', 'vencido'])
const ESTADOS_PIPELINE = ['borrador', 'enviado', 'aprobado', 'rechazado', 'vencido', 'baja'] as const

export const ETIQUETAS_TIPO: Record<string, string> = {
  articulos: 'Artículos',
  cercado: 'Cercado',
  general: 'General',
}

export const ETIQUETAS_FORMA_PAGO: Record<string, string> = {
  efectivo: 'Efectivo',
  lista: 'Lista / Factura',
  tarjeta: 'Tarjeta',
  echeq45: 'ECHEQ 45',
  echeq60: 'ECHEQ 60',
  echeq90: 'ECHEQ 90',
}

export const ETIQUETAS_ESTADO: Record<string, string> = {
  borrador: 'Borrador',
  enviado: 'Enviado',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
  vencido: 'Vencido',
  baja: 'Baja',
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function toISODateLocal(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseISODateLocal(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export function rangoPeriodo(
  preset: PeriodoPreset,
  hoy = new Date(),
  custom?: { desde: string; hasta: string }
): RangoFechas {
  const h = startOfDay(hoy)

  switch (preset) {
    case 'mes':
      return { desde: new Date(h.getFullYear(), h.getMonth(), 1), hasta: h }
    case 'mes_anterior': {
      const desde = new Date(h.getFullYear(), h.getMonth() - 1, 1)
      const hasta = new Date(h.getFullYear(), h.getMonth(), 0)
      return { desde, hasta }
    }
    case 'trimestre': {
      const q = Math.floor(h.getMonth() / 3) * 3
      return { desde: new Date(h.getFullYear(), q, 1), hasta: h }
    }
    case 'año':
      return { desde: new Date(h.getFullYear(), 0, 1), hasta: h }
    case 'custom': {
      if (!custom?.desde || !custom?.hasta) return rangoPeriodo('mes', hoy)
      return {
        desde: parseISODateLocal(custom.desde),
        hasta: parseISODateLocal(custom.hasta),
      }
    }
  }
}

export function rangoAnterior(desde: Date, hasta: Date, preset: PeriodoPreset): RangoFechas {
  if (preset === 'mes' || preset === 'mes_anterior') {
    return {
      desde: new Date(desde.getFullYear(), desde.getMonth() - 1, 1),
      hasta: new Date(desde.getFullYear(), desde.getMonth(), 0),
    }
  }
  if (preset === 'trimestre') {
    return {
      desde: new Date(desde.getFullYear(), desde.getMonth() - 3, 1),
      hasta: new Date(desde.getFullYear(), desde.getMonth(), 0),
    }
  }
  if (preset === 'año') {
    return {
      desde: new Date(desde.getFullYear() - 1, 0, 1),
      hasta: new Date(desde.getFullYear() - 1, 11, 31),
    }
  }

  const ms =
    startOfDay(hasta).getTime() + 24 * 60 * 60 * 1000 - 1 - startOfDay(desde).getTime()
  const hastaAnt = new Date(startOfDay(desde).getTime() - 24 * 60 * 60 * 1000)
  const desdeAnt = new Date(hastaAnt.getTime() - ms)
  return { desde: startOfDay(desdeAnt), hasta: startOfDay(hastaAnt) }
}

export function enRango(fechaEmision: string, rango: RangoFechas): boolean {
  if (!fechaEmision) return false
  const f = parseISODateLocal(fechaEmision)
  const d = startOfDay(rango.desde)
  const h = startOfDay(rango.hasta)
  return f >= d && f <= h
}

export function filtrarPresupuestos(
  rows: PresupuestoVentas[],
  rango: RangoFechas,
  vendedorId: string | 'todos',
  tipo: string | 'todos'
): PresupuestoVentas[] {
  return rows.filter((p) => {
    if (!enRango(p.fecha_emision, rango)) return false
    if (vendedorId !== 'todos' && p.usuario_id !== vendedorId) return false
    if (tipo !== 'todos' && p.tipo !== tipo) return false
    return true
  })
}

export type KpisVentas = {
  total: number
  aprobados: number
  enviados: number
  rechazados: number
  decididos: number
  montoAprobado: number
  montoRechazado: number
  tasaDecididos: number
  tasaVsEnviados: number
  ticketAprobado: number
  ticketRechazado: number
}

export function calcularKpis(rows: PresupuestoVentas[]): KpisVentas {
  let aprobados = 0
  let enviados = 0
  let rechazados = 0
  let decididos = 0
  let montoAprobado = 0
  let montoRechazado = 0

  for (const p of rows) {
    const total = Number(p.total) || 0
    if (ESTADOS_DECIDIDOS.has(p.estado)) decididos++
    if (p.estado === 'aprobado') {
      aprobados++
      montoAprobado += total
    } else if (p.estado === 'enviado') {
      enviados++
    } else if (p.estado === 'rechazado') {
      rechazados++
      montoRechazado += total
    }
  }

  const vsEnviadosDen = aprobados + enviados

  return {
    total: rows.length,
    aprobados,
    enviados,
    rechazados,
    decididos,
    montoAprobado,
    montoRechazado,
    tasaDecididos: decididos > 0 ? (aprobados / decididos) * 100 : 0,
    tasaVsEnviados: vsEnviadosDen > 0 ? (aprobados / vsEnviadosDen) * 100 : 0,
    ticketAprobado: aprobados > 0 ? montoAprobado / aprobados : 0,
    ticketRechazado: rechazados > 0 ? montoRechazado / rechazados : 0,
  }
}

export function deltaPorcentaje(actual: number, anterior: number): number | null {
  if (anterior === 0) return actual === 0 ? 0 : null
  return ((actual - anterior) / anterior) * 100
}

export type PipelineEstado = {
  estado: string
  etiqueta: string
  cantidad: number
  monto: number
}

export function pipelinePorEstado(rows: PresupuestoVentas[]): PipelineEstado[] {
  const map = new Map<string, { cantidad: number; monto: number }>()
  for (const estado of ESTADOS_PIPELINE) {
    map.set(estado, { cantidad: 0, monto: 0 })
  }
  for (const p of rows) {
    const key = ESTADOS_PIPELINE.includes(p.estado as (typeof ESTADOS_PIPELINE)[number])
      ? p.estado
      : p.estado
    const prev = map.get(key) || { cantidad: 0, monto: 0 }
    prev.cantidad++
    prev.monto += Number(p.total) || 0
    map.set(key, prev)
  }
  return ESTADOS_PIPELINE.map((estado) => ({
    estado,
    etiqueta: ETIQUETAS_ESTADO[estado] || estado,
    cantidad: map.get(estado)?.cantidad || 0,
    monto: map.get(estado)?.monto || 0,
  }))
}

export type BreakdownFila = {
  clave: string
  etiqueta: string
  total: number
  aprobados: number
  enviados: number
  tasaDecididos: number
  montoAprobado: number
}

function breakdown(
  rows: PresupuestoVentas[],
  claveDe: (p: PresupuestoVentas) => string,
  etiquetaDe: (clave: string, p?: PresupuestoVentas) => string
): BreakdownFila[] {
  const grupos = new Map<string, PresupuestoVentas[]>()
  for (const p of rows) {
    const clave = claveDe(p)
    const list = grupos.get(clave) || []
    list.push(p)
    grupos.set(clave, list)
  }

  const filas: BreakdownFila[] = []
  for (const [clave, list] of grupos) {
    const kpis = calcularKpis(list)
    filas.push({
      clave,
      etiqueta: etiquetaDe(clave, list[0]),
      total: kpis.total,
      aprobados: kpis.aprobados,
      enviados: kpis.enviados,
      tasaDecididos: kpis.tasaDecididos,
      montoAprobado: kpis.montoAprobado,
    })
  }

  return filas.sort((a, b) => b.montoAprobado - a.montoAprobado || b.tasaDecididos - a.tasaDecididos)
}

export function breakdownPorVendedor(rows: PresupuestoVentas[]): BreakdownFila[] {
  return breakdown(
    rows,
    (p) => p.usuario_id || 'sin-vendedor',
    (_clave, p) => p?.usuario_nombre || 'Sin asignar'
  )
}

export function breakdownPorTipo(rows: PresupuestoVentas[]): BreakdownFila[] {
  return breakdown(
    rows,
    (p) => p.tipo || 'sin-tipo',
    (clave) => ETIQUETAS_TIPO[clave] || clave
  )
}

export function breakdownPorFormaPago(rows: PresupuestoVentas[]): BreakdownFila[] {
  return breakdown(
    rows,
    (p) => p.forma_pago || 'sin-dato',
    (clave) => (clave === 'sin-dato' ? 'Sin dato' : ETIQUETAS_FORMA_PAGO[clave] || clave)
  )
}

export type SerieMensual = {
  ym: string
  etiqueta: string
  total: number
  aprobados: number
  montoAprobado: number
  tasaDecididos: number
}

export function serieMensual(rows: PresupuestoVentas[], meses = 12, hasta = new Date()): SerieMensual[] {
  const fin = startOfDay(hasta)
  const inicio = new Date(fin.getFullYear(), fin.getMonth() - (meses - 1), 1)
  const buckets = new Map<string, PresupuestoVentas[]>()

  for (let i = 0; i < meses; i++) {
    const d = new Date(inicio.getFullYear(), inicio.getMonth() + i, 1)
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    buckets.set(ym, [])
  }

  for (const p of rows) {
    if (!p.fecha_emision) continue
    const f = parseISODateLocal(p.fecha_emision)
    if (f < inicio || f > fin) continue
    const ym = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}`
    const list = buckets.get(ym)
    if (list) list.push(p)
  }

  const mesesCortos = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

  return Array.from(buckets.entries()).map(([ym, list]) => {
    const kpis = calcularKpis(list)
    const [y, m] = ym.split('-').map(Number)
    return {
      ym,
      etiqueta: `${mesesCortos[(m || 1) - 1]} ${y}`,
      total: kpis.total,
      aprobados: kpis.aprobados,
      montoAprobado: kpis.montoAprobado,
      tasaDecididos: kpis.tasaDecididos,
    }
  })
}

export type TopCliente = {
  clave: string
  nombre: string
  cantidad: number
  monto: number
  ticket: number
}

export function topClientes(rows: PresupuestoVentas[], limite = 10): TopCliente[] {
  const aprobados = rows.filter((p) => p.estado === 'aprobado')
  const map = new Map<string, { nombre: string; cantidad: number; monto: number }>()

  for (const p of aprobados) {
    const clave = p.cliente_id || p.cliente_nombre || 'sin-cliente'
    const prev = map.get(clave) || {
      nombre: p.cliente_nombre || 'Sin nombre',
      cantidad: 0,
      monto: 0,
    }
    prev.cantidad++
    prev.monto += Number(p.total) || 0
    map.set(clave, prev)
  }

  return Array.from(map.entries())
    .map(([clave, v]) => ({
      clave,
      nombre: v.nombre,
      cantidad: v.cantidad,
      monto: v.monto,
      ticket: v.cantidad > 0 ? v.monto / v.cantidad : 0,
    }))
    .sort((a, b) => b.monto - a.monto)
    .slice(0, limite)
}

export type TopProducto = {
  descripcion: string
  cantidad: number
  monto: number
  unidad: string | null
}

export function topProductos(items: ItemVentas[], limite = 10): TopProducto[] {
  const map = new Map<string, { descripcion: string; cantidad: number; monto: number; unidad: string | null }>()

  for (const item of items) {
    const label = (item.descripcion || 'Sin descripción').trim()
    const clave = label.toLowerCase()
    const prev = map.get(clave) || {
      descripcion: label,
      cantidad: 0,
      monto: 0,
      unidad: item.unidad || null,
    }
    prev.cantidad += Number(item.cantidad) || 0
    prev.monto += Number(item.precio_total) || 0
    map.set(clave, prev)
  }

  return Array.from(map.values())
    .sort((a, b) => b.monto - a.monto)
    .slice(0, limite)
}

export function formatearMoneda(valor: number): string {
  return valor.toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

export function formatearMonedaDecimal(valor: number): string {
  return valor.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function formatearDelta(delta: number | null): string {
  if (delta === null) return 's/d'
  const sign = delta > 0 ? '+' : ''
  return `${sign}${delta.toFixed(1)}%`
}
