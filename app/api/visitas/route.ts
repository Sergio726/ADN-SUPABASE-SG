import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { generateUUID } from '@/lib/utils'
import * as crypto from 'crypto'

// Función para hashear IP
function hashIP(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex')
}

// Función para parsear User Agent
function parseUserAgent(userAgent: string): {
  dispositivo: string
  navegador: string
  sistemaOperativo: string
} {
  const ua = userAgent.toLowerCase()
  
  // Detectar dispositivo
  let dispositivo = 'desktop'
  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
    dispositivo = 'mobile'
  } else if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
    dispositivo = 'tablet'
  }
  
  // Detectar navegador
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
  
  // Detectar sistema operativo
  let sistemaOperativo = 'unknown'
  if (ua.includes('windows')) {
    sistemaOperativo = 'Windows'
  } else if (ua.includes('mac')) {
    sistemaOperativo = 'macOS'
  } else if (ua.includes('linux')) {
    sistemaOperativo = 'Linux'
  } else if (ua.includes('android')) {
    sistemaOperativo = 'Android'
  } else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) {
    sistemaOperativo = 'iOS'
  }
  
  return { dispositivo, navegador, sistemaOperativo }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, pathname, referrer, sessionId, duration } = body
    
    // Validaciones básicas
    if (!url || !pathname) {
      return NextResponse.json(
        { error: 'URL y pathname son requeridos' },
        { status: 400 }
      )
    }
    
    // Obtener información de la request
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               request.headers.get('x-real-ip') ||
               request.ip ||
               'unknown'
    
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // Parsear User Agent
    const { dispositivo, navegador, sistemaOperativo } = parseUserAgent(userAgent)
    
    // Hashear IP para privacidad
    const ipHash = ip !== 'unknown' ? hashIP(ip) : null
    
    // Generar session ID si no viene (formato UUID v4)
    const sessionIdFinal = sessionId || generateUUID()
    
    // Crear cliente de Supabase anónimo para operaciones públicas
    // Usamos createClient directamente para asegurar que la API key anónima esté presente
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Faltan variables de entorno de Supabase')
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      )
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // Por ahora, simplificamos: todas las visitas se registran como nuevas
    // La verificación de visitas previas se puede agregar después cuando la función RPC esté disponible
    // Insertar visita - asegurar que los valores sean válidos
    const visitaData: any = {
      url: String(url).substring(0, 2048), // Limitar longitud de URL
      pathname: String(pathname).substring(0, 500), // Limitar longitud de pathname
      session_id: sessionIdFinal,
      duracion_segundos: Math.max(0, Math.floor(duration || 0)),
      es_nueva_visita: true,
      es_retorno: false,
    }
    
    // Campos opcionales
    if (referrer) {
      visitaData.referrer = String(referrer).substring(0, 2048)
    }
    if (userAgent && userAgent !== 'unknown') {
      visitaData.user_agent = String(userAgent).substring(0, 500)
    }
    if (ipHash) {
      visitaData.ip_hash = ipHash
    }
    if (dispositivo) {
      visitaData.dispositivo = String(dispositivo).substring(0, 20)
    }
    if (navegador && navegador !== 'unknown') {
      visitaData.navegador = String(navegador).substring(0, 50)
    }
    if (sistemaOperativo && sistemaOperativo !== 'unknown') {
      visitaData.sistema_operativo = String(sistemaOperativo).substring(0, 50)
    }
    
    const { data, error } = await supabase
      .from('visitas_web')
      .insert(visitaData)
      .select()
      .single()
    
    if (error) {
      console.error('Error al insertar visita:', error)
      console.error('Código del error:', error.code)
      console.error('Mensaje del error:', error.message)
      console.error('Detalles del error:', JSON.stringify(error, null, 2))
      console.error('Datos que se intentaron insertar:', JSON.stringify(visitaData, null, 2))
      
      // Incluir el mensaje de error en la respuesta para diagnóstico
      return NextResponse.json(
        { 
          error: 'Error al registrar visita',
          message: error.message || 'Error desconocido',
          code: error.code || 'UNKNOWN',
          hint: error.hint || undefined
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      visita_id: data.id,
      session_id: sessionIdFinal,
    })
    
  } catch (error: any) {
    console.error('Error en API de visitas:', error)
    console.error('Stack trace:', error?.stack)
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    )
  }
}

// GET para obtener estadísticas (solo para usuarios autenticados)
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
    
    // Obtener estadísticas
    const { data: stats, error: statsError } = await supabase
      .rpc('obtener_estadisticas_visitas', {
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta,
      })
    
    if (statsError) {
      console.error('Error al obtener estadísticas:', statsError)
      return NextResponse.json(
        { error: 'Error al obtener estadísticas' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      estadisticas: stats?.[0] || null,
    })
    
  } catch (error: any) {
    console.error('Error en GET de visitas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

