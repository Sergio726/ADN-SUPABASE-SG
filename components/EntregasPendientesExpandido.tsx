'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Package, Clock, CheckCircle2, AlertCircle, TrendingUp, Calendar, DollarSign } from 'lucide-react'
import Link from 'next/link'
// Barra de progreso simple sin componente externo

export function EntregasPendientesExpandido() {
  const router = useRouter()
  const [presupuestosEntregas, setPresupuestosEntregas] = useState<any[]>([])
  const [cargandoEntregas, setCargandoEntregas] = useState(false)

  // Cargar estado de entregas
  const cargarEstadoEntregas = useCallback(async () => {
    try {
      setCargandoEntregas(true)
      const { data, error } = await supabase
        .from('v_presupuestos_estado_entrega')
        .select('*')
        .order('fecha_emision', { ascending: true })

      if (error) {
        console.error('Error al cargar estado de entregas:', error)
        return
      }

      setPresupuestosEntregas(data || [])
    } catch (error) {
      console.error('Error al cargar entregas:', error)
    } finally {
      setCargandoEntregas(false)
    }
  }, [])

  useEffect(() => {
    cargarEstadoEntregas()
  }, [cargarEstadoEntregas])

  // Filtrar y ordenar presupuestos pendientes
  const presupuestosPendientes = useMemo(() => {
    return presupuestosEntregas
      .filter((p: any) => p.estado_entrega === 'pendiente' || p.estado_entrega === 'parcial')
      .sort((a: any, b: any) => {
        // Primero pendientes, luego parciales
        if (a.estado_entrega !== b.estado_entrega) {
          return a.estado_entrega === 'pendiente' ? -1 : 1
        }
        // Luego por fecha más antigua primero (mayor prioridad)
        return new Date(a.fecha_emision).getTime() - new Date(b.fecha_emision).getTime()
      })
      .slice(0, 5) // Limitar a 5 para no saturar
  }, [presupuestosEntregas])

  // Calcular días transcurridos desde aprobación
  const calcularDiasTranscurridos = useCallback((fechaEmision: string) => {
    const fecha = new Date(fechaEmision)
    const ahora = new Date()
    const diffTime = Math.abs(ahora.getTime() - fecha.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }, [])

  // Obtener color según urgencia
  const obtenerColorUrgencia = useCallback((dias: number) => {
    if (dias > 15) return 'text-destructive'
    if (dias > 3) return 'text-orange-600'
    return 'text-amber-600'
  }, [])

  // Calcular porcentaje de progreso
  const calcularProgreso = useCallback((itemsCompletos: number, totalItems: number) => {
    if (!totalItems || totalItems === 0) return 0
    return Math.round((itemsCompletos / totalItems) * 100)
  }, [])

  if (cargandoEntregas) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-amber-600" />
            <CardTitle>Entregas Pendientes</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Clock className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (presupuestosPendientes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <CardTitle>Entregas Pendientes</CardTitle>
          </div>
          <CardDescription>
            Presupuestos aprobados esperando entrega
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">¡Excelente!</h3>
            <p className="text-muted-foreground">
              No hay presupuestos pendientes de entrega
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-amber-600" />
            <CardTitle>Entregas Pendientes</CardTitle>
          </div>
          <Badge variant="secondary" className="bg-amber-100 text-amber-800">
            {presupuestosPendientes.length} {presupuestosPendientes.length === 1 ? 'presupuesto' : 'presupuestos'}
          </Badge>
        </div>
        <CardDescription>
          Presupuestos aprobados esperando entrega completa
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {presupuestosPendientes.map((presupuesto: any) => {
            const diasTranscurridos = calcularDiasTranscurridos(presupuesto.fecha_emision)
            const porcentajeProgreso = calcularProgreso(
              presupuesto.items_completos || 0,
              presupuesto.total_items || 0
            )
            const esParcial = presupuesto.estado_entrega === 'parcial'

            return (
              <div
                key={presupuesto.id}
                className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50/30 p-4 hover:shadow-md transition-shadow"
              >
                {/* Header con número y estado */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-semibold text-lg">
                        {presupuesto.numero}
                      </span>
                      <Badge
                        variant={esParcial ? 'secondary' : 'outline'}
                        className={esParcial 
                          ? 'bg-orange-100 text-orange-800 border-orange-300' 
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                        }
                      >
                        {esParcial ? (
                          <>
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Parcial
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3 mr-1" />
                            Pendiente
                          </>
                        )}
                      </Badge>
                      {diasTranscurridos > 15 && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Urgente
                        </Badge>
                      )}
                    </div>
                    
                    <p className="font-medium text-base">{presupuesto.cliente_nombre}</p>
                    
                    {/* Información de fechas y progreso */}
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Aprobado: {new Date(presupuesto.fecha_emision).toLocaleDateString('es-AR')}
                        </span>
                        <span className={`font-medium ml-1 ${obtenerColorUrgencia(diasTranscurridos)}`}>
                          ({diasTranscurridos} días)
                        </span>
                      </div>
                      
                      {presupuesto.fecha_ultima_entrega && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span>
                            Última entrega: {new Date(presupuesto.fecha_ultima_entrega).toLocaleDateString('es-AR')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Barra de progreso */}
                    {presupuesto.total_items && presupuesto.total_items > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Progreso de entrega</span>
                          <span className="font-medium">
                            {presupuesto.items_completos || 0} / {presupuesto.total_items} items
                            {' '}
                            ({porcentajeProgreso}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-green-600 h-full transition-all duration-300 rounded-full"
                            style={{ width: `${porcentajeProgreso}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Información de monto y entregas */}
                    <div className="flex flex-wrap items-center gap-4 pt-1">
                      <div className="flex items-center gap-1 text-green-600 font-semibold">
                        <DollarSign className="h-4 w-4" />
                        <span>
                          ${presupuesto.total?.toLocaleString('es-AR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      
                      {presupuesto.total_entregas > 0 && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Package className="h-4 w-4" />
                          <span>{presupuesto.total_entregas} entrega{presupuesto.total_entregas !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Botón de acción */}
                  <Button
                    variant="default"
                    size="sm"
                    asChild
                    className="whitespace-nowrap"
                  >
                    <Link href={`/dashboard/presupuestos/${presupuesto.id}`}>
                      Ver Detalle
                    </Link>
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
        
        {/* Enlace a ver todos si hay más de 5 */}
        {presupuestosEntregas.filter((p: any) => 
          p.estado_entrega === 'pendiente' || p.estado_entrega === 'parcial'
        ).length > 5 && (
          <div className="mt-4 pt-4 border-t">
            <Button variant="outline" className="w-full" asChild>
              <Link href="/dashboard/presupuestos">
                Ver todos los presupuestos pendientes
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

