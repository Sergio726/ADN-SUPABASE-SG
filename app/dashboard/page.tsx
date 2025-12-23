import { createServerClient } from '@/lib/supabaseServer'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Package, Building2, Mail, AlertTriangle, Plus, ArrowRight, Calculator, Ruler } from 'lucide-react'
import { EntregasPendientesExpandido } from '@/components/EntregasPendientesExpandido'

// Forzar renderizado dinámico porque usa cookies
export const dynamic = 'force-dynamic'

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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Bienvenido al Panel de Control
          </h2>
          <p className="text-muted-foreground mt-2">
            Resumen general del sistema
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/dashboard/presupuestos/nuevo/articulos"
            className="group flex items-center gap-3 rounded-xl border border-red-300 bg-gradient-to-br from-red-500 via-red-400 to-red-600 px-5 py-4 text-white shadow-md transition hover:shadow-lg w-full sm:w-auto"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
              <Calculator className="h-6 w-6 text-white" />
            </span>
            <div className="leading-tight">
              <div className="text-sm uppercase tracking-wide text-white/80">
                Cotizar
              </div>
              <div className="text-lg font-semibold">
                Artículos
              </div>
            </div>
          </Link>
          <Link
            href="/dashboard/presupuestos/nuevo/cercado"
            className="group flex items-center gap-3 rounded-xl border border-red-200 bg-gradient-to-br from-red-200 via-red-100 to-pink-200 px-5 py-4 text-red-900 shadow-md transition hover:shadow-lg w-full sm:w-auto"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-900/10">
              <Ruler className="h-6 w-6 text-red-900" />
            </span>
            <div className="leading-tight">
              <div className="text-sm uppercase tracking-wide text-red-900/70">
                Cotizar
              </div>
              <div className="text-lg font-semibold">
                Cercos
              </div>
            </div>
          </Link>
        </div>
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

      {/* Entregas Pendientes Expandido */}
      <EntregasPendientesExpandido />

      {/* Quick Actions removed */}
    </div>
  )
}

