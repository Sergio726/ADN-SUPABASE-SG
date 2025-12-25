'use client'

import { generateUUID } from '@/lib/utils'

// Cliente para trackear visitas desde el frontend
export class VisitasTracker {
  private sessionId: string
  private startTime: number
  private isTracking: boolean = false
  private currentVisitaId: string | null = null

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
    // Actualizar startTime para esta nueva página
    this.startTime = Date.now()
    // Limpiar visita anterior
    this.currentVisitaId = null
    
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
          duration: 0, // Se actualizará cuando salga de la página
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
      // keepalive asegura que la request se complete incluso si la página se cierra
      await fetch('/api/visitas', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
        keepalive: true,
      })
    } catch (error) {
      // Ignorar errores al salir (puede que la página ya se haya cerrado)
      // No loguear para no generar ruido en consola
    }
  }
}

