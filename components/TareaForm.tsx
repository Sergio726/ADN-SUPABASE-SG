'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TareaCRM, CrearTareaData, ActualizarTareaData, EstadoTarea } from '@/lib/tareas-service'
import { supabase } from '@/lib/supabaseClient'

interface TareaFormProps {
  abierto: boolean
  onCerrar: () => void
  onGuardar: (datos: CrearTareaData | ActualizarTareaData) => Promise<void>
  tareaEditar?: TareaCRM | null
  clienteId?: string
  presupuestoId?: string
}

export function TareaForm({
  abierto,
  onCerrar,
  onGuardar,
  tareaEditar,
  clienteId,
  presupuestoId,
}: TareaFormProps) {
  const [loading, setLoading] = useState(false)
  const [usuarios, setUsuarios] = useState<Array<{ id: string; nombre: string }>>([])
  const [formData, setFormData] = useState<{
    titulo: string
    descripcion: string
    asignado_a: string
    fecha_vencimiento: string
    estado: EstadoTarea
  }>({
    titulo: '',
    descripcion: '',
    asignado_a: '',
    fecha_vencimiento: '',
    estado: 'pendiente',
  })

  // Cargar usuarios para asignación
  useEffect(() => {
    if (abierto) {
      cargarUsuarios()
    }
  }, [abierto])

  // Cargar datos de tarea si se está editando
  useEffect(() => {
    if (tareaEditar && abierto) {
      setFormData({
        titulo: tareaEditar.titulo || '',
        descripcion: tareaEditar.descripcion || '',
        asignado_a: tareaEditar.asignado_a || '',
        fecha_vencimiento: tareaEditar.fecha_vencimiento
          ? new Date(tareaEditar.fecha_vencimiento).toISOString().slice(0, 16)
          : '',
        estado: tareaEditar.estado,
      })
    } else if (abierto) {
      // Resetear formulario para nueva tarea
      setFormData({
        titulo: '',
        descripcion: '',
        asignado_a: '',
        fecha_vencimiento: '',
        estado: 'pendiente',
      })
    }
  }, [tareaEditar, abierto])

  // Obtener usuario actual por defecto
  useEffect(() => {
    if (abierto && !tareaEditar && !formData.asignado_a) {
      obtenerUsuarioActual()
    }
  }, [abierto, tareaEditar])

  const cargarUsuarios = async () => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nombre')
        .order('nombre')

      if (error) throw error
      setUsuarios(data || [])
    } catch (error) {
      console.error('Error al cargar usuarios:', error)
    }
  }

  const obtenerUsuarioActual = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: usuario } = await supabase
          .from('usuarios')
          .select('id')
          .eq('id', user.id)
          .single()

        if (usuario) {
          setFormData(prev => ({ ...prev, asignado_a: usuario.id }))
        }
      }
    } catch (error) {
      console.error('Error al obtener usuario actual:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const datos: CrearTareaData | ActualizarTareaData = {
        titulo: formData.titulo,
        descripcion: formData.descripcion || undefined,
        asignado_a: formData.asignado_a || undefined,
        fecha_vencimiento: formData.fecha_vencimiento
          ? new Date(formData.fecha_vencimiento).toISOString()
          : undefined,
        ...(tareaEditar ? { estado: formData.estado } : {}),
        ...(clienteId && !tareaEditar ? { cliente_id: clienteId } : {}),
        ...(presupuestoId && !tareaEditar ? { presupuesto_id: presupuestoId } : {}),
      }

      await onGuardar(datos)
      onCerrar()
    } catch (error) {
      console.error('Error al guardar tarea:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={onCerrar}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {tareaEditar ? 'Editar Tarea' : 'Nueva Tarea'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
              placeholder="Ej: Seguimiento de presupuesto PRES-2025-001"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
              placeholder="Detalles adicionales de la tarea..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="asignado_a">Asignado a</Label>
              <Select
                value={formData.asignado_a}
                onValueChange={(value) => setFormData(prev => ({ ...prev, asignado_a: value }))}
              >
                <SelectTrigger id="asignado_a">
                  <SelectValue placeholder="Seleccionar usuario" />
                </SelectTrigger>
                <SelectContent>
                  {usuarios.map((usuario) => (
                    <SelectItem key={usuario.id} value={usuario.id}>
                      {usuario.nombre || usuario.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {tareaEditar && (
              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Select
                  value={formData.estado}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, estado: value }))}
                >
                  <SelectTrigger id="estado">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="en_progreso">En progreso</SelectItem>
                    <SelectItem value="completada">Completada</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fecha_vencimiento">Fecha de vencimiento</Label>
            <Input
              id="fecha_vencimiento"
              type="datetime-local"
              value={formData.fecha_vencimiento}
              onChange={(e) => setFormData(prev => ({ ...prev, fecha_vencimiento: e.target.value }))}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCerrar} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.titulo.trim()}>
              {loading ? 'Guardando...' : tareaEditar ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

