'use client'

import { useState } from 'react'
import { TareaCRM } from '@/lib/tareas-service'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { CheckCircle2, Clock, AlertCircle, XCircle, Calendar, User, FileText, Trash2, Edit, MessageSquare, Copy, Check, Phone, Mail } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

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
  const [showContactDialog, setShowContactDialog] = useState(false)
  const [copiado, setCopiado] = useState(false)

  // Generar mensaje predefinido para WhatsApp
  const generarMensajeWhatsApp = () => {
    const nombreCliente = tarea.cliente_nombre || 'Estimado/a cliente'
    const numeroPresupuesto = tarea.presupuesto_numero || 'su presupuesto'
    
    return `Hola ${nombreCliente}, 👋

Le escribimos desde *Alambres del Norte* para darle seguimiento a su cotización *${numeroPresupuesto}*.

⏰ Queremos informarle que esta cotización está próxima a vencer y los precios podrían actualizarse.

¿Desea *confirmar el pedido* o prefiere que le generemos una *nueva cotización* actualizada?

Quedamos a su disposición para cualquier consulta.

Saludos cordiales,
Equipo Alambres del Norte 🏭`
  }

  const copiarMensaje = async () => {
    const mensaje = generarMensajeWhatsApp()
    try {
      await navigator.clipboard.writeText(mensaje)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch (err) {
      console.error('Error al copiar:', err)
    }
  }

  const abrirWhatsApp = () => {
    const mensaje = encodeURIComponent(generarMensajeWhatsApp())
    const telefono = tarea.cliente_telefono?.replace(/\D/g, '') || ''
    window.open(`https://wa.me/${telefono}?text=${mensaje}`, '_blank')
  }

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
              {/* Botón de contactar cliente - solo si hay presupuesto */}
              {tarea.presupuesto_numero && tarea.cliente_nombre && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowContactDialog(true)}
                  className="h-8 w-8 p-0"
                  title="Contactar cliente"
                >
                  <MessageSquare className="h-4 w-4 text-green-600" />
                </Button>
              )}
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

      {/* Dialog para contactar al cliente */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-green-600" />
              Contactar Cliente
            </DialogTitle>
            <DialogDescription>
              Información del cliente y mensaje predefinido para seguimiento del presupuesto.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Datos del cliente */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Datos del Cliente
              </h4>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{tarea.cliente_nombre || 'Sin nombre'}</span>
                </div>
                
                {tarea.cliente_telefono ? (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={`tel:${tarea.cliente_telefono}`}
                      className="text-primary hover:underline"
                    >
                      {tarea.cliente_telefono}
                    </a>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span className="italic">Sin teléfono registrado</span>
                  </div>
                )}
                
                {tarea.cliente_email ? (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={`mailto:${tarea.cliente_email}`}
                      className="text-primary hover:underline"
                    >
                      {tarea.cliente_email}
                    </a>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="italic">Sin correo registrado</span>
                  </div>
                )}

                {tarea.presupuesto_numero && (
                  <div className="flex items-center gap-2 pt-1 border-t">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-sm">
                      Presupuesto: {tarea.presupuesto_numero}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Mensaje predefinido */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Mensaje para WhatsApp
              </h4>
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3 text-sm whitespace-pre-wrap max-h-48 overflow-y-auto">
                {generarMensajeWhatsApp()}
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={copiarMensaje}
              >
                {copiado ? (
                  <>
                    <Check className="h-4 w-4 mr-2 text-green-600" />
                    ¡Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar mensaje
                  </>
                )}
              </Button>
              
              {tarea.cliente_telefono && (
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={abrirWhatsApp}
                >
                  <svg 
                    className="h-4 w-4 mr-2" 
                    viewBox="0 0 24 24" 
                    fill="currentColor"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Abrir WhatsApp
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
