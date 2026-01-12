'use client'

import { useEffect, useState } from 'react'
import { Clock, CheckCircle2, XCircle } from 'lucide-react'
import {
  obtenerHorarios,
  estaEnHorarioAtencion,
  obtenerNombreDia,
  obtenerNombreTipoAtencion,
  formatearHoraCorta,
  type HorarioCompleto,
  type TipoAtencion,
} from '@/lib/horarios-service'

interface HorariosAtencionProps {
  tipoAtencion?: TipoAtencion // Si no se especifica, muestra todos
  mostrarEstado?: boolean // Si muestra el estado actual (en horario/fuera de horario)
  compacto?: boolean // Versión compacta para footer
}

export default function HorariosAtencion({
  tipoAtencion,
  mostrarEstado = false,
  compacto = false,
}: HorariosAtencionProps) {
  const [horarios, setHorarios] = useState<HorarioCompleto[]>([])
  const [enHorario, setEnHorario] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarHorarios()
    
    // Actualizar el estado cada minuto si se muestra el estado
    if (mostrarEstado && tipoAtencion) {
      const intervalo = setInterval(() => {
        verificarEstado()
      }, 60000) // Actualizar cada minuto
      
      return () => clearInterval(intervalo)
    }
  }, [tipoAtencion, mostrarEstado])

  async function verificarEstado() {
    if (tipoAtencion) {
      try {
        const estaEnHorarioActual = await estaEnHorarioAtencion(tipoAtencion)
        setEnHorario(estaEnHorarioActual)
      } catch (error) {
        console.error('Error al verificar estado:', error)
      }
    }
  }

  async function cargarHorarios() {
    try {
      const todosHorarios = await obtenerHorarios()
      
      // Filtrar por tipo si se especifica
      let horariosFiltrados = todosHorarios.filter((h) => h.activo)
      if (tipoAtencion) {
        horariosFiltrados = horariosFiltrados.filter((h) => h.tipo_atencion === tipoAtencion)
      }

      setHorarios(horariosFiltrados)
      setLoading(false)

      // Verificar si está en horario si se requiere (no bloquea la carga si falla)
      if (mostrarEstado && tipoAtencion) {
        try {
          const estaEnHorarioActual = await estaEnHorarioAtencion(tipoAtencion)
          setEnHorario(estaEnHorarioActual)
        } catch (error) {
          console.error('Error al verificar estado en cargarHorarios:', error)
          // No bloqueamos la carga si falla la verificación de estado
        }
      }
    } catch (error) {
      console.error('Error al cargar horarios:', error)
      setLoading(false)
      // Asegurar que se muestre algo aunque falle
      setHorarios([])
    }
  }

  // Agrupar horarios por tipo de atención
  const horariosPorTipo = horarios.reduce((acc, horario) => {
    if (!acc[horario.tipo_atencion]) {
      acc[horario.tipo_atencion] = []
    }
    acc[horario.tipo_atencion].push(horario)
    return acc
  }, {} as Record<string, HorarioCompleto[]>)

  // Ordenar días de la semana
  const ordenDias = [1, 2, 3, 4, 5, 6, 0] // Lunes a Domingo

  if (loading) {
    return (
      <div className="text-sm text-gray-400">
        <Clock className="h-4 w-4 inline mr-2" />
        Cargando horarios...
      </div>
    )
  }

  if (horarios.length === 0) {
    return (
      <div className="text-sm text-gray-400">
        <Clock className="h-4 w-4 inline mr-2" />
        Horarios no configurados
      </div>
    )
  }

  if (compacto) {
    // Versión compacta para footer
    const tiposMostrar = tipoAtencion ? [tipoAtencion] : Object.keys(horariosPorTipo)
    const primerTipo = tiposMostrar[0] as TipoAtencion
    const horariosPrimerTipo = horariosPorTipo[primerTipo] || []

    // Agrupar días consecutivos con mismo horario
    const horariosAgrupados: Array<{ dias: string[]; hora: string }> = []
    const horariosPorHora = horariosPrimerTipo.reduce((acc, h) => {
      const key = `${h.hora_inicio}-${h.hora_fin}`
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(h)
      return acc
    }, {} as Record<string, HorarioCompleto[]>)

    Object.entries(horariosPorHora).forEach(([hora, horariosHora]) => {
      const dias = horariosHora.map((h) => h.dia_semana).sort((a, b) => ordenDias.indexOf(a) - ordenDias.indexOf(b))
      const diasNombres = dias.map((d) => obtenerNombreDia(d))
      horariosAgrupados.push({
        dias: diasNombres,
        hora: hora.split('-')[0] + ' - ' + hora.split('-')[1],
      })
    })

    return (
      <div className="space-y-1">
        {horariosAgrupados.map((grupo, idx) => {
          const [horaInicio, horaFin] = grupo.hora.split(' - ')
          return (
            <div key={idx} className="text-sm text-gray-400">
              <strong className="text-white">{grupo.dias.join(', ')}:</strong> {formatearHoraCorta(horaInicio)} - {formatearHoraCorta(horaFin)}
            </div>
          )
        })}
      </div>
    )
  }

  // Versión completa
  return (
    <div className="space-y-4">
      {Object.entries(horariosPorTipo).map(([tipo, horariosTipo]) => (
        <div key={tipo} className="space-y-3">
          <h4 className="font-semibold text-gray-900 flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-brand-red" />
            {obtenerNombreTipoAtencion(tipo as TipoAtencion)}
          </h4>
          <div className="space-y-2 bg-gray-50 rounded-lg p-3 border border-gray-200">
            {ordenDias.map((diaNum) => {
              const horarioDia = horariosTipo.find((h) => h.dia_semana === diaNum)
              if (!horarioDia) return null
              return (
                <div key={diaNum} className="flex justify-between items-center text-sm py-1">
                  <span className="font-medium text-gray-700">{obtenerNombreDia(diaNum)}</span>
                  <span className="text-brand-red font-semibold">
                    {formatearHoraCorta(horarioDia.hora_inicio)} - {formatearHoraCorta(horarioDia.hora_fin)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

