'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { Plus, Edit, Eye, Users, RefreshCw, Building2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { SortableHeader } from '@/components/ui/sortable-header'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export default function ClientesPage() {
  const [clientes, setClientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    cargarClientes()
  }, [])

  async function cargarClientes() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('v_clientes_con_stats')
        .select('*')
        .order('nombre_completo')

      if (error) {
        console.error('Error al cargar clientes:', error)
        toast({
          title: "Error al cargar clientes",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      setClientes(data || [])
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error inesperado",
        description: "No se pudieron cargar los clientes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const categoriaIcon = (categoria: string) => {
    switch (categoria) {
      case 'Empresa': return <Building2 className="h-3 w-3 mr-1" />
      case 'Particular': return <User className="h-3 w-3 mr-1" />
      default: return null
    }
  }

  const categoriaBadgeVariant = (categoria: string) => {
    switch (categoria) {
      case 'Empresa': return 'default'
      case 'Revendedor': return 'secondary'
      case 'Gobierno': return 'outline'
      default: return 'outline'
    }
  }

  const columns = [
    {
      accessorKey: 'numero_documento',
      header: ({ column }: any) => <SortableHeader column={column} title="Documento" />,
      cell: ({ row }: any) => (
        <div>
          <div className="font-mono font-semibold text-sm">
            {row.original.tipo_documento} {row.original.numero_documento}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'nombre_completo',
      header: ({ column }: any) => <SortableHeader column={column} title="Cliente" />,
      cell: ({ row }: any) => (
        <div>
          <div className="font-medium">{row.original.nombre_completo}</div>
          {row.original.razon_social && (
            <div className="text-xs text-muted-foreground">{row.original.razon_social}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }: any) => (
        <div className="text-sm text-muted-foreground">
          {row.original.email || '-'}
        </div>
      ),
    },
    {
      accessorKey: 'telefono',
      header: 'Teléfono',
      cell: ({ row }: any) => (
        <div className="text-sm">{row.original.telefono || '-'}</div>
      ),
    },
    {
      accessorKey: 'ciudad',
      header: 'Ciudad',
      cell: ({ row }: any) => (
        <div className="text-sm">
          {row.original.ciudad || '-'}
          {row.original.provincia && (
            <span className="text-muted-foreground">, {row.original.provincia}</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'categoria',
      header: 'Categoría',
      cell: ({ row }: any) => (
        <Badge variant={categoriaBadgeVariant(row.original.categoria)}>
          <span className="flex items-center">
            {categoriaIcon(row.original.categoria)}
            {row.original.categoria || 'Sin categoría'}
          </span>
        </Badge>
      ),
    },
    {
      accessorKey: 'total_presupuestos',
      header: 'Presup.',
      cell: ({ row }: any) => (
        <Badge variant="outline">{row.original.total_presupuestos || 0}</Badge>
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
                  <Link href={`/dashboard/clientes/${row.original.id}`}>
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ver cliente</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/dashboard/clientes/editar/${row.original.id}`}>
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Editar cliente</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
          <p className="text-muted-foreground mt-1">
            Gestión de clientes y datos fiscales
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={cargarClientes}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button asChild>
            <Link href="/dashboard/clientes/nuevo">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Cliente
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Clientes</CardDescription>
            <CardTitle className="text-3xl">{clientes.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Empresas</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {clientes.filter((c: any) => c.categoria === 'Empresa').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Particulares</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {clientes.filter((c: any) => c.categoria === 'Particular').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Con Presupuestos</CardDescription>
            <CardTitle className="text-3xl text-purple-600">
              {clientes.filter((c: any) => c.total_presupuestos > 0).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Clientes</CardTitle>
          <CardDescription>
            {clientes.length} clientes registrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={clientes}
            searchKey="nombre_completo"
            searchPlaceholder="Buscar por nombre o documento..."
          />
        </CardContent>
      </Card>
    </div>
  )
}

