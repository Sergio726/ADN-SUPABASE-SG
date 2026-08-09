/**
 * Ejecuta una acción del asistente que el vendedor ya confirmó.
 *
 * Este endpoint es el único que escribe. Se llama desde el botón "Confirmar"
 * de la tarjeta de propuesta, nunca desde el modelo.
 *
 * Los datos que llegan son referencias (ids, metros, textos): los importes se
 * recalculan del lado del servidor, así que manipular el pedido no cambia el
 * total que queda guardado. Además todo pasa por la sesión del vendedor, o sea
 * que siguen valiendo las políticas RLS.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { ejecutarAccion, esAccion, AccionInvalida } from '@/lib/ai/acciones'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Necesitás iniciar sesión.' }, { status: 401 })
    }

    const body = await request.json()
    const accion = String(body?.accion || '')

    if (!esAccion(accion)) {
      return NextResponse.json({ error: 'Acción no reconocida.' }, { status: 400 })
    }

    const resultado = await ejecutarAccion(supabase, accion, body?.datos || {}, session.user.id)

    return NextResponse.json(resultado)
  } catch (error: any) {
    console.error('[asistente/ejecutar] Error:', error)

    if (error instanceof AccionInvalida) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'No se pudo completar la acción. Revisá los logs del servidor.' },
      { status: 500 }
    )
  }
}
