import { createServerClient } from '@/lib/supabaseServer'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Package, Building2, Mail, AlertTriangle, Plus, DollarSign, TrendingUp, ArrowRight } from 'lucide-react'

async function getStats() {
  const supabase = createServerClient()
  const [
    { count: totalArticulos },
    { count: totalProveedores },
    { count: totalLeads },
    { data: todosArticulos },
  ] = await Promise.all([
    supabase.from('articulos').select('*', { count: 'exact', head: true }),
    supabase.from('proveedores').select('*', { count: 'exact', head: true }),
    supabase.from('leads').select('*', { count: 'exact', head: true }),
    supabase
      .from('articulos')
      .select('id, nombre, stock_actual, stock_minimo'),
  ])

  // Filtrar artículos con stock bajo (stock_actual <= stock_minimo)
  const articulosBajoStock = todosArticulos
    ?.filter(art => art.stock_actual <= art.stock_minimo)
    .slice(0, 5) || []

  return {
    totalArticulos: totalArticulos || 0,
    totalProveedores: totalProveedores || 0,
    totalLeads: totalLeads || 0,
    articulosBajoStock,
  }
}

export default async function DashboardPage() {
  const stats = await getStats()

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Bienvenido al Panel de Control
        </h2>
        <p className="text-muted-foreground mt-2">
          Resumen general del sistema
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Artículos
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalArticulos}</div>
            <Button variant="link" asChild className="px-0 mt-2">
              <Link href="/dashboard/articulos" className="flex items-center text-xs text-muted-foreground hover:text-primary">
                Ver todos <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Proveedores
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProveedores}</div>
            <Button variant="link" asChild className="px-0 mt-2">
              <Link href="/dashboard/proveedores" className="flex items-center text-xs text-muted-foreground hover:text-primary">
                Ver todos <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Leads
            </CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLeads}</div>
            <Button variant="link" asChild className="px-0 mt-2">
              <Link href="/dashboard/leads" className="flex items-center text-xs text-muted-foreground hover:text-primary">
                Ver todos <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-destructive/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Stock Bajo
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.articulosBajoStock.length}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Artículos por debajo del stock mínimo
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Alerts */}
      {stats.articulosBajoStock.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <CardTitle>Alertas de Stock</CardTitle>
            </div>
            <CardDescription>
              Artículos que requieren atención inmediata
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.articulosBajoStock.map((articulo) => (
                <div
                  key={articulo.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-destructive/5 border-destructive/20"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{articulo.nombre}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="destructive" className="text-xs">
                        Stock: {articulo.stock_actual}
                      </Badge>
                      <span>•</span>
                      <span>Mínimo requerido: {articulo.stock_minimo}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/articulos/editar/${articulo.id}`}>
                      Editar
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>
            Operaciones frecuentes del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 p-6 hover:bg-primary/5 hover:border-primary"
              asChild
            >
              <Link href="/dashboard/articulos/nuevo">
                <Plus className="h-8 w-8" />
                <span className="font-medium">Nuevo Artículo</span>
              </Link>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col gap-2 p-6 hover:bg-primary/5 hover:border-primary"
              asChild
            >
              <Link href="/dashboard/proveedores">
                <Building2 className="h-8 w-8" />
                <span className="font-medium">Gestionar Proveedores</span>
              </Link>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col gap-2 p-6 hover:bg-primary/5 hover:border-primary"
              asChild
            >
              <Link href="/dashboard/precios">
                <DollarSign className="h-8 w-8" />
                <span className="font-medium">Actualizar Precios</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

