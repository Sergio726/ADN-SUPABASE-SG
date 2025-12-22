'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { Plus, Edit, Eye, RefreshCw, Calculator, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { SortableHeader } from '@/components/ui/sortable-header'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function ConfiguracionesCercadoPage() {
  const [configuraciones, setConfiguraciones] = useState<any[]>([])
  const [configuracionesFiltradas, setConfiguracionesFiltradas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Estados de filtros
  const [filtroAlturaFinal, setFiltroAlturaFinal] = useState('todos')
  const [filtroTipoPoste, setFiltroTipoPoste] = useState('todos')
  const [filtroCordon, setFiltroCordon] = useState('todos')
  const [filtroHilosPua, setFiltroHilosPua] = useState('todos')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroCalibre, setFiltroCalibre] = useState('todos')
  const [filtroRombo, setFiltroRombo] = useState('todos')

  useEffect(() => {
    cargarConfiguraciones()
  }, [])

  useEffect(() => {
    aplicarFiltros()
  }, [configuraciones, filtroAlturaFinal, filtroTipoPoste, filtroCordon, filtroHilosPua, filtroEstado, filtroCalibre, filtroRombo])

  async function cargarConfiguraciones() {
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
  }

  function aplicarFiltros() {
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

    setConfiguracionesFiltradas(resultado)
  }

  function limpiarFiltros() {
    setFiltroAlturaFinal('todos')
    setFiltroTipoPoste('todos')
    setFiltroCordon('todos')
    setFiltroHilosPua('todos')
    setFiltroEstado('todos')
    setFiltroCalibre('todos')
    setFiltroRombo('todos')
  }

  // Obtener valores únicos para los filtros
  const alturasUnicas = Array.from(new Set(
    configuraciones
      .map((c: any) => c.altura_final_cerco ?? c.altura)
      .filter((alt: any) => alt != null)
      .sort((a: number, b: number) => b - a)
  ))

  const calibresUnicos = Array.from(new Set(
    configuraciones
      .map((c: any) => c.calibre)
      .filter((cal: any) => cal != null)
      .sort((a: number, b: number) => a - b)
  ))

  const rombosUnicos = Array.from(new Set(
    configuraciones
      .map((c: any) => c.tamano_rombo)
      .filter((rom: any) => rom != null)
      .sort((a: number, b: number) => b - a)
  ))

  const columns = [
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
  ]

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
              {/* Filtros */}
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 grid gap-3 md:grid-cols-4 lg:grid-cols-7">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Altura Final</label>
                    <Select value={filtroAlturaFinal} onValueChange={setFiltroAlturaFinal}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todas</SelectItem>
                        {alturasUnicas.map((altura: any) => (
                          <SelectItem key={altura} value={altura.toString()}>
                            {altura}m
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tipo Poste</label>
                    <Select value={filtroTipoPoste} onValueChange={setFiltroTipoPoste}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="Olimp">Olimp</SelectItem>
                        <SelectItem value="Punta Diamante">Punta Diamante</SelectItem>
                        <SelectItem value="Eucalipto">Eucalipto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Cordón</label>
                    <Select value={filtroCordon} onValueChange={setFiltroCordon}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="10cm">10cm</SelectItem>
                        <SelectItem value="15cm">15cm</SelectItem>
                        <SelectItem value="20cm">20cm</SelectItem>
                        <SelectItem value="Sin cordón">Sin cordón</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Hilos Púa</label>
                    <Select value={filtroHilosPua} onValueChange={setFiltroHilosPua}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="0">0 hilos</SelectItem>
                        <SelectItem value="1">1 hilo</SelectItem>
                        <SelectItem value="2">2 hilos</SelectItem>
                        <SelectItem value="3">3 hilos</SelectItem>
                        <SelectItem value="4">4 hilos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Calibre</label>
                    <Select value={filtroCalibre} onValueChange={setFiltroCalibre}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        {calibresUnicos.map((calibre: any) => (
                          <SelectItem key={calibre} value={calibre.toString()}>
                            Cal. {calibre}
                          </SelectItem>
                        ))}
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
                        {rombosUnicos.map((rombo: any) => (
                          <SelectItem key={rombo} value={rombo.toString()}>
                            {rombo}"
                          </SelectItem>
                        ))}
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

