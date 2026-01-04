/**
 * Hook personalizado para gestión de tareas CRM
 * Proporciona estado y funciones para operaciones CRUD de tareas
 */

import { useState, useEffect, useCallback } from 'react'
import { useToast } from './use-toast'
import * as tareasService from '@/lib/tareas-service'
import type { TareaCRM, CrearTareaData, ActualizarTareaData, EstadoTarea } from '@/lib/tareas-service'

interface UseTareasOptions {
  cliente_id?: string
  presupuesto_id?: string
  asignado_a?: string
  autoCargar?: boolean
}

export function useTareas(options: UseTareasOptions = {}) {
  const { autoCargar = true, ...filtros } = options
  const { toast } = useToast()
  const [tareas, setTareas] = useState<TareaCRM[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const cargarTareas = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await tareasService.obtenerTareas(filtros)
      setTareas(data)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error desconocido')
      setError(error)
      console.error('Error al cargar tareas:', error)
      toast({
        title: "Error al cargar tareas",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [filtros.cliente_id, filtros.presupuesto_id, filtros.asignado_a, toast])

  useEffect(() => {
    if (autoCargar) {
      cargarTareas()
    }
  }, [autoCargar, cargarTareas])

  const crearTarea = useCallback(async (datos: CrearTareaData): Promise<TareaCRM | null> => {
    try {
      setLoading(true)
      const nuevaTarea = await tareasService.crearTarea(datos)
      setTareas(prev => [nuevaTarea, ...prev])
      toast({
        title: "Tarea creada",
        description: "La tarea se ha creado correctamente",
      })
      return nuevaTarea
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error desconocido')
      console.error('Error al crear tarea:', error)
      toast({
        title: "Error al crear tarea",
        description: error.message,
        variant: "destructive",
      })
      return null
    } finally {
      setLoading(false)
    }
  }, [toast])

  const actualizarTarea = useCallback(async (
    id: string,
    datos: ActualizarTareaData
  ): Promise<boolean> => {
    try {
      setLoading(true)
      const tareaActualizada = await tareasService.actualizarTarea(id, datos)
      setTareas(prev => prev.map(t => t.id === id ? tareaActualizada : t))
      toast({
        title: "Tarea actualizada",
        description: "La tarea se ha actualizado correctamente",
      })
      return true
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error desconocido')
      console.error('Error al actualizar tarea:', error)
      toast({
        title: "Error al actualizar tarea",
        description: error.message,
        variant: "destructive",
      })
      return false
    } finally {
      setLoading(false)
    }
  }, [toast])

  const completarTarea = useCallback(async (id: string): Promise<boolean> => {
    return await actualizarTarea(id, { estado: 'completada' })
  }, [actualizarTarea])

  const eliminarTarea = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true)
      await tareasService.eliminarTarea(id)
      setTareas(prev => prev.filter(t => t.id !== id))
      toast({
        title: "Tarea eliminada",
        description: "La tarea se ha eliminado correctamente",
      })
      return true
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error desconocido')
      console.error('Error al eliminar tarea:', error)
      toast({
        title: "Error al eliminar tarea",
        description: error.message,
        variant: "destructive",
      })
      return false
    } finally {
      setLoading(false)
    }
  }, [toast])

  const cambiarEstado = useCallback(async (
    id: string,
    nuevoEstado: EstadoTarea
  ): Promise<boolean> => {
    return await actualizarTarea(id, { estado: nuevoEstado })
  }, [actualizarTarea])

  return {
    tareas,
    loading,
    error,
    cargarTareas,
    crearTarea,
    actualizarTarea,
    completarTarea,
    eliminarTarea,
    cambiarEstado,
  }
}

/**
 * Hook para tareas pendientes del usuario actual
 */
export function useMisTareas() {
  const { toast } = useToast()
  const [tareas, setTareas] = useState<TareaCRM[]>([])
  const [loading, setLoading] = useState(false)

  const cargarMisTareas = useCallback(async () => {
    try {
      setLoading(true)
      const { data: { user } } = await (await import('@/lib/supabaseClient')).supabase.auth.getUser()
      
      if (!user) {
        setTareas([])
        return
      }

      const data = await tareasService.obtenerTareasPendientesUsuario(user.id)
      setTareas(data)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error desconocido')
      console.error('Error al cargar mis tareas:', error)
      toast({
        title: "Error al cargar tareas",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    cargarMisTareas()
  }, [cargarMisTareas])

  return {
    tareas,
    loading,
    recargar: cargarMisTareas,
  }
}

