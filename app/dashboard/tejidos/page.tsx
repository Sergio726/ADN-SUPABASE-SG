'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { Plus, Edit, Eye, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { SortableHeader } from '@/components/ui/sortable-header'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export default function TejidosPage() {
  const [tejidos, setTejidos] = useState([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    cargarTejidos()
  }, [])

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
      header: ({ column }: any) => <SortableHeader column={column} label="Código" />,
      cell: ({ row }: any) => (
        <div className="font-mono font-semibold text-sm">{row.original.codigo}</div>
      ),
    },
    {
      accessorKey: 'calibre',
      header: ({ column }: any) => <SortableHeader column={column} label="Calibre" />,
      cell: ({ row }: any) => (
        <Badge variant="outline" className="font-mono">
          Cal. {row.original.calibre}
        </Badge>
      ),
    },
    {
      accessorKey: 'altura',
      header: ({ column }: any) => <SortableHeader column={column} label="Altura" />,
      cell: ({ row }: any) => (
        <span className="font-medium">{row.original.altura}m</span>
      ),
    },
    {
      accessorKey: 'tamano_rombo',
      header: ({ column }: any) => <SortableHeader column={column} label="Rombo" />,
      cell: ({ row }: any) => (
        <span className="font-medium">{row.original.tamano_rombo}"</span>
      ),
    },
    {
      accessorKey: 'peso_kg',
      header: ({ column }: any) => <SortableHeader column={column} label="Peso (kg)" />,
      cell: ({ row }: any) => (
        <span className="text-muted-foreground">{row.original.peso_kg} kg</span>
      ),
    },
    {
      accessorKey: 'mano_obra',
      header: ({ column }: any) => <SortableHeader column={column} label="M. Obra" />,
      cell: ({ row }: any) => (
        <span className="text-sm">${row.original.mano_obra?.toLocaleString()}</span>
      ),
    },
    {
      accessorKey: 'precio_costo',
      header: ({ column }: any) => <SortableHeader column={column} label="Costo" />,
      cell: ({ row }: any) => (
        <span className="font-semibold text-orange-600">
          ${row.original.precio_costo?.toLocaleString() || 'N/A'}
        </span>
      ),
    },
    {
      accessorKey: 'precio_venta',
      header: ({ column }: any) => <SortableHeader column={column} label="Venta" />,
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
          <CardTitle>Listado de Tejidos</CardTitle>
          <CardDescription>
            {tejidos.length} configuraciones en total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={tejidos}
            searchKey="codigo"
            searchPlaceholder="Buscar por código..."
          />
        </CardContent>
      </Card>
    </div>
  )
}

