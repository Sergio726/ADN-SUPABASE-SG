'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { Plus, Edit, Eye, RefreshCw, Calculator, Filter, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { SortableHeader } from '@/components/ui/sortable-header'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { recalcularPreciosCercado, esPrecioDesactualizado, diasDesdeActualizacion } from '@/lib/cercado-service'

export default function ConfiguracionesCercadoPage() {
  const [configuraciones, setConfiguraciones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [recalculandoIds, setRecalculandoIds] = useState<Set<string>>(new Set())
  const [dialogDesactualizadasAbierto, setDialogDesactualizadasAbierto] = useState(false)
  const { toast } = useToast()

  // Estados de filtros
  const [filtroAlturaFinal, setFiltroAlturaFinal] = useState('todos')
  const [filtroTipoPoste, setFiltroTipoPoste] = useState('todos')
  const [filtroCordon, setFiltroCordon] = useState('todos')
  const [filtroHilosPua, setFiltroHilosPua] = useState('todos')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroCalibre, setFiltroCalibre] = useState('todos')
  const [filtroRombo, setFiltroRombo] = useState('todos')

  const cargarConfiguraciones = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('v_configuraciones_cercado_completas')
        .select('*')
        .order('altura_final_cerco', { ascending: false, nullsFirst: false })
        .order('altura', { ascending: false })

      if (error) {
        console.error('Error:', error)
        toast({
          title: "Error al cargar configuraciones",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      setConfiguraciones(data || [])
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error inesperado",
        description: "No se pudieron cargar las configuraciones",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    cargarConfiguraciones()
  }, [cargarConfiguraciones])

  const configuracionesFiltradas = useMemo(() => {
    let resultado = [...configuraciones]

    // Filtro por altura final del cerco
    if (filtroAlturaFinal !== 'todos') {
      const alturaBuscada = parseFloat(filtroAlturaFinal)
      resultado = resultado.filter((c: any) => {
        const alturaFinal = c.altura_final_cerco ?? c.altura
        return alturaFinal === alturaBuscada
      })
    }

    // Filtro por tipo de poste
    if (filtroTipoPoste !== 'todos') {
      resultado = resultado.filter((c: any) => c.tipo_poste === filtroTipoPoste)
    }

    // Filtro por cordón
    if (filtroCordon !== 'todos') {
      resultado = resultado.filter((c: any) => c.cordon_tipo === filtroCordon)
    }

    // Filtro por hilos de púa
    if (filtroHilosPua !== 'todos') {
      const hilosBuscados = parseInt(filtroHilosPua)
      resultado = resultado.filter((c: any) => c.hilos_pua === hilosBuscados)
    }

    // Filtro por estado
    if (filtroEstado !== 'todos') {
      resultado = resultado.filter((c: any) => 
        filtroEstado === 'activos' ? c.activo : !c.activo
      )
    }

    // Filtro por calibre
    if (filtroCalibre !== 'todos') {
      const calibreBuscado = parseInt(filtroCalibre)
      resultado = resultado.filter((c: any) => c.calibre === calibreBuscado)
    }

    // Filtro por tamaño de rombo
    if (filtroRombo !== 'todos') {
      const romboBuscado = parseFloat(filtroRombo)
      resultado = resultado.filter((c: any) => c.tamano_rombo === romboBuscado)
    }

    return resultado
  }, [configuraciones, filtroAlturaFinal, filtroTipoPoste, filtroCordon, filtroHilosPua, filtroEstado, filtroCalibre, filtroRombo])

  const limpiarFiltros = useCallback(() => {
    setFiltroAlturaFinal('todos')
    setFiltroTipoPoste('todos')
    setFiltroCordon('todos')
    setFiltroHilosPua('todos')
    setFiltroEstado('todos')
    setFiltroCalibre('todos')
    setFiltroRombo('todos')
  }, [])

  const handleRecalcularPrecios = useCallback(async (configuracionId: string) => {
    try {
      setRecalculandoIds(prev => new Set(prev).add(configuracionId))
      
      await recalcularPreciosCercado(configuracionId)
      
      toast({
        title: 'Precios recalculados',
        description: 'Se actualizaron los precios con valores vigentes.',
      })
      
      // Recargar la lista para reflejar los cambios
      await cargarConfiguraciones()
    } catch (error: any) {
      console.error('Error al recalcular:', error)
      toast({
        title: 'Error al recalcular',
        description: error.message || 'No fue posible actualizar los precios.',
        variant: 'destructive',
      })
    } finally {
      setRecalculandoIds(prev => {
        const nuevo = new Set(prev)
        nuevo.delete(configuracionId)
        return nuevo
      })
    }
  }, [cargarConfiguraciones, toast])

  // Calcular estadísticas de configuraciones desactualizadas (memoizado)
  const configuracionesDesactualizadas = useMemo(() => 
    configuraciones.filter((c: any) => esPrecioDesactualizado(c.actualizado_en)),
    [configuraciones]
  )
  
  const totalDesactualizadas = useMemo(() => configuracionesDesactualizadas.length, [configuracionesDesactualizadas])
  const totalActualizadas = useMemo(() => configuraciones.length - totalDesactualizadas, [configuraciones.length, totalDesactualizadas])

  // Obtener valores únicos para los filtros (memoizado)
  const alturasUnicas = useMemo(() => Array.from(new Set(
    configuraciones
      .map((c: any) => c.altura_final_cerco ?? c.altura)
      .filter((alt: any) => alt != null)
      .sort((a: number, b: number) => b - a)
  )), [configuraciones])

  const calibresUnicos = useMemo(() => Array.from(new Set(
    configuraciones
      .map((c: any) => c.calibre)
      .filter((cal: any) => cal != null)
      .sort((a: number, b: number) => a - b)
  )), [configuraciones])

  const rombosUnicos = useMemo(() => Array.from(new Set(
    configuraciones
      .map((c: any) => c.tamano_rombo)
      .filter((rom: any) => rom != null)
      .sort((a: number, b: number) => b - a)
  )), [configuraciones])

  const columns = useMemo(() => [
    {
      accessorKey: 'nombre',
      header: ({ column }: any) => <SortableHeader column={column} title="Nombre" />,
      cell: ({ row }: any) => (
        <div>
          <div className="font-semibold">{row.original.nombre}</div>
          {row.original.descripcion && (
            <div className="text-xs text-muted-foreground">{row.original.descripcion}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'altura_final_cerco',
      header: ({ column }: any) => <SortableHeader column={column} title="Altura" />,
      cell: ({ row }: any) => (
        <Badge variant="outline">
          {row.original.altura_final_cerco ? `${row.original.altura_final_cerco}m` : `${row.original.altura}m`}
        </Badge>
      ),
    },
    {
      accessorKey: 'tejido_codigo',
      header: 'Tejido',
      cell: ({ row }: any) => (
        <div className="text-sm">
          <div className="font-mono font-semibold">{row.original.tejido_codigo}</div>
          <div className="text-xs text-muted-foreground">
            Cal.{row.original.calibre} - Rombo {row.original.tamano_rombo}"
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'tipo_poste',
      header: 'Postes',
      cell: ({ row }: any) => (
        <span className="text-sm">{row.original.tipo_poste}</span>
      ),
    },
    {
      accessorKey: 'cordon_tipo',
      header: 'Cordón',
      cell: ({ row }: any) => (
        <span className="text-sm">{row.original.cordon_tipo}</span>
      ),
    },
    {
      accessorKey: 'hilos_pua',
      header: 'Púa',
      cell: ({ row }: any) => (
        <Badge variant={row.original.hilos_pua > 0 ? 'default' : 'outline'}>
          {row.original.hilos_pua} hilos
        </Badge>
      ),
    },
    {
      accessorKey: 'precio_por_metro_lineal',
      header: ({ column }: any) => <SortableHeader column={column} title="$/Metro" />,
      cell: ({ row }: any) => (
        <div className="font-bold text-green-600">
          ${row.original.precio_por_metro_lineal?.toLocaleString() || 'N/A'}
        </div>
      ),
    },
    {
      accessorKey: 'precio_base_180m',
      header: ({ column }: any) => <SortableHeader column={column} title="Total 180m" />,
      cell: ({ row }: any) => (
        <div className="text-sm text-muted-foreground">
          ${row.original.precio_base_180m?.toLocaleString() || 'N/A'}
        </div>
      ),
    },
    {
      accessorKey: 'activo',
      header: 'Estado',
      cell: ({ row }: any) => (
        <Badge variant={row.original.activo ? 'default' : 'outline'}>
          {row.original.activo ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      id: 'actualizacion',
      header: 'Actualización',
      cell: ({ row }: any) => {
        const desactualizado = esPrecioDesactualizado(row.original.actualizado_en)
        const dias = diasDesdeActualizacion(row.original.actualizado_en)
        const recalculando = recalculandoIds.has(row.original.id)
        
        if (desactualizado) {
          return (
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="destructive" className="cursor-help">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {dias !== null ? `${dias} días` : 'Sin actualizar'}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Precios desactualizados (más de 30 días)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRecalcularPrecios(row.original.id)}
                      disabled={recalculando}
                    >
                      <RefreshCw className={`h-3 w-3 mr-1 ${recalculando ? 'animate-spin' : ''}`} />
                      Recalcular
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Recalcular precios con valores vigentes</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )
        }
        
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="cursor-help">
                  Actualizado
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {dias !== null 
                    ? `Actualizado hace ${dias} ${dias === 1 ? 'día' : 'días'}`
                    : 'Precios actualizados'}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      },
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
                  <Link href={`/dashboard/cercado/${row.original.id}`}>
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
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/dashboard/cercado/editar/${row.original.id}`}>
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Editar configuración</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      ),
    },
  ], [recalculandoIds, handleRecalcularPrecios])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configuraciones de Cercado</h1>
          <p className="text-muted-foreground mt-1">
            Gestión de precios base para servicios de cercado perimetral
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={cargarConfiguraciones}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button asChild>
            <Link href="/dashboard/cercado/nuevo">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Configuración
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Listado de Configuraciones</CardTitle>
              <CardDescription>
                {configuracionesFiltradas.length} de {configuraciones.length} configuraciones
              </CardDescription>
            </div>
            {(filtroAlturaFinal !== 'todos' || filtroTipoPoste !== 'todos' || filtroCordon !== 'todos' || 
              filtroHilosPua !== 'todos' || filtroEstado !== 'todos' || filtroCalibre !== 'todos' || 
              filtroRombo !== 'todos') && (
              <Button variant="outline" size="sm" onClick={limpiarFiltros}>
                Limpiar Filtros
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {configuraciones.length === 0 ? (
            <div className="text-center py-12">
              <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay configuraciones</h3>
              <p className="text-muted-foreground mb-4">
                Crea la primera configuración base de cercado
              </p>
              <Button asChild>
                <Link href="/dashboard/cercado/nuevo">
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Configuración
                </Link>
              </Button>
            </div>
          ) : (
            <>
              {/* Resumen de actualizaciones */}
              <div className="grid gap-3 md:grid-cols-2">
                <Card className="border-green-200 bg-green-50/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Actualizadas
                        </p>
                        <div className="flex items-baseline gap-2">
                          <p className="text-2xl font-bold text-green-700">
                            {totalActualizadas}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {configuraciones.length > 0 
                              ? `${Math.round((totalActualizadas / configuraciones.length) * 100)}%`
                              : '0%'}
                          </p>
                        </div>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-green-200 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-5 w-5 text-green-700" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className={`${totalDesactualizadas > 0 ? 'border-destructive/50 bg-destructive/10' : 'border-green-200 bg-green-50/50'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Desactualizadas
                        </p>
                        <div className="flex items-baseline gap-2">
                          <p className={`text-2xl font-bold ${totalDesactualizadas > 0 ? 'text-destructive' : 'text-green-700'}`}>
                            {totalDesactualizadas}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {configuraciones.length > 0 
                              ? `${Math.round((totalDesactualizadas / configuraciones.length) * 100)}%`
                              : '0%'}
                          </p>
                        </div>
                        {totalDesactualizadas > 0 && (
                          <button
                            onClick={() => setDialogDesactualizadasAbierto(true)}
                            className="text-xs text-destructive hover:underline mt-1"
                          >
                            Ver detalles →
                          </button>
                        )}
                      </div>
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${totalDesactualizadas > 0 ? 'bg-destructive/20' : 'bg-green-200'}`}>
                        <AlertCircle className={`h-5 w-5 ${totalDesactualizadas > 0 ? 'text-destructive' : 'text-green-700'}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filtros compactos */}
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 grid gap-2 md:grid-cols-4 lg:grid-cols-7">
                  <Select value={filtroAlturaFinal} onValueChange={setFiltroAlturaFinal}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Altura Final" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas las alturas</SelectItem>
                      {alturasUnicas.map((altura: any) => (
                        <SelectItem key={altura} value={altura.toString()}>
                          {altura}m
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filtroTipoPoste} onValueChange={setFiltroTipoPoste}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Tipo Poste" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los tipos</SelectItem>
                      <SelectItem value="Olimp">Olimp</SelectItem>
                      <SelectItem value="Punta Diamante">Punta Diamante</SelectItem>
                      <SelectItem value="Eucalipto">Eucalipto</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filtroCordon} onValueChange={setFiltroCordon}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Cordón" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los cordones</SelectItem>
                      <SelectItem value="10cm">10cm</SelectItem>
                      <SelectItem value="15cm">15cm</SelectItem>
                      <SelectItem value="20cm">20cm</SelectItem>
                      <SelectItem value="Sin cordón">Sin cordón</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filtroHilosPua} onValueChange={setFiltroHilosPua}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Hilos Púa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los hilos</SelectItem>
                      <SelectItem value="0">0 hilos</SelectItem>
                      <SelectItem value="1">1 hilo</SelectItem>
                      <SelectItem value="2">2 hilos</SelectItem>
                      <SelectItem value="3">3 hilos</SelectItem>
                      <SelectItem value="4">4 hilos</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filtroCalibre} onValueChange={setFiltroCalibre}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Calibre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los calibres</SelectItem>
                      {calibresUnicos.map((calibre: any) => (
                        <SelectItem key={calibre} value={calibre.toString()}>
                          Cal. {calibre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filtroRombo} onValueChange={setFiltroRombo}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Rombo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los rombos</SelectItem>
                      {rombosUnicos.map((rombo: any) => (
                        <SelectItem key={rombo} value={rombo.toString()}>
                          {rombo}"
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los estados</SelectItem>
                      <SelectItem value="activos">Activos</SelectItem>
                      <SelectItem value="inactivos">Inactivos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tabla */}
              {configuracionesFiltradas.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay configuraciones que coincidan con los filtros seleccionados.
                </p>
              ) : (
                <DataTable
                  columns={columns}
                  data={configuracionesFiltradas}
                  searchKey="nombre"
                  searchPlaceholder="Buscar configuración..."
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Configuraciones Desactualizadas */}
      <Dialog open={dialogDesactualizadasAbierto} onOpenChange={setDialogDesactualizadasAbierto}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Configuraciones Desactualizadas
            </DialogTitle>
            <DialogDescription>
              {totalDesactualizadas} {totalDesactualizadas === 1 ? 'configuración' : 'configuraciones'} con precios de más de 30 días
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4">
            {configuracionesDesactualizadas.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <p className="text-muted-foreground">No hay configuraciones desactualizadas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {configuracionesDesactualizadas.map((config: any) => {
                  const dias = diasDesdeActualizacion(config.actualizado_en)
                  const fechaActualizacion = config.actualizado_en 
                    ? new Date(config.actualizado_en).toLocaleDateString('es-AR', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })
                    : 'N/A'
                  const recalculando = recalculandoIds.has(config.id)
                  
                  return (
                    <Card key={config.id} className="border-destructive/20">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2 mb-2">
                              <h4 className="font-semibold text-sm">{config.nombre}</h4>
                              <Badge variant="destructive" className="shrink-0">
                                {dias !== null ? `${dias} días` : 'Sin actualizar'}
                              </Badge>
                            </div>
                            {config.descripcion && (
                              <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                                {config.descripcion}
                              </p>
                            )}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-muted-foreground">Altura: </span>
                                <span className="font-medium">
                                  {config.altura_final_cerco ? `${config.altura_final_cerco}m` : `${config.altura}m`}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Precio/m: </span>
                                <span className="font-medium text-green-600">
                                  ${config.precio_por_metro_lineal?.toLocaleString() || 'N/A'}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Tejido: </span>
                                <span className="font-medium">
                                  {config.tejido_codigo} (Cal.{config.calibre}, Rombo {config.tamano_rombo}")
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Última actualización: </span>
                                <span className="font-medium">{fechaActualizacion}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRecalcularPrecios(config.id)}
                              disabled={recalculando}
                              className="w-full"
                            >
                              <RefreshCw className={`h-3 w-3 mr-2 ${recalculando ? 'animate-spin' : ''}`} />
                              Recalcular
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="w-full"
                            >
                              <Link href={`/dashboard/cercado/${config.id}`}>
                                <Eye className="h-3 w-3 mr-2" />
                                Ver
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base">💡 Información</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-900">
          <p className="mb-2">
            Las configuraciones de cercado definen los componentes y costos base para un terreno de <strong>180 metros lineales</strong> (60×30).
          </p>
          <ul className="space-y-1 ml-4">
            <li>• Al crear presupuestos, el sistema calcula automáticamente de forma proporcional</li>
            <li>• Para terrenos &lt;50m se aplica un recargo del 50% automáticamente</li>
            <li>• Cada configuración incluye: tejido, postes, cordón, púa, accesorios, mano de obra y transporte</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

