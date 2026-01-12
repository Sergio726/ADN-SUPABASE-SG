'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { Clock, Plus, Trash2, Save, Calendar, AlertCircle } from 'lucide-react'
import {
  obtenerHorarios,
  guardarHorario,
  eliminarHorario,
  obtenerDiasEspeciales,
  guardarDiaEspecial,
  eliminarDiaEspecial,
  obtenerNombreDia,
  obtenerNombreTipoAtencion,
  type HorarioAtencion,
  type DiaEspecial,
  type TipoAtencion,
  type TipoDiaEspecial,
} from '@/lib/horarios-service'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

const DIAS_SEMANA = [
  { valor: 1, nombre: 'Lunes' },
  { valor: 2, nombre: 'Martes' },
  { valor: 3, nombre: 'Miércoles' },
  { valor: 4, nombre: 'Jueves' },
  { valor: 5, nombre: 'Viernes' },
  { valor: 6, nombre: 'Sábado' },
  { valor: 0, nombre: 'Domingo' },
]

const TIPOS_ATENCION: { valor: TipoAtencion; nombre: string }[] = [
  { valor: 'presencial', nombre: 'Presencial' },
  { valor: 'telefonica', nombre: 'Telefónica' },
  { valor: 'online', nombre: 'Online' },
]

const TIPOS_DIA_ESPECIAL: { valor: TipoDiaEspecial; nombre: string }[] = [
  { valor: 'feriado', nombre: 'Feriado' },
  { valor: 'cierre', nombre: 'Cierre' },
]

export default function ConfiguracionHorariosPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [horarios, setHorarios] = useState<any[]>([])
  const [diasEspeciales, setDiasEspeciales] = useState<DiaEspecial[]>([])
  
  // Estados para formulario de horario
  const [mostrarFormHorario, setMostrarFormHorario] = useState(false)
  const [horarioEditando, setHorarioEditando] = useState<HorarioAtencion | null>(null)
  const [formHorario, setFormHorario] = useState<Partial<HorarioAtencion>>({
    tipo_atencion: 'presencial',
    dia_semana: 1,
    hora_inicio: '08:00',
    hora_fin: '18:00',
    activo: true,
  })

  // Estados para formulario de día especial
  const [mostrarFormDiaEspecial, setMostrarFormDiaEspecial] = useState(false)
  const [diaEspecialEditando, setDiaEspecialEditando] = useState<DiaEspecial | null>(null)
  const [formDiaEspecial, setFormDiaEspecial] = useState<Partial<DiaEspecial>>({
    fecha: '',
    tipo: 'feriado',
    descripcion: '',
    activo: true,
  })

  // Estado para confirmación de eliminación
  const [eliminandoHorario, setEliminandoHorario] = useState<string | null>(null)
  const [eliminandoDiaEspecial, setEliminandoDiaEspecial] = useState<string | null>(null)

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    setLoading(true)
    try {
      const [horariosData, diasData] = await Promise.all([
        obtenerHorarios(),
        obtenerDiasEspeciales(),
      ])
      setHorarios(horariosData)
      setDiasEspeciales(diasData)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos: ' + (error.message || 'Error desconocido'),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  function abrirFormHorario(horario?: any) {
    if (horario) {
      setHorarioEditando(horario)
      setFormHorario({
        id: horario.id,
        tipo_atencion: horario.tipo_atencion,
        dia_semana: horario.dia_semana,
        hora_inicio: horario.hora_inicio,
        hora_fin: horario.hora_fin,
        activo: horario.activo,
      })
    } else {
      setHorarioEditando(null)
      setFormHorario({
        tipo_atencion: 'presencial',
        dia_semana: 1,
        hora_inicio: '08:00',
        hora_fin: '18:00',
        activo: true,
      })
    }
    setMostrarFormHorario(true)
  }

  function cerrarFormHorario() {
    setMostrarFormHorario(false)
    setHorarioEditando(null)
    setFormHorario({
      tipo_atencion: 'presencial',
      dia_semana: 1,
      hora_inicio: '08:00',
      hora_fin: '18:00',
      activo: true,
    })
  }

  function validarHorario(): boolean {
    if (!formHorario.hora_inicio || !formHorario.hora_fin) {
      toast({
        title: 'Error de validación',
        description: 'Debe completar hora de inicio y fin',
        variant: 'destructive',
      })
      return false
    }

    if (formHorario.hora_inicio >= formHorario.hora_fin) {
      toast({
        title: 'Error de validación',
        description: 'La hora de inicio debe ser menor que la hora de fin',
        variant: 'destructive',
      })
      return false
    }

    return true
  }

  async function guardarHorarioHandler() {
    if (!validarHorario()) return

    setSaving(true)
    try {
      const horarioData: HorarioAtencion = {
        id: formHorario.id,
        tipo_atencion: formHorario.tipo_atencion as TipoAtencion,
        dia_semana: formHorario.dia_semana!,
        hora_inicio: formHorario.hora_inicio!,
        hora_fin: formHorario.hora_fin!,
        activo: formHorario.activo ?? true,
      }

      await guardarHorario(horarioData)
      toast({
        title: 'Éxito',
        description: horarioEditando ? 'Horario actualizado correctamente' : 'Horario creado correctamente',
      })
      cerrarFormHorario()
      cargarDatos()
    } catch (error: any) {
      // El mensaje de error ya viene formateado desde el servicio
      const mensajeError = error.message || 'Error desconocido'
      toast({
        title: 'Error',
        description: mensajeError,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  async function eliminarHorarioHandler(id: string) {
    setSaving(true)
    try {
      await eliminarHorario(id)
      toast({
        title: 'Éxito',
        description: 'Horario eliminado correctamente',
      })
      setEliminandoHorario(null)
      cargarDatos()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el horario: ' + (error.message || 'Error desconocido'),
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  function abrirFormDiaEspecial(diaEspecial?: DiaEspecial) {
    if (diaEspecial) {
      setDiaEspecialEditando(diaEspecial)
      setFormDiaEspecial({
        id: diaEspecial.id,
        fecha: diaEspecial.fecha,
        tipo: diaEspecial.tipo,
        descripcion: diaEspecial.descripcion,
        activo: diaEspecial.activo,
      })
    } else {
      setDiaEspecialEditando(null)
      setFormDiaEspecial({
        fecha: '',
        tipo: 'feriado',
        descripcion: '',
        activo: true,
      })
    }
    setMostrarFormDiaEspecial(true)
  }

  function cerrarFormDiaEspecial() {
    setMostrarFormDiaEspecial(false)
    setDiaEspecialEditando(null)
    setFormDiaEspecial({
      fecha: '',
      tipo: 'feriado',
      descripcion: '',
      activo: true,
    })
  }

  async function guardarDiaEspecialHandler() {
    if (!formDiaEspecial.fecha) {
      toast({
        title: 'Error de validación',
        description: 'Debe seleccionar una fecha',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      const diaEspecialData: DiaEspecial = {
        id: formDiaEspecial.id,
        fecha: formDiaEspecial.fecha,
        tipo: formDiaEspecial.tipo as TipoDiaEspecial,
        descripcion: formDiaEspecial.descripcion,
        activo: formDiaEspecial.activo ?? true,
      }

      await guardarDiaEspecial(diaEspecialData)
      toast({
        title: 'Éxito',
        description: diaEspecialEditando ? 'Día especial actualizado correctamente' : 'Día especial creado correctamente',
      })
      cerrarFormDiaEspecial()
      cargarDatos()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'No se pudo guardar el día especial: ' + (error.message || 'Error desconocido'),
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  async function eliminarDiaEspecialHandler(id: string) {
    setSaving(true)
    try {
      await eliminarDiaEspecial(id)
      toast({
        title: 'Éxito',
        description: 'Día especial eliminado correctamente',
      })
      setEliminandoDiaEspecial(null)
      cargarDatos()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el día especial: ' + (error.message || 'Error desconocido'),
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  function obtenerHorariosPorTipo(tipo: TipoAtencion) {
    return horarios.filter((h) => h.tipo_atencion === tipo)
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Clock className="h-8 w-8" />
            Configuración de Horarios de Atención
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestiona los horarios de atención y días especiales de tu negocio
          </p>
        </div>
      </div>

      {/* Horarios de Atención */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Horarios de Atención</CardTitle>
              <CardDescription>
                Configura los horarios de atención por tipo y día de la semana
              </CardDescription>
            </div>
            <Button onClick={() => abrirFormHorario()}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Horario
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {TIPOS_ATENCION.map((tipo) => {
            const horariosTipo = obtenerHorariosPorTipo(tipo.valor)
            return (
              <div key={tipo.valor} className="mb-6 last:mb-0">
                <h3 className="text-lg font-semibold mb-3">{tipo.nombre}</h3>
                {horariosTipo.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay horarios configurados</p>
                ) : (
                  <div className="space-y-2">
                    {horariosTipo.map((horario) => (
                      <div
                        key={horario.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="font-medium w-24">{horario.dia_nombre}</div>
                          <div className="text-sm text-muted-foreground">
                            {horario.hora_inicio} - {horario.hora_fin}
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={horario.activo}
                              onCheckedChange={async (checked) => {
                                try {
                                  await guardarHorario({ ...horario, activo: checked })
                                  cargarDatos()
                                } catch (error: any) {
                                  toast({
                                    title: 'Error',
                                    description: 'No se pudo actualizar el horario',
                                    variant: 'destructive',
                                  })
                                }
                              }}
                            />
                            <span className="text-xs text-muted-foreground">
                              {horario.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => abrirFormHorario(horario)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setEliminandoHorario(horario.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Días Especiales */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Días Especiales</CardTitle>
              <CardDescription>
                Gestiona feriados y días de cierre
              </CardDescription>
            </div>
            <Button onClick={() => abrirFormDiaEspecial()}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Día Especial
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {diasEspeciales.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay días especiales configurados</p>
          ) : (
            <div className="space-y-2">
              {diasEspeciales.map((dia) => (
                <div
                  key={dia.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div className="font-medium">
                      {new Date(dia.fecha).toLocaleDateString('es-AR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {TIPOS_DIA_ESPECIAL.find((t) => t.valor === dia.tipo)?.nombre}
                    </div>
                    {dia.descripcion && (
                      <div className="text-sm text-muted-foreground">{dia.descripcion}</div>
                    )}
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={dia.activo}
                        onCheckedChange={async (checked) => {
                          try {
                            await guardarDiaEspecial({ ...dia, activo: checked })
                            cargarDatos()
                          } catch (error: any) {
                            toast({
                              title: 'Error',
                              description: 'No se pudo actualizar el día especial',
                              variant: 'destructive',
                            })
                          }
                        }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {dia.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => abrirFormDiaEspecial(dia)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setEliminandoDiaEspecial(dia.id!)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formulario de Horario */}
      {mostrarFormHorario && (
        <Card>
          <CardHeader>
            <CardTitle>{horarioEditando ? 'Editar Horario' : 'Nuevo Horario'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Tipo de Atención</Label>
                <Select
                  value={formHorario.tipo_atencion}
                  onValueChange={(value) =>
                    setFormHorario({ ...formHorario, tipo_atencion: value as TipoAtencion })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_ATENCION.map((tipo) => (
                      <SelectItem key={tipo.valor} value={tipo.valor}>
                        {tipo.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Día de la Semana</Label>
                <Select
                  value={formHorario.dia_semana?.toString()}
                  onValueChange={(value) =>
                    setFormHorario({ ...formHorario, dia_semana: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIAS_SEMANA.map((dia) => (
                      <SelectItem key={dia.valor} value={dia.valor.toString()}>
                        {dia.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Hora de Inicio</Label>
                <Input
                  type="time"
                  value={formHorario.hora_inicio}
                  onChange={(e) =>
                    setFormHorario({ ...formHorario, hora_inicio: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Hora de Fin</Label>
                <Input
                  type="time"
                  value={formHorario.hora_fin}
                  onChange={(e) => setFormHorario({ ...formHorario, hora_fin: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formHorario.activo}
                onCheckedChange={(checked) =>
                  setFormHorario({ ...formHorario, activo: checked })
                }
              />
              <Label>Activo</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={cerrarFormHorario}>
                Cancelar
              </Button>
              <Button onClick={guardarHorarioHandler} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulario de Día Especial */}
      {mostrarFormDiaEspecial && (
        <Card>
          <CardHeader>
            <CardTitle>{diaEspecialEditando ? 'Editar Día Especial' : 'Nuevo Día Especial'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={formDiaEspecial.fecha}
                  onChange={(e) => setFormDiaEspecial({ ...formDiaEspecial, fecha: e.target.value })}
                />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select
                  value={formDiaEspecial.tipo}
                  onValueChange={(value) =>
                    setFormDiaEspecial({ ...formDiaEspecial, tipo: value as TipoDiaEspecial })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_DIA_ESPECIAL.map((tipo) => (
                      <SelectItem key={tipo.valor} value={tipo.valor}>
                        {tipo.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label>Descripción (opcional)</Label>
                <Input
                  value={formDiaEspecial.descripcion}
                  onChange={(e) =>
                    setFormDiaEspecial({ ...formDiaEspecial, descripcion: e.target.value })
                  }
                  placeholder="Ej: Día de la Independencia"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formDiaEspecial.activo}
                onCheckedChange={(checked) =>
                  setFormDiaEspecial({ ...formDiaEspecial, activo: checked })
                }
              />
              <Label>Activo</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={cerrarFormDiaEspecial}>
                Cancelar
              </Button>
              <Button onClick={guardarDiaEspecialHandler} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Diálogo de confirmación eliminar horario */}
      <AlertDialog open={eliminandoHorario !== null} onOpenChange={(open) => !open && setEliminandoHorario(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar horario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El horario será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => eliminandoHorario && eliminarHorarioHandler(eliminandoHorario)}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de confirmación eliminar día especial */}
      <AlertDialog open={eliminandoDiaEspecial !== null} onOpenChange={(open) => !open && setEliminandoDiaEspecial(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar día especial?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El día especial será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => eliminandoDiaEspecial && eliminarDiaEspecialHandler(eliminandoDiaEspecial)}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

