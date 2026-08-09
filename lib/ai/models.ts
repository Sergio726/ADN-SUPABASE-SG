/**
 * Selección de modelo de OpenRouter según la modalidad de la consulta.
 *
 * OpenRouter expone la misma API que OpenAI Chat Completions, así que el
 * cambio de modelo es solo cambiar el string del id. Todos los ids se pueden
 * sobreescribir por variable de entorno sin tocar código.
 *
 * Modelos por defecto: Gemini Flash acepta texto, imagen y audio en el mismo
 * endpoint y soporta tool calling, que es lo que necesita el asistente para
 * consultar la base. Si en algún momento se quiere más precisión de
 * razonamiento para texto, alcanza con setear OPENROUTER_MODEL_TEXTO.
 */

export type Modalidad = 'texto' | 'audio' | 'imagen'

const POR_DEFECTO: Record<Modalidad, string> = {
  texto: 'google/gemini-2.5-flash',
  audio: 'google/gemini-2.5-flash',
  imagen: 'google/gemini-2.5-flash',
}

export function modeloPara(modalidad: Modalidad): string {
  switch (modalidad) {
    case 'audio':
      return process.env.OPENROUTER_MODEL_AUDIO || POR_DEFECTO.audio
    case 'imagen':
      return process.env.OPENROUTER_MODEL_IMAGEN || POR_DEFECTO.imagen
    case 'texto':
    default:
      return process.env.OPENROUTER_MODEL_TEXTO || POR_DEFECTO.texto
  }
}

/**
 * Deduce la modalidad a partir del contenido del último mensaje del usuario.
 * Fase 1 solo manda texto; audio e imagen quedan preparados para la Fase 2.
 */
export function detectarModalidad(mensajes: Array<{ content: any }>): Modalidad {
  const ultimo = [...mensajes].reverse().find((m) => Array.isArray(m.content))
  if (!ultimo) return 'texto'

  const partes = ultimo.content as Array<{ type?: string }>
  if (partes.some((p) => p?.type === 'input_audio')) return 'audio'
  if (partes.some((p) => p?.type === 'image_url')) return 'imagen'
  return 'texto'
}
