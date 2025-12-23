'use client'

import { generateUUID } from '@/lib/utils'

// Cliente para trackear visitas desde el frontend
export class VisitasTracker {
  private sessionId: string
  private startTime: number
  private isTracking: boolean = false

  constructor() {
    // Obtener o crear session ID
    this.sessionId = this.getOrCreateSessionId()
    this.startTime = Date.now()
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

  async trackPageView() {
    if (this.isTracking) return
    if (typeof window === 'undefined') return
    
    this.isTracking = true
    
    try {
      const url = window.location.href
      const pathname = window.location.pathname
      const referrer = document.referrer || undefined
      
      await fetch('/api/visitas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          pathname,
          referrer,
          sessionId: this.sessionId,
          duration: 0, // Se actualizará cuando salga de la página
        }),
      })
    } catch (error) {
      console.error('Error al trackear visita:', error)
    } finally {
      this.isTracking = false
    }
  }

  async trackPageExit() {
    if (typeof window === 'undefined') return
    
    const duration = Math.floor((Date.now() - this.startTime) / 1000)
    
    try {
      const url = window.location.href
      const pathname = window.location.pathname
      
      await fetch('/api/visitas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          pathname,
          sessionId: this.sessionId,
          duration,
        }),
      })
    } catch (error) {
      // Ignorar errores al salir (puede que la página ya se haya cerrado)
      console.error('Error al trackear salida:', error)
    }
  }
}

