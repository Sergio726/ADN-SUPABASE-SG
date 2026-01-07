'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { TareaCard } from './TareaCard'
import { TareaForm } from './TareaForm'
import { useTareas } from '@/hooks/use-tareas'
import type { TareaCRM, CrearTareaData, ActualizarTareaData } from '@/lib/tareas-service'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface TareasSectionProps {
  clienteId?: string
  presupuestoId?: string
  asignadoA?: string
  titulo?: string
  descripcion?: string
  mostrarEstadisticas?: boolean
  compacta?: boolean
}

export function TareasSection({
  clienteId,
  presupuestoId,
  asignadoA,
  titulo = 'Tareas',
  descripcion = 'Gestiona las tareas relacionadas',
  mostrarEstadisticas = true,
  compacta = false,
}: TareasSectionProps) {
  const [formAbierto, setFormAbierto] = useState(false)
  const [tareaEditar, setTareaEditar] = useState<TareaCRM | null>(null)
  const [tareaEliminar, setTareaEliminar] = useState<string | null>(null)

  const {
    tareas,
    loading,
    crearTarea,
    actualizarTarea,
    completarTarea,
    eliminarTarea,
    cargarTareas,
  } = useTareas({
    cliente_id: clienteId,
    presupuesto_id: presupuestoId,
    asignado_a: asignadoA,
  })

  const handleCrearTarea = async (datos: CrearTareaData) => {
    await crearTarea(datos)
    setFormAbierto(false)
  }

  const handleEditarTarea = async (datos: ActualizarTareaData) => {
    if (tareaEditar) {
      await actualizarTarea(tareaEditar.id, datos)
      setTareaEditar(null)
      setFormAbierto(false)
    }
  }

  const handleGuardar = async (datos: CrearTareaData | ActualizarTareaData) => {
    if (tareaEditar) {
      await handleEditarTarea(datos as ActualizarTareaData)
    } else {
      await handleCrearTarea(datos as CrearTareaData)
    }
  }

  const handleEliminarConfirmado = async () => {
    if (tareaEliminar) {
      await eliminarTarea(tareaEliminar)
      setTareaEliminar(null)
    }
  }

  const tareasPendientes = tareas.filter(t => t.estado === 'pendiente').length
  const tareasEnProgreso = tareas.filter(t => t.estado === 'en_progreso').length
  const tareasVencidas = tareas.filter(t => t.estado_vencimiento === 'vencida' && t.estado !== 'completada').length

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{titulo}</CardTitle>
              <CardDescription>{descripcion}</CardDescription>
            </div>
            <Button
              onClick={() => {
                setTareaEditar(null)
                setFormAbierto(true)
              }}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Tarea
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {mostrarEstadisticas && tareas.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
                  <Clock className="h-4 w-4" />
                  Pendientes
                </div>
                <div className="text-2xl font-bold">{tareasPendientes}</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
                  <CheckCircle2 className="h-4 w-4" />
                  En progreso
                </div>
                <div className="text-2xl font-bold">{tareasEnProgreso}</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
                  <AlertCircle className="h-4 w-4" />
                  Vencidas
                </div>
                <div className="text-2xl font-bold text-destructive">{tareasVencidas}</div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando tareas...
            </div>
          ) : tareas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-2">No hay tareas registradas</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTareaEditar(null)
                  setFormAbierto(true)
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear primera tarea
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {tareas.map((tarea) => (
                <TareaCard
                  key={tarea.id}
                  tarea={tarea}
                  compacta={compacta}
                  onCompletar={completarTarea}
                  onEditar={(t) => {
                    setTareaEditar(t)
                    setFormAbierto(true)
                  }}
                  onEliminar={setTareaEliminar}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TareaForm
        abierto={formAbierto}
        onCerrar={() => {
          setFormAbierto(false)
          setTareaEditar(null)
        }}
        onGuardar={handleGuardar}
        tareaEditar={tareaEditar}
        clienteId={clienteId}
        presupuestoId={presupuestoId}
      />

      <AlertDialog open={tareaEliminar !== null} onOpenChange={(open) => !open && setTareaEliminar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tarea?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La tarea se eliminará permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleEliminarConfirmado} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

