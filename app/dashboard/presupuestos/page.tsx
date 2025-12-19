'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { Plus, Eye, FileText, RefreshCw, Download, Info, TrendingUp, CheckCircle2, Send, Filter, X, Package, User } from 'lucide-react'
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
  const [filtroVendedor, setFiltroVendedor] = useState('todos')
  const [vendedores, setVendedores] = useState<Array<{id: string, nombre: string}>>([])
  
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
        toast({
          title: "Error al cargar entregas",
          description: error.message || "No se pudieron cargar los estados de entrega",
          variant: "destructive",
        })
        return
      }

      setPresupuestosEntregas(data || [])
    } catch (error: any) {
      console.error('Error al cargar entregas:', error)
      toast({
        title: "Error inesperado",
        description: "No se pudieron cargar los estados de entrega",
        variant: "destructive",
      })
    } finally {
      setCargandoEntregas(false)
    }
  }, [toast])

  // Cargar lista de vendedores desde presupuestos y usuarios
  const cargarVendedores = useCallback(async () => {
    try {
      // Primero, obtener vendedores únicos de los presupuestos cargados
      const vendedoresDePresupuestos = new Map<string, string>()
      
      presupuestos.forEach((p: any) => {
        if (p.usuario_id && p.usuario_nombre) {
          vendedoresDePresupuestos.set(p.usuario_id, p.usuario_nombre)
        }
      })

      // También cargar todos los usuarios con rol vendedor/admin como respaldo
      const { data: usuariosData, error: usuariosError } = await supabase
        .from('usuarios')
        .select('id, nombre, rol')
        .not('nombre', 'is', null)
        .in('rol', ['vendedor', 'admin'])
        .order('nombre')

      if (usuariosError) {
        console.error('Error al cargar usuarios:', usuariosError)
      }

      // Combinar: primero los de presupuestos, luego los de usuarios (sin duplicar)
      const vendedoresCombinados = new Map<string, string>(vendedoresDePresupuestos)
      
      if (usuariosData) {
        usuariosData.forEach((u: any) => {
          if (!vendedoresCombinados.has(u.id)) {
            vendedoresCombinados.set(u.id, u.nombre)
          }
        })
      }

      // Convertir a array y ordenar por nombre
      const vendedoresArray = Array.from(vendedoresCombinados.entries())
        .map(([id, nombre]) => ({ id, nombre }))
        .sort((a, b) => a.nombre.localeCompare(b.nombre))

      setVendedores(vendedoresArray)
    } catch (error) {
      console.error('Error al cargar vendedores:', error)
    }
  }, [presupuestos])

  // Memoizar función de limpiar filtros
  const limpiarFiltros = useCallback(() => {
    setFiltroEstado('todos')
    setFiltroTipo('todos')
    setFiltroVendedor('todos')
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

    // Filtro por Vendedor
    if (filtroVendedor !== 'todos') {
      resultado = resultado.filter((p: any) => p.usuario_id === filtroVendedor)
    }

    return resultado
  }, [presupuestos, filtroEstado, filtroTipo, filtroVendedor])

  const filtrosActivos = filtroEstado !== 'todos' || filtroTipo !== 'todos' || filtroVendedor !== 'todos'

  useEffect(() => {
    cargarPresupuestos()
    cargarEstadoEntregas()
  }, [cargarPresupuestos, cargarEstadoEntregas])

  // Cargar vendedores después de que se carguen los presupuestos
  useEffect(() => {
    if (presupuestos.length > 0) {
      cargarVendedores()
    }
  }, [presupuestos, cargarVendedores])

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
        <div className="font-mono text-xs font-semibold whitespace-nowrap">{row.original.numero}</div>
      ),
      size: 120,
    },
    {
      accessorKey: 'tipo',
      header: 'Tipo',
      cell: ({ row }: any) => (
        <Badge variant={tipoBadgeVariant(row.original.tipo)} className="text-xs">
          {row.original.tipo === 'articulos' 
            ? 'Art.' 
            : row.original.tipo === 'cercado'
            ? 'Cerc.'
            : 'Gen.'}
        </Badge>
      ),
      size: 70,
    },
    {
      accessorKey: 'cliente_nombre',
      header: ({ column }: any) => <SortableHeader column={column} title="Cliente" />,
      cell: ({ row }: any) => (
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{row.original.cliente_nombre}</div>
          {row.original.cliente_email && (
            <div className="text-xs text-muted-foreground truncate">{row.original.cliente_email}</div>
          )}
        </div>
      ),
      size: 180,
    },
    {
      accessorKey: 'usuario_nombre',
      header: ({ column }: any) => <SortableHeader column={column} title="Vendedor" />,
      cell: ({ row }: any) => (
        <div className="flex items-center gap-1.5 min-w-0">
          <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <span className="text-xs truncate">{row.original.usuario_nombre || '—'}</span>
        </div>
      ),
      size: 110,
    },
    {
      accessorKey: 'fecha_emision',
      header: ({ column }: any) => <SortableHeader column={column} title="Fecha" />,
      cell: ({ row }: any) => (
        <div className="text-xs whitespace-nowrap">
          {new Date(row.original.fecha_emision).toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
          })}
        </div>
      ),
      size: 85,
    },
    {
      accessorKey: 'total',
      header: ({ column }: any) => <SortableHeader column={column} title="Total" />,
      cell: ({ row }: any) => (
        <span className="text-sm font-bold text-green-600 whitespace-nowrap">
          ${row.original.total?.toLocaleString() || '0'}
        </span>
      ),
      size: 120,
    },
    {
      accessorKey: 'estado_actual',
      header: ({ column }: any) => <SortableHeader column={column} title="Estado" />,
      cell: ({ row }: any) => (
        <Badge variant={estadoBadgeVariant(row.original.estado_actual)} className="text-xs">
          {row.original.estado_actual?.charAt(0).toUpperCase() + row.original.estado_actual?.slice(1)}
        </Badge>
      ),
      size: 100,
    },
    {
      accessorKey: 'cantidad_items',
      header: 'Items',
      cell: ({ row }: any) => (
        <Badge variant="outline" className="text-xs">{row.original.cantidad_items || 0}</Badge>
      ),
      size: 70,
    },
    {
      id: 'acciones',
      header: 'Acciones',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-0.5">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" asChild>
                  <Link href={`/dashboard/presupuestos/${row.original.id}`}>
                    <Eye className="h-3.5 w-3.5" />
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
                  className="h-7 w-7 p-0"
                  onClick={() => descargarPresupuesto(row.original.id)}
                  disabled={downloadingId === row.original.id}
                >
                  <Download className={`h-3.5 w-3.5 ${downloadingId === row.original.id ? 'animate-pulse' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Descargar PDF</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

        </div>
      ),
      size: 80,
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

  // Calcular tasa de conversión por vendedor
  const estadisticasPorVendedor = useMemo(() => {
    const ahora = new Date()
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
    
    const presupuestosDelMes = presupuestos.filter((p: any) => {
      const fecha = new Date(p.fecha_emision)
      return fecha >= inicioMes && fecha <= ahora
    })

    const porVendedor: Record<string, {
      nombre: string
      total: number
      aprobados: number
      enviados: number
      tasaConversion: number
      montoAprobado: number
    }> = {}

    presupuestosDelMes.forEach((p: any) => {
      const vendedorId = p.usuario_id || 'sin-vendedor'
      const vendedorNombre = p.usuario_nombre || 'Sin asignar'

      if (!porVendedor[vendedorId]) {
        porVendedor[vendedorId] = {
          nombre: vendedorNombre,
          total: 0,
          aprobados: 0,
          enviados: 0,
          tasaConversion: 0,
          montoAprobado: 0,
        }
      }

      porVendedor[vendedorId].total++
      
      if (p.estado_actual === 'aprobado') {
        porVendedor[vendedorId].aprobados++
        porVendedor[vendedorId].montoAprobado += parseFloat(p.total) || 0
      }
      
      if (p.estado_actual === 'enviado') {
        porVendedor[vendedorId].enviados++
      }
    })

    // Calcular tasa de conversión para cada vendedor
    Object.keys(porVendedor).forEach((vendedorId) => {
      const stats = porVendedor[vendedorId]
      stats.tasaConversion = stats.total > 0 
        ? (stats.aprobados / stats.total) * 100 
        : 0
    })

    return Object.values(porVendedor).sort((a, b) => b.tasaConversion - a.tasaConversion)
  }, [presupuestos])

  // Estadísticas del vendedor filtrado (si hay filtro activo)
  const estadisticasVendedorFiltrado = useMemo(() => {
    if (filtroVendedor === 'todos') return null

    const vendedor = estadisticasPorVendedor.find((v: any) => {
      const vendedorEnLista = vendedores.find((vend: any) => vend.id === filtroVendedor)
      return vendedorEnLista?.nombre === v.nombre
    })

    return vendedor || null
  }, [filtroVendedor, estadisticasPorVendedor, vendedores])

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
                      {[
                        filtroEstado !== 'todos' && 'Estado', 
                        filtroTipo !== 'todos' && 'Tipo',
                        filtroVendedor !== 'todos' && 'Vendedor'
                      ].filter(Boolean).length}
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
                <div className="flex-1 grid gap-3 md:grid-cols-3">
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

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Vendedor</label>
                    <Select value={filtroVendedor} onValueChange={setFiltroVendedor}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        {vendedores.map((vendedor) => (
                          <SelectItem key={vendedor.id} value={vendedor.id}>
                            {vendedor.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              {/* Mostrar estadísticas del vendedor filtrado */}
              {estadisticasVendedorFiltrado && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-900">
                      Estadísticas de {estadisticasVendedorFiltrado.nombre}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <div className="text-muted-foreground">Tasa de Conversión</div>
                      <div className="font-bold text-blue-600 text-base">
                        {estadisticasVendedorFiltrado.tasaConversion.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Total del Mes</div>
                      <div className="font-semibold">{estadisticasVendedorFiltrado.total}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Aprobados</div>
                      <div className="font-semibold text-green-600">
                        {estadisticasVendedorFiltrado.aprobados}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Monto Aprobado</div>
                      <div className="font-semibold text-green-600">
                        ${estadisticasVendedorFiltrado.montoAprobado.toLocaleString('es-AR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
            <>
              {/* Vista móvil: Tarjetas verticales */}
              <div className="md:hidden space-y-3">
                {presupuestosFiltrados.map((presupuesto: any) => {
                  const inicialVendedor = presupuesto.usuario_nombre 
                    ? presupuesto.usuario_nombre.charAt(0).toUpperCase() 
                    : '—'
                  
                  return (
                    <Card key={presupuesto.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        {/* Header: Número y Estado */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-semibold">{presupuesto.numero}</span>
                            <Badge variant={estadoBadgeVariant(presupuesto.estado_actual)} className="text-xs">
                              {presupuesto.estado_actual?.charAt(0).toUpperCase() + presupuesto.estado_actual?.slice(1)}
                            </Badge>
                          </div>
                          <Badge variant={tipoBadgeVariant(presupuesto.tipo)} className="text-xs">
                            {presupuesto.tipo === 'articulos' ? 'Art.' : presupuesto.tipo === 'cercado' ? 'Cerc.' : 'Gen.'}
                          </Badge>
                        </div>

                        {/* Cliente */}
                        <div className="mb-3">
                          <div className="text-sm font-semibold text-gray-900 truncate">
                            {presupuesto.cliente_nombre}
                          </div>
                          {presupuesto.cliente_email && (
                            <div className="text-xs text-muted-foreground truncate">
                              {presupuesto.cliente_email}
                            </div>
                          )}
                        </div>

                        {/* Vendedor y Fecha */}
                        <div className="flex items-center justify-between mb-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-semibold">
                              {inicialVendedor}
                            </div>
                            <span>{presupuesto.usuario_nombre || 'Sin asignar'}</span>
                          </div>
                          <span>
                            {new Date(presupuesto.fecha_emision).toLocaleDateString('es-AR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: '2-digit'
                            })}
                          </span>
                        </div>

                        {/* Precio destacado */}
                        <div className="mb-3 pb-3 border-b">
                          <div className="text-xs text-muted-foreground mb-1">Total</div>
                          <div className="text-2xl font-bold text-green-600">
                            ${presupuesto.total?.toLocaleString('es-AR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }) || '0'}
                          </div>
                        </div>

                        {/* Acciones: Botones grandes y accesibles */}
                        <div className="flex gap-2 -mx-1">
                          <Button
                            variant="default"
                            className="flex-1 text-xs sm:text-sm"
                            onClick={() => descargarPresupuesto(presupuesto.id)}
                            disabled={downloadingId === presupuesto.id}
                          >
                            <Download className={`h-4 w-4 mr-1.5 sm:mr-2 flex-shrink-0 ${downloadingId === presupuesto.id ? 'animate-pulse' : ''}`} />
                            <span className="truncate">{downloadingId === presupuesto.id ? 'Generando...' : 'PDF'}</span>
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 text-xs sm:text-sm"
                            asChild
                          >
                            <Link href={`/dashboard/presupuestos/${presupuesto.id}`} className="flex items-center justify-center">
                              <Eye className="h-4 w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                              <span>Ver</span>
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Vista desktop: Tabla */}
              <div className="hidden md:block overflow-x-auto">
                <DataTable
                  columns={columns}
                  data={presupuestosFiltrados}
                  searchKey="numero"
                  searchPlaceholder="Buscar por número o cliente..."
                  tableWrapperClassName="min-w-full"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

