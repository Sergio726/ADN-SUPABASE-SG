import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    console.log('Iniciando suscripción...')
    const { email, telefono } = await request.json()
    console.log('Datos recibidos:', { email, telefono })

    // Validaciones básicas
    if (!email) {
      return NextResponse.json(
        { error: 'El email es requerido' },
        { status: 400 }
      )
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'El formato del email no es válido' },
        { status: 400 }
      )
    }

    // Validar teléfono si se proporciona
    if (telefono) {
      const telefonoRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/
      if (!telefonoRegex.test(telefono)) {
        return NextResponse.json(
          { error: 'El formato del teléfono no es válido' },
          { status: 400 }
        )
      }
    }

    const supabase = createServerClient()
    console.log('Cliente Supabase creado')

    // Obtener IP y User Agent
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Determinar tipo de suscripción y descuento
    const tipoSuscripcion = telefono ? 'telefono' : 'email'
    const descuentoPorcentaje = telefono ? 10.00 : 0.00
    const codigoDescuento = telefono ? `DESC${Math.random().toString(36).substr(2, 8).toUpperCase()}` : null

    console.log('Datos a insertar:', {
      nombre: 'Suscriptor Newsletter',
      email,
      telefono: telefono || null,
      mensaje: `Suscripción newsletter - Tipo: ${tipoSuscripcion} - Descuento: ${descuentoPorcentaje}% - Código: ${codigoDescuento || 'N/A'}`,
      origen: 'newsletter'
    })

    // Usar la tabla leads que sabemos que existe
    const { data, error } = await supabase
      .from('leads')
      .insert({
        nombre: 'Suscriptor Newsletter',
        email,
        telefono: telefono || null,
        mensaje: `Suscripción newsletter - Tipo: ${tipoSuscripcion} - Descuento: ${descuentoPorcentaje}% - Código: ${codigoDescuento || 'N/A'}`,
        origen: 'newsletter'
      })
      .select()
      .single()

    console.log('Resultado de Supabase:', { data, error })

    if (error) {
      console.error('Error al crear suscriptor:', error)
      
      // Si es error de duplicado
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Este email ya está suscrito a nuestro newsletter' },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      )
    }

    // Preparar respuesta
    const mensaje = descuentoPorcentaje > 0 
      ? '¡Te has suscrito exitosamente! Recibiste un 10% de descuento en tu primera compra.'
      : '¡Te has suscrito exitosamente! Recibirás nuestras promociones por email.'

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        email: data.email,
        telefono: data.telefono || null,
        tipo_suscripcion: tipoSuscripcion,
        descuento_porcentaje: descuentoPorcentaje,
        codigo_descuento: codigoDescuento,
        mensaje: mensaje
      }
    })

  } catch (error) {
    console.error('Error en suscripción:', error)
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
