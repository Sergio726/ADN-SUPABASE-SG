'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TareaCard } from '@/components/TareaCard'
import { TareaForm } from '@/components/TareaForm'
import { useMisTareas } from '@/hooks/use-tareas'
import { Button } from '@/components/ui/button'
import { Plus, RefreshCw, CheckCircle2, Clock, AlertCircle, CheckSquare } from 'lucide-react'
import { useState, useEffect } from 'react'
import type { TareaCRM, CrearTareaData, ActualizarTareaData } from '@/lib/tareas-service'
import { useTareas } from '@/hooks/use-tareas'
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

export default function MisTareasPage() {
  const [formAbierto, setFormAbierto] = useState(false)
  const [tareaEditar, setTareaEditar] = useState<TareaCRM | null>(null)
  const [tareaEliminar, setTareaEliminar] = useState<string | null>(null)

  const { tareas, loading, recargar } = useMisTareas()
  const {
    crearTarea,
    actualizarTarea,
    completarTarea,
    eliminarTarea,
  } = useTareas({ autoCargar: false })

  const handleCrearTarea = async (datos: CrearTareaData) => {
    const resultado = await crearTarea(datos)
    if (resultado) {
      recargar()
      setFormAbierto(false)
    }
  }

  const handleEditarTarea = async (datos: ActualizarTareaData) => {
    if (tareaEditar) {
      const resultado = await actualizarTarea(tareaEditar.id, datos)
      if (resultado) {
        recargar()
        setTareaEditar(null)
        setFormAbierto(false)
      }
    }
  }

  const handleGuardar = async (datos: CrearTareaData | ActualizarTareaData) => {
    if (tareaEditar) {
      await handleEditarTarea(datos as ActualizarTareaData)
    } else {
      await handleCrearTarea(datos as CrearTareaData)
    }
  }

  const handleCompletar = async (id: string) => {
    const resultado = await completarTarea(id)
    if (resultado) {
      recargar()
    }
  }

  const handleEliminarConfirmado = async () => {
    if (tareaEliminar) {
      const resultado = await eliminarTarea(tareaEliminar)
      if (resultado) {
        recargar()
        setTareaEliminar(null)
      }
    }
  }

  // Debug: ver qué datos llegan
  useEffect(() => {
    if (tareas.length > 0) {
      console.log('=== DEBUG TAREAS ===')
      console.log('Total tareas:', tareas.length)
      console.log('Tareas:', tareas.map(t => ({ 
        id: t.id?.slice(0, 8), 
        estado: t.estado, 
        estado_vencimiento: t.estado_vencimiento,
        titulo: t.titulo?.slice(0, 30),
        asignado_a: t.asignado_a?.slice(0, 8)
      })))
    }
  }, [tareas])
  
  const tareasPendientes = tareas.filter(t => t.estado === 'pendiente')
  const tareasEnProgreso = tareas.filter(t => t.estado === 'en_progreso')
  const tareasCompletadas = tareas.filter(t => t.estado === 'completada')
  const tareasVencidas = tareas.filter(t => t.estado_vencimiento === 'vencida' && t.estado !== 'completada')

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mis Tareas</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona tus tareas y seguimientos pendientes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={recargar} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button
            onClick={() => {
              setTareaEditar(null)
              setFormAbierto(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Tarea
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pendientes</p>
                <p className="text-2xl font-bold">{tareasPendientes.length}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">En Progreso</p>
                <p className="text-2xl font-bold">{tareasEnProgreso.length}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Completadas</p>
                <p className="text-2xl font-bold text-green-600">{tareasCompletadas.length}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Vencidas</p>
                <p className="text-2xl font-bold text-destructive">{tareasVencidas.length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tareas Vencidas (Prioridad) */}
      {tareasVencidas.length > 0 && (
        <Card className="border-red-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Tareas Vencidas ({tareasVencidas.length})
            </CardTitle>
            <CardDescription>
              Estas tareas requieren atención urgente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tareasVencidas.map((tarea) => (
                <TareaCard
                  key={tarea.id}
                  tarea={tarea}
                  onCompletar={handleCompletar}
                  onEditar={(t) => {
                    setTareaEditar(t)
                    setFormAbierto(true)
                  }}
                  onEliminar={setTareaEliminar}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tareas Pendientes */}
      {tareasPendientes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pendientes ({tareasPendientes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tareasPendientes.map((tarea) => (
                <TareaCard
                  key={tarea.id}
                  tarea={tarea}
                  onCompletar={handleCompletar}
                  onEditar={(t) => {
                    setTareaEditar(t)
                    setFormAbierto(true)
                  }}
                  onEliminar={setTareaEliminar}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tareas En Progreso */}
      {tareasEnProgreso.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              En Progreso ({tareasEnProgreso.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tareasEnProgreso.map((tarea) => (
                <TareaCard
                  key={tarea.id}
                  tarea={tarea}
                  onCompletar={handleCompletar}
                  onEditar={(t) => {
                    setTareaEditar(t)
                    setFormAbierto(true)
                  }}
                  onEliminar={setTareaEliminar}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tareas Completadas (Colapsable) */}
      {tareasCompletadas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Completadas ({tareasCompletadas.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tareasCompletadas.slice(0, 5).map((tarea) => (
                <TareaCard
                  key={tarea.id}
                  tarea={tarea}
                  mostrarAcciones={false}
                />
              ))}
              {tareasCompletadas.length > 5 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Y {tareasCompletadas.length - 5} tareas más completadas
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estado vacío */}
      {!loading && tareas.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg font-medium mb-2">No tienes tareas asignadas</p>
            <p className="text-sm text-muted-foreground mb-4">
              Las tareas de seguimiento se crearán automáticamente cuando envíes presupuestos
            </p>
            <Button
              onClick={() => {
                setTareaEditar(null)
                setFormAbierto(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear primera tarea
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Debug: Tareas sin categorizar */}
      {!loading && tareas.length > 0 && tareasPendientes.length === 0 && tareasEnProgreso.length === 0 && tareasCompletadas.length === 0 && (
        <Card className="border-orange-500">
          <CardContent className="py-6">
            <p className="text-sm font-medium text-orange-600 mb-2">⚠️ Debug: {tareas.length} tareas encontradas pero ninguna coincide con los filtros</p>
            <p className="text-xs text-muted-foreground mb-2">Estados encontrados: {[...new Set(tareas.map(t => t.estado || 'undefined'))].join(', ')}</p>
            <div className="text-xs text-muted-foreground space-y-1">
              {tareas.slice(0, 3).map(t => (
                <div key={t.id}>• {t.titulo} - estado: "{t.estado}" - venc: "{t.estado_vencimiento}"</div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulario */}
      <TareaForm
        abierto={formAbierto}
        onCerrar={() => {
          setFormAbierto(false)
          setTareaEditar(null)
        }}
        onGuardar={handleGuardar}
        tareaEditar={tareaEditar}
      />

      {/* Diálogo de confirmación de eliminación */}
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
    </div>
  )
}

