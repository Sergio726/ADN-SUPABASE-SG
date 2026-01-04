'use client'

import { TareaCRM } from '@/lib/tareas-service'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Clock, AlertCircle, XCircle, Calendar, User, FileText, Trash2, Edit } from 'lucide-react'
import Link from 'next/link'
// Función simple de formateo de fechas (sin dependencia externa)
const formatearFecha = (fecha: Date | string): string => {
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha
  if (isNaN(d.getTime())) return fecha.toString()
  
  const dia = String(d.getDate()).padStart(2, '0')
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const año = d.getFullYear()
  const horas = String(d.getHours()).padStart(2, '0')
  const minutos = String(d.getMinutes()).padStart(2, '0')
  
  return `${dia}/${mes}/${año} a las ${horas}:${minutos}`
}

const formatearFechaCorta = (fecha: Date | string): string => {
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha
  if (isNaN(d.getTime())) return fecha.toString()
  
  const dia = String(d.getDate()).padStart(2, '0')
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const año = d.getFullYear()
  
  return `${dia}/${mes}/${año}`
}
import { cn } from '@/lib/utils'

interface TareaCardProps {
  tarea: TareaCRM
  onCompletar?: (id: string) => void
  onEliminar?: (id: string) => void
  onEditar?: (tarea: TareaCRM) => void
  mostrarAcciones?: boolean
  compacta?: boolean
}

export function TareaCard({
  tarea,
  onCompletar,
  onEliminar,
  onEditar,
  mostrarAcciones = true,
  compacta = false,
}: TareaCardProps) {
  const getEstadoBadge = () => {
    switch (tarea.estado) {
      case 'completada':
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completada
          </Badge>
        )
      case 'en_progreso':
        return (
          <Badge variant="default" className="bg-blue-600">
            <Clock className="h-3 w-3 mr-1" />
            En progreso
          </Badge>
        )
      case 'cancelada':
        return (
          <Badge variant="secondary">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelada
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            Pendiente
          </Badge>
        )
    }
  }

  const getVencimientoBadge = () => {
    if (!tarea.fecha_vencimiento) return null

    const estado = tarea.estado_vencimiento
    if (estado === 'vencida' && tarea.estado !== 'completada') {
      return (
        <Badge variant="destructive" className="ml-2">
          <AlertCircle className="h-3 w-3 mr-1" />
          Vencida
        </Badge>
      )
    }
    if (estado === 'por_vencer') {
      return (
        <Badge variant="outline" className="ml-2 border-orange-500 text-orange-600">
          <AlertCircle className="h-3 w-3 mr-1" />
          Por vencer
        </Badge>
      )
    }
    return null
  }


  return (
    <Card className={cn(
      "transition-all hover:shadow-md",
      tarea.estado === 'completada' && "opacity-75",
      tarea.estado_vencimiento === 'vencida' && tarea.estado !== 'completada' && "border-red-500"
    )}>
      <CardContent className={cn("p-4", compacta && "p-3")}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {getEstadoBadge()}
              {getVencimientoBadge()}
            </div>
            
            <h4 className={cn(
              "font-semibold mb-1",
              tarea.estado === 'completada' && "line-through text-muted-foreground",
              compacta ? "text-sm" : "text-base"
            )}>
              {tarea.titulo}
            </h4>

            {tarea.descripcion && !compacta && (
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                {tarea.descripcion}
              </p>
            )}

            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-2">
              {tarea.cliente_nombre && (
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {tarea.cliente_id ? (
                    <Link 
                      href={`/dashboard/clientes/${tarea.cliente_id}`}
                      className="hover:text-primary hover:underline"
                    >
                      {tarea.cliente_nombre}
                    </Link>
                  ) : (
                    <span>{tarea.cliente_nombre}</span>
                  )}
                </div>
              )}

              {tarea.presupuesto_numero && (
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {tarea.presupuesto_id ? (
                    <Link 
                      href={`/dashboard/presupuestos/${tarea.presupuesto_id}`}
                      className="hover:text-primary hover:underline font-mono"
                    >
                      {tarea.presupuesto_numero}
                    </Link>
                  ) : (
                    <span className="font-mono">{tarea.presupuesto_numero}</span>
                  )}
                </div>
              )}

              {tarea.fecha_vencimiento && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {compacta 
                      ? formatearFechaCorta(tarea.fecha_vencimiento)
                      : `Vence: ${formatearFecha(tarea.fecha_vencimiento)}`
                    }
                  </span>
                </div>
              )}

              {tarea.asignado_nombre && (
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>Asignado a: {tarea.asignado_nombre}</span>
                </div>
              )}
            </div>
          </div>

          {mostrarAcciones && tarea.estado !== 'completada' && (
            <div className="flex items-center gap-1 shrink-0">
              {onCompletar && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCompletar(tarea.id)}
                  className="h-8 w-8 p-0"
                  title="Marcar como completada"
                >
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </Button>
              )}
              {onEditar && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditar(tarea)}
                  className="h-8 w-8 p-0"
                  title="Editar tarea"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {onEliminar && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEliminar(tarea.id)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  title="Eliminar tarea"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

