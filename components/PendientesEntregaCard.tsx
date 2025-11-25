'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Package, CheckCircle2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function PendientesEntregaCard() {
  const router = useRouter()
  const [presupuestosEntregas, setPresupuestosEntregas] = useState<any[]>([])
  const [dialogEntregasAbierto, setDialogEntregasAbierto] = useState(false)
  const [cargandoEntregas, setCargandoEntregas] = useState(false)

  // Cargar estado de entregas
  const cargarEstadoEntregas = useCallback(async () => {
    try {
      setCargandoEntregas(true)
      const { data, error } = await supabase
        .from('v_presupuestos_estado_entrega')
        .select('*')
        .order('fecha_emision', { ascending: false })

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

  // Calcular estadísticas de entregas
  const estadisticasEntregas = useMemo(() => {
    const pendientes = presupuestosEntregas.filter((p: any) => p.estado_entrega === 'pendiente').length
    const parciales = presupuestosEntregas.filter((p: any) => p.estado_entrega === 'parcial').length
    const totalPendientes = pendientes + parciales

    return {
      pendientes,
      parciales,
      totalPendientes,
    }
  }, [presupuestosEntregas])

  // Presupuestos pendientes y parciales para el modal
  const presupuestosPendientesModal = useMemo(() => {
    return presupuestosEntregas.filter((p: any) => 
      p.estado_entrega === 'pendiente' || p.estado_entrega === 'parcial'
    ).sort((a: any, b: any) => {
      // Ordenar: primero pendientes, luego parciales, luego por fecha
      if (a.estado_entrega !== b.estado_entrega) {
        return a.estado_entrega === 'pendiente' ? -1 : 1
      }
      return new Date(b.fecha_emision).getTime() - new Date(a.fecha_emision).getTime()
    })
  }, [presupuestosEntregas])

  return (
    <>
      <Card 
        className="border-2 border-amber-200 bg-amber-50/50 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => estadisticasEntregas.totalPendientes > 0 && setDialogEntregasAbierto(true)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between mb-2">
            <CardDescription className="text-sm font-medium text-amber-700 uppercase tracking-wide">
              Pendientes de Entrega
            </CardDescription>
            <Package className="h-5 w-5 text-amber-600" />
          </div>
          <CardTitle className="text-4xl font-bold text-amber-600 mb-2">
            {estadisticasEntregas.totalPendientes}
          </CardTitle>
          <div className="space-y-1">
            {estadisticasEntregas.pendientes > 0 && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200 mr-2">
                {estadisticasEntregas.pendientes} pendientes
              </Badge>
            )}
            {estadisticasEntregas.parciales > 0 && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-800 hover:bg-orange-200">
                {estadisticasEntregas.parciales} parciales
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Dialog: Lista de Presupuestos Pendientes de Entrega */}
      <Dialog open={dialogEntregasAbierto} onOpenChange={setDialogEntregasAbierto}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-amber-600" />
              Presupuestos Pendientes de Entrega
            </DialogTitle>
            <DialogDescription>
              {presupuestosPendientesModal.length} presupuesto{presupuestosPendientesModal.length !== 1 ? 's' : ''} aprobado{presupuestosPendientesModal.length !== 1 ? 's' : ''} esperando entrega
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4">
            {cargandoEntregas ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : presupuestosPendientesModal.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">¡Excelente!</h3>
                <p className="text-muted-foreground">
                  No hay presupuestos pendientes de entrega
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {presupuestosPendientesModal.map((presupuesto: any) => (
                  <Card 
                    key={presupuesto.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      setDialogEntregasAbierto(false)
                      router.push(`/dashboard/presupuestos/${presupuesto.id}`)
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold">{presupuesto.numero}</span>
                            <Badge 
                              variant={presupuesto.estado_entrega === 'parcial' ? 'secondary' : 'outline'}
                              className={presupuesto.estado_entrega === 'parcial' ? 'bg-orange-100 text-orange-800' : ''}
                            >
                              {presupuesto.estado_entrega === 'parcial' ? 'Parcial' : 'Pendiente'}
                            </Badge>
                          </div>
                          <p className="font-medium">{presupuesto.cliente_nombre}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="font-semibold text-green-600">
                              ${presupuesto.total?.toLocaleString('es-AR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                            {presupuesto.total_items && (
                              <span>
                                {presupuesto.items_completos || 0}/{presupuesto.total_items} items completos
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          {presupuesto.fecha_ultima_entrega ? (
                            <div>
                              <p className="text-xs">Última entrega:</p>
                              <p className="font-medium">
                                {new Date(presupuesto.fecha_ultima_entrega).toLocaleDateString('es-AR')}
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs">Sin entregas</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

