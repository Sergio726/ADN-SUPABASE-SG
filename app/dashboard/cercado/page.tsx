'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { Plus, Edit, Eye, RefreshCw, Calculator } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { SortableHeader } from '@/components/ui/sortable-header'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export default function ConfiguracionesCercadoPage() {
  const [configuraciones, setConfiguraciones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    cargarConfiguraciones()
  }, [])

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

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Configuraciones</CardDescription>
            <CardTitle className="text-3xl">{configuraciones.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Activas</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {configuraciones.filter((c: any) => c.activo).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Altura 2m</CardDescription>
            <CardTitle className="text-3xl">
              {configuraciones.filter((c: any) => 
                (c.altura_final_cerco && c.altura_final_cerco === 2) || 
                (!c.altura_final_cerco && c.altura === 2)
              ).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Con Cordón</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {configuraciones.filter((c: any) => c.cordon_tipo !== 'Sin cordón').length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Configuraciones</CardTitle>
          <CardDescription>
            Configuraciones base para presupuestos de cercado (180 metros lineales)
          </CardDescription>
        </CardHeader>
        <CardContent>
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
            <DataTable
              columns={columns}
              data={configuraciones}
              searchKey="nombre"
              searchPlaceholder="Buscar configuración..."
            />
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

