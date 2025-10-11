import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Link from 'next/link'
import { Package, Plus, Edit, ExternalLink, AlertTriangle } from 'lucide-react'

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
    return []
  }

  return data || []
}

export default async function ArticulosPage() {
  const articulos = await getArticulos()

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
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Artículo</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articulos.map((articulo: any) => {
                  const precioVigente = articulo.precios_venta?.find((p: any) => p.vigente)
                  const stockBajo = articulo.stock_actual <= articulo.stock_minimo
                  
                  return (
                    <TableRow key={articulo.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{articulo.nombre}</div>
                          {articulo.descripcion && (
                            <div className="text-sm text-muted-foreground">{articulo.descripcion}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {articulo.categoria || 'Sin categoría'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {articulo.proveedores?.nombre || 'Sin proveedor'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={stockBajo ? 'text-destructive font-medium' : ''}>
                            {articulo.stock_actual} {articulo.unidad}
                          </span>
                          {stockBajo && (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Bajo
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {precioVigente ? (
                          <span className="font-medium">${precioVigente.precio_venta.toLocaleString('es-AR')}</span>
                        ) : (
                          <span className="text-muted-foreground">Sin precio</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/articulos/editar/${articulo.id}`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/articulos/${articulo.id}`} target="_blank">
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
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

