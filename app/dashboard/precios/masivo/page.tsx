'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { formatCurrency } from '@/lib/utils'
import { aplicarAumentoCosto, aplicarAumentoCompraTejido, validarPorcentaje } from '@/lib/precios-masivos'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import {
  ArrowLeft,
  Grid3x3,
  Layers,
  Package,
  Percent,
  Shield,
  CheckSquare,
  Square,
} from 'lucide-react'

type Alcance = 'articulos' | 'postes' | 'tejidos' | 'cercados' | 'todos'

type Fila = {
  key: string
  tipo: 'articulo' | 'tejido' | 'cercado'
  precioId?: number
  tejidoId?: string
  cercadoId?: string
  nombre: string
  grupo: string
  costo: number | null
  venta: number
  margen: number | null
  margenEfectivo?: number
  seleccionable: boolean
  detalle?: string
}

const ALCANCES: {
  id: Alcance
  titulo: string
  descripcion: string
  icon: typeof Package
}[] = [
  {
    id: 'articulos',
    titulo: 'Artículos',
    descripcion: 'Alambres, accesorios, hierros y el resto del catálogo (sin postes).',
    icon: Package,
  },
  {
    id: 'postes',
    titulo: 'Postes',
    descripcion: 'Solo la categoría Postes, con el margen que ya tiene cada uno.',
    icon: Layers,
  },
  {
    id: 'tejidos',
    titulo: 'Tejidos',
    descripcion: 'Rollos de reventa (Marcelo). Los fabricados se mueven vía alambre.',
    icon: Grid3x3,
  },
  {
    id: 'cercados',
    titulo: 'Cercados',
    descripcion: 'Recalcula el precio por metro con los costos vigentes. No aplica porcentaje.',
    icon: Shield,
  },
  {
    id: 'todos',
    titulo: 'Todos',
    descripcion: 'Artículos, postes, tejidos de reventa y configuraciones de cercado.',
    icon: CheckSquare,
  },
]

export default function ActualizacionMasivaPreciosPage() {
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  const [esAdmin, setEsAdmin] = useState<boolean | null>(null)
  const [alcance, setAlcance] = useState<Alcance | null>(null)
  const [filas, setFilas] = useState<Fila[]>([])
  const [cargando, setCargando] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [filtroGrupo, setFiltroGrupo] = useState('todos')
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set())
  const [porcentaje, setPorcentaje] = useState('')
  const [recalcularCercados, setRecalcularCercados] = useState(true)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [aplicando, setAplicando] = useState(false)

  useEffect(() => {
    async function chequearRol() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setEsAdmin(false)
        return
      }
      const { data, error } = await supabase
        .from('usuarios')
        .select('rol')
        .eq('id', session.user.id)
        .maybeSingle()
      if (error) {
        setEsAdmin(false)
        return
      }
      setEsAdmin(data?.rol === 'admin')
    }
    chequearRol()
  }, [supabase])

  const cargar = useCallback(async (tipo: Alcance) => {
    setCargando(true)
    setSeleccion(new Set())
    setFiltroGrupo('todos')
    setBusqueda('')
    try {
      const siguientes: Fila[] = []

      const necesitaArticulos = tipo === 'articulos' || tipo === 'postes' || tipo === 'todos'
      if (necesitaArticulos) {
        const { data, error } = await supabase
          .from('precios_venta')
          .select('id, precio_costo, precio_venta, margen, vigente, articulos(id, nombre, categoria)')
          .eq('vigente', true)
        if (error) throw error

        for (const pv of data || []) {
          const art = Array.isArray(pv.articulos) ? pv.articulos[0] : pv.articulos
          const categoria = art?.categoria || 'Sin categoría'
          const esPoste = categoria.toLowerCase() === 'postes'
          if (tipo === 'articulos' && esPoste) continue
          if (tipo === 'postes' && !esPoste) continue

          const costo = Number(pv.precio_costo)
          const venta = Number(pv.precio_venta)
          siguientes.push({
            key: `a-${pv.id}`,
            tipo: 'articulo',
            precioId: Number(pv.id),
            nombre: art?.nombre || `Artículo ${art?.id}`,
            grupo: categoria,
            costo,
            venta,
            margen: costo > 0 ? ((venta - costo) / costo) * 100 : Number(pv.margen) || 0,
            seleccionable: true,
          })
        }
      }

      if (tipo === 'tejidos' || tipo === 'todos') {
        const { data, error } = await supabase
          .from('tejidos_configuraciones')
          .select('id, codigo, nombre, origen, precio_compra, precio_costo, precio_venta, margen_efectivo, activo')
          .eq('activo', true)
          .order('codigo')
        if (error) throw error

        for (const t of data || []) {
          const costo = Number(t.precio_compra ?? t.precio_costo)
          const venta = Number(t.precio_venta)
          const esReventa = t.origen === 'reventa'
          siguientes.push({
            key: `t-${t.id}`,
            tipo: 'tejido',
            tejidoId: String(t.id),
            nombre: t.nombre || t.codigo,
            grupo: esReventa ? 'Tejido reventa' : 'Tejido fabricado',
            costo,
            venta,
            margen: costo > 0 ? ((venta - costo) / costo) * 100 : Number(t.margen_efectivo) || 45,
            margenEfectivo: Number(t.margen_efectivo ?? 45),
            seleccionable: esReventa,
            detalle: esReventa
              ? 'Se actualiza el precio de compra; la venta conserva el margen.'
              : 'No se toca: el costo sale del alambre + mano de obra.',
          })
        }
      }

      if (tipo === 'cercados' || tipo === 'todos') {
        const { data, error } = await supabase
          .from('configuraciones_cercado')
          .select('id, nombre, precio_por_metro_lineal, activo')
          .eq('activo', true)
          .order('nombre')
        if (error) throw error

        for (const c of data || []) {
          siguientes.push({
            key: `c-${c.id}`,
            tipo: 'cercado',
            cercadoId: String(c.id),
            nombre: c.nombre,
            grupo: 'Cercado',
            costo: null,
            venta: Number(c.precio_por_metro_lineal) || 0,
            margen: null,
            seleccionable: true,
            detalle: 'Se recalcula desde tejidos, postes y accesorios vigentes.',
          })
        }
      }

      siguientes.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
      setFilas(siguientes)
    } catch (error: any) {
      toast({
        title: 'No se pudo cargar el listado',
        description: error.message,
        variant: 'destructive',
      })
      setFilas([])
    } finally {
      setCargando(false)
    }
  }, [supabase, toast])

  useEffect(() => {
    if (alcance) cargar(alcance)
  }, [alcance, cargar])

  const grupos = useMemo(() => {
    return Array.from(new Set(filas.map((f) => f.grupo))).sort((a, b) => a.localeCompare(b, 'es'))
  }, [filas])

  const gruposSeleccionables = useMemo(() => {
    return grupos.filter((g) => filas.some((f) => f.grupo === g && f.seleccionable))
  }, [filas, grupos])

  const filasVisibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return filas.filter((f) => {
      if (filtroGrupo !== 'todos' && f.grupo !== filtroGrupo) return false
      if (q && !f.nombre.toLowerCase().includes(q) && !f.grupo.toLowerCase().includes(q)) return false
      return true
    })
  }, [filas, busqueda, filtroGrupo])

  const seleccionablesVisibles = filasVisibles.filter((f) => f.seleccionable)

  const toggle = (key: string, seleccionable: boolean) => {
    if (!seleccionable) return
    setSeleccion((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const seleccionarVisibles = () => {
    setSeleccion((prev) => {
      const next = new Set(prev)
      seleccionablesVisibles.forEach((f) => next.add(f.key))
      return next
    })
  }

  const seleccionarGrupo = (grupo: string) => {
    setSeleccion((prev) => {
      const next = new Set(prev)
      filas.filter((f) => f.grupo === grupo && f.seleccionable).forEach((f) => next.add(f.key))
      return next
    })
  }

  const limpiarSeleccion = () => setSeleccion(new Set())

  const seleccionadas = filas.filter((f) => seleccion.has(f.key) && f.seleccionable)
  const selArticulos = seleccionadas.filter((f) => f.tipo === 'articulo')
  const selTejidos = seleccionadas.filter((f) => f.tipo === 'tejido')
  const selCercados = seleccionadas.filter((f) => f.tipo === 'cercado')
  const hayCostos = selArticulos.length + selTejidos.length > 0
  const soloCercado = alcance === 'cercados' || (!hayCostos && selCercados.length > 0)

  const pctNum = parseFloat(porcentaje.replace(',', '.'))
  const errorPct = hayCostos ? validarPorcentaje(pctNum) : null

  const previews = useMemo(() => {
    if (!hayCostos || errorPct) return new Map<string, { costo: number; venta: number }>()
    const map = new Map<string, { costo: number; venta: number }>()
    for (const fila of seleccionadas) {
      if (fila.tipo === 'cercado' || fila.costo == null || fila.costo <= 0) continue
      try {
        if (fila.tipo === 'tejido') {
          const r = aplicarAumentoCompraTejido(fila.costo, pctNum, fila.margenEfectivo ?? 45)
          map.set(fila.key, { costo: r.nuevoCosto, venta: r.nuevaVenta })
        } else {
          const r = aplicarAumentoCosto(fila.costo, fila.venta, pctNum)
          map.set(fila.key, { costo: r.nuevoCosto, venta: r.nuevaVenta })
        }
      } catch {
        // se omite en preview
      }
    }
    return map
  }, [hayCostos, errorPct, seleccionadas, pctNum])

  const puedeAplicar = esAdmin && seleccionadas.length > 0 && (soloCercado || !errorPct)

  async function aplicar() {
    if (!puedeAplicar) return
    setAplicando(true)
    try {
      const res = await fetch('/api/precios/masivo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          porcentaje: hayCostos ? pctNum : undefined,
          precioIds: selArticulos.map((f) => f.precioId),
          tejidoIds: selTejidos.map((f) => f.tejidoId),
          cercadoIds: selCercados.map((f) => f.cercadoId),
          recalcularCercados: hayCostos && recalcularCercados,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al actualizar')

      toast({
        title: 'Precios actualizados',
        description: [
          json.articulosActualizados ? `${json.articulosActualizados} artículos` : null,
          json.tejidosActualizados ? `${json.tejidosActualizados} tejidos` : null,
          json.cercadosRecalculados ? `${json.cercadosRecalculados} cercados recalculados` : null,
        ].filter(Boolean).join(' · ') || 'Sin cambios',
      })

      if (json.omitidos?.length) {
        toast({
          title: 'Algunos ítems se omitieron',
          description: json.omitidos.slice(0, 4).join(' · '),
          variant: 'destructive',
        })
      }

      setConfirmOpen(false)
      setSeleccion(new Set())
      if (alcance) await cargar(alcance)
    } catch (error: any) {
      toast({
        title: 'No se pudo aplicar',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setAplicando(false)
    }
  }

  if (esAdmin === false) {
    return (
      <div className="max-w-xl space-y-4">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/precios">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a precios
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Solo administradores</CardTitle>
            <CardDescription>
              La actualización masiva de precios está limitada al rol admin.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (esAdmin === null) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button variant="ghost" size="sm" className="mb-2 -ml-2" asChild>
            <Link href="/dashboard/precios">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Precios
            </Link>
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">Actualización masiva</h2>
          <p className="text-muted-foreground mt-1">
            Sube el costo y recalcula la venta conservando el margen de cada ítem.
          </p>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium mb-3">1. ¿Qué querés actualizar?</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {ALCANCES.map((item) => {
            const Icon = item.icon
            const activo = alcance === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setAlcance(item.id)
                  setPorcentaje('')
                }}
                className={`text-left rounded-lg border p-4 transition ${
                  activo ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-primary/40'
                }`}
              >
                <Icon className={`h-5 w-5 mb-2 ${activo ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="font-semibold">{item.titulo}</div>
                <p className="text-xs text-muted-foreground mt-1">{item.descripcion}</p>
              </button>
            )
          })}
        </div>
      </div>

      {alcance && (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">2. Elegí ítems o una categoría</CardTitle>
              <CardDescription>
                El porcentaje de margen que ves es el actual de cada fila. Los tejidos fabricados no se pueden marcar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                <div className="flex-1">
                  <Label htmlFor="buscar">Buscar</Label>
                  <Input
                    id="buscar"
                    placeholder="Nombre o categoría"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                </div>
                <div className="w-full lg:w-64">
                  <Label>Filtrar por categoría</Label>
                  <Select value={filtroGrupo} onValueChange={setFiltroGrupo}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas</SelectItem>
                      {grupos.map((g) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={seleccionarVisibles}>
                  Seleccionar visibles ({seleccionablesVisibles.length})
                </Button>
                {gruposSeleccionables.map((g) => (
                  <Button
                    key={g}
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => seleccionarGrupo(g)}
                  >
                    Toda {g}
                  </Button>
                ))}
                <Button type="button" variant="ghost" size="sm" onClick={limpiarSeleccion}>
                  Limpiar
                </Button>
              </div>

              {cargando ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
                </div>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr className="text-left">
                        <th className="p-2 w-10" />
                        <th className="p-2">Nombre</th>
                        <th className="p-2">Grupo</th>
                        <th className="p-2 text-right">Costo</th>
                        <th className="p-2 text-right">Venta</th>
                        <th className="p-2 text-right">Margen</th>
                        {hayCostos && !errorPct && (
                          <>
                            <th className="p-2 text-right">Nuevo costo</th>
                            <th className="p-2 text-right">Nueva venta</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {filasVisibles.map((fila) => {
                        const marcada = seleccion.has(fila.key)
                        const preview = previews.get(fila.key)
                        return (
                          <tr
                            key={fila.key}
                            className={`border-t ${!fila.seleccionable ? 'opacity-50' : marcada ? 'bg-primary/5' : ''}`}
                          >
                            <td className="p-2">
                              <button
                                type="button"
                                disabled={!fila.seleccionable}
                                onClick={() => toggle(fila.key, fila.seleccionable)}
                                className="disabled:cursor-not-allowed"
                                aria-label={marcada ? 'Quitar selección' : 'Seleccionar'}
                              >
                                {marcada ? (
                                  <CheckSquare className="h-4 w-4 text-primary" />
                                ) : (
                                  <Square className="h-4 w-4 text-muted-foreground" />
                                )}
                              </button>
                            </td>
                            <td className="p-2">
                              <div className="font-medium">{fila.nombre}</div>
                              {fila.detalle && (
                                <div className="text-xs text-muted-foreground">{fila.detalle}</div>
                              )}
                            </td>
                            <td className="p-2">
                              <Badge variant="secondary">{fila.grupo}</Badge>
                            </td>
                            <td className="p-2 text-right">
                              {fila.costo == null ? '—' : formatCurrency(fila.costo)}
                            </td>
                            <td className="p-2 text-right">{formatCurrency(fila.venta)}</td>
                            <td className="p-2 text-right">
                              {fila.margen == null ? '—' : `${fila.margen.toFixed(1)}%`}
                            </td>
                            {hayCostos && !errorPct && (
                              <>
                                <td className="p-2 text-right text-muted-foreground">
                                  {preview ? formatCurrency(preview.costo) : '—'}
                                </td>
                                <td className="p-2 text-right font-medium">
                                  {preview ? formatCurrency(preview.venta) : '—'}
                                </td>
                              </>
                            )}
                          </tr>
                        )
                      })}
                      {filasVisibles.length === 0 && (
                        <tr>
                          <td colSpan={8} className="p-6 text-center text-muted-foreground">
                            No hay filas con esos filtros.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">3. Aplicar</CardTitle>
              <CardDescription>
                {seleccionadas.length} seleccionado{seleccionadas.length === 1 ? '' : 's'}
                {selArticulos.length ? ` · ${selArticulos.length} artículos/postes` : ''}
                {selTejidos.length ? ` · ${selTejidos.length} tejidos` : ''}
                {selCercados.length ? ` · ${selCercados.length} cercados` : ''}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {hayCostos && (
                <div className="max-w-xs">
                  <Label htmlFor="porcentaje">Porcentaje sobre el costo</Label>
                  <div className="relative">
                    <Input
                      id="porcentaje"
                      inputMode="decimal"
                      placeholder="Ej. 8 o -5"
                      value={porcentaje}
                      onChange={(e) => setPorcentaje(e.target.value)}
                      className="pr-8"
                    />
                    <Percent className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  </div>
                  {errorPct && porcentaje !== '' && (
                    <p className="text-sm text-red-600 mt-1">{errorPct}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    La venta se recalcula con el mismo margen. Las formas de pago (lista, tarjeta, e-cheq) se derivan solas.
                  </p>
                </div>
              )}

              {hayCostos && (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={recalcularCercados}
                    onChange={(e) => setRecalcularCercados(e.target.checked)}
                  />
                  Recalcular todas las configuraciones de cercado activas al terminar
                </label>
              )}

              {alcance === 'cercados' && (
                <p className="text-sm text-muted-foreground">
                  En cercado no se aplica porcentaje: se vuelve a armar el precio por metro con los precios vigentes.
                </p>
              )}

              <Button
                disabled={!puedeAplicar || aplicando}
                onClick={() => setConfirmOpen(true)}
              >
                Revisar y aplicar
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Aplicar la actualización?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                {hayCostos && (
                  <p>
                    Costo × (1 + {pctNum}%) en {selArticulos.length + selTejidos.length} ítems,
                    conservando el margen actual. Los presupuestos ya emitidos no se tocan.
                  </p>
                )}
                {hayCostos && recalcularCercados && (
                  <p>Después se recalculan todas las configs de cercado activas.</p>
                )}
                {hayCostos && !recalcularCercados && selCercados.length > 0 && (
                  <p>También se recalcularán {selCercados.length} cercados seleccionados.</p>
                )}
                {soloCercado && (
                  <p>Se recalcularán {selCercados.length} configuraciones de cercado.</p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" disabled={aplicando} onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={aplicar} disabled={aplicando}>
              {aplicando ? 'Aplicando…' : 'Confirmar'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
