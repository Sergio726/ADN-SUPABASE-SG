'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { RefreshCw, Globe, Monitor, Smartphone, Tablet, Calendar, BarChart3, ChevronDown, ChevronUp, ChevronsDownUp, ChevronsUpDown, Share2, Target, MousePointerClick, Phone, Mail, MessageSquare, FileDown } from 'lucide-react'
import { DataTable } from '@/components/ui/data-table'
import { SortableHeader } from '@/components/ui/sortable-header'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
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

interface FuenteTrafico {
  fuente: string
  total_visitas: number
  visitas_unicas: number
  porcentaje: number
}

interface EventoConversion {
  tipo_evento: string
  total_eventos: number
  sesiones_unicas: number
  porcentaje_conversion: number
}

interface ConversionPorFuente {
  fuente: string
  total_visitas: number
  total_conversiones: number
  tasa_conversion: number
}

export default function VisitasPage() {
  const [loading, setLoading] = useState(true)
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null)
  const [visitasPorDia, setVisitasPorDia] = useState<VisitaPorDia[]>([])
  const [paginasMasVisitadas, setPaginasMasVisitadas] = useState<PaginaMasVisitada[]>([])
  const [dispositivosNavegadores, setDispositivosNavegadores] = useState<DispositivoNavegador[]>([])
  const [fuentesTrafico, setFuentesTrafico] = useState<FuenteTrafico[]>([])
  const [eventosConversion, setEventosConversion] = useState<EventoConversion[]>([])
  const [conversionesPorFuente, setConversionesPorFuente] = useState<ConversionPorFuente[]>([])
  const [rangoDias, setRangoDias] = useState('30')
  const { toast } = useToast()
  
  // Estados para controlar secciones colapsables
  const [dispositivosAbierto, setDispositivosAbierto] = useState(true)
  const [visitasPorDiaAbierto, setVisitasPorDiaAbierto] = useState(true)
  const [paginasAbierto, setPaginasAbierto] = useState(true)
  const [fuentesAbierto, setFuentesAbierto] = useState(true)
  const [conversionesAbierto, setConversionesAbierto] = useState(true)

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

      // Cargar fuentes de tráfico
      const { data: fuentes, error: fuentesError } = await supabase
        .rpc('obtener_estadisticas_por_fuente', {
          fecha_desde: fechaDesde.toISOString(),
          fecha_hasta: fechaHasta.toISOString(),
        })

      if (!fuentesError) {
        setFuentesTrafico(fuentes || [])
      }

      // Cargar eventos de conversión
      const { data: conversiones, error: conversionesError } = await supabase
        .rpc('obtener_estadisticas_conversiones', {
          fecha_desde: fechaDesde.toISOString(),
          fecha_hasta: fechaHasta.toISOString(),
        })

      if (!conversionesError) {
        setEventosConversion(conversiones || [])
      }

      // Cargar conversiones por fuente
      const { data: convPorFuente, error: convFuenteError } = await supabase
        .rpc('obtener_conversiones_por_fuente', {
          fecha_desde: fechaDesde.toISOString(),
          fecha_hasta: fechaHasta.toISOString(),
        })

      if (!convFuenteError) {
        setConversionesPorFuente(convPorFuente || [])
      }

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
  
  // Función para expandir/colapsar todo
  const expandirTodo = () => {
    setDispositivosAbierto(true)
    setVisitasPorDiaAbierto(true)
    setPaginasAbierto(true)
    setFuentesAbierto(true)
    setConversionesAbierto(true)
  }
  
  const colapsarTodo = () => {
    setDispositivosAbierto(false)
    setVisitasPorDiaAbierto(false)
    setPaginasAbierto(false)
    setFuentesAbierto(false)
    setConversionesAbierto(false)
  }
  
  const todasExpandidas = dispositivosAbierto && visitasPorDiaAbierto && paginasAbierto && fuentesAbierto && conversionesAbierto
  const todasColapsadas = !dispositivosAbierto && !visitasPorDiaAbierto && !paginasAbierto && !fuentesAbierto && !conversionesAbierto

  // Función para obtener ícono de tipo de evento
  const getIconoEvento = (tipo: string) => {
    switch (tipo) {
      case 'click_whatsapp': return <MessageSquare className="h-4 w-4 text-green-600" />
      case 'click_telefono': return <Phone className="h-4 w-4 text-blue-600" />
      case 'envio_formulario': return <Mail className="h-4 w-4 text-purple-600" />
      case 'descarga_catalogo': return <FileDown className="h-4 w-4 text-orange-600" />
      case 'click_email': return <Mail className="h-4 w-4 text-red-600" />
      default: return <MousePointerClick className="h-4 w-4 text-gray-600" />
    }
  }

  // Función para obtener nombre legible de evento
  const getNombreEvento = (tipo: string) => {
    switch (tipo) {
      case 'click_whatsapp': return 'Click en WhatsApp'
      case 'click_telefono': return 'Click en Teléfono'
      case 'envio_formulario': return 'Envío de Formulario'
      case 'descarga_catalogo': return 'Descarga de Catálogo'
      case 'click_email': return 'Click en Email'
      default: return tipo
    }
  }

  // Función para obtener color de fuente
  const getColorFuente = (fuente: string) => {
    switch (fuente.toLowerCase()) {
      case 'google': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'facebook': return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      case 'instagram': return 'bg-pink-100 text-pink-800 border-pink-200'
      case 'whatsapp': return 'bg-green-100 text-green-800 border-green-200'
      case 'directo': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'email': return 'bg-red-100 text-red-800 border-red-200'
      case 'twitter': return 'bg-sky-100 text-sky-800 border-sky-200'
      default: return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

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
    <div className="max-h-[calc(100vh-10rem)] overflow-y-auto overflow-x-hidden -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
      <div className="space-y-4 md:space-y-6 pb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Analytics de Visitantes</h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              Estadísticas y análisis de visitas a la página web
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <Select value={rangoDias} onValueChange={setRangoDias}>
              <SelectTrigger className="w-full sm:w-[160px]">
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
              className="w-full sm:w-auto"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button 
              variant="outline" 
              onClick={exportarAExcel}
              className="w-full sm:w-auto"
            >
              Exportar
            </Button>
            <Button
              variant="outline"
              onClick={todasExpandidas ? colapsarTodo : expandirTodo}
              className="w-full sm:w-auto"
              title={todasExpandidas ? "Colapsar todo" : "Expandir todo"}
            >
              {todasExpandidas ? (
                <>
                  <ChevronsUpDown className="h-4 w-4 mr-2" />
                  Colapsar
                </>
              ) : (
                <>
                  <ChevronsDownUp className="h-4 w-4 mr-2" />
                  Expandir
                </>
              )}
            </Button>
          </div>
        </div>

      {/* Estadísticas principales */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2 md:pb-3">
            <CardDescription className="text-xs md:text-sm">Total Visitas</CardDescription>
            <CardTitle className="text-xl md:text-2xl lg:text-3xl">
              {loading ? '...' : estadisticas?.total_visitas?.toLocaleString() || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2 md:pb-3">
            <CardDescription className="text-xs md:text-sm">Visitas Únicas</CardDescription>
            <CardTitle className="text-xl md:text-2xl lg:text-3xl text-blue-600">
              {loading ? '...' : estadisticas?.visitas_unicas?.toLocaleString() || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2 md:pb-3">
            <CardDescription className="text-xs md:text-sm">Páginas Visitadas</CardDescription>
            <CardTitle className="text-xl md:text-2xl lg:text-3xl text-green-600">
              {loading ? '...' : estadisticas?.paginas_visitadas || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2 md:pb-3">
            <CardDescription className="text-xs md:text-sm">Duración Promedio</CardDescription>
            <CardTitle className="text-xl md:text-2xl lg:text-3xl text-orange-600">
              {loading ? '...' : formatearDuracion(estadisticas?.promedio_duracion || 0)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Dispositivos */}
      <Collapsible open={dispositivosAbierto} onOpenChange={setDispositivosAbierto}>
        <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2">
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    Dispositivos
                  </div>
                  {dispositivosAbierto ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <div className="space-y-3">
                  {dispositivos.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No hay datos de dispositivos
                    </p>
                  ) : (
                    dispositivos.map((d, idx) => (
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
                    ))
                  )}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>

          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Navegadores
                  </div>
                  {dispositivosAbierto ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <div className="space-y-3">
                  {navegadores.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No hay datos de navegadores
                    </p>
                  ) : (
                    navegadores.slice(0, 5).map((n, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{n.nombre}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">{n.cantidad.toLocaleString()}</span>
                          <Badge variant="outline">{n.porcentaje.toFixed(1)}%</Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </div>
      </Collapsible>

      {/* Visitas por día */}
      <Collapsible open={visitasPorDiaAbierto} onOpenChange={setVisitasPorDiaAbierto}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Visitas por Día
                </div>
                {visitasPorDiaAbierto ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {visitasPorDia.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No hay datos de visitas por día
                  </p>
                ) : (
                  visitasPorDia.slice(0, 10).map((dia, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded bg-muted">
                      <span className="text-sm font-medium">{formatearFecha(dia.fecha)}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          {dia.visitas_unicas} únicas
                        </span>
                        <Badge>{dia.total_visitas} total</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Páginas más visitadas */}
      <Collapsible open={paginasAbierto} onOpenChange={setPaginasAbierto}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Páginas Más Visitadas
                </div>
                {paginasAbierto ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              {paginasMasVisitadas.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No hay datos de visitas en el período seleccionado
                </p>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  <DataTable
                    columns={columns}
                    data={paginasMasVisitadas}
                    searchKey="pathname"
                    searchPlaceholder="Buscar página..."
                  />
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Fuentes de Tráfico y Conversiones */}
      <Collapsible open={fuentesAbierto} onOpenChange={setFuentesAbierto}>
        <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2">
          {/* Fuentes de Tráfico */}
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Share2 className="h-5 w-5" />
                    Fuentes de Tráfico
                  </div>
                  {fuentesAbierto ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </CardTitle>
                <CardDescription>De dónde vienen tus visitantes</CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <div className="space-y-3">
                  {fuentesTrafico.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No hay datos de fuentes de tráfico
                    </p>
                  ) : (
                    fuentesTrafico.map((fuente, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={getColorFuente(fuente.fuente)}>
                            {fuente.fuente.charAt(0).toUpperCase() + fuente.fuente.slice(1)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">
                            {fuente.visitas_unicas.toLocaleString()} únicas
                          </span>
                          <Badge variant="secondary">{fuente.porcentaje}%</Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>

          {/* Conversiones por Fuente */}
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Conversión por Fuente
                  </div>
                  {fuentesAbierto ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </CardTitle>
                <CardDescription>Tasa de conversión por origen</CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <div className="space-y-3">
                  {conversionesPorFuente.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No hay datos de conversiones
                    </p>
                  ) : (
                    conversionesPorFuente.filter(c => c.total_conversiones > 0).map((conv, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={getColorFuente(conv.fuente)}>
                            {conv.fuente.charAt(0).toUpperCase() + conv.fuente.slice(1)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">
                            {conv.total_conversiones} de {conv.total_visitas}
                          </span>
                          <Badge variant={conv.tasa_conversion > 5 ? "default" : "outline"} 
                                 className={conv.tasa_conversion > 5 ? "bg-green-600" : ""}>
                            {conv.tasa_conversion}%
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                  {conversionesPorFuente.filter(c => c.total_conversiones > 0).length === 0 && conversionesPorFuente.length > 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Aún no hay conversiones registradas
                    </p>
                  )}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </div>
      </Collapsible>

      {/* Eventos de Conversión */}
      <Collapsible open={conversionesAbierto} onOpenChange={setConversionesAbierto}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MousePointerClick className="h-5 w-5" />
                  Eventos de Conversión
                </div>
                {conversionesAbierto ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </CardTitle>
              <CardDescription>Clicks en WhatsApp, teléfono, formularios y más</CardDescription>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              {eventosConversion.length === 0 ? (
                <div className="text-center py-8">
                  <MousePointerClick className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    No hay eventos de conversión registrados
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Los eventos se registran cuando los visitantes hacen click en WhatsApp, teléfono o envían formularios
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {eventosConversion.map((evento, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      {getIconoEvento(evento.tipo_evento)}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{getNombreEvento(evento.tipo_evento)}</p>
                        <p className="text-xs text-muted-foreground">
                          {evento.total_eventos} eventos • {evento.sesiones_unicas} sesiones
                        </p>
                      </div>
                      <Badge variant={evento.porcentaje_conversion > 2 ? "default" : "outline"}
                             className={evento.porcentaje_conversion > 2 ? "bg-green-600" : ""}>
                        {evento.porcentaje_conversion}%
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
      </div>
    </div>
  )
}

