'use client'

/**
 * Asistente de ventas — widget flotante del dashboard.
 *
 * Fase 1: consultas por texto (solo lectura).
 * Fase 2: dictado por voz y envío de fotos.
 *
 * El contenido de un mensaje del usuario puede ser texto suelto o una lista de
 * partes (texto + audio + imágenes), que es el formato que espera OpenRouter.
 */
import { useEffect, useRef, useState } from 'react'
import {
  Bot, Send, X, Loader2, Trash2, AlertCircle, Mic, Square, ImagePlus, Paperclip,
  ShieldCheck, TriangleAlert, Check, ExternalLink,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RespuestaAsistente } from '@/components/RespuestaAsistente'
import { GrabadorDeVoz, prepararImagen } from '@/lib/ai/grabacion'

/** Acción propuesta por el asistente, a la espera de que el vendedor confirme. */
interface PropuestaAccion {
  accion: string
  titulo: string
  detalle: Array<{ campo: string; valor: string }>
  advertencias?: string[]
  propuesta_token: string
}

type PartePendiente =
  | { tipo: 'audio'; base64: string; duracionSegundos: number }
  | { tipo: 'imagen'; dataUrl: string; nombre: string }

interface MensajeChat {
  role: 'user' | 'assistant'
  /** Texto visible en el hilo */
  content: string
  /** Contenido real que se manda al modelo (con adjuntos), si difiere del texto */
  contenidoParaModelo?: any
  adjuntos?: PartePendiente[]
  /** Acción pendiente de confirmación, si el asistente propuso una */
  propuesta?: PropuestaAccion
  /** Cómo terminó la propuesta, una vez resuelta */
  resultadoAccion?: { estado: 'hecha' | 'cancelada'; mensaje: string; enlace?: string }
}

/**
 * Tope de grabación. A 16 kHz mono, un segundo pesa ~31 KB, que en base64
 * quedan ~41 KB: 60 s son ~2,4 MB. Se eligió ese número para que el pedido
 * entre cómodo debajo del límite de tamaño de request de Vercel (~4,5 MB)
 * aunque el vendedor mande además una foto en el mismo mensaje. Se corta solo
 * para que nadie hable de más y después le rebote el mensaje.
 */
const MAX_SEGUNDOS_GRABACION = 60

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

  // Fase 2: adjuntos pendientes de enviar y estado de grabación
  const [adjuntos, setAdjuntos] = useState<PartePendiente[]>([])
  const [grabando, setGrabando] = useState(false)
  const [procesandoAudio, setProcesandoAudio] = useState(false)
  const [segundosGrabando, setSegundosGrabando] = useState(0)

  // Fase 3: hay una acción de escritura en curso
  const [ejecutandoAccion, setEjecutandoAccion] = useState(false)

  const finDelHilo = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const archivoRef = useRef<HTMLInputElement>(null)
  const grabador = useRef<GrabadorDeVoz | null>(null)

  useEffect(() => {
    if (abierto) {
      finDelHilo.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [mensajes, cargando, abierto])

  useEffect(() => {
    if (abierto) inputRef.current?.focus()
  }, [abierto])

  // Cortar el micrófono si el componente se desmonta con una grabación abierta
  useEffect(() => {
    return () => {
      grabador.current?.cancelar()
      grabador.current = null
    }
  }, [])

  // Contador de la grabación, con corte automático al llegar al tope
  useEffect(() => {
    if (!grabando) {
      setSegundosGrabando(0)
      return
    }

    const intervalo = setInterval(() => {
      setSegundosGrabando((previos) => {
        const siguiente = previos + 1
        if (siguiente >= MAX_SEGUNDOS_GRABACION) {
          // El corte se dispara fuera del setState para no encadenar renders
          setTimeout(() => detenerGrabacion(), 0)
        }
        return siguiente
      })
    }, 1000)

    return () => clearInterval(intervalo)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grabando])

  // ---- Fase 3: confirmar acciones que escriben ----

  async function confirmarAccion(indiceMensaje: number) {
    const propuesta = mensajes[indiceMensaje]?.propuesta
    if (!propuesta || ejecutandoAccion) return

    setEjecutandoAccion(true)
    setError(null)

    try {
      const respuesta = await fetch('/api/asistente/ejecutar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propuesta_token: propuesta.propuesta_token }),
      })

      const datos = await respuesta.json()
      if (!respuesta.ok) throw new Error(datos?.error || 'No se pudo completar la acción.')

      setMensajes((previos) =>
        previos.map((mensaje, i) =>
          i === indiceMensaje
            ? {
                ...mensaje,
                propuesta: undefined,
                resultadoAccion: { estado: 'hecha', mensaje: datos.mensaje, enlace: datos.enlace },
                // El vendedor ve la tarjeta verde; al modelo se le cuenta en
                // texto, para que en el turno siguiente sepa que ya se ejecutó
                contenidoParaModelo: `${mensaje.content}\n\n[Confirmado por el vendedor: ${datos.mensaje}]`,
              }
            : mensaje
        )
      )
    } catch (e: any) {
      console.error('Error al ejecutar la acción:', e)
      setError(e?.message || 'No se pudo completar la acción.')
    } finally {
      setEjecutandoAccion(false)
    }
  }

  function cancelarAccion(indiceMensaje: number) {
    setMensajes((previos) =>
      previos.map((mensaje, i) =>
        i === indiceMensaje
          ? {
              ...mensaje,
              propuesta: undefined,
              resultadoAccion: { estado: 'cancelada', mensaje: 'Cancelaste la acción. No se guardó nada.' },
              contenidoParaModelo: `${mensaje.content}\n\n[El vendedor canceló: no se guardó nada]`,
            }
          : mensaje
      )
    )
  }

  // ---- Fase 2: voz ----

  async function detenerGrabacion() {
    // Sin grabador activo no hay nada que cortar: evita que un corte doble
    // (por ejemplo el automático justo cuando el vendedor aprieta el botón)
    // termine arrancando una grabación nueva.
    if (!grabador.current?.grabando) return

    setGrabando(false)
    setProcesandoAudio(true)

    try {
      const audio = await grabador.current.detener()
      if (audio.duracionSegundos < 0.4) {
        setError('La grabación fue demasiado corta.')
      } else {
        setAdjuntos((previos) => [
          ...previos,
          { tipo: 'audio', base64: audio.base64, duracionSegundos: audio.duracionSegundos },
        ])
      }
    } catch (e: any) {
      console.error('Error al procesar el audio:', e)
      setError(e?.message || 'No se pudo procesar la grabación.')
    } finally {
      setProcesandoAudio(false)
      grabador.current = null
    }
  }

  async function alternarGrabacion() {
    setError(null)

    if (grabando) {
      await detenerGrabacion()
      return
    }

    try {
      grabador.current = new GrabadorDeVoz()
      await grabador.current.iniciar()
      setGrabando(true)
    } catch (e: any) {
      console.error('Error al iniciar la grabación:', e)
      grabador.current = null
      setError(
        e?.name === 'NotAllowedError'
          ? 'Hay que dar permiso al micrófono para dictar.'
          : e?.message || 'No se pudo acceder al micrófono.'
      )
    }
  }

  // ---- Fase 2: imágenes ----

  async function agregarImagen(archivo: File | undefined) {
    if (!archivo) return
    setError(null)

    try {
      const dataUrl = await prepararImagen(archivo)
      setAdjuntos((previos) => [...previos, { tipo: 'imagen', dataUrl, nombre: archivo.name }])
    } catch (e: any) {
      console.error('Error al preparar la imagen:', e)
      setError(e?.message || 'No se pudo adjuntar la imagen.')
    }
  }

  /** Arma el content multimodal que espera OpenRouter. */
  function construirContenido(texto: string, partes: PartePendiente[]) {
    if (!partes.length) return texto

    const contenido: any[] = []
    if (texto) contenido.push({ type: 'text', text: texto })

    for (const parte of partes) {
      if (parte.tipo === 'audio') {
        contenido.push({ type: 'input_audio', input_audio: { data: parte.base64, format: 'wav' } })
      } else {
        contenido.push({ type: 'image_url', image_url: { url: parte.dataUrl } })
      }
    }

    // Si solo hay adjuntos, se le dice al modelo qué hacer con ellos
    if (!texto) {
      contenido.unshift({
        type: 'text',
        text: 'Respondé lo que se pide en el audio o la imagen adjunta.',
      })
    }

    return contenido
  }

  async function enviar(texto: string) {
    const consulta = texto.trim()
    const partes = adjuntos
    if ((!consulta && !partes.length) || cargando || grabando) return

    const descripcion =
      consulta ||
      partes
        .map((p) => (p.tipo === 'audio' ? `🎤 Audio (${p.duracionSegundos}s)` : `🖼️ ${p.nombre}`))
        .join(' · ')

    const nuevos: MensajeChat[] = [
      ...mensajes,
      {
        role: 'user',
        content: descripcion,
        contenidoParaModelo: construirContenido(consulta, partes),
        adjuntos: partes,
      },
    ]

    setMensajes(nuevos)
    setEntrada('')
    setAdjuntos([])
    setError(null)
    setCargando(true)

    try {
      const respuesta = await fetch('/api/asistente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensajes: nuevos.map((m) => ({
            role: m.role,
            content: m.contenidoParaModelo ?? m.content,
          })),
        }),
      })

      const datos = await respuesta.json()

      if (!respuesta.ok) {
        throw new Error(datos?.error || 'No se pudo consultar al asistente.')
      }

      setMensajes([
        ...nuevos,
        {
          role: 'assistant',
          content:
            datos.respuesta ||
            (datos.propuesta ? 'Revisá los datos y confirmá si está bien:' : '(sin respuesta)'),
          propuesta: datos.propuesta,
        },
      ])
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
              Preguntame por precios, tejidos, cercos, clientes o presupuestos. Podés escribir, dictar
              con el micrófono o mandarme una foto. También puedo dejarte un presupuesto en borrador,
              cargar un cliente o anotarte una tarea: siempre te lo muestro antes para que confirmes.
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
              <div className="space-y-2">
                <div className="rounded-2xl rounded-bl-sm bg-muted px-3 py-2">
                  <RespuestaAsistente texto={mensaje.content} />
                </div>

                {/* Acción propuesta: nada se guarda hasta que el vendedor confirme */}
                {mensaje.propuesta && (
                  <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      <p className="text-sm font-semibold">{mensaje.propuesta.titulo}</p>
                    </div>

                    <dl className="mb-3 space-y-1 text-xs">
                      {mensaje.propuesta.detalle.map((fila) => (
                        <div key={fila.campo} className="flex justify-between gap-3">
                          <dt className="text-muted-foreground">{fila.campo}</dt>
                          <dd className="text-right font-medium">{fila.valor}</dd>
                        </div>
                      ))}
                    </dl>

                    {mensaje.propuesta.advertencias?.map((advertencia) => (
                      <div
                        key={advertencia}
                        className="mb-2 flex items-start gap-2 rounded-lg bg-amber-100 px-2 py-1.5 text-[11px] text-amber-900"
                      >
                        <TriangleAlert className="mt-0.5 h-3 w-3 shrink-0" />
                        <span>{advertencia}</span>
                      </div>
                    ))}

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => confirmarAccion(idx)}
                        disabled={ejecutandoAccion}
                      >
                        {ejecutandoAccion ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="mr-1 h-4 w-4" />
                            Confirmar
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => cancelarAccion(idx)}
                        disabled={ejecutandoAccion}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Resultado de una acción ya resuelta */}
                {mensaje.resultadoAccion && (
                  <div
                    className={`rounded-xl border px-3 py-2 text-xs ${
                      mensaje.resultadoAccion.estado === 'hecha'
                        ? 'border-green-300 bg-green-50 text-green-900'
                        : 'border-border bg-muted text-muted-foreground'
                    }`}
                  >
                    <p className="flex items-start gap-2">
                      {mensaje.resultadoAccion.estado === 'hecha' && (
                        <Check className="mt-0.5 h-3 w-3 shrink-0" />
                      )}
                      <span>{mensaje.resultadoAccion.mensaje}</span>
                    </p>
                    {mensaje.resultadoAccion.enlace && (
                      <Link
                        href={mensaje.resultadoAccion.enlace}
                        onClick={() => setAbierto(false)}
                        className="mt-1.5 inline-flex items-center gap-1 font-medium underline"
                      >
                        Abrirlo <ExternalLink className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                )}
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
        {/* Adjuntos pendientes de enviar */}
        {adjuntos.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {adjuntos.map((adjunto, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 rounded-full border bg-muted px-2.5 py-1 text-xs"
              >
                <Paperclip className="h-3 w-3 text-muted-foreground" />
                <span>
                  {adjunto.tipo === 'audio'
                    ? `Audio ${adjunto.duracionSegundos}s`
                    : adjunto.nombre.slice(0, 22)}
                </span>
                <button
                  type="button"
                  onClick={() => setAdjuntos((previos) => previos.filter((_, i) => i !== idx))}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Quitar adjunto"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {grabando && (
          <div className="mb-2 flex items-center justify-between gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-destructive" />
              Grabando… tocá el cuadrado para terminar.
            </span>
            <span className="font-mono tabular-nums">
              {String(Math.floor(segundosGrabando / 60)).padStart(2, '0')}:
              {String(segundosGrabando % 60).padStart(2, '0')}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            ref={archivoRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              agregarImagen(e.target.files?.[0])
              e.target.value = ''
            }}
          />

          <Button
            type="button"
            variant={grabando ? 'destructive' : 'outline'}
            size="sm"
            onClick={alternarGrabacion}
            disabled={cargando || procesandoAudio}
            title={grabando ? 'Terminar grabación' : 'Dictar consulta'}
            aria-label={grabando ? 'Terminar grabación' : 'Dictar consulta'}
          >
            {procesandoAudio ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : grabando ? (
              <Square className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => archivoRef.current?.click()}
            disabled={cargando || grabando}
            title="Adjuntar una foto"
            aria-label="Adjuntar una foto"
          >
            <ImagePlus className="h-4 w-4" />
          </Button>

          <Input
            ref={inputRef}
            value={entrada}
            onChange={(e) => setEntrada(e.target.value)}
            placeholder={grabando ? 'Grabando…' : 'Preguntá, dictá o mandá una foto…'}
            disabled={cargando || grabando}
          />

          <Button
            type="submit"
            size="sm"
            disabled={cargando || grabando || (!entrada.trim() && adjuntos.length === 0)}
          >
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
