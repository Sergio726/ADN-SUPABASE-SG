import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(amount)
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

/**
 * Parsea un valor de forma segura a número decimal.
 * Maneja valores con formato (puntos como separadores de miles, comas como decimales).
 * Evita NaN y valores infinitos.
 * 
 * @param value - Valor a parsear (string, number, null, undefined)
 * @param defaultValue - Valor por defecto si el valor no es válido (default: 0)
 * @returns Número parseado o valor por defecto
 * 
 * @example
 * parseSafe("1.234,56") // 1234.56
 * parseSafe("1.234.567") // 1234567
 * parseSafe("1234,56") // 1234.56
 * parseSafe(null) // 0
 * parseSafe("invalid", 10) // 10
 */
export function parseSafe(value: string | number | undefined | null, defaultValue: number = 0): number {
  if (value === null || value === undefined || value === '') return defaultValue
  
  if (typeof value === 'number') {
    return isNaN(value) || !isFinite(value) ? defaultValue : value
  }
  
  // Convertir a string y limpiar formato
  let cleaned = String(value).trim()
  
  // Si tiene formato con puntos (separadores de miles) y comas (decimales)
  // Ejemplo: "1.234.567,89" -> "1234567.89"
  if (cleaned.includes('.') && cleaned.includes(',')) {
    // Remover puntos (separadores de miles) y reemplazar coma por punto (decimal)
    cleaned = cleaned.replace(/\./g, '').replace(',', '.')
  }
  // Si solo tiene puntos y más de un punto, asumir que son separadores de miles
  // Ejemplo: "1.234.567" -> "1234567"
  else if ((cleaned.match(/\./g) || []).length > 1) {
    cleaned = cleaned.replace(/\./g, '')
  }
  // Si solo tiene coma, reemplazar por punto (decimal)
  // Ejemplo: "1234,56" -> "1234.56"
  else if (cleaned.includes(',') && !cleaned.includes('.')) {
    cleaned = cleaned.replace(',', '.')
  }
  
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) || !isFinite(parsed) ? defaultValue : parsed
}

/**
 * Parsea un valor de forma segura a número entero.
 * Maneja valores con formato (puntos como separadores de miles).
 * Evita NaN y valores infinitos.
 * 
 * @param value - Valor a parsear (string, number, null, undefined)
 * @param defaultValue - Valor por defecto si el valor no es válido (default: 0)
 * @returns Número entero parseado o valor por defecto
 * 
 * @example
 * parseSafeInt("1.234") // 1234
 * parseSafeInt("1.234.567") // 1234567
 * parseSafeInt("1234,56") // 1234 (trunca decimales)
 * parseSafeInt(null) // 0
 * parseSafeInt("invalid", 10) // 10
 */
export function parseSafeInt(value: string | number | undefined | null, defaultValue: number = 0): number {
  const parsed = parseSafe(value, defaultValue)
  return Math.floor(parsed)
}

