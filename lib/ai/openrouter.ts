/**
 * Cliente mínimo de OpenRouter.
 *
 * OpenRouter expone la API de OpenAI Chat Completions, así que alcanza con
 * fetch: no hace falta sumar un SDK. La API key vive SOLO en el servidor
 * (OPENROUTER_API_KEY, sin prefijo NEXT_PUBLIC_): nunca se manda al browser.
 */

const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions'

export type Rol = 'system' | 'user' | 'assistant' | 'tool'

export interface Mensaje {
  role: Rol
  content: any
  tool_calls?: ToolCall[]
  tool_call_id?: string
  name?: string
}

export interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

export interface DefinicionTool {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, any>
  }
}

export interface RespuestaChat {
  mensaje: Mensaje
  finish_reason: string | null
  uso?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
}

export class OpenRouterError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message)
    this.name = 'OpenRouterError'
  }
}

export async function chatCompletion(opciones: {
  modelo: string
  mensajes: Mensaje[]
  tools?: DefinicionTool[]
  temperatura?: number
  signal?: AbortSignal
}): Promise<RespuestaChat> {
  const apiKey = process.env.OPENROUTER_API_KEY

  if (!apiKey) {
    throw new OpenRouterError(
      'Falta OPENROUTER_API_KEY. Cargala en .env.local (y en Vercel) para usar el asistente.'
    )
  }

  const respuesta = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      // OpenRouter usa estos headers para atribuir el tráfico a la app
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      'X-Title': 'Alambres del Norte — Asistente',
    },
    body: JSON.stringify({
      model: opciones.modelo,
      messages: opciones.mensajes,
      ...(opciones.tools?.length ? { tools: opciones.tools, tool_choice: 'auto' } : {}),
      temperature: opciones.temperatura ?? 0.2,
    }),
    signal: opciones.signal,
  })

  if (!respuesta.ok) {
    const detalle = await respuesta.text().catch(() => '')
    throw new OpenRouterError(
      `OpenRouter respondió ${respuesta.status}: ${detalle.slice(0, 500)}`,
      respuesta.status
    )
  }

  const data = await respuesta.json()
  const choice = data?.choices?.[0]

  if (!choice) {
    throw new OpenRouterError('OpenRouter no devolvió ninguna respuesta')
  }

  return {
    mensaje: choice.message,
    finish_reason: choice.finish_reason ?? null,
    uso: data?.usage,
  }
}
