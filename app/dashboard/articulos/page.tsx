"use client"

import { useEffect, useState, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { SortableHeader } from '@/components/ui/sortable-header'
import { ColumnDef } from '@tanstack/react-table'
import Link from 'next/link'
import { Package, Plus, Edit, ExternalLink, AlertTriangle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/hooks/use-toast'

type Articulo = {
  id: string
  nombre: string
  descripcion: string | null
  categoria: string | null
  stock_actual: number
  stock_minimo: number
  unidad: string
  publicado: boolean
  mostrar_precio_publico: boolean
  proveedores: { nombre: string } | null
  precios_venta: Array<{ precio_venta: number; vigente: boolean }>
}

export default function ArticulosPage() {
  const [articulos, setArticulos] = useState<Articulo[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 })
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function getArticulos() {
      const { data, error } = await supabase
        .from('articulos')
        .select(`
          *,
          proveedores(nombre),
          precios_venta(precio_venta, vigente)
        `)
        .order('nombre')

      if (error) {
        console.error('Error al cargar artículos:', error)
        setArticulos([])
      } else {
        setArticulos(data || [])
      }
      setLoading(false)
    }

    getArticulos()
  }, [supabase])

  const actualizarPublicado = async (id: string, publicado: boolean) => {
    const { error } = await supabase
      .from('articulos')
      .update({ publicado })
      .eq('id', id)

    if (error) {
      console.error('Error al actualizar publicación:', error)
      toast({
        title: "Error",
        description: "No se pudo actualizar la publicación del artículo",
        variant: "destructive",
      })
    } else {
      // Actualizar el estado local
      setArticulos(prev => prev.map(articulo => 
        articulo.id === id ? { ...articulo, publicado } : articulo
      ))
      toast({
        title: "Éxito",
        description: publicado ? "Artículo publicado en web" : "Artículo removido de la web",
      })
    }
  }

  const actualizarMostrarPrecio = async (id: string, mostrar_precio_publico: boolean) => {
    const { error } = await supabase
      .from('articulos')
      .update({ mostrar_precio_publico })
      .eq('id', id)

    if (error) {
      console.error('Error al actualizar mostrar precio:', error)
      toast({
        title: "Error",
        description: "No se pudo actualizar la visibilidad del precio",
        variant: "destructive",
      })
    } else {
      // Actualizar el estado local
      setArticulos(prev => prev.map(articulo => 
        articulo.id === id ? { ...articulo, mostrar_precio_publico } : articulo
      ))
      toast({
        title: "Éxito",
        description: mostrar_precio_publico ? "Precio visible en web" : "Precio oculto en web",
      })
    }
  }

  const columns: ColumnDef<Articulo>[] = [
    {
      accessorKey: "nombre",
      header: ({ column }) => <SortableHeader column={column} title="Artículo" />,
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.nombre}</div>
          {row.original.descripcion && (
            <div className="text-sm text-muted-foreground">{row.original.descripcion}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "categoria",
      header: ({ column }) => <SortableHeader column={column} title="Categoría" />,
      cell: ({ row }) => (
        <Badge variant="secondary">
          {row.original.categoria || 'Sin categoría'}
        </Badge>
      ),
    },
    {
      accessorKey: "proveedores.nombre",
      header: "Proveedor",
      cell: ({ row }) => row.original.proveedores?.nombre || 'Sin proveedor',
    },
    {
      accessorKey: "stock_actual",
      header: ({ column }) => <SortableHeader column={column} title="Stock" />,
      cell: ({ row }) => {
        const stockBajo = row.original.stock_actual <= row.original.stock_minimo
        return (
          <div className="flex items-center gap-2">
            <span className={stockBajo ? 'text-destructive font-medium' : ''}>
              {row.original.stock_actual} {row.original.unidad}
            </span>
            {stockBajo && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                Bajo
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      id: "precio",
      header: "Precio",
      cell: ({ row }) => {
        const precioVigente = row.original.precios_venta?.find((p) => p.vigente)
        return precioVigente ? (
          <span className="font-medium">${precioVigente.precio_venta.toLocaleString('es-AR')}</span>
        ) : (
          <span className="text-muted-foreground">Sin precio</span>
        )
      },
    },
    {
      id: "publicado",
      header: "Publicar en Web",
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Switch
            checked={row.original.publicado}
            onCheckedChange={(checked) => actualizarPublicado(row.original.id, checked)}
          />
        </div>
      ),
    },
    {
      id: "mostrar_precio_publico",
      header: "Mostrar Precio al Público",
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Switch
            checked={row.original.mostrar_precio_publico}
            onCheckedChange={(checked) => actualizarMostrarPrecio(row.original.id, checked)}
            disabled={!row.original.publicado}
          />
        </div>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Acciones</div>,
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/dashboard/articulos/editar/${row.original.id}`}>
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Editar artículo</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/articulos/${row.original.id}`} target="_blank">
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ver en web pública</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      ),
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Artículos</h2>
          <p className="text-muted-foreground mt-2">
            Gestiona el catálogo completo de productos
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/articulos/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Artículo
          </Link>
        </Button>
      </div>

      {articulos.length > 0 ? (
        <Card>
          <CardContent className="pt-6">
            <DataTable 
              columns={columns} 
              data={articulos}
              searchKey="nombre"
              searchPlaceholder="Buscar artículos..."
              pageSize={20}
              initialPagination={pagination}
              onPaginationChange={setPagination}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <CardTitle className="mb-2">No hay artículos todavía</CardTitle>
            <CardDescription className="mb-6 text-center">
              Comienza agregando tu primer artículo al catálogo
            </CardDescription>
            <Button asChild>
              <Link href="/dashboard/articulos/nuevo">
                <Plus className="mr-2 h-4 w-4" />
                Crear primer artículo
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
