'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  Send,
  DollarSign,
  Users,
  Package,
  Filter,
  Info,
} from 'lucide-react'
import { exportarACSV } from '@/lib/export-utils'
import { exportarDashboardVentasAExcel } from '@/lib/excel-generator'
import {
  type PeriodoPreset,
  type PresupuestoVentas,
  type ItemVentas,
  breakdownPorFormaPago,
  breakdownPorTipo,
  breakdownPorVendedor,
  calcularKpis,
  deltaPorcentaje,
  filtrarPresupuestos,
  formatearDelta,
  formatearMoneda,
  pipelinePorEstado,
  rangoAnterior,
  rangoPeriodo,
  serieMensual,
  toISODateLocal,
  topClientes,
  topProductos,
  ETIQUETAS_TIPO,
} from '@/lib/ventas-metrics'

function Barra({ valor, max, className = 'bg-red-600' }: { valor: number; max: number; className?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((valor / max) * 100)) : 0
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className={`h-full rounded-full ${className}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) {
    return <Badge variant="outline">s/d período anterior</Badge>
  }
  const up = delta >= 0
  return (
    <Badge
      variant="outline"
      className={up ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}
    >
      {up ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
      {formatearDelta(delta)} vs ant.
    </Badge>
  )
}

export default function VentasPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [exportando, setExportando] = useState(false)
  const [presupuestos, setPresupuestos] = useState<PresupuestoVentas[]>([])
  const [itemsAprobados, setItemsAprobados] = useState<ItemVentas[]>([])
  const [vendedores, setVendedores] = useState<Array<{ id: string; nombre: string }>>([])

  const [periodo, setPeriodo] = useState<PeriodoPreset>('mes')
  const [filtroVendedor, setFiltroVendedor] = useState('todos')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true)

      const [{ data: rows, error: errP }, { data: usuarios, error: errU }] = await Promise.all([
        supabase
          .from('presupuestos')
          .select(
            'id, numero, tipo, estado, forma_pago, total, cliente_id, cliente_nombre, usuario_id, fecha_emision'
          )
          .order('fecha_emision', { ascending: false }),
        supabase.from('usuarios').select('id, nombre').not('nombre', 'is', null).order('nombre'),
      ])

      if (errP) throw errP
      if (errU) console.error('Error al cargar usuarios:', errU)

      const nombres = new Map((usuarios || []).map((u: any) => [u.id, u.nombre as string]))
      const mapped: PresupuestoVentas[] = (rows || []).map((p: any) => ({
        id: p.id,
        numero: p.numero,
        tipo: p.tipo,
        estado: p.estado,
        forma_pago: p.forma_pago,
        total: parseFloat(p.total) || 0,
        cliente_id: p.cliente_id,
        cliente_nombre: p.cliente_nombre || 'Sin nombre',
        usuario_id: p.usuario_id,
        usuario_nombre: (p.usuario_id && nombres.get(p.usuario_id)) || 'Sin asignar',
        fecha_emision: p.fecha_emision,
      }))

      setPresupuestos(mapped)

      const vendedoresMap = new Map<string, string>()
      mapped.forEach((p) => {
        if (p.usuario_id) vendedoresMap.set(p.usuario_id, p.usuario_nombre)
      })
      ;(usuarios || []).forEach((u: any) => {
        if (u.id && u.nombre) vendedoresMap.set(u.id, u.nombre)
      })
      setVendedores(
        Array.from(vendedoresMap.entries())
          .map(([id, nombre]) => ({ id, nombre }))
          .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
      )

      const idsAprobados = mapped.filter((p) => p.estado === 'aprobado').map((p) => p.id)
      if (idsAprobados.length === 0) {
        setItemsAprobados([])
        return
      }

      const { data: items, error: errI } = await supabase
        .from('presupuestos_items')
        .select('presupuesto_id, descripcion, cantidad, precio_total, unidad')
        .in('presupuesto_id', idsAprobados)

      if (errI) {
        console.error('Error al cargar ítems:', errI)
        setItemsAprobados([])
        return
      }

      setItemsAprobados(
        (items || []).map((i: any) => ({
          presupuesto_id: i.presupuesto_id,
          descripcion: i.descripcion || 'Sin descripción',
          cantidad: parseFloat(i.cantidad) || 0,
          precio_total: parseFloat(i.precio_total) || 0,
          unidad: i.unidad || null,
        }))
      )
    } catch (error: any) {
      console.error(error)
      toast({
        title: 'Error al cargar ventas',
        description: error?.message || 'No se pudieron cargar los presupuestos',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  const rangoActual = useMemo(
    () => rangoPeriodo(periodo, new Date(), { desde: fechaDesde, hasta: fechaHasta }),
    [periodo, fechaDesde, fechaHasta]
  )
  const rangoPrev = useMemo(
    () => rangoAnterior(rangoActual.desde, rangoActual.hasta, periodo),
    [rangoActual, periodo]
  )

  const actual = useMemo(
    () => filtrarPresupuestos(presupuestos, rangoActual, filtroVendedor, filtroTipo),
    [presupuestos, rangoActual, filtroVendedor, filtroTipo]
  )
  const anterior = useMemo(
    () => filtrarPresupuestos(presupuestos, rangoPrev, filtroVendedor, filtroTipo),
    [presupuestos, rangoPrev, filtroVendedor, filtroTipo]
  )

  const kpis = useMemo(() => calcularKpis(actual), [actual])
  const kpisAnt = useMemo(() => calcularKpis(anterior), [anterior])
  const pipeline = useMemo(() => pipelinePorEstado(actual), [actual])
  const porVendedor = useMemo(() => breakdownPorVendedor(actual), [actual])
  const porTipo = useMemo(() => breakdownPorTipo(actual), [actual])
  const porFormaPago = useMemo(() => breakdownPorFormaPago(actual), [actual])
  const tendencia = useMemo(() => serieMensual(presupuestos, 12), [presupuestos])
  const clientesTop = useMemo(() => topClientes(actual), [actual])

  const productosTop = useMemo(() => {
    const ids = new Set(actual.filter((p) => p.estado === 'aprobado').map((p) => p.id))
    return topProductos(itemsAprobados.filter((i) => ids.has(i.presupuesto_id)))
  }, [actual, itemsAprobados])

  const maxMontoTendencia = Math.max(...tendencia.map((t) => t.montoAprobado), 1)
  const maxPipeline = Math.max(...pipeline.map((p) => p.cantidad), 1)
  const maxVendedorMonto = Math.max(...porVendedor.map((v) => v.montoAprobado), 1)

  const labelRango = `${toISODateLocal(rangoActual.desde)} → ${toISODateLocal(rangoActual.hasta)}`

  const exportarExcel = () => {
    try {
      setExportando(true)
      exportarDashboardVentasAExcel({
        kpis: [
          { Métrica: 'Período', Valor: labelRango },
          { Métrica: 'Tasa vs decididos (%)', Valor: Number(kpis.tasaDecididos.toFixed(1)) },
          { Métrica: 'Tasa vs enviados (%)', Valor: Number(kpis.tasaVsEnviados.toFixed(1)) },
          { Métrica: 'Aprobados (cantidad)', Valor: kpis.aprobados },
          { Métrica: 'Ventas aprobadas ($)', Valor: Number(kpis.montoAprobado.toFixed(2)) },
          { Métrica: 'Ticket promedio aprobado ($)', Valor: Number(kpis.ticketAprobado.toFixed(2)) },
          { Métrica: 'Ticket promedio rechazado ($)', Valor: Number(kpis.ticketRechazado.toFixed(2)) },
          { Métrica: 'Enviados abiertos', Valor: kpis.enviados },
          { Métrica: 'Decididos', Valor: kpis.decididos },
          { Métrica: 'Total presupuestos', Valor: kpis.total },
        ],
        vendedores: porVendedor.map((v) => ({
          Vendedor: v.etiqueta,
          Total: v.total,
          Aprobados: v.aprobados,
          'Tasa %': Number(v.tasaDecididos.toFixed(1)),
          'Monto aprobado': Number(v.montoAprobado.toFixed(2)),
        })),
        tipos: porTipo.map((t) => ({
          Tipo: t.etiqueta,
          Total: t.total,
          Aprobados: t.aprobados,
          'Tasa %': Number(t.tasaDecididos.toFixed(1)),
          'Monto aprobado': Number(t.montoAprobado.toFixed(2)),
        })),
        formasPago: porFormaPago.map((f) => ({
          'Forma de pago': f.etiqueta,
          Total: f.total,
          Aprobados: f.aprobados,
          'Tasa %': Number(f.tasaDecididos.toFixed(1)),
          'Monto aprobado': Number(f.montoAprobado.toFixed(2)),
        })),
        clientes: clientesTop.map((c) => ({
          Cliente: c.nombre,
          Presupuestos: c.cantidad,
          'Monto $': Number(c.monto.toFixed(2)),
          Ticket: Number(c.ticket.toFixed(2)),
        })),
        productos: productosTop.map((p) => ({
          Producto: p.descripcion,
          Cantidad: p.cantidad,
          Unidad: p.unidad || '',
          'Monto $': Number(p.monto.toFixed(2)),
        })),
      })
      toast({ title: 'Excel descargado' })
    } catch (e: any) {
      toast({ title: 'No se pudo exportar', description: e?.message, variant: 'destructive' })
    } finally {
      setExportando(false)
    }
  }

  const exportarCsv = () => {
    try {
      setExportando(true)
      exportarACSV(
        [
          ...porVendedor.map((v) => ({
            seccion: 'Vendedor',
            nombre: v.etiqueta,
            total: v.total,
            aprobados: v.aprobados,
            tasa: Number(v.tasaDecididos.toFixed(1)),
            monto: Number(v.montoAprobado.toFixed(2)),
          })),
          ...porTipo.map((t) => ({
            seccion: 'Tipo',
            nombre: t.etiqueta,
            total: t.total,
            aprobados: t.aprobados,
            tasa: Number(t.tasaDecididos.toFixed(1)),
            monto: Number(t.montoAprobado.toFixed(2)),
          })),
          ...clientesTop.map((c) => ({
            seccion: 'Cliente',
            nombre: c.nombre,
            total: c.cantidad,
            aprobados: c.cantidad,
            tasa: 0,
            monto: Number(c.monto.toFixed(2)),
          })),
        ],
        [
          { key: 'seccion', label: 'Sección' },
          { key: 'nombre', label: 'Nombre' },
          { key: 'total', label: 'Total' },
          { key: 'aprobados', label: 'Aprobados' },
          { key: 'tasa', label: 'Tasa %' },
          { key: 'monto', label: 'Monto aprobado' },
        ],
        'dashboard_ventas'
      )
      toast({ title: 'CSV descargado' })
    } catch (e: any) {
      toast({ title: 'No se pudo exportar', description: e?.message, variant: 'destructive' })
    } finally {
      setExportando(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Ventas y conversión</h1>
          <p className="text-sm text-muted-foreground">
            Venta = presupuesto <strong>aprobado</strong> · fecha = emisión. {labelRango}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button variant="outline" onClick={cargarDatos} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button variant="outline" onClick={exportarCsv} disabled={exportando || loading}>
            <Download className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <Button onClick={exportarExcel} disabled={exportando || loading}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
          <CardDescription>Aplican a toda la pantalla (conversión y performance)</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Período</label>
            <Select
              value={periodo}
              onValueChange={(v: PeriodoPreset) => {
                setPeriodo(v)
                if (v !== 'custom') {
                  setFechaDesde('')
                  setFechaHasta('')
                } else if (!fechaDesde || !fechaHasta) {
                  const r = rangoPeriodo('mes')
                  setFechaDesde(toISODateLocal(r.desde))
                  setFechaHasta(toISODateLocal(r.hasta))
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mes">Mes actual</SelectItem>
                <SelectItem value="mes_anterior">Mes anterior</SelectItem>
                <SelectItem value="trimestre">Trimestre</SelectItem>
                <SelectItem value="año">Año</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Tipo</label>
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {Object.entries(ETIQUETAS_TIPO).map(([k, label]) => (
                  <SelectItem key={k} value={k}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Vendedor</label>
            <Select value={filtroVendedor} onValueChange={setFiltroVendedor}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {vendedores.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {periodo === 'custom' && (
            <div className="grid grid-cols-2 gap-2 sm:col-span-2 lg:col-span-1">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Desde</label>
                <Input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Hasta</label>
                <Input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-2 border-green-200 bg-green-50/50">
          <CardHeader className="pb-3">
            <CardDescription className="text-xs font-medium uppercase tracking-wide text-green-700">
              Tasa vs decididos
            </CardDescription>
            <CardTitle className="text-3xl font-bold text-green-700">
              {loading ? '…' : `${kpis.tasaDecididos.toFixed(1)}%`}
            </CardTitle>
            <p className="text-xs text-green-800">
              {kpis.aprobados} aprobados / {kpis.decididos} decididos
              <span className="block text-[11px] text-muted-foreground">
                (enviado + aprobado + rechazado + vencido)
              </span>
            </p>
            <DeltaBadge delta={deltaPorcentaje(kpis.tasaDecididos, kpisAnt.tasaDecididos)} />
          </CardHeader>
        </Card>

        <Card className="border-2 border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-3">
            <CardDescription className="text-xs font-medium uppercase tracking-wide text-blue-700">
              Tasa vs enviados
            </CardDescription>
            <CardTitle className="text-3xl font-bold text-blue-700">
              {loading ? '…' : `${kpis.tasaVsEnviados.toFixed(1)}%`}
            </CardTitle>
            <p className="text-xs text-blue-800">
              {kpis.aprobados} / {kpis.aprobados + kpis.enviados} (aprobado + enviado abierto)
            </p>
            <DeltaBadge delta={deltaPorcentaje(kpis.tasaVsEnviados, kpisAnt.tasaVsEnviados)} />
          </CardHeader>
        </Card>

        <Card className="border-2 border-red-200 bg-red-50/40">
          <CardHeader className="pb-3">
            <div className="mb-1 flex items-center justify-between">
              <CardDescription className="text-xs font-medium uppercase tracking-wide text-red-800">
                Ventas (aprobados)
              </CardDescription>
              <DollarSign className="h-4 w-4 text-red-700" />
            </div>
            <CardTitle className="text-3xl font-bold text-red-800">
              {loading ? '…' : `$${formatearMoneda(kpis.montoAprobado)}`}
            </CardTitle>
            <p className="text-xs text-red-900">{kpis.aprobados} presupuestos</p>
            <DeltaBadge delta={deltaPorcentaje(kpis.montoAprobado, kpisAnt.montoAprobado)} />
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs font-medium uppercase tracking-wide">
              Ticket promedio
            </CardDescription>
            <CardTitle className="text-2xl font-bold">
              {loading ? '…' : `$${formatearMoneda(kpis.ticketAprobado)}`}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Aprobado vs rechazado: ${formatearMoneda(kpis.ticketRechazado)}
            </p>
            <div className="flex items-start gap-1 pt-1 text-[11px] text-muted-foreground">
              <Info className="mt-0.5 h-3 w-3 shrink-0" />
              Hay pocos aprobados en prod; el KPI crece cuando el equipo marca estado con disciplina.
            </div>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Pipeline</CardTitle>
            <CardDescription>Cantidad y $ por estado (período)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pipeline.map((p) => (
              <div key={p.estado} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{p.etiqueta}</span>
                  <span className="text-muted-foreground">
                    {p.cantidad} · ${formatearMoneda(p.monto)}
                  </span>
                </div>
                <Barra
                  valor={p.cantidad}
                  max={maxPipeline}
                  className={
                    p.estado === 'aprobado'
                      ? 'bg-green-600'
                      : p.estado === 'enviado'
                        ? 'bg-blue-600'
                        : p.estado === 'rechazado' || p.estado === 'baja'
                          ? 'bg-red-600'
                          : 'bg-gray-400'
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Tendencia mensual (12 meses)</CardTitle>
            <CardDescription>Monto aprobado por mes de emisión · no respeta el filtro de período</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {tendencia.map((m) => (
              <div key={m.ym} className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-3">
                <span className="text-xs font-medium text-muted-foreground">{m.etiqueta}</span>
                <Barra valor={m.montoAprobado} max={maxMontoTendencia} className="bg-red-600" />
                <span className="w-28 text-right text-xs">
                  ${formatearMoneda(m.montoAprobado)}
                  <span className="ml-1 text-muted-foreground">{m.tasaDecididos.toFixed(0)}%</span>
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Conversión</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" />
                Por vendedor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {porVendedor.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin datos en el período</p>
              ) : (
                porVendedor.map((v) => (
                  <div key={v.clave} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{v.etiqueta}</span>
                      <Badge variant="outline">{v.tasaDecididos.toFixed(1)}%</Badge>
                    </div>
                    <Barra valor={v.montoAprobado} max={maxVendedorMonto} />
                    <p className="text-xs text-muted-foreground">
                      {v.aprobados}/{v.total} · ${formatearMoneda(v.montoAprobado)}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Por tipo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {porTipo.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin datos en el período</p>
              ) : (
                porTipo.map((t) => (
                  <div key={t.clave} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{t.etiqueta}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.aprobados}/{t.total} · ${formatearMoneda(t.montoAprobado)}
                      </p>
                    </div>
                    <Badge variant={t.tasaDecididos >= 20 ? 'default' : 'outline'}>
                      {t.tasaDecididos.toFixed(1)}%
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Por forma de pago</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {porFormaPago.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin datos en el período</p>
              ) : (
                porFormaPago.map((f) => (
                  <div key={f.clave} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{f.etiqueta}</p>
                      <p className="text-xs text-muted-foreground">
                        {f.aprobados}/{f.total} · ${formatearMoneda(f.montoAprobado)}
                      </p>
                    </div>
                    <Badge variant="outline">{f.tasaDecididos.toFixed(1)}%</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Performance</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Top clientes (aprobados)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {clientesTop.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay aprobados en el período</p>
              ) : (
                <div className="space-y-3">
                  {clientesTop.map((c, idx) => (
                    <div key={c.clave} className="flex items-center justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {idx + 1}. {c.nombre}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {c.cantidad} presup. · ticket ${formatearMoneda(c.ticket)}
                        </p>
                      </div>
                      <span className="shrink-0 font-semibold">${formatearMoneda(c.monto)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-4 w-4" />
                Productos más vendidos
              </CardTitle>
              <CardDescription>Ítems de presupuestos aprobados del período</CardDescription>
            </CardHeader>
            <CardContent>
              {productosTop.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay ítems de aprobados en el período</p>
              ) : (
                <div className="space-y-3">
                  {productosTop.map((p, idx) => (
                    <div key={`${p.descripcion}-${idx}`} className="flex items-center justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {idx + 1}. {p.descripcion}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {p.cantidad} {p.unidad || 'u.'}
                        </p>
                      </div>
                      <span className="shrink-0 font-semibold">${formatearMoneda(p.monto)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        <Send className="mr-1 inline h-3 w-3" />
        Listado operativo:{' '}
        <Link href="/dashboard/presupuestos" className="underline">
          Presupuestos
        </Link>
        . Los filtros de esta pantalla no cambian esa lista.
      </p>
    </div>
  )
}
