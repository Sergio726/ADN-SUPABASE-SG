'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { VisitasTracker } from '@/lib/visitas-tracker'

export function VisitasTrackerComponent() {
  const pathname = usePathname()
  const trackerRef = useRef<VisitasTracker | null>(null)

  useEffect(() => {
    // Solo trackear en páginas públicas (no dashboard)
    if (pathname?.startsWith('/dashboard')) {
      return
    }

    // Inicializar tracker solo una vez
    if (!trackerRef.current) {
      trackerRef.current = new VisitasTracker()
    }

    const tracker = trackerRef.current

    // Trackear visita inicial
    tracker.trackPageView()

    // Trackear salida cuando el usuario abandone la página
    const handleBeforeUnload = () => {
      tracker.trackPageExit()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      // Trackear salida cuando cambie de página
      tracker.trackPageExit()
    }
  }, [pathname])

  return null // Este componente no renderiza nada
}
