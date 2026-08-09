'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { Plus, Edit, Eye, RefreshCw, Filter, MessageSquareText, Download, FileSpreadsheet, FileDown, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { SortableHeader } from '@/components/ui/sortable-header'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { exportarTejidosAExcel } from '@/lib/excel-generator'
import { generarPDFListaTejidos } from '@/lib/pdf-generator'

export default function TejidosPage() {
  const [tejidos, setTejidos] = useState<any[]>([])
  const [tejidosFiltrados, setTejidosFiltrados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  
  // Estados de filtros
  const [filtroCalibre, setFiltroCalibre] = useState('todos')
  const [filtroAltura, setFiltroAltura] = useState('todos')
  const [filtroRombo, setFiltroRombo] = useState('todos')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroOrigen, setFiltroOrigen] = useState('todos')

  useEffect(() => {
    cargarTejidos()
  }, [])

  useEffect(() => {
    aplicarFiltros()
  }, [tejidos, filtroCalibre, filtroAltura, filtroRombo, filtroEstado, filtroOrigen])

  function aplicarFiltros() {
    let resultado = [...tejidos]

    if (filtroCalibre !== 'todos') {
      resultado = resultado.filter((t: any) => t.calibre === parseInt(filtroCalibre))
    }

    if (filtroAltura !== 'todos') {
      resultado = resultado.filter((t: any) => t.altura === parseFloat(filtroAltura))
    }

    if (filtroRombo !== 'todos') {
      resultado = resultado.filter((t: any) => t.tamano_rombo === parseFloat(filtroRombo))
    }

    if (filtroEstado !== 'todos') {
      resultado = resultado.filter((t: any) => (filtroEstado === 'activos' ? t.activo : !t.activo))
    }

    if (filtroOrigen !== 'todos') {
      resultado = resultado.filter((t: any) => (t.origen || 'fabricado') === filtroOrigen)
    }

    setTejidosFiltrados(resultado)
  }

  function limpiarFiltros() {
    setFiltroCalibre('todos')
    setFiltroAltura('todos')
    setFiltroRombo('todos')
    setFiltroEstado('todos')
    setFiltroOrigen('todos')
  }

  async function cargarTejidos() {
    try {
      setLoading(true)
      // Consultar directamente desde la tabla base para asegurar que tenemos todos los campos
      const { data, error } = await supabase
        .from('tejidos_configuraciones')
        .select(`
          *,
          alambre:articulos!alambre_articulo_id(id, nombre),
          articulo:articulos!articulo_id(id, nombre),
          proveedor:proveedores!proveedor_id(id, nombre)
        `)
        .eq('activo', true)
        .order('calibre')
        .order('altura', { ascending: false })
        .order('tamano_rombo', { ascending: false })

      if (error) {
        console.error('Error al cargar tejidos:', error)
        toast({
          title: "Error al cargar tejidos",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      // Transformar datos para mantener compatibilidad con la estructura esperada
      const tejidosTransformados = (data || []).map((tejido: any) => ({
        ...tejido,
        alambre_nombre: tejido.alambre?.nombre || null,
        articulo_nombre: tejido.articulo?.nombre || null,
        proveedor_nombre: tejido.proveedor?.nombre || null,
        origen: tejido.origen || 'fabricado',
        // Mantener compatibilidad con nombres antiguos
        peso_kg: tejido.cantidad_alambre, // Para compatibilidad con código que usa peso_kg
        mano_obra: tejido.costo_mano_obra, // Para compatibilidad con código que usa mano_obra
        calidad_sugerida: 
          tejido.tamano_rombo === 3.5 ? 'Económica' :
          tejido.tamano_rombo === 3.0 ? 'Standard' : 'Reforzada'
      }))

      setTejidos(tejidosTransformados)
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error inesperado",
        description: "No se pudieron cargar los tejidos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatearMoneda = (valor?: number | null) =>
    valor != null && Number.isFinite(valor)
      ? valor.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : '—'

  const getEtiquetaFiltro = (valor: string, sufijo?: string) => {
    if (!valor || valor === 'todos') return 'Todos'
    return `${valor}${sufijo || ''}`
  }

  const generarNombreWhatsappTejido = (tejido: any) => {
    const calibre = tejido?.calibre != null ? `Cal.${tejido.calibre}` : (tejido?.codigo || 'Tejido')
    const altura = tejido?.altura != null ? `${tejido.altura}m` : null
    const rombo = tejido?.tamano_rombo != null ? `Rombo ${tejido.tamano_rombo}"` : null
    const partes = ['Tejido Romboidal', calibre, altura, rombo].filter(Boolean)
    return partes.join(' - ')
  }

  const generarResumenWhatsapp = (tejido: any) => {
    const partes: string[] = []
    partes.push(`🧱 *${tejido.nombre || tejido.codigo}*`)
    const detalles: string[] = []
    if (tejido.altura) detalles.push(`Altura ${tejido.altura} m`)
    if (tejido.calibre) detalles.push(`Calibre ${tejido.calibre}`)
    if (tejido.tamano_rombo) detalles.push(`Rombo ${tejido.tamano_rombo}"`)
    if (tejido.largo) detalles.push(`Largo ${tejido.largo} m`)
    if (detalles.length) partes.push(detalles.join(' · '))
    if (tejido.precio_venta != null) {
      const precioBase = `$${formatearMoneda(Number(tejido.precio_venta))}`
      partes.push(`Precio efectivo: ${precioBase}`)
      partes.push(`Factura/lista: $${formatearMoneda(Number(tejido.precio_venta) * 1.21)}`)
    } else {
      partes.push('Precio efectivo: Consultar')
    }
    return partes.join('\n')
  }

  const generarListadoFiltradoWhatsapp = () => {
    const filtros = [
      `calibre ${getEtiquetaFiltro(filtroCalibre)}`,
      `altura ${getEtiquetaFiltro(filtroAltura, 'm')}`,
      `rombo ${getEtiquetaFiltro(filtroRombo)}`,
      `Estado ${getEtiquetaFiltro(filtroEstado === 'activos' ? 'Activos' : filtroEstado === 'inactivos' ? 'Inactivos' : 'todos')}`,
    ]

    const encabezado = `*Lista de precios de tejidos romboidales* (Validez 1 dia)`

    const items = tejidosFiltrados.map((tejido, idx) => {
      const titulo = `${idx + 1}) 🧱 *${generarNombreWhatsappTejido(tejido)}*`
      const detalles: string[] = []
      if (tejido?.altura != null) detalles.push(`Altura ${tejido.altura} m`)
      if (tejido?.calibre != null) detalles.push(`Calibre ${tejido.calibre}`)
      if (tejido?.tamano_rombo != null) detalles.push(`Rombo ${tejido.tamano_rombo}"`)
      if (tejido?.largo != null) detalles.push(`Largo ${tejido.largo} m`)
      const specs = detalles.length ? `${detalles.join(' · ')}` : ''

      const precioVenta = tejido?.precio_venta != null ? Number(tejido.precio_venta) : null
      const precioEfectivo = precioVenta != null ? `$${formatearMoneda(precioVenta)}` : 'Consultar'
      const precioFactura = precioVenta != null ? `$${formatearMoneda(precioVenta * 1.21)}` : 'Consultar'

      return [titulo, '', specs, `Precio efectivo: ${precioEfectivo}`, `Factura/lista: ${precioFactura}`]
        .filter((l) => l !== '')
        .join('\n')
    })

    return [encabezado, '', ...items].join('\n\n').trim()
  }

  const copiarResumen = async (tejido: any) => {
    try {
      const texto = generarResumenWhatsapp(tejido)
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(texto)
        toast({
          title: 'Resumen copiado',
          description: 'Listo para compartir en WhatsApp.',
        })
      } else {
        toast({
          title: 'No soportado',
          description: 'Tu navegador no permite copiar automáticamente.',
          variant: 'destructive',
        })
      }
    } catch (error: any) {
      console.error('Error al copiar tejido:', error)
      toast({
        title: 'No se pudo copiar',
        description: 'Tu navegador no permitió copiar el texto.',
        variant: 'destructive',
      })
    }
  }

  const copiarListadoFiltrado = async () => {
    try {
      if (!tejidosFiltrados?.length) {
        toast({
          title: 'Sin resultados',
          description: 'No hay tejidos filtrados para copiar.',
          variant: 'destructive',
        })
        return
      }

      const texto = generarListadoFiltradoWhatsapp()
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(texto)
        toast({
          title: 'Listado copiado',
          description: 'Listo para pegar en WhatsApp.',
        })
      } else {
        toast({
          title: 'No soportado',
          description: 'Tu navegador no permite copiar automáticamente.',
          variant: 'destructive',
        })
      }
    } catch (error: any) {
      console.error('Error al copiar listado de tejidos:', error)
      toast({
        title: 'No se pudo copiar',
        description: 'Tu navegador no permitió copiar el texto.',
        variant: 'destructive',
      })
    }
  }

  // Función auxiliar para calcular precios por tipo de pago
  const calcularPreciosPorTipoPagoParaExportacion = (precioVenta: number) => {
    return {
      efectivo: precioVenta * 1.0, // sin IVA
      facturaLista: precioVenta * 1.21, // con IVA 21%
      tarjeta: precioVenta * 1.3, // con IVA 21%
    }
  }

  // Función para exportar a Excel
  const exportarAExcel = () => {
    try {
      const datosParaExportar = tejidosFiltrados.map((tejido) => {
        const preciosCalculados = calcularPreciosPorTipoPagoParaExportacion(Number(tejido.precio_venta) || 0)
        return {
          codigo: tejido.codigo || '-',
          nombre: tejido.nombre || null,
          categoria: tejido.categoria_calidad || tejido.calidad_sugerida || null,
          unidad: 'rollo', // Los tejidos se venden por rollo
          origen: tejido.origen === 'reventa'
            ? `Reventa${tejido.proveedor_nombre ? ` (${tejido.proveedor_nombre})` : ''}`
            : 'Fabricado',
          precioEfectivo: preciosCalculados.efectivo,
          precioFactura: preciosCalculados.facturaLista,
          precioTarjeta: preciosCalculados.tarjeta,
          estado: tejido.activo ? 'Activo' : 'Inactivo',
        }
      })

      exportarTejidosAExcel(datosParaExportar, 'Lista_Tejidos')
      
      toast({
        title: 'Excel exportado',
        description: `Se exportaron ${datosParaExportar.length} tejidos correctamente.`,
      })
    } catch (error) {
      console.error('Error al exportar a Excel:', error)
      toast({
        title: 'Error al exportar',
        description: 'No se pudo exportar la lista de tejidos. Intenta nuevamente.',
        variant: 'destructive',
      })
    }
  }

  // Función para exportar a PDF
  const exportarAPDF = () => {
    try {
      const datosParaExportar = tejidosFiltrados.map((tejido) => {
        const preciosCalculados = calcularPreciosPorTipoPagoParaExportacion(Number(tejido.precio_venta) || 0)
        return {
          codigo: tejido.codigo || '-',
          nombre: tejido.nombre || null,
          categoria: tejido.categoria_calidad || tejido.calidad_sugerida || null,
          unidad: 'rollo', // Los tejidos se venden por rollo
          origen: tejido.origen === 'reventa'
            ? `Reventa${tejido.proveedor_nombre ? ` (${tejido.proveedor_nombre})` : ''}`
            : 'Fabricado',
          precioEfectivo: preciosCalculados.efectivo,
          precioFactura: preciosCalculados.facturaLista,
          precioTarjeta: preciosCalculados.tarjeta,
          estado: tejido.activo ? 'Activo' : 'Inactivo',
        }
      })

      generarPDFListaTejidos(datosParaExportar, 'Lista_Tejidos')
      
      toast({
        title: 'PDF exportado',
        description: `Se exportaron ${datosParaExportar.length} tejidos correctamente.`,
      })
    } catch (error) {
      console.error('Error al exportar a PDF:', error)
      toast({
        title: 'Error al exportar',
        description: 'No se pudo exportar la lista de tejidos. Intenta nuevamente.',
        variant: 'destructive',
      })
    }
  }

  const columns = [
    {
      accessorKey: 'codigo',
      header: ({ column }: any) => <SortableHeader column={column} title="Código" />,
      cell: ({ row }: any) => (
        <div className="font-mono font-semibold text-[11px] md:text-xs whitespace-nowrap max-w-[110px] truncate">{row.original.codigo}</div>
      ),
    },
    {
      accessorKey: 'calibre',
      header: ({ column }: any) => <SortableHeader column={column} title="Calibre" />,
      cell: ({ row }: any) => (
        <Badge variant="outline" className="font-mono text-[11px]">
          Cal. {row.original.calibre}
        </Badge>
      ),
    },
    {
      accessorKey: 'altura',
      header: ({ column }: any) => <SortableHeader column={column} title="Altura" />,
      cell: ({ row }: any) => (
        <span className="font-medium whitespace-nowrap text-xs md:text-sm">{row.original.altura}m</span>
      ),
    },
    {
      accessorKey: 'tamano_rombo',
      header: ({ column }: any) => <SortableHeader column={column} title="Rombo" />,
      cell: ({ row }: any) => (
        <span className="font-medium whitespace-nowrap text-xs md:text-sm">{row.original.tamano_rombo}"</span>
      ),
    },
    {
      accessorKey: 'origen',
      header: 'Origen',
      cell: ({ row }: any) => {
        const esReventa = row.original.origen === 'reventa'
        return (
          <Badge
            variant={esReventa ? 'default' : 'outline'}
            className={`text-[11px] whitespace-nowrap ${esReventa ? '' : 'border-amber-500 text-amber-700'}`}
            title={esReventa
              ? `Se compra a ${row.original.proveedor_nombre || 'proveedor'}`
              : 'Se fabrica: hoy no se compra a proveedor'}
          >
            {esReventa ? (row.original.proveedor_nombre || 'Reventa') : 'Fabricado'}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'peso_kg',
      header: ({ column }: any) => <SortableHeader column={column} title="Peso" />,
      cell: ({ row }: any) => {
        // En reventa no hay alambre de materia prima
        if (row.original.origen === 'reventa') {
          return <span className="text-muted-foreground text-xs">—</span>
        }
        const peso = row.original.cantidad_alambre || row.original.peso_kg
        if (peso == null || peso === undefined) {
          return <span className="text-muted-foreground text-xs">—</span>
        }
        return (
          <span className="text-muted-foreground text-xs md:text-sm">{Number(peso).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg</span>
        )
      },
    },
    {
      accessorKey: 'mano_obra',
      header: ({ column }: any) => <SortableHeader column={column} title="M. Obra" />,
      cell: ({ row }: any) => {
        // En reventa no hay mano de obra de fabricación
        if (row.original.origen === 'reventa') {
          return <span className="text-xs text-muted-foreground">—</span>
        }
        const manoObra = row.original.costo_mano_obra || row.original.mano_obra
        if (manoObra == null || manoObra === undefined) {
          return <span className="text-xs text-muted-foreground">—</span>
        }
        return (
          <span className="text-xs md:text-sm">${Number(manoObra).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        )
      },
    },
    {
      accessorKey: 'precio_costo',
      header: ({ column }: any) => <SortableHeader column={column} title="Costo" />,
      cell: ({ row }: any) => (
        <span className="font-semibold text-orange-600 text-xs md:text-sm whitespace-nowrap">
          ${formatearMoneda(Number(row.original.precio_costo))}
        </span>
      ),
    },
    {
      accessorKey: 'precio_venta',
      header: ({ column }: any) => <SortableHeader column={column} title="Venta" />,
      cell: ({ row }: any) => (
        <span className="font-bold text-green-600 text-xs md:text-sm whitespace-nowrap">
          ${formatearMoneda(Number(row.original.precio_venta))}
        </span>
      ),
    },
    {
      accessorKey: 'categoria_calidad',
      header: 'Calidad',
      cell: ({ row }: any) => {
        const calidad = row.original.categoria_calidad || row.original.calidad_sugerida
        const variant = 
          calidad === 'Económica' ? 'secondary' :
          calidad === 'Standard' ? 'default' :
          'destructive'
        return <Badge variant={variant} className="text-[11px] whitespace-nowrap">{calidad}</Badge>
      },
    },
    {
      id: 'acciones',
      header: 'Acciones',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-1 flex-wrap sm:flex-nowrap">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                  <Link href={`/dashboard/tejidos/${row.original.id}`}>
                    <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                  <Link href={`/dashboard/tejidos/editar/${row.original.id}`}>
                    <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Editar tejido</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => copiarResumen(row.original)}
                >
                  <MessageSquareText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copiar para WhatsApp</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tejidos Romboidales</h1>
          <p className="text-muted-foreground mt-1">
            Gestión de configuraciones de tejidos fabricados
          </p>
        </div>
        <div className="grid gap-2 sm:flex sm:gap-2">
          <Button
            variant="outline"
            onClick={cargarTejidos}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportarAExcel}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Exportar a Excel (.xlsx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportarAPDF}>
                <FileDown className="mr-2 h-4 w-4" />
                Exportar a PDF (.pdf)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/dashboard/tejidos/nuevo">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Tejido
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Configuraciones</CardDescription>
            <CardTitle className="text-3xl">{tejidos.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Activos</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {tejidos.filter(t => t.activo).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Calibre 12</CardDescription>
            <CardTitle className="text-3xl">
              {tejidos.filter(t => t.calibre === 12).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Calibre 14</CardDescription>
            <CardTitle className="text-3xl">
              {tejidos.filter(t => t.calibre === 14).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Listado de Tejidos</CardTitle>
              <CardDescription>
                {tejidosFiltrados.length} de {tejidos.length} configuraciones
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copiarListadoFiltrado}
                disabled={tejidosFiltrados.length === 0}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar listado (WhatsApp)
              </Button>
              {(filtroCalibre !== 'todos' || filtroAltura !== 'todos' || filtroRombo !== 'todos' || filtroEstado !== 'todos' || filtroOrigen !== 'todos') && (
                <Button variant="outline" size="sm" onClick={limpiarFiltros}>
                  Limpiar Filtros
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1 grid gap-3 md:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Calibre</label>
                <Select value={filtroCalibre} onValueChange={setFiltroCalibre}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="12">Calibre 12</SelectItem>
                    <SelectItem value="14">Calibre 14</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Altura</label>
                <Select value={filtroAltura} onValueChange={setFiltroAltura}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas</SelectItem>
                    <SelectItem value="1.00">1.0 m</SelectItem>
                    <SelectItem value="1.20">1.2 m</SelectItem>
                    <SelectItem value="1.50">1.5 m</SelectItem>
                    <SelectItem value="1.80">1.8 m</SelectItem>
                    <SelectItem value="2.00">2.0 m</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Rombo</label>
                <Select value={filtroRombo} onValueChange={setFiltroRombo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="2.0">2.0"</SelectItem>
                    <SelectItem value="2.5">2.5"</SelectItem>
                    <SelectItem value="3.0">3.0"</SelectItem>
                    <SelectItem value="3.5">3.5"</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Estado</label>
                <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="activos">Activos</SelectItem>
                    <SelectItem value="inactivos">Inactivos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Origen</label>
                <Select value={filtroOrigen} onValueChange={setFiltroOrigen}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="reventa">Reventa</SelectItem>
                    <SelectItem value="fabricado">Fabricado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Tabla */}
          {tejidosFiltrados.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay tejidos que coincidan con los filtros.</p>
          ) : null}

          <div className="space-y-3 md:hidden">
            {tejidosFiltrados.map((tejido) => (
              <div key={tejido.id} className="rounded-lg border border-border/60 bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase font-medium text-muted-foreground">Código</p>
                    <p className="font-mono text-sm font-semibold">{tejido.codigo}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={tejido.origen === 'reventa' ? 'default' : 'outline'}
                      className={`text-[11px] ${tejido.origen === 'reventa' ? '' : 'border-amber-500 text-amber-700'}`}
                    >
                      {tejido.origen === 'reventa' ? (tejido.proveedor_nombre || 'Reventa') : 'Fabricado'}
                    </Badge>
                    <Badge variant={tejido.categoria_calidad === 'Económica' ? 'secondary' : tejido.categoria_calidad === 'Standard' ? 'default' : 'destructive'} className="text-[11px]">
                      {tejido.categoria_calidad || tejido.calidad_sugerida}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="rounded-lg border border-border/40 px-3 py-2">
                    <p className="uppercase font-medium">Calibre</p>
                    <p className="text-sm font-semibold text-foreground">{tejido.calibre}</p>
                  </div>
                  <div className="rounded-lg border border-border/40 px-3 py-2">
                    <p className="uppercase font-medium">Altura</p>
                    <p className="text-sm font-semibold text-foreground">{tejido.altura} m</p>
                  </div>
                  <div className="rounded-lg border border-border/40 px-3 py-2">
                    <p className="uppercase font-medium">Rombo</p>
                    <p className="text-sm font-semibold text-foreground">{tejido.tamano_rombo}"</p>
                  </div>
                  <div className="rounded-lg border border-border/40 px-3 py-2">
                    <p className="uppercase font-medium">Precio</p>
                    <p className="text-sm font-bold text-green-600">${formatearMoneda(Number(tejido.precio_venta))}</p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <Button variant="outline" size="sm" className="h-8 px-3" asChild>
                    <Link href={`/dashboard/tejidos/${tejido.id}`}>
                      <Eye className="h-4 w-4 mr-1" /> Ver
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 px-3" asChild>
                    <Link href={`/dashboard/tejidos/editar/${tejido.id}`}>
                      <Edit className="h-4 w-4 mr-1" /> Editar
                    </Link>
                  </Button>
                  <Button variant="secondary" size="sm" className="h-8 px-3" onClick={() => copiarResumen(tejido)}>
                    <MessageSquareText className="h-4 w-4 mr-1" /> Copiar
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block">
            <DataTable 
              columns={columns} 
              data={tejidosFiltrados}
              searchKey="codigo"
              searchPlaceholder="Buscar por código..."
              pageSize={15}
              tableWrapperClassName="min-w-[1024px]"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

