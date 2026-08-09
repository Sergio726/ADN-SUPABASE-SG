'use client'

/**
 * Asistente de ventas — widget flotante del dashboard.
 *
 * Fase 1: solo texto y solo consultas de lectura. La grabación de voz y el
 * envío de imágenes se suman en la Fase 2 sobre este mismo componente.
 */
import { useEffect, useRef, useState } from 'react'
import { Bot, Send, X, Loader2, Trash2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RespuestaAsistente } from '@/components/RespuestaAsistente'

interface MensajeChat {
  role: 'user' | 'assistant'
  content: string
}

const SUGERENCIAS = [
  '¿Cuánto sale el rollo de tejido cal.14 de 1,80 con rombo 2,5?',
  'Cotizame 120 metros de cerco olímpico',
  '¿Qué presupuestos están enviados sin respuesta?',
]

export function AsistenteWidget() {
  const [abierto, setAbierto] = useState(false)
  const [mensajes, setMensajes] = useState<MensajeChat[]>([])
  const [entrada, setEntrada] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const finDelHilo = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (abierto) {
      finDelHilo.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [mensajes, cargando, abierto])

  useEffect(() => {
    if (abierto) inputRef.current?.focus()
  }, [abierto])

  async function enviar(texto: string) {
    const consulta = texto.trim()
    if (!consulta || cargando) return

    const nuevos: MensajeChat[] = [...mensajes, { role: 'user', content: consulta }]
    setMensajes(nuevos)
    setEntrada('')
    setError(null)
    setCargando(true)

    try {
      const respuesta = await fetch('/api/asistente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensajes: nuevos }),
      })

      const datos = await respuesta.json()

      if (!respuesta.ok) {
        throw new Error(datos?.error || 'No se pudo consultar al asistente.')
      }

      setMensajes([...nuevos, { role: 'assistant', content: datos.respuesta || '(sin respuesta)' }])
    } catch (e: any) {
      console.error('Error del asistente:', e)
      setError(e?.message || 'No se pudo consultar al asistente.')
    } finally {
      setCargando(false)
    }
  }

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:scale-105 hover:shadow-xl"
        aria-label="Abrir asistente de ventas"
        title="Asistente de ventas"
      >
        <Bot className="h-6 w-6" />
      </button>
    )
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l bg-background shadow-2xl sm:max-w-md">
      {/* Encabezado */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">Asistente de ventas</p>
            <p className="text-xs text-muted-foreground">Consultas de precios y cotizaciones</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {mensajes.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setMensajes([])
                setError(null)
              }}
              title="Limpiar conversación"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => setAbierto(false)} aria-label="Cerrar asistente">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Conversación */}
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {mensajes.length === 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Preguntame por precios, tejidos, cercos, clientes o presupuestos. Puedo buscar los datos
              del sistema, pero todavía no puedo cargar ni modificar nada.
            </p>
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Para empezar
              </p>
              {SUGERENCIAS.map((sugerencia) => (
                <button
                  key={sugerencia}
                  onClick={() => enviar(sugerencia)}
                  className="w-full rounded-lg border border-border/60 px-3 py-2 text-left text-sm transition hover:bg-muted"
                >
                  {sugerencia}
                </button>
              ))}
            </div>
          </div>
        )}

        {mensajes.map((mensaje, idx) => (
          <div key={idx} className={mensaje.role === 'user' ? 'flex justify-end' : ''}>
            {mensaje.role === 'user' ? (
              <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground">
                {mensaje.content}
              </div>
            ) : (
              <div className="rounded-2xl rounded-bl-sm bg-muted px-3 py-2">
                <RespuestaAsistente texto={mensaje.content} />
              </div>
            )}
          </div>
        ))}

        {cargando && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Buscando en el sistema…
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div ref={finDelHilo} />
      </div>

      {/* Entrada */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          enviar(entrada)
        }}
        className="border-t p-3"
      >
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={entrada}
            onChange={(e) => setEntrada(e.target.value)}
            placeholder="Preguntá por un precio o una cotización…"
            disabled={cargando}
          />
          <Button type="submit" size="sm" disabled={cargando || !entrada.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Las cotizaciones son informativas: para dejarlas firmes hay que cargar el presupuesto.
        </p>
      </form>
    </div>
  )
}
