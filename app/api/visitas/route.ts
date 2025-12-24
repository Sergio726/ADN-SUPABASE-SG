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
    
    // Verificar si es una visita nueva o retorno usando función de BD
    // Esta función usa SECURITY DEFINER, por lo que no requiere permisos RLS de lectura
    let esNuevaVisita = true
    let esRetorno = false
    
    if (sessionIdFinal) {
      const { data: tieneVisitaPrevia, error: errorVerificacion } = await supabase
        .rpc('verificar_visita_previa', { p_session_id: sessionIdFinal })
      
      if (!errorVerificacion && tieneVisitaPrevia === true) {
        esNuevaVisita = false
        esRetorno = true
      }
    }
    
    // Insertar visita
    const { data, error } = await supabase
      .from('visitas_web')
      .insert({
        url,
        pathname,
        referrer: referrer || null,
        user_agent: userAgent,
        ip_hash: ipHash,
        session_id: sessionIdFinal,
        dispositivo,
        navegador,
        sistema_operativo: sistemaOperativo,
        duracion_segundos: duration || 0,
        es_nueva_visita: esNuevaVisita,
        es_retorno: esRetorno,
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error al insertar visita:', error)
      console.error('Detalles del error:', JSON.stringify(error, null, 2))
      return NextResponse.json(
        { 
          error: 'Error al registrar visita',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
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
    return NextResponse.json(
      { error: 'Error interno del servidor' },
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

