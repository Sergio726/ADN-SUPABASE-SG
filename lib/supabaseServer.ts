import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const createServerClient = () => {
  // Validar variables de entorno en tiempo de ejecución (no durante build)
  if (typeof window === 'undefined') {
    // Solo validar en el servidor
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error(
        'Variables de entorno de Supabase no configuradas: NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY son requeridas'
      )
    }
  }
  
  return createServerComponentClient({ cookies })
}

