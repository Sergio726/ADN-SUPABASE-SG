"use client"

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { SortableHeader } from '@/components/ui/sortable-header'
import { ColumnDef } from '@tanstack/react-table'
import Link from 'next/link'
import { DollarSign, Edit, ExternalLink, CheckCircle, XCircle, PlusCircle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

type Precio = {
  id: string
  precio_costo: number
  precio_venta: number
  margen: number
  vigente: boolean
  fecha_fin: string | null
  articulos: {
    id: string
    nombre: string
    categoria: string | null
  } | null
}

export default function PreciosPage() {
  const [precios, setPrecio] = useState<Precio[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
async function getTodosLosPrecios() {
  const { data, error } = await supabase
    .from('precios_venta')
    .select(`
      *,
      articulos(id, nombre, categoria)
    `)

  if (error) {
    console.error('Error:', error)
        setPrecio([])
      } else {
        const sorted = data?.sort((a: any, b: any) => {
    if (a.vigente === b.vigente) {
      return (a.articulos?.nombre || '').localeCompare(b.articulos?.nombre || '')
    }
    return a.vigente ? -1 : 1
  }) || []
        setPrecio(sorted)
      }
      setLoading(false)
    }

    getTodosLosPrecios()
  }, [supabase])

  const columns: ColumnDef<Precio>[] = [
    {
      id: "articulo",
      accessorFn: (row) => row.articulos?.nombre,
      header: ({ column }) => <SortableHeader column={column} title="Artículo" />,
      cell: ({ row }) => (
        <div className="font-medium">{row.original.articulos?.nombre}</div>
      ),
    },
    {
      accessorKey: "articulos.categoria",
      header: ({ column }) => <SortableHeader column={column} title="Categoría" />,
      cell: ({ row }) => (
        <Badge variant="secondary">
          {row.original.articulos?.categoria || 'Sin categoría'}
        </Badge>
      ),
    },
    {
      accessorKey: "precio_costo",
      header: ({ column }) => (
        <div className="text-right">
          <SortableHeader column={column} title="Costo" />
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-right">{formatCurrency(row.original.precio_costo)}</div>
      ),
    },
    {
      accessorKey: "precio_venta",
      header: ({ column }) => (
        <div className="text-right">
          <SortableHeader column={column} title="Venta" />
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-right font-medium">{formatCurrency(row.original.precio_venta)}</div>
      ),
    },
    {
      accessorKey: "margen",
      header: ({ column }) => (
        <div className="text-right">
          <SortableHeader column={column} title="Margen" />
        </div>
      ),
      cell: ({ row }) => {
        const margen = row.original.margen
        return (
          <div className="text-right">
            <span 
              className={`font-medium ${
                margen >= 30 
                  ? 'text-green-600' 
                  : margen >= 15 
                  ? 'text-yellow-600' 
                  : 'text-red-600'
              }`}
            >
              {margen.toFixed(2)}%
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: "vigente",
      header: ({ column }) => (
        <div className="text-center">
          <SortableHeader column={column} title="Vigencia" />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex flex-col items-center gap-1">
          {row.original.vigente ? (
            <Badge variant="default" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              Vigente
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <XCircle className="h-3 w-3" />
              No vigente
            </Badge>
          )}
          {row.original.fecha_fin && (
            <span className="text-xs text-muted-foreground">
              Vence: {new Date(row.original.fecha_fin).toLocaleDateString('es-AR')}
            </span>
          )}
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
                  <Link href={`/dashboard/precios/editar/${row.original.id}`}>
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Editar precio</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/dashboard/articulos/editar/${row.original.articulos?.id}`}>
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Editar artículo</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      ),
    },
  ]

  const preciosVigentes = precios.filter((p) => p.vigente).length
  const preciosNoVigentes = precios.filter((p) => !p.vigente).length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestión de Precios</h2>
          <p className="text-muted-foreground mt-2">
            Total: {precios.length} precios ({preciosVigentes} vigentes, {preciosNoVigentes} no vigentes)
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/precios/nuevo">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nuevo precio
          </Link>
        </Button>
      </div>

      {precios.length > 0 ? (
        <Card>
          <CardContent className="pt-6">
            <DataTable 
              columns={columns} 
              data={precios}
              searchKey="articulo"
              searchPlaceholder="Buscar por artículo..."
              pageSize={20}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DollarSign className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">
            No hay precios configurados
          </h3>
            <p className="text-muted-foreground mb-6 text-center">
            Agrega precios a tus artículos desde la gestión de artículos
          </p>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/dashboard/articulos">
                  Ir a Artículos
                </Link>
              </Button>
              <Button asChild>
                <Link href="/dashboard/precios/nuevo">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Crear precio
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
