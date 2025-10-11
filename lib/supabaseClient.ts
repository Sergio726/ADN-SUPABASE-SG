import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos de la base de datos
export type Articulo = {
  id: number
  nombre: string
  descripcion: string | null
  categoria: string | null
  unidad: string
  stock_actual: number
  stock_minimo: number
  proveedor_id: number | null
  usuario_id: string | null
  creado_en: string
}

export type Proveedor = {
  id: number
  nombre: string
  contacto: string | null
  telefono: string | null
  email: string | null
  direccion: string | null
  creado_en: string
}

export type PrecioVenta = {
  id: number
  articulo_id: number
  precio_costo: number
  precio_venta: number
  margen: number
  vigente: boolean
  fecha_inicio: string
  fecha_fin: string | null
}

export type Lead = {
  id: number
  nombre: string
  email: string | null
  telefono: string | null
  mensaje: string | null
  origen: string
  creado_en: string
}

export type Usuario = {
  id: string
  nombre: string | null
  rol: 'admin' | 'vendedor' | 'cliente'
  creado_en: string
}

