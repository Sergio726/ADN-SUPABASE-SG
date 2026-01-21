'use client'

import { generateUUID } from '@/lib/utils'

// Interfaz para UTM params
interface UTMParams {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
}

// Interfaz para eventos de conversión
export interface EventoConversion {
  tipo_evento: 'click_whatsapp' | 'click_telefono' | 'envio_formulario' | 'descarga_catalogo' | 'click_email'
  pagina_origen?: string
  elemento_id?: string
  elemento_texto?: string
  metadata?: Record<string, any>
}

// Cliente para trackear visitas desde el frontend
export class VisitasTracker {
  private sessionId: string
  private startTime: number
  private isTracking: boolean = false
  private currentVisitaId: string | null = null
  private utmParams: UTMParams = {}

  constructor() {
    // Obtener o crear session ID
    this.sessionId = this.getOrCreateSessionId()
    this.startTime = Date.now()
    // Capturar UTM params al inicializar
    this.utmParams = this.getUTMParams()
  }

  private getOrCreateSessionId(): string {
    if (typeof window === 'undefined') return ''
    
    try {
      let sessionId = sessionStorage.getItem('visitas_session_id')
      if (!sessionId) {
        sessionId = generateUUID()
        sessionStorage.setItem('visitas_session_id', sessionId)
      }
      return sessionId
    } catch (error) {
      // Si sessionStorage no está disponible, generar un ID temporal
      return 'temp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
    }
  }

  /**
   * Extrae los parámetros UTM de la URL actual
   */
  private getUTMParams(): UTMParams {
    if (typeof window === 'undefined') return {}
    
    try {
      const urlParams = new URLSearchParams(window.location.search)
      const params: UTMParams = {}
      
      const utm_source = urlParams.get('utm_source')
      const utm_medium = urlParams.get('utm_medium')
      const utm_campaign = urlParams.get('utm_campaign')
      const utm_content = urlParams.get('utm_content')
      const utm_term = urlParams.get('utm_term')
      
      if (utm_source) params.utm_source = utm_source
      if (utm_medium) params.utm_medium = utm_medium
      if (utm_campaign) params.utm_campaign = utm_campaign
      if (utm_content) params.utm_content = utm_content
      if (utm_term) params.utm_term = utm_term
      
      // Guardar en sessionStorage para mantener durante la sesión
      if (Object.keys(params).length > 0) {
        sessionStorage.setItem('utm_params', JSON.stringify(params))
      } else {
        // Intentar recuperar UTM params guardados
        const saved = sessionStorage.getItem('utm_params')
        if (saved) {
          return JSON.parse(saved)
        }
      }
      
      return params
    } catch (error) {
      return {}
    }
  }

  /**
   * Categoriza el referrer en grupos conocidos
   */
  private categorizarReferrer(referrer: string | undefined): string {
    if (!referrer) return 'directo'
    
    const ref = referrer.toLowerCase()
    
    if (ref.includes('google.')) return 'google'
    if (ref.includes('facebook.') || ref.includes('fb.')) return 'facebook'
    if (ref.includes('instagram.')) return 'instagram'
    if (ref.includes('whatsapp.') || ref.includes('wa.me')) return 'whatsapp'
    if (ref.includes('twitter.') || ref.includes('t.co') || ref.includes('x.com')) return 'twitter'
    if (ref.includes('linkedin.')) return 'linkedin'
    if (ref.includes('youtube.') || ref.includes('youtu.be')) return 'youtube'
    if (ref.includes('bing.')) return 'bing'
    if (ref.includes('mail.google') || ref.includes('outlook.') || ref.includes('yahoo.')) return 'email'
    if (ref.includes('mercadolibre.') || ref.includes('mercadopago.')) return 'mercadolibre'
    
    return 'otro'
  }

  /**
   * Obtiene el session ID actual
   */
  getSessionId(): string {
    return this.sessionId
  }

  /**
   * Obtiene los UTM params actuales
   */
  getUTMParamsActuales(): UTMParams {
    return this.utmParams
  }

  async trackPageView() {
    if (this.isTracking) return
    if (typeof window === 'undefined') return
    
    this.isTracking = true
    // Actualizar startTime para esta nueva página
    this.startTime = Date.now()
    // Limpiar visita anterior
    this.currentVisitaId = null
    // Actualizar UTM params (por si hay nuevos en la URL)
    this.utmParams = this.getUTMParams()
    
    try {
      const url = window.location.href
      const pathname = window.location.pathname
      const referrer = document.referrer || undefined
      
      const response = await fetch('/api/visitas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          pathname,
          referrer,
          sessionId: this.sessionId,
          duration: 0,
          // Incluir UTM params
          ...this.utmParams,
          // Incluir fuente categorizada
          fuente_categorizada: this.utmParams.utm_source || this.categorizarReferrer(referrer),
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        // Guardar el ID de la visita para poder actualizarla después
        if (data.visita_id) {
          this.currentVisitaId = data.visita_id
        }
      }
    } catch (error) {
      console.error('Error al trackear visita:', error)
    } finally {
      this.isTracking = false
    }
  }

  async trackPageExit() {
    if (typeof window === 'undefined') return
    if (!this.currentVisitaId) return // No hay visita para actualizar
    
    const duration = Math.floor((Date.now() - this.startTime) / 1000)
    
    try {
      // Actualizar la visita existente en lugar de crear una nueva
      const body = JSON.stringify({
        visita_id: this.currentVisitaId,
        duration,
      })
      
      // Usar fetch con keepalive para no bloquear la navegación
      await fetch('/api/visitas', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
        keepalive: true,
      })
    } catch (error) {
      // Ignorar errores al salir
    }
  }

  /**
   * Registra un evento de conversión
   */
  async trackConversion(evento: EventoConversion) {
    if (typeof window === 'undefined') return
    
    try {
      const response = await fetch('/api/eventos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...evento,
          visita_id: this.currentVisitaId,
          session_id: this.sessionId,
          pagina_origen: evento.pagina_origen || window.location.pathname,
          // Incluir UTM params para análisis
          ...this.utmParams,
        }),
      })
      
      if (!response.ok) {
        console.error('Error al registrar evento de conversión')
      }
    } catch (error) {
      console.error('Error al trackear conversión:', error)
    }
  }
}

// Instancia singleton del tracker
let trackerInstance: VisitasTracker | null = null

export function getVisitasTracker(): VisitasTracker {
  if (typeof window === 'undefined') {
    // En SSR, retornar una instancia vacía
    return new VisitasTracker()
  }
  
  if (!trackerInstance) {
    trackerInstance = new VisitasTracker()
  }
  return trackerInstance
}

// Funciones de utilidad para trackear eventos comunes
export function trackClickWhatsApp(telefono?: string, mensaje?: string) {
  const tracker = getVisitasTracker()
  tracker.trackConversion({
    tipo_evento: 'click_whatsapp',
    elemento_texto: telefono,
    metadata: { mensaje },
  })
}

export function trackClickTelefono(telefono: string) {
  const tracker = getVisitasTracker()
  tracker.trackConversion({
    tipo_evento: 'click_telefono',
    elemento_texto: telefono,
  })
}

export function trackEnvioFormulario(formulario: string, datos?: Record<string, any>) {
  const tracker = getVisitasTracker()
  tracker.trackConversion({
    tipo_evento: 'envio_formulario',
    elemento_id: formulario,
    metadata: datos,
  })
}

export function trackDescargaCatalogo(nombreArchivo: string) {
  const tracker = getVisitasTracker()
  tracker.trackConversion({
    tipo_evento: 'descarga_catalogo',
    elemento_texto: nombreArchivo,
  })
}

export function trackClickEmail(email: string) {
  const tracker = getVisitasTracker()
  tracker.trackConversion({
    tipo_evento: 'click_email',
    elemento_texto: email,
  })
}