'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { Plus, Eye, FileText, RefreshCw, Download, Info, TrendingUp, CheckCircle2, Send, Filter, X, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { SortableHeader } from '@/components/ui/sortable-header'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { generarPDFPresupuesto } from '@/lib/pdf-generator'
import { useRouter } from 'next/navigation'

// Funciones puras fuera del componente para evitar recreaciones
const estadoBadgeVariant = (estado: string) => {
  switch (estado) {
    case 'aprobado': return 'default'
    case 'enviado': return 'secondary'
    case 'borrador': return 'outline'
    case 'rechazado': return 'destructive'
    case 'vencido': return 'destructive'
    case 'baja': return 'destructive'
    default: return 'outline'
  }
}

const tipoBadgeVariant = (tipo: string) => {
  if (tipo === 'cercado') return 'default'
  if (tipo === 'general') return 'outline'
  return 'secondary'
}

export default function PresupuestosPage() {
  const router = useRouter()
  const [presupuestos, setPresupuestos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [filtrosExpandidos, setFiltrosExpandidos] = useState(false)
  const { toast } = useToast()

  // Estados de filtros
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  
  // Estados para entregas pendientes
  const [presupuestosEntregas, setPresupuestosEntregas] = useState<any[]>([])
  const [dialogEntregasAbierto, setDialogEntregasAbierto] = useState(false)
  const [cargandoEntregas, setCargandoEntregas] = useState(false)

  // Memoizar función de cargar presupuestos
  const cargarPresupuestos = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('v_presupuestos_completos')
        .select('*')
        .order('fecha_emision', { ascending: false })

      if (error) {
        console.error('Error al cargar presupuestos:', error)
        toast({
          title: "Error al cargar presupuestos",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      setPresupuestos(data || [])
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error inesperado",
        description: "No se pudieron cargar los presupuestos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Cargar estado de entregas
  const cargarEstadoEntregas = useCallback(async () => {
    try {
      setCargandoEntregas(true)
      const { data, error } = await supabase
        .from('v_presupuestos_estado_entrega')
        .select('*')
        .order('fecha_emision', { ascending: false })

      if (error) {
        console.error('Error al cargar estado de entregas:', error)
        return
      }

      setPresupuestosEntregas(data || [])
    } catch (error) {
      console.error('Error al cargar entregas:', error)
    } finally {
      setCargandoEntregas(false)
    }
  }, [])

  // Memoizar función de limpiar filtros
  const limpiarFiltros = useCallback(() => {
    setFiltroEstado('todos')
    setFiltroTipo('todos')
  }, [])

  // Filtrado optimizado con useMemo (evita render extra)
  const presupuestosFiltrados = useMemo(() => {
    let resultado = [...presupuestos]

    // Filtro por Estado
    if (filtroEstado !== 'todos') {
      resultado = resultado.filter((p: any) => p.estado_actual === filtroEstado)
    }

    // Filtro por Tipo
    if (filtroTipo !== 'todos') {
      resultado = resultado.filter((p: any) => p.tipo === filtroTipo)
    }

    return resultado
  }, [presupuestos, filtroEstado, filtroTipo])

  const filtrosActivos = filtroEstado !== 'todos' || filtroTipo !== 'todos'

  useEffect(() => {
    cargarPresupuestos()
    cargarEstadoEntregas()
  }, [cargarPresupuestos, cargarEstadoEntregas])

  // Recargar estado de entregas cuando cambia el estado de un presupuesto
  useEffect(() => {
    if (presupuestos.length > 0) {
      cargarEstadoEntregas()
    }
  }, [presupuestos.length, cargarEstadoEntregas])

  // Memoizar función de descargar presupuesto
  const descargarPresupuesto = useCallback(async (presupuestoId: string) => {
    try {
      setDownloadingId(presupuestoId)

      const { data: presupuesto, error: presupuestoError } = await supabase
        .from('presupuestos')
        .select('*')
        .eq('id', presupuestoId)
        .single()

      if (presupuestoError || !presupuesto) {
        throw presupuestoError || new Error('No se encontró el presupuesto')
      }

      const { data: itemsData, error: itemsError } = await supabase
        .from('presupuestos_items')
        .select('*')
        .eq('presupuesto_id', presupuestoId)
        .order('orden')

      if (itemsError) {
        throw itemsError
      }

      let vendedorNombre = ''
      if (presupuesto.usuario_id) {
        const { data: vendedor } = await supabase
          .from('usuarios')
          .select('nombre')
          .eq('id', presupuesto.usuario_id)
          .single()
        vendedorNombre = vendedor?.nombre || ''
      }

      let clienteInfo: any = null
      if (presupuesto.cliente_id) {
        const { data: cliente } = await supabase
          .from('clientes')
          .select(
            'nombre_completo, telefono, email, direccion, tipo_documento, numero_documento'
          )
          .eq('id', presupuesto.cliente_id)
          .single()
        clienteInfo = cliente
      }

      const presupuestoParaPdf = {
        ...presupuesto,
        cliente_nombre:
          presupuesto.cliente_nombre ||
          clienteInfo?.nombre_completo ||
          '',
        cliente_telefono:
          presupuesto.cliente_telefono ||
          clienteInfo?.telefono ||
          '',
        cliente_email:
          presupuesto.cliente_email ||
          clienteInfo?.email ||
          '',
        cliente_direccion:
          presupuesto.cliente_direccion ||
          clienteInfo?.direccion ||
          '',
        tipo_documento:
          presupuesto.tipo_documento ||
          clienteInfo?.tipo_documento ||
          '',
        numero_documento:
          presupuesto.numero_documento ||
          clienteInfo?.numero_documento ||
          '',
        vendedor_nombre: vendedorNombre,
      }

      const itemsParaPdf =
        itemsData?.map((item) => ({
          descripcion: item.descripcion,
          cantidad: Number(item.cantidad) || 0,
          unidad: item.unidad,
          precio_unitario: Number(item.precio_unitario) || 0,
          precio_total: Number(item.precio_total) || 0,
        })) || []

      generarPDFPresupuesto(presupuestoParaPdf, itemsParaPdf)
      toast({
        title: 'PDF generado',
        description: `Se descargó el presupuesto ${presupuesto.numero}`,
      })
    } catch (error: any) {
      console.error('Error al descargar PDF:', error)
      toast({
        title: 'Error al generar PDF',
        description: error.message || 'No se pudo generar el PDF',
        variant: 'destructive',
      })
    } finally {
      setDownloadingId(null)
    }
  }, [toast])

  // Memoizar columnas para evitar recreaciones en cada render
  const columns = useMemo(() => [
    {
      accessorKey: 'numero',
      header: ({ column }: any) => <SortableHeader column={column} title="Número" />,
      cell: ({ row }: any) => (
        <div className="font-mono font-semibold">{row.original.numero}</div>
      ),
    },
    {
      accessorKey: 'tipo',
      header: 'Tipo',
      cell: ({ row }: any) => (
        <Badge variant={tipoBadgeVariant(row.original.tipo)}>
          {row.original.tipo === 'articulos' 
            ? 'Artículos' 
            : row.original.tipo === 'cercado'
            ? 'Cercado'
            : 'General'}
        </Badge>
      ),
    },
    {
      accessorKey: 'cliente_nombre',
      header: ({ column }: any) => <SortableHeader column={column} title="Cliente" />,
      cell: ({ row }: any) => (
        <div>
          <div className="font-medium">{row.original.cliente_nombre}</div>
          {row.original.cliente_email && (
            <div className="text-xs text-muted-foreground">{row.original.cliente_email}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'fecha_emision',
      header: ({ column }: any) => <SortableHeader column={column} title="Fecha" />,
      cell: ({ row }: any) => (
        <div className="text-sm">
          {new Date(row.original.fecha_emision).toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })}
        </div>
      ),
    },
    {
      accessorKey: 'total',
      header: ({ column }: any) => <SortableHeader column={column} title="Total" />,
      cell: ({ row }: any) => (
        <span className="font-bold text-green-600">
          ${row.original.total?.toLocaleString() || '0'}
        </span>
      ),
    },
    {
      accessorKey: 'estado_actual',
      header: ({ column }: any) => <SortableHeader column={column} title="Estado" />,
      cell: ({ row }: any) => (
        <Badge variant={estadoBadgeVariant(row.original.estado_actual)}>
          {row.original.estado_actual?.charAt(0).toUpperCase() + row.original.estado_actual?.slice(1)}
        </Badge>
      ),
    },
    {
      accessorKey: 'cantidad_items',
      header: 'Items',
      cell: ({ row }: any) => (
        <Badge variant="outline">{row.original.cantidad_items || 0}</Badge>
      ),
    },
    {
      id: 'acciones',
      header: 'Acciones',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/dashboard/presupuestos/${row.original.id}`}>
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ver detalle</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => descargarPresupuesto(row.original.id)}
                  disabled={downloadingId === row.original.id}
                >
                  <Download className={`h-4 w-4 ${downloadingId === row.original.id ? 'animate-pulse' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Descargar PDF</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

        </div>
      ),
    },
  ], [descargarPresupuesto, downloadingId])

  // Memoizar cálculos para evitar recálculos innecesarios
  const totalMonto = useMemo(() => 
    presupuestos.reduce((sum: number, p: any) => sum + (parseFloat(p.total) || 0), 0),
    [presupuestos]
  )

  const porEstado = useMemo(() => ({
    borrador: presupuestos.filter((p: any) => p.estado_actual === 'borrador').length,
    enviado: presupuestos.filter((p: any) => p.estado_actual === 'enviado').length,
    aprobado: presupuestos.filter((p: any) => p.estado_actual === 'aprobado').length,
  }), [presupuestos])

  // Calcular suma de presupuestos aprobados del mes actual
  const montoAprobadosMesActual = useMemo(() => {
    const ahora = new Date()
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
    
    return presupuestos
      .filter((p: any) => {
        if (p.estado_actual !== 'aprobado') return false
        
        const fecha = new Date(p.fecha_emision)
        return fecha >= inicioMes && fecha <= ahora
      })
      .reduce((sum: number, p: any) => sum + (parseFloat(p.total) || 0), 0)
  }, [presupuestos])

  // Calcular estadísticas del mes actual para porcentaje de conversión
  const estadisticasMesActual = useMemo(() => {
    const ahora = new Date()
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
    
    const presupuestosDelMes = presupuestos.filter((p: any) => {
      const fecha = new Date(p.fecha_emision)
      return fecha >= inicioMes && fecha <= ahora
    })
    
    const totalDelMes = presupuestosDelMes.length
    const aprobadosDelMes = presupuestosDelMes.filter(
      (p: any) => p.estado_actual === 'aprobado'
    ).length
    
    const porcentajeConversion = totalDelMes > 0 
      ? (aprobadosDelMes / totalDelMes) * 100 
      : 0
    
    return {
      totalDelMes,
      aprobadosDelMes,
      porcentajeConversion,
    }
  }, [presupuestos])

  // Calcular estadísticas de entregas
  const estadisticasEntregas = useMemo(() => {
    const pendientes = presupuestosEntregas.filter((p: any) => p.estado_entrega === 'pendiente').length
    const parciales = presupuestosEntregas.filter((p: any) => p.estado_entrega === 'parcial').length
    const completos = presupuestosEntregas.filter((p: any) => p.estado_entrega === 'completo').length
    const totalPendientes = pendientes + parciales
    
    return {
      pendientes,
      parciales,
      completos,
      totalPendientes,
    }
  }, [presupuestosEntregas])

  // Presupuestos pendientes y parciales para el modal
  const presupuestosPendientesModal = useMemo(() => {
    return presupuestosEntregas.filter((p: any) => 
      p.estado_entrega === 'pendiente' || p.estado_entrega === 'parcial'
    ).sort((a: any, b: any) => {
      // Ordenar: primero pendientes, luego parciales, luego por fecha
      if (a.estado_entrega !== b.estado_entrega) {
        return a.estado_entrega === 'pendiente' ? -1 : 1
      }
      return new Date(b.fecha_emision).getTime() - new Date(a.fecha_emision).getTime()
    })
  }, [presupuestosEntregas])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Presupuestos</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Gestión de presupuestos de artículos y cercado
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button
            variant="outline"
            onClick={cargarPresupuestos}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/dashboard/presupuestos/nuevo/tipo">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Presupuesto
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {/* Card 1: Tasa de Conversión */}
        <Card className="border-2 border-green-200 bg-green-50/50 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-2">
              <CardDescription className="text-sm font-medium text-green-700 uppercase tracking-wide">
                Tasa de Conversión
              </CardDescription>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <CardTitle className="text-4xl font-bold text-green-600 mb-2">
              {estadisticasMesActual.porcentajeConversion.toFixed(1)}%
            </CardTitle>
            <div className="flex items-center gap-2 text-xs text-green-700 bg-white/60 px-2 py-1 rounded-md w-fit">
              <CheckCircle2 className="h-3 w-3" />
              <span className="font-medium">
                {estadisticasMesActual.aprobadosDelMes} de {estadisticasMesActual.totalDelMes} del mes
              </span>
            </div>
          </CardHeader>
        </Card>

        {/* Card 3: Aprobados */}
        <Card className="border-2 border-green-200 bg-green-50/50 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CardDescription className="text-sm font-medium text-green-700 uppercase tracking-wide">
                  Aprobados
                </CardDescription>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-green-600 cursor-help hover:text-green-700" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm">Presupuestos aprobados de este mes</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold text-green-600">
                ${montoAprobadosMesActual.toLocaleString('es-AR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
            </CardTitle>
              <div>
                <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white font-semibold">
                  {porEstado.aprobado} aprobados
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Card 4: Enviados */}
        <Card className="border-2 border-blue-200 bg-blue-50/50 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-2">
              <CardDescription className="text-sm font-medium text-blue-700 uppercase tracking-wide">
                Enviados
              </CardDescription>
              <Send className="h-5 w-5 text-blue-600" />
            </div>
            <CardTitle className="text-4xl font-bold text-blue-600">
              {porEstado.enviado}
            </CardTitle>
            <div className="mt-2 text-xs text-blue-700 bg-white/60 px-2 py-1 rounded-md w-fit">
              <span className="font-medium">Pendientes de respuesta</span>
            </div>
          </CardHeader>
        </Card>

        {/* Card 5: Pendientes de Entrega */}
        <Card 
          className="border-2 border-amber-200 bg-amber-50/50 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => estadisticasEntregas.totalPendientes > 0 && setDialogEntregasAbierto(true)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-2">
              <CardDescription className="text-sm font-medium text-amber-700 uppercase tracking-wide">
                Pendientes de Entrega
              </CardDescription>
              <Package className="h-5 w-5 text-amber-600" />
            </div>
            <CardTitle className="text-4xl font-bold text-amber-600 mb-2">
              {estadisticasEntregas.totalPendientes}
            </CardTitle>
            <div className="space-y-1">
              {estadisticasEntregas.pendientes > 0 && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200 mr-2">
                  {estadisticasEntregas.pendientes} pendientes
                </Badge>
              )}
              {estadisticasEntregas.parciales > 0 && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-800 hover:bg-orange-200">
                  {estadisticasEntregas.parciales} parciales
                </Badge>
              )}
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Dialog: Lista de Presupuestos Pendientes de Entrega */}
      <Dialog open={dialogEntregasAbierto} onOpenChange={setDialogEntregasAbierto}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-amber-600" />
              Presupuestos Pendientes de Entrega
            </DialogTitle>
            <DialogDescription>
              {presupuestosPendientesModal.length} presupuesto{presupuestosPendientesModal.length !== 1 ? 's' : ''} aprobado{presupuestosPendientesModal.length !== 1 ? 's' : ''} esperando entrega
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4">
            {cargandoEntregas ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : presupuestosPendientesModal.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">¡Excelente!</h3>
                <p className="text-muted-foreground">
                  No hay presupuestos pendientes de entrega
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {presupuestosPendientesModal.map((presupuesto: any) => (
                  <Card 
                    key={presupuesto.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      setDialogEntregasAbierto(false)
                      router.push(`/dashboard/presupuestos/${presupuesto.id}`)
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold">{presupuesto.numero}</span>
                            <Badge 
                              variant={presupuesto.estado_entrega === 'parcial' ? 'secondary' : 'outline'}
                              className={presupuesto.estado_entrega === 'parcial' ? 'bg-orange-100 text-orange-800' : ''}
                            >
                              {presupuesto.estado_entrega === 'parcial' ? 'Parcial' : 'Pendiente'}
                            </Badge>
                          </div>
                          <p className="font-medium">{presupuesto.cliente_nombre}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="font-semibold text-green-600">
                              ${presupuesto.total?.toLocaleString('es-AR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                            {presupuesto.total_items && (
                              <span>
                                {presupuesto.items_completos || 0}/{presupuesto.total_items} items completos
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          {presupuesto.fecha_ultima_entrega ? (
                            <div>
                              <p className="text-xs">Última entrega:</p>
                              <p className="font-medium">
                                {new Date(presupuesto.fecha_ultima_entrega).toLocaleDateString('es-AR')}
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs">Sin entregas</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
          <CardTitle>Listado de Presupuestos</CardTitle>
          <CardDescription>
                {presupuestosFiltrados.length} de {presupuestos.length} presupuestos
                {filtrosActivos && ' (filtrados)'}
          </CardDescription>
            </div>
            {filtrosActivos && (
              <Button variant="outline" size="sm" onClick={limpiarFiltros}>
                <X className="h-4 w-4 mr-2" />
                Limpiar Filtros
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Panel de Filtros */}
          <Collapsible open={filtrosExpandidos} onOpenChange={setFiltrosExpandidos}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between" type="button">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span>Filtros</span>
                  {filtrosActivos && (
                    <Badge variant="secondary" className="ml-2">
                      {[filtroEstado !== 'todos' && 'Estado', filtroTipo !== 'todos' && 'Tipo'].filter(Boolean).length}
                    </Badge>
                  )}
                </div>
                {filtrosExpandidos ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg mt-2">
                <div className="flex-1 grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Estado</label>
                    <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="borrador">Borrador</SelectItem>
                        <SelectItem value="enviado">Enviado</SelectItem>
                        <SelectItem value="aprobado">Aprobado</SelectItem>
                        <SelectItem value="rechazado">Rechazado</SelectItem>
                        <SelectItem value="vencido">Vencido</SelectItem>
                        <SelectItem value="baja">Baja</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tipo</label>
                    <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="articulos">Artículos</SelectItem>
                        <SelectItem value="cercado">Cercado</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {presupuestos.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay presupuestos</h3>
              <p className="text-muted-foreground mb-4">
                Crea tu primer presupuesto para comenzar
              </p>
              <Button asChild>
                <Link href="/dashboard/presupuestos/nuevo/tipo">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Presupuesto
                </Link>
              </Button>
            </div>
          ) : presupuestosFiltrados.length === 0 && filtrosActivos ? (
            <div className="text-center py-12">
              <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay presupuestos que coincidan con los filtros</h3>
              <p className="text-muted-foreground mb-4">
                Intenta ajustar los filtros o limpiarlos para ver todos los presupuestos
              </p>
              <Button variant="outline" onClick={limpiarFiltros}>
                <X className="h-4 w-4 mr-2" />
                Limpiar Filtros
              </Button>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={presupuestosFiltrados}
              searchKey="numero"
              searchPlaceholder="Buscar por número o cliente..."
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

