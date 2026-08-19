/**
 * Endpoint del asistente de ventas.
 *
 * Corre el loop de tool calling contra OpenRouter: el modelo pide datos, el
 * servidor los busca en Supabase con la sesión del usuario (respetando RLS) y
 * se los devuelve, hasta que el modelo produce la respuesta final.
 *
 * La API key de OpenRouter nunca sale del servidor.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { chatCompletion, OpenRouterError, type Mensaje } from '@/lib/ai/openrouter'
import { DEFINICIONES_TOOLS, ejecutarTool } from '@/lib/ai/tools'
import { SYSTEM_PROMPT, contextoDeSesion } from '@/lib/ai/prompt'
import { detectarModalidad, modeloPara } from '@/lib/ai/models'
import { prepararHistorial, AdjuntoInvalido } from '@/lib/ai/adjuntos'
import {
  DEFINICIONES_ACCIONES,
  prepararAccion,
  esAccion,
  AccionInvalida,
} from '@/lib/ai/acciones'
import { crearAlmacenPropuestasSupabase, crearPropuesta, firmarPropuesta } from '@/lib/ai/propuestas'

// Tope de vueltas del loop: evita que un modelo en bucle dispare consultas sin fin
const MAX_ITERACIONES = 5
const MAX_MENSAJES_HISTORIAL = 20

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // El asistente es interno: sin sesión no responde
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Necesitás iniciar sesión para usar el asistente.' }, { status: 401 })
    }

    const body = await request.json()
    const mensajesEntrada: Mensaje[] = Array.isArray(body?.mensajes) ? body.mensajes : []

    if (!mensajesEntrada.length) {
      return NextResponse.json({ error: 'No llegó ningún mensaje.' }, { status: 400 })
    }

    // Solo se aceptan mensajes de usuario y asistente desde el cliente: el
    // system prompt y los resultados de herramientas los pone el servidor.
    // Se validan los adjuntos y se dejan solo en el último mensaje.
    const historial = prepararHistorial(mensajesEntrada, MAX_MENSAJES_HISTORIAL)

    const modelo = modeloPara(detectarModalidad(historial))

    const mensajes: Mensaje[] = [
      { role: 'system', content: `${SYSTEM_PROMPT}\n\n${contextoDeSesion(session.user.email)}` },
      ...historial,
    ]

    const herramientasUsadas: string[] = []

    for (let iteracion = 0; iteracion < MAX_ITERACIONES; iteracion++) {
      const respuesta = await chatCompletion({
        modelo,
        mensajes,
        tools: [...DEFINICIONES_TOOLS, ...DEFINICIONES_ACCIONES],
      })

      const mensaje = respuesta.mensaje
      mensajes.push(mensaje)

      const toolCalls = mensaje?.tool_calls || []

      // Sin pedidos de herramientas: es la respuesta final
      if (!toolCalls.length) {
        return NextResponse.json({
          respuesta: typeof mensaje.content === 'string' ? mensaje.content : '',
          herramientas_usadas: herramientasUsadas,
          modelo,
        })
      }

      // Ejecutar cada herramienta pedida y devolver el resultado al modelo
      for (const call of toolCalls) {
        let argumentos: any = {}
        try {
          argumentos = call.function.arguments ? JSON.parse(call.function.arguments) : {}
        } catch {
          argumentos = {}
        }

        herramientasUsadas.push(call.function.name)

        // Las acciones que escriben NO se ejecutan acá: se arma una propuesta,
        // se corta el loop y se le muestra al vendedor para que confirme.
        if (esAccion(call.function.name)) {
          try {
            const propuesta = await prepararAccion(supabase, call.function.name, argumentos)
            const secreto = process.env.ASISTENTE_ACCIONES_SECRET || process.env.OPENROUTER_API_KEY
            if (!secreto) throw new Error('Falta configurar el secreto para confirmar acciones del asistente.')
            const propuestaPendiente = await crearPropuesta(
              crearAlmacenPropuestasSupabase(supabase),
              session.user.id,
              propuesta.accion,
              propuesta.datos
            )
            const { datos: _datos, ...propuestaVisible } = propuesta

            return NextResponse.json({
              respuesta:
                typeof mensaje.content === 'string' && mensaje.content ? mensaje.content : '',
              propuesta: {
                ...propuestaVisible,
                propuesta_token: firmarPropuesta(propuestaPendiente, secreto),
              },
              herramientas_usadas: herramientasUsadas,
              modelo,
            })
          } catch (error: any) {
            // Si la propuesta no se puede armar (cliente ambiguo, config sin
            // precio), se le devuelve el motivo al modelo para que repregunte
            if (error instanceof AccionInvalida) {
              mensajes.push({
                role: 'tool',
                tool_call_id: call.id,
                name: call.function.name,
                content: JSON.stringify({ error: error.message }),
              })
              continue
            }
            throw error
          }
        }

        const resultado = await ejecutarTool(supabase, call.function.name, argumentos)

        mensajes.push({
          role: 'tool',
          tool_call_id: call.id,
          name: call.function.name,
          content: JSON.stringify(resultado),
        })
      }
    }

    // Si se agotaron las iteraciones, el modelo quedó dando vueltas
    return NextResponse.json({
      respuesta:
        'Estuve consultando datos pero no logré cerrar una respuesta. Probá acotando la pregunta (por ejemplo, indicando el tipo de cerco y los metros).',
      herramientas_usadas: herramientasUsadas,
      modelo,
    })
  } catch (error: any) {
    console.error('[asistente] Error:', error)

    // Adjunto mal formado o demasiado grande: es culpa del pedido, no del server
    if (error instanceof AdjuntoInvalido) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (error instanceof OpenRouterError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status && error.status >= 400 && error.status < 600 ? error.status : 502 }
      )
    }

    return NextResponse.json(
      { error: 'No se pudo procesar la consulta. Revisá los logs del servidor.' },
      { status: 500 }
    )
  }
}
