/**
 * Validación de los mensajes multimodales que llegan del navegador.
 *
 * El contenido de un mensaje puede ser texto suelto o una lista de partes
 * (texto + audio + imágenes). Como esas partes viajan al modelo y se pagan por
 * token, se valida forma y tamaño acá antes de mandar nada.
 */
import type { Mensaje } from './openrouter'

/** Formatos de audio que aceptan los modelos multimodales de OpenRouter. */
const FORMATOS_AUDIO = ['wav', 'mp3', 'ogg', 'flac', 'm4a', 'aac']

/** Tope por adjunto (en base64, que es ~33% más grande que el binario). */
const MAX_BASE64_BYTES = 4 * 1024 * 1024 // ~3 MB de archivo real
const MAX_ADJUNTOS_POR_MENSAJE = 4
const MAX_LARGO_TEXTO = 4000

export class AdjuntoInvalido extends Error {}

type Parte =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }
  | { type: 'input_audio'; input_audio: { data: string; format: string } }

function validarParte(parte: any): Parte {
  if (!parte || typeof parte !== 'object') {
    throw new AdjuntoInvalido('El mensaje tiene un formato que no reconozco.')
  }

  if (parte.type === 'text') {
    return { type: 'text', text: String(parte.text ?? '').slice(0, MAX_LARGO_TEXTO) }
  }

  if (parte.type === 'image_url') {
    const url = String(parte.image_url?.url ?? '')

    // Solo data URIs de imagen: no se permite que el navegador haga que el
    // servidor salga a buscar una URL arbitraria.
    if (!url.startsWith('data:image/')) {
      throw new AdjuntoInvalido('Las imágenes tienen que adjuntarse desde el dispositivo.')
    }
    if (url.length > MAX_BASE64_BYTES) {
      throw new AdjuntoInvalido('La imagen es demasiado grande. Probá con una foto más liviana.')
    }

    return { type: 'image_url', image_url: { url } }
  }

  if (parte.type === 'input_audio') {
    const data = String(parte.input_audio?.data ?? '')
    const formato = String(parte.input_audio?.format ?? '').toLowerCase()

    if (!data) throw new AdjuntoInvalido('El audio llegó vacío.')
    if (!FORMATOS_AUDIO.includes(formato)) {
      throw new AdjuntoInvalido(`Formato de audio no soportado: ${formato || 'desconocido'}.`)
    }
    if (data.length > MAX_BASE64_BYTES) {
      throw new AdjuntoInvalido('El audio es demasiado largo. Probá con un mensaje más corto.')
    }

    return { type: 'input_audio', input_audio: { data, format: formato } }
  }

  throw new AdjuntoInvalido(`Tipo de contenido no soportado: ${parte.type}.`)
}

function validarContenido(content: any): string | Parte[] {
  if (typeof content === 'string') return content.slice(0, MAX_LARGO_TEXTO)

  if (!Array.isArray(content)) {
    throw new AdjuntoInvalido('El mensaje tiene un formato que no reconozco.')
  }

  const adjuntos = content.filter((p: any) => p?.type === 'image_url' || p?.type === 'input_audio')
  if (adjuntos.length > MAX_ADJUNTOS_POR_MENSAJE) {
    throw new AdjuntoInvalido(`Se pueden mandar hasta ${MAX_ADJUNTOS_POR_MENSAJE} adjuntos por mensaje.`)
  }

  return content.map(validarParte)
}

/**
 * Reemplaza los adjuntos de un mensaje viejo por una nota de texto.
 *
 * El audio y las imágenes se mandan una sola vez: reenviar toda la galería en
 * cada pregunta multiplicaría el costo sin aportar nada, porque el modelo ya
 * transcribió o describió el adjunto en su respuesta anterior.
 */
function resumirAdjuntos(content: string | Parte[]): string | Parte[] {
  if (typeof content === 'string') return content

  const textos: string[] = []
  let audios = 0
  let imagenes = 0

  for (const parte of content) {
    if (parte.type === 'text') textos.push(parte.text)
    else if (parte.type === 'input_audio') audios++
    else if (parte.type === 'image_url') imagenes++
  }

  const notas: string[] = []
  if (audios) notas.push(`[${audios} audio${audios > 1 ? 's' : ''} de un mensaje anterior]`)
  if (imagenes) notas.push(`[${imagenes} imagen${imagenes > 1 ? 'es' : ''} de un mensaje anterior]`)

  return [...textos, ...notas].join(' ').trim() || '[adjunto de un mensaje anterior]'
}

/**
 * Valida el historial que llega del cliente y deja los adjuntos solo en el
 * último mensaje del usuario, que es el que se está respondiendo ahora.
 */
export function prepararHistorial(mensajes: any[], maxMensajes: number): Mensaje[] {
  const conversacion = mensajes
    .filter((m) => m?.role === 'user' || m?.role === 'assistant')
    .slice(-maxMensajes)

  const indiceUltimoUsuario = conversacion.map((m) => m.role).lastIndexOf('user')

  return conversacion.map((mensaje, indice) => {
    const contenido = validarContenido(mensaje.content)

    return {
      role: mensaje.role,
      content: indice === indiceUltimoUsuario ? contenido : resumirAdjuntos(contenido),
    }
  })
}
