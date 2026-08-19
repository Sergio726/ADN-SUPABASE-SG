/** Redondeo a 2 decimales, mismo criterio que el alta/edición de precios. */
export function redondearDinero(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100
}

/**
 * Sube (o baja) el costo y recalcula la venta conservando el margen actual
 * (ratio venta/costo de esa fila, no el default 1.56 / 1.45).
 */
export function aplicarAumentoCosto(
  costo: number,
  venta: number,
  porcentaje: number
): { nuevoCosto: number; nuevaVenta: number; margenActual: number } {
  if (!Number.isFinite(costo) || costo <= 0) {
    throw new Error('El costo tiene que ser mayor a 0 para conservar el margen.')
  }
  if (!Number.isFinite(venta) || venta < 0) {
    throw new Error('El precio de venta no es válido.')
  }
  if (!Number.isFinite(porcentaje)) {
    throw new Error('El porcentaje no es válido.')
  }

  const ratio = venta / costo
  const nuevoCosto = redondearDinero(costo * (1 + porcentaje / 100))
  const nuevaVenta = redondearDinero(nuevoCosto * ratio)
  const margenActual = nuevoCosto > 0 ? ((nuevaVenta - nuevoCosto) / nuevoCosto) * 100 : 0

  return { nuevoCosto, nuevaVenta, margenActual }
}

/** Misma fórmula que el trigger de reventa: venta = compra × (1 + margen_efectivo/100). */
export function aplicarAumentoCompraTejido(
  precioCompra: number,
  porcentaje: number,
  margenEfectivo: number
): { nuevoCosto: number; nuevaVenta: number } {
  if (!Number.isFinite(precioCompra) || precioCompra <= 0) {
    throw new Error('El precio de compra tiene que ser mayor a 0.')
  }
  if (!Number.isFinite(porcentaje)) {
    throw new Error('El porcentaje no es válido.')
  }
  const margen = Number.isFinite(margenEfectivo) ? margenEfectivo : 45
  const nuevoCosto = redondearDinero(precioCompra * (1 + porcentaje / 100))
  const nuevaVenta = redondearDinero(nuevoCosto * (100 + margen) / 100)
  return { nuevoCosto, nuevaVenta }
}

export function validarPorcentaje(porcentaje: number) {
  if (!Number.isFinite(porcentaje)) return 'Ingresá un porcentaje numérico.'
  if (porcentaje === 0) return 'El porcentaje no puede ser 0.'
  if (porcentaje < -90 || porcentaje > 500) return 'El porcentaje tiene que estar entre -90% y 500%.'
  return null
}

/** Cambia el margen y recalcula la venta. El costo no se toca. */
export function aplicarCambioMargen(
  costo: number,
  margenNuevo: number
): { nuevoCosto: number; nuevaVenta: number } {
  if (!Number.isFinite(costo) || costo <= 0) {
    throw new Error('El costo tiene que ser mayor a 0.')
  }
  const error = validarMargenNuevo(margenNuevo)
  if (error) throw new Error(error)
  const nuevaVenta = redondearDinero(costo * (100 + margenNuevo) / 100)
  return { nuevoCosto: costo, nuevaVenta }
}

export function validarMargenNuevo(margen: number) {
  if (!Number.isFinite(margen)) return 'Ingresá el margen nuevo (porcentaje).'
  if (margen < 0 || margen > 500) return 'El margen tiene que estar entre 0% y 500%.'
  return null
}
