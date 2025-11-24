"use client"

import { useEffect, useState, useMemo, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { SortableHeader } from '@/components/ui/sortable-header'
import { ColumnDef } from '@tanstack/react-table'
import Link from 'next/link'
import { Package, Plus, Edit, ExternalLink, AlertTriangle, Download, FileDown, FileSpreadsheet } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Switch } from '@/components/ui/switch'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { generarPDFListaStock } from '@/lib/pdf-generator'
import { exportarStockAExcel } from '@/lib/excel-generator'

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
  const { toast } = useToast()

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

  // Función genérica para actualizar campos del artículo (reduce redundancia)
  const actualizarCampoArticulo = useCallback(async (
    id: string, 
    campo: 'publicado' | 'mostrar_precio_publico',
    valor: boolean,
    mensajes: { error: string; exitoSiTrue: string; exitoSiFalse: string }
  ) => {
    const { error } = await supabase
      .from('articulos')
      .update({ [campo]: valor })
      .eq('id', id)

    if (error) {
      console.error(`Error al actualizar ${campo}:`, error)
      toast({
        title: "Error",
        description: mensajes.error,
        variant: "destructive",
      })
      return false
    }

    // Actualizar el estado local
    setArticulos(prev => prev.map(articulo => 
      articulo.id === id ? { ...articulo, [campo]: valor } : articulo
    ))
    
    toast({
      title: "Éxito",
      description: valor ? mensajes.exitoSiTrue : mensajes.exitoSiFalse,
    })
    return true
  }, [supabase, toast])

  const actualizarPublicado = useCallback(async (id: string, publicado: boolean) => {
    await actualizarCampoArticulo(id, 'publicado', publicado, {
      error: "No se pudo actualizar la publicación del artículo",
      exitoSiTrue: "Artículo publicado en web",
      exitoSiFalse: "Artículo removido de la web"
    })
  }, [actualizarCampoArticulo])

  const actualizarMostrarPrecio = useCallback(async (id: string, mostrar_precio_publico: boolean) => {
    await actualizarCampoArticulo(id, 'mostrar_precio_publico', mostrar_precio_publico, {
      error: "No se pudo actualizar la visibilidad del precio",
      exitoSiTrue: "Precio visible en web",
      exitoSiFalse: "Precio oculto en web"
    })
  }, [actualizarCampoArticulo])

  // Función helper para determinar si el stock está bajo (evita repetición) - debe estar antes de usarse
  const esStockBajo = useCallback((stockActual: number, stockMinimo: number) => {
    return stockActual <= stockMinimo
  }, [])

  // Función helper para preparar datos de exportación (reduce redundancia)
  const prepararDatosExportacion = useCallback((articulosParaExportar: Articulo[]) => {
    return articulosParaExportar.map(({ nombre, categoria, stock_actual, stock_minimo, unidad }) => ({
      nombre,
      categoria,
      stock_actual,
      stock_minimo,
      unidad,
    }))
  }, [])

  // Función para exportar control de stock a PDF (memoizada)
  const exportarStockAPDF = useCallback((soloStockBajo: boolean = false) => {
    try {
      const articulosFiltrados = soloStockBajo
        ? articulos.filter(a => esStockBajo(a.stock_actual, a.stock_minimo))
        : articulos

      if (articulosFiltrados.length === 0) {
        toast({
          title: 'Sin datos para exportar',
          description: soloStockBajo 
            ? 'No hay artículos con stock bajo para exportar.' 
            : 'No hay artículos para exportar.',
          variant: 'destructive',
        })
        return
      }

      const datosParaExportar = prepararDatosExportacion(articulosFiltrados)
      const nombreArchivo = soloStockBajo ? 'Control_Stock_Bajo' : 'Control_Stock'
      
      generarPDFListaStock(datosParaExportar, nombreArchivo)
      
      toast({
        title: 'PDF exportado',
        description: `Se generó el control de stock con ${datosParaExportar.length} artículos.`,
      })
    } catch (error) {
      console.error('Error al exportar stock a PDF:', error)
      toast({
        title: 'Error al exportar',
        description: 'No se pudo generar el PDF de control de stock. Intenta nuevamente.',
        variant: 'destructive',
      })
    }
  }, [articulos, toast, prepararDatosExportacion, esStockBajo])

  // Función para exportar control de stock a Excel (memoizada)
  const exportarStockAExcelFunc = useCallback((soloStockBajo: boolean = false) => {
    try {
      const articulosFiltrados = soloStockBajo
        ? articulos.filter(a => esStockBajo(a.stock_actual, a.stock_minimo))
        : articulos

      if (articulosFiltrados.length === 0) {
        toast({
          title: 'Sin datos para exportar',
          description: soloStockBajo 
            ? 'No hay artículos con stock bajo para exportar.' 
            : 'No hay artículos para exportar.',
          variant: 'destructive',
        })
        return
      }

      const datosParaExportar = prepararDatosExportacion(articulosFiltrados)
      const nombreArchivo = soloStockBajo ? 'Control_Stock_Bajo' : 'Control_Stock'
      
      exportarStockAExcel(datosParaExportar, nombreArchivo)
      
      toast({
        title: 'Excel exportado',
        description: `Se exportaron ${datosParaExportar.length} artículos correctamente.`,
      })
    } catch (error) {
      console.error('Error al exportar stock a Excel:', error)
      toast({
        title: 'Error al exportar',
        description: 'No se pudo exportar el control de stock. Intenta nuevamente.',
        variant: 'destructive',
      })
    }
  }, [articulos, toast, prepararDatosExportacion, esStockBajo])

  // Memoizar columnas para evitar recreaciones en cada render
  const columns: ColumnDef<Articulo>[] = useMemo(() => [
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
        const stockBajo = esStockBajo(row.original.stock_actual, row.original.stock_minimo)
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
          <Link href={`/dashboard/precios/nuevo?articulo=${row.original.id}`} className="text-primary hover:underline">
            Agregar precio
          </Link>
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
        <TooltipProvider>
          <div className="flex justify-end gap-2">
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
          </div>
        </TooltipProvider>
      ),
    },
  ], [actualizarPublicado, actualizarMostrarPrecio, esStockBajo])

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
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Exportar Stock
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                Exportar a Excel
              </div>
              <DropdownMenuItem onClick={(e) => { e.preventDefault(); exportarStockAExcelFunc(false); }}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Todos los artículos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.preventDefault(); exportarStockAExcelFunc(true); }}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Solo stock bajo
              </DropdownMenuItem>
              <div className="my-1 h-px bg-border" />
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                Exportar a PDF
              </div>
              <DropdownMenuItem onClick={(e) => { e.preventDefault(); exportarStockAPDF(false); }}>
                <FileDown className="mr-2 h-4 w-4" />
                Todos los artículos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.preventDefault(); exportarStockAPDF(true); }}>
                <FileDown className="mr-2 h-4 w-4" />
                Solo stock bajo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button asChild>
            <Link href="/dashboard/articulos/nuevo">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Artículo
            </Link>
          </Button>
        </div>
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
