'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { Plus, Edit, Eye, CheckCircle, XCircle, RefreshCw, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { SortableHeader } from '@/components/ui/sortable-header'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function TejidosPage() {
  const [tejidos, setTejidos] = useState<any[]>([])
  const [tejidosFiltrados, setTejidosFiltrados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  
  // Estados de filtros
  const [filtroCalibre, setFiltroCalibre] = useState('todos')
  const [filtroAltura, setFiltroAltura] = useState('todos')
  const [filtroRombo, setFiltroRombo] = useState('todos')

  useEffect(() => {
    cargarTejidos()
  }, [])

  useEffect(() => {
    aplicarFiltros()
  }, [tejidos, filtroCalibre, filtroAltura, filtroRombo])

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

    setTejidosFiltrados(resultado)
  }

  function limpiarFiltros() {
    setFiltroCalibre('todos')
    setFiltroAltura('todos')
    setFiltroRombo('todos')
  }

  async function cargarTejidos() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('v_tejidos_con_precios')
        .select('*')
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

      setTejidos(data || [])
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

  async function toggleActivo(id: string, activo: boolean) {
    try {
      const { error } = await supabase
        .from('tejidos_configuraciones')
        .update({ activo: !activo })
        .eq('id', id)

      if (error) throw error

      toast({
        title: "¡Actualizado!",
        description: `Tejido ${!activo ? 'activado' : 'desactivado'} correctamente`,
      })

      cargarTejidos()
    } catch (error: any) {
      console.error('Error:', error)
      toast({
        title: "Error al actualizar",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const columns = [
    {
      accessorKey: 'codigo',
      header: ({ column }: any) => <SortableHeader column={column} title="Código" />,
      cell: ({ row }: any) => (
        <div className="font-mono font-semibold text-sm">{row.original.codigo}</div>
      ),
    },
    {
      accessorKey: 'calibre',
      header: ({ column }: any) => <SortableHeader column={column} title="Calibre" />,
      cell: ({ row }: any) => (
        <Badge variant="outline" className="font-mono">
          Cal. {row.original.calibre}
        </Badge>
      ),
    },
    {
      accessorKey: 'altura',
      header: ({ column }: any) => <SortableHeader column={column} title="Altura" />,
      cell: ({ row }: any) => (
        <span className="font-medium">{row.original.altura}m</span>
      ),
    },
    {
      accessorKey: 'tamano_rombo',
      header: ({ column }: any) => <SortableHeader column={column} title="Rombo" />,
      cell: ({ row }: any) => (
        <span className="font-medium">{row.original.tamano_rombo}"</span>
      ),
    },
    {
      accessorKey: 'peso_kg',
      header: ({ column }: any) => <SortableHeader column={column} title="Peso" />,
      cell: ({ row }: any) => (
        <span className="text-muted-foreground">{row.original.peso_kg} kg</span>
      ),
    },
    {
      accessorKey: 'mano_obra',
      header: ({ column }: any) => <SortableHeader column={column} title="M. Obra" />,
      cell: ({ row }: any) => (
        <span className="text-sm">${row.original.mano_obra?.toLocaleString()}</span>
      ),
    },
    {
      accessorKey: 'precio_costo',
      header: ({ column }: any) => <SortableHeader column={column} title="Costo" />,
      cell: ({ row }: any) => (
        <span className="font-semibold text-orange-600">
          ${row.original.precio_costo?.toLocaleString() || 'N/A'}
        </span>
      ),
    },
    {
      accessorKey: 'precio_venta',
      header: ({ column }: any) => <SortableHeader column={column} title="Venta" />,
      cell: ({ row }: any) => (
        <span className="font-bold text-green-600">
          ${row.original.precio_venta?.toLocaleString() || 'N/A'}
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
        return <Badge variant={variant}>{calidad}</Badge>
      },
    },
    {
      accessorKey: 'activo',
      header: 'Estado',
      cell: ({ row }: any) => (
        <Badge variant={row.original.activo ? 'default' : 'outline'}>
          {row.original.activo ? (
            <><CheckCircle className="h-3 w-3 mr-1" /> Activo</>
          ) : (
            <><XCircle className="h-3 w-3 mr-1" /> Inactivo</>
          )}
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
                  <Link href={`/dashboard/tejidos/${row.original.id}`}>
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
                  <Link href={`/dashboard/tejidos/editar/${row.original.id}`}>
                    <Edit className="h-4 w-4" />
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
                  onClick={() => toggleActivo(row.original.id, row.original.activo)}
                >
                  {row.original.activo ? (
                    <XCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{row.original.activo ? 'Desactivar' : 'Activar'}</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Tejidos Romboidales</h1>
          <p className="text-muted-foreground mt-1">
            Gestión de configuraciones de tejidos fabricados
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={cargarTejidos}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button asChild>
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
            {(filtroCalibre !== 'todos' || filtroAltura !== 'todos' || filtroRombo !== 'todos') && (
              <Button variant="outline" size="sm" onClick={limpiarFiltros}>
                Limpiar Filtros
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1 grid gap-3 md:grid-cols-3">
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
            </div>
          </div>

          {/* Tabla */}
          <DataTable
            columns={columns}
            data={tejidosFiltrados}
            searchKey="codigo"
            searchPlaceholder="Buscar por código..."
          />
        </CardContent>
      </Card>
    </div>
  )
}

