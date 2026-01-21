import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// POST para registrar evento de conversión
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      tipo_evento,
      visita_id,
      session_id,
      pagina_origen,
      elemento_id,
      elemento_texto,
      metadata,
      // UTM params (para análisis)
      utm_source,
      utm_medium,
      utm_campaign,
    } = body

    // Validaciones básicas
    if (!tipo_evento) {
      return NextResponse.json(
        { error: 'tipo_evento es requerido' },
        { status: 400 }
      )
    }

    // Validar tipo de evento
    const tiposValidos = ['click_whatsapp', 'click_telefono', 'envio_formulario', 'descarga_catalogo', 'click_email']
    if (!tiposValidos.includes(tipo_evento)) {
      return NextResponse.json(
        { error: `tipo_evento inválido. Debe ser uno de: ${tiposValidos.join(', ')}` },
        { status: 400 }
      )
    }

    // Crear cliente de Supabase con SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Faltan variables de entorno de Supabase')
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })

    // Obtener información del dispositivo desde user-agent
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const ua = userAgent.toLowerCase()

    let dispositivo = 'desktop'
    if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
      dispositivo = 'mobile'
    } else if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
      dispositivo = 'tablet'
    }

    let navegador = 'unknown'
    if (ua.includes('chrome') && !ua.includes('edg')) {
      navegador = 'Chrome'
    } else if (ua.includes('firefox')) {
      navegador = 'Firefox'
    } else if (ua.includes('safari') && !ua.includes('chrome')) {
      navegador = 'Safari'
    } else if (ua.includes('edg')) {
      navegador = 'Edge'
    } else if (ua.includes('opera') || ua.includes('opr')) {
      navegador = 'Opera'
    }

    // Construir objeto de evento
    const eventoData: any = {
      tipo_evento,
      session_id: session_id || null,
      pagina_origen: pagina_origen ? String(pagina_origen).substring(0, 500) : null,
      dispositivo,
      navegador,
    }

    // Campos opcionales
    if (visita_id) {
      eventoData.visita_id = visita_id
    }
    if (elemento_id) {
      eventoData.elemento_id = String(elemento_id).substring(0, 100)
    }
    if (elemento_texto) {
      eventoData.elemento_texto = String(elemento_texto).substring(0, 500)
    }
    if (metadata && typeof metadata === 'object') {
      eventoData.metadata = metadata
    }
    if (utm_source) {
      eventoData.utm_source = String(utm_source).substring(0, 100)
    }
    if (utm_medium) {
      eventoData.utm_medium = String(utm_medium).substring(0, 100)
    }
    if (utm_campaign) {
      eventoData.utm_campaign = String(utm_campaign).substring(0, 200)
    }

    const { data, error } = await supabase
      .from('eventos_conversion')
      .insert(eventoData)
      .select()
      .single()

    if (error) {
      console.error('Error al insertar evento:', error)
      return NextResponse.json(
        {
          error: 'Error al registrar evento',
          message: error.message || 'Error desconocido',
          code: error.code || 'UNKNOWN',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      evento_id: data.id,
    })
  } catch (error: any) {
    console.error('Error en API de eventos:', error)
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    )
  }
}

// GET para obtener estadísticas de conversiones (solo usuarios autenticados)
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Verificar autenticación
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const fechaDesde = searchParams.get('fecha_desde') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const fechaHasta = searchParams.get('fecha_hasta') || new Date().toISOString()

    // Obtener estadísticas de conversiones
    const { data: conversiones, error: conversionesError } = await supabase
      .rpc('obtener_estadisticas_conversiones', {
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta,
      })

    if (conversionesError) {
      console.error('Error al obtener estadísticas de conversiones:', conversionesError)
      return NextResponse.json(
        { error: 'Error al obtener estadísticas' },
        { status: 500 }
      )
    }

    // Obtener conversiones por fuente
    const { data: conversionesPorFuente, error: fuenteError } = await supabase
      .rpc('obtener_conversiones_por_fuente', {
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta,
      })

    if (fuenteError) {
      console.error('Error al obtener conversiones por fuente:', fuenteError)
    }

    return NextResponse.json({
      success: true,
      conversiones: conversiones || [],
      conversiones_por_fuente: conversionesPorFuente || [],
    })
  } catch (error: any) {
    console.error('Error en GET de eventos:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
