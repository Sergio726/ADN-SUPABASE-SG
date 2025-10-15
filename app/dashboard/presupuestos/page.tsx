'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { Plus, Edit, Eye, FileText, RefreshCw, Download, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { SortableHeader } from '@/components/ui/sortable-header'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export default function PresupuestosPage() {
  const [presupuestos, setPresupuestos] = useState([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    cargarPresupuestos()
  }, [])

  async function cargarPresupuestos() {
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
  }

  const estadoBadgeVariant = (estado: string) => {
    switch (estado) {
      case 'aprobado': return 'default'
      case 'enviado': return 'secondary'
      case 'borrador': return 'outline'
      case 'rechazado': return 'destructive'
      case 'vencido': return 'destructive'
      default: return 'outline'
    }
  }

  const tipoBadgeVariant = (tipo: string) => {
    return tipo === 'cercado' ? 'default' : 'secondary'
  }

  const columns = [
    {
      accessorKey: 'numero',
      header: ({ column }: any) => <SortableHeader column={column} label="Número" />,
      cell: ({ row }: any) => (
        <div className="font-mono font-semibold">{row.original.numero}</div>
      ),
    },
    {
      accessorKey: 'tipo',
      header: 'Tipo',
      cell: ({ row }: any) => (
        <Badge variant={tipoBadgeVariant(row.original.tipo)}>
          {row.original.tipo === 'articulos' ? 'Artículos' : 'Cercado'}
        </Badge>
      ),
    },
    {
      accessorKey: 'cliente_nombre',
      header: ({ column }: any) => <SortableHeader column={column} label="Cliente" />,
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
      header: ({ column }: any) => <SortableHeader column={column} label="Fecha" />,
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
      header: ({ column }: any) => <SortableHeader column={column} label="Total" />,
      cell: ({ row }: any) => (
        <span className="font-bold text-green-600">
          ${row.original.total?.toLocaleString() || '0'}
        </span>
      ),
    },
    {
      accessorKey: 'estado_actual',
      header: 'Estado',
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
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/dashboard/presupuestos/editar/${row.original.id}`}>
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Editar presupuesto</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Descargar PDF</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Copy className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Duplicar</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      ),
    },
  ]

  const totalMonto = presupuestos.reduce((sum: number, p: any) => sum + (parseFloat(p.total) || 0), 0)
  const porEstado = {
    borrador: presupuestos.filter((p: any) => p.estado_actual === 'borrador').length,
    enviado: presupuestos.filter((p: any) => p.estado_actual === 'enviado').length,
    aprobado: presupuestos.filter((p: any) => p.estado_actual === 'aprobado').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Presupuestos</h1>
          <p className="text-muted-foreground mt-1">
            Gestión de presupuestos de artículos y cercado
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={cargarPresupuestos}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button asChild>
            <Link href="/dashboard/presupuestos/nuevo/tipo">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Presupuesto
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Presupuestos</CardDescription>
            <CardTitle className="text-3xl">{presupuestos.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Monto Total</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              ${totalMonto.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Aprobados</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {porEstado.aprobado}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Enviados</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {porEstado.enviado}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Presupuestos</CardTitle>
          <CardDescription>
            {presupuestos.length} presupuestos en total
          </CardDescription>
        </CardHeader>
        <CardContent>
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
          ) : (
            <DataTable
              columns={columns}
              data={presupuestos}
              searchKey="numero"
              searchPlaceholder="Buscar por número o cliente..."
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

