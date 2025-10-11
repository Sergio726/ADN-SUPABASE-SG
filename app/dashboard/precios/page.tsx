import { supabase } from '@/lib/supabaseClient'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
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
import { DollarSign, Edit, ExternalLink, CheckCircle, XCircle } from 'lucide-react'

async function getTodosLosPrecios() {
  const { data, error } = await supabase
    .from('precios_venta')
    .select(`
      *,
      articulos(id, nombre, categoria)
    `)

  if (error) {
    console.error('Error:', error)
    return []
  }

  return data?.sort((a: any, b: any) => {
    if (a.vigente === b.vigente) {
      return (a.articulos?.nombre || '').localeCompare(b.articulos?.nombre || '')
    }
    return a.vigente ? -1 : 1
  }) || []
}

export default async function PreciosPage() {
  const precios = await getTodosLosPrecios()
  const preciosVigentes = precios.filter((p: any) => p.vigente)
  const preciosNoVigentes = precios.filter((p: any) => !p.vigente)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Gestión de Precios</h2>
        <p className="text-muted-foreground mt-2">
          Total: {precios.length} precios ({preciosVigentes.length} vigentes, {preciosNoVigentes.length} no vigentes)
        </p>
      </div>

      {precios.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Artículo</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Costo</TableHead>
                  <TableHead className="text-right">Venta</TableHead>
                  <TableHead className="text-right">Margen</TableHead>
                  <TableHead className="text-center">Vigencia</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {precios.map((precio: any) => (
                  <TableRow key={precio.id}>
                    <TableCell className="font-medium">
                      {precio.articulos?.nombre}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {precio.articulos?.categoria || 'Sin categoría'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(precio.precio_costo)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(precio.precio_venta)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span 
                        className={`font-medium ${
                          precio.margen >= 30 
                            ? 'text-green-600' 
                            : precio.margen >= 15 
                            ? 'text-yellow-600' 
                            : 'text-red-600'
                        }`}
                      >
                        {precio.margen.toFixed(2)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        {precio.vigente ? (
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
                        {precio.fecha_fin && (
                          <span className="text-xs text-muted-foreground">
                            Vence: {new Date(precio.fecha_fin).toLocaleDateString('es-AR')}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/precios/editar/${precio.id}`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/articulos/editar/${precio.articulos?.id}`}>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
            <Button asChild>
              <Link href="/dashboard/articulos">
                Ir a Artículos
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
