'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { RefreshCw, Globe, Monitor, Smartphone, Tablet, Calendar, BarChart3 } from 'lucide-react'
import { DataTable } from '@/components/ui/data-table'
import { SortableHeader } from '@/components/ui/sortable-header'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { exportarACSV } from '@/lib/export-utils'

interface Estadisticas {
  total_visitas: number
  visitas_unicas: number
  paginas_visitadas: number
  promedio_duracion: number
  visitas_moviles: number
  visitas_desktop: number
}

interface VisitaPorDia {
  fecha: string
  total_visitas: number
  visitas_unicas: number
}

interface PaginaMasVisitada {
  pathname: string
  total_visitas: number
  visitas_unicas: number
  promedio_duracion: number
}

interface DispositivoNavegador {
  tipo: string
  nombre: string
  cantidad: number
  porcentaje: number
}

export default function VisitasPage() {
  const [loading, setLoading] = useState(true)
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null)
  const [visitasPorDia, setVisitasPorDia] = useState<VisitaPorDia[]>([])
  const [paginasMasVisitadas, setPaginasMasVisitadas] = useState<PaginaMasVisitada[]>([])
  const [dispositivosNavegadores, setDispositivosNavegadores] = useState<DispositivoNavegador[]>([])
  const [rangoDias, setRangoDias] = useState('30')
  const { toast } = useToast()

  useEffect(() => {
    cargarDatos()
  }, [rangoDias])

  async function cargarDatos() {
    try {
      setLoading(true)
      const fechaHasta = new Date()
      const fechaDesde = new Date()
      fechaDesde.setDate(fechaDesde.getDate() - parseInt(rangoDias))

      // Cargar estadísticas generales
      const { data: stats, error: statsError } = await supabase
        .rpc('obtener_estadisticas_visitas', {
          fecha_desde: fechaDesde.toISOString(),
          fecha_hasta: fechaHasta.toISOString(),
        })

      if (statsError) throw statsError
      setEstadisticas(stats?.[0] || null)

      // Cargar visitas por día
      const { data: porDia, error: porDiaError } = await supabase
        .rpc('obtener_visitas_por_dia', {
          fecha_desde: fechaDesde.toISOString(),
          fecha_hasta: fechaHasta.toISOString(),
        })

      if (porDiaError) throw porDiaError
      setVisitasPorDia(porDia || [])

      // Cargar páginas más visitadas
      const { data: paginas, error: paginasError } = await supabase
        .rpc('obtener_paginas_mas_visitadas', {
          fecha_desde: fechaDesde.toISOString(),
          fecha_hasta: fechaHasta.toISOString(),
          limite: 10,
        })

      if (paginasError) throw paginasError
      setPaginasMasVisitadas(paginas || [])

      // Cargar dispositivos y navegadores
      const { data: dispositivos, error: dispositivosError } = await supabase
        .rpc('obtener_dispositivos_navegadores', {
          fecha_desde: fechaDesde.toISOString(),
          fecha_hasta: fechaHasta.toISOString(),
        })

      if (dispositivosError) throw dispositivosError
      setDispositivosNavegadores(dispositivos || [])

    } catch (error: any) {
      console.error('Error al cargar datos:', error)
      toast({
        title: "Error al cargar estadísticas",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  function formatearDuracion(segundos: number): string {
    if (segundos < 60) return `${Math.round(segundos)}s`
    const minutos = Math.floor(segundos / 60)
    const segs = Math.round(segundos % 60)
    return `${minutos}m ${segs}s`
  }

  function formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  function exportarAExcel() {
    try {
      if (paginasMasVisitadas.length === 0) {
        toast({
          title: 'Sin datos para exportar',
          description: 'No hay visitas registradas en el período seleccionado',
          variant: 'destructive',
        })
        return
      }

      const datos = paginasMasVisitadas.map((pagina, idx) => ({
        '#': idx + 1,
        'Página': pagina.pathname,
        'Total Visitas': pagina.total_visitas,
        'Visitas Únicas': pagina.visitas_unicas,
        'Duración Promedio': formatearDuracion(pagina.promedio_duracion),
      }))

      exportarACSV(
        datos,
        [
          { key: '#', label: '#' },
          { key: 'Página', label: 'Página' },
          { key: 'Total Visitas', label: 'Total Visitas' },
          { key: 'Visitas Únicas', label: 'Visitas Únicas' },
          { key: 'Duración Promedio', label: 'Duración Promedio' },
        ],
        `Visitas_Web_${new Date().toISOString().split('T')[0]}`
      )

      toast({
        title: 'Exportado exitosamente',
        description: 'Los datos se han exportado a CSV',
      })
    } catch (error: any) {
      console.error('Error al exportar:', error)
      toast({
        title: 'Error al exportar',
        description: error.message || 'No se pudo exportar los datos',
        variant: 'destructive',
      })
    }
  }

  const dispositivos = dispositivosNavegadores.filter(d => d.tipo === 'dispositivo')
  const navegadores = dispositivosNavegadores.filter(d => d.tipo === 'navegador')

  const columns = [
    {
      accessorKey: 'pathname',
      header: ({ column }: any) => <SortableHeader column={column} title="Página" />,
      cell: ({ row }: any) => (
        <div className="font-mono text-sm">{row.original.pathname || '/'}</div>
      ),
    },
    {
      accessorKey: 'total_visitas',
      header: ({ column }: any) => <SortableHeader column={column} title="Total Visitas" />,
      cell: ({ row }: any) => (
        <Badge variant="outline">{row.original.total_visitas}</Badge>
      ),
    },
    {
      accessorKey: 'visitas_unicas',
      header: ({ column }: any) => <SortableHeader column={column} title="Visitas Únicas" />,
      cell: ({ row }: any) => (
        <span className="text-sm">{row.original.visitas_unicas}</span>
      ),
    },
    {
      accessorKey: 'promedio_duracion',
      header: ({ column }: any) => <SortableHeader column={column} title="Duración Promedio" />,
      cell: ({ row }: any) => (
        <span className="text-sm text-muted-foreground">
          {formatearDuracion(row.original.promedio_duracion)}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics de Visitantes</h1>
          <p className="text-muted-foreground mt-1">
            Estadísticas y análisis de visitas a la página web
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={rangoDias} onValueChange={setRangoDias}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 días</SelectItem>
              <SelectItem value="30">Últimos 30 días</SelectItem>
              <SelectItem value="60">Últimos 60 días</SelectItem>
              <SelectItem value="90">Últimos 90 días</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={cargarDatos}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button variant="outline" onClick={exportarAExcel}>
            Exportar
          </Button>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Visitas</CardDescription>
            <CardTitle className="text-3xl">
              {loading ? '...' : estadisticas?.total_visitas?.toLocaleString() || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Visitas Únicas</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {loading ? '...' : estadisticas?.visitas_unicas?.toLocaleString() || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Páginas Visitadas</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {loading ? '...' : estadisticas?.paginas_visitadas || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Duración Promedio</CardDescription>
            <CardTitle className="text-3xl text-orange-600">
              {loading ? '...' : formatearDuracion(estadisticas?.promedio_duracion || 0)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Dispositivos */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Dispositivos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dispositivos.map((d, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {d.nombre === 'mobile' && <Smartphone className="h-4 w-4 text-muted-foreground" />}
                    {d.nombre === 'desktop' && <Monitor className="h-4 w-4 text-muted-foreground" />}
                    {d.nombre === 'tablet' && <Tablet className="h-4 w-4 text-muted-foreground" />}
                    <span className="text-sm font-medium capitalize">{d.nombre || 'Desconocido'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{d.cantidad.toLocaleString()}</span>
                    <Badge variant="outline">{d.porcentaje.toFixed(1)}%</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Navegadores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {navegadores.slice(0, 5).map((n, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{n.nombre}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{n.cantidad.toLocaleString()}</span>
                    <Badge variant="outline">{n.porcentaje.toFixed(1)}%</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visitas por día */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Visitas por Día
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {visitasPorDia.slice(0, 10).map((dia, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded bg-muted">
                <span className="text-sm font-medium">{formatearFecha(dia.fecha)}</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    {dia.visitas_unicas} únicas
                  </span>
                  <Badge>{dia.total_visitas} total</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Páginas más visitadas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Páginas Más Visitadas
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {paginasMasVisitadas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay datos de visitas en el período seleccionado
            </p>
          ) : (
            <DataTable
              columns={columns}
              data={paginasMasVisitadas}
              searchKey="pathname"
              searchPlaceholder="Buscar página..."
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

