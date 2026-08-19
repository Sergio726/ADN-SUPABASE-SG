import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import {
  aplicarAumentoCosto,
  aplicarAumentoCompraTejido,
  aplicarCambioMargen,
  validarMargenNuevo,
  validarPorcentaje,
} from '@/lib/precios-masivos'
import { recalcularPreciosCercado } from '@/lib/cercado-service'

type Modo = 'aumento_costo' | 'cambiar_margen'

type Body = {
  modo?: Modo
  porcentaje?: number
  precioIds?: number[]
  tejidoIds?: string[]
  cercadoIds?: string[]
  recalcularCercados?: boolean
}

async function exigirAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  return data?.rol === 'admin'
}

function redondearMargen(margen: number) {
  return Math.round((margen + Number.EPSILON) * 100) / 100
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Necesitás iniciar sesión.' }, { status: 401 })
    }

    if (!(await exigirAdmin(supabase, session.user.id))) {
      return NextResponse.json(
        { error: 'Solo un administrador puede actualizar precios de forma masiva.' },
        { status: 403 }
      )
    }

    const body = (await request.json()) as Body
    const modo: Modo = body.modo === 'cambiar_margen' ? 'cambiar_margen' : 'aumento_costo'
    const precioIds = Array.from(new Set((body.precioIds || []).map(Number).filter((n) => Number.isFinite(n))))
    const tejidoIds = Array.from(new Set((body.tejidoIds || []).map(String).filter(Boolean)))
    const cercadoIds = Array.from(new Set((body.cercadoIds || []).map(String).filter(Boolean)))
    const hayCostos = precioIds.length > 0 || tejidoIds.length > 0
    const recalcularCercados = body.recalcularCercados === true

    if (!hayCostos && cercadoIds.length === 0) {
      return NextResponse.json({ error: 'No hay ítems para actualizar.' }, { status: 400 })
    }

    let articulosActualizados = 0
    let tejidosActualizados = 0
    const omitidos: string[] = []

    if (hayCostos) {
      const porcentaje = Number(body.porcentaje)
      const errorPct = modo === 'cambiar_margen'
        ? validarMargenNuevo(porcentaje)
        : validarPorcentaje(porcentaje)
      if (errorPct) {
        return NextResponse.json({ error: errorPct }, { status: 400 })
      }

      if (precioIds.length > 0) {
        const { data: precios, error } = await supabase
          .from('precios_venta')
          .select('id, articulo_id, precio_costo, precio_venta, vigente')
          .in('id', precioIds)

        if (error) throw error

        for (const fila of precios || []) {
          if (!fila.vigente) {
            omitidos.push(`precio ${fila.id} (no vigente)`)
            continue
          }
          try {
            const costo = Number(fila.precio_costo)
            const venta = Number(fila.precio_venta)
            const resultado = modo === 'cambiar_margen'
              ? aplicarCambioMargen(costo, porcentaje)
              : aplicarAumentoCosto(costo, venta, porcentaje)
            const { error: errUpd } = await supabase
              .from('precios_venta')
              .update({
                precio_costo: resultado.nuevoCosto,
                precio_venta: resultado.nuevaVenta,
                margen: redondearMargen(
                  resultado.nuevoCosto > 0
                    ? ((resultado.nuevaVenta - resultado.nuevoCosto) / resultado.nuevoCosto) * 100
                    : porcentaje
                ),
              })
              .eq('id', fila.id)
            if (errUpd) throw errUpd
            articulosActualizados += 1
          } catch (err: any) {
            omitidos.push(`artículo ${fila.articulo_id}: ${err.message}`)
          }
        }
      }

      if (tejidoIds.length > 0) {
        const { data: tejidos, error } = await supabase
          .from('tejidos_configuraciones')
          .select('id, codigo, origen, precio_compra, precio_costo, margen_efectivo')
          .in('id', tejidoIds)

        if (error) throw error

        for (const tejido of tejidos || []) {
          const esReventa = tejido.origen === 'reventa'
          if (modo === 'aumento_costo' && !esReventa) {
            omitidos.push(`${tejido.codigo || tejido.id}: fabricado, se actualiza vía alambre`)
            continue
          }
          try {
            if (modo === 'cambiar_margen') {
              const { error: errUpd } = await supabase
                .from('tejidos_configuraciones')
                .update({ margen_efectivo: redondearMargen(porcentaje) })
                .eq('id', tejido.id)
              if (errUpd) throw errUpd
            } else {
              const compraActual = Number(tejido.precio_compra ?? tejido.precio_costo)
              const { nuevoCosto } = aplicarAumentoCompraTejido(
                compraActual,
                porcentaje,
                Number(tejido.margen_efectivo ?? 45)
              )
              const { error: errUpd } = await supabase
                .from('tejidos_configuraciones')
                .update({ precio_compra: nuevoCosto })
                .eq('id', tejido.id)
              if (errUpd) throw errUpd
            }
            tejidosActualizados += 1
          } catch (err: any) {
            omitidos.push(`${tejido.codigo || tejido.id}: ${err.message}`)
          }
        }
      }
    }

    let cercadosRecalculados = 0
    const idsCercado: string[] = []

    if (hayCostos && recalcularCercados && (articulosActualizados + tejidosActualizados > 0)) {
      const { data: configs, error } = await supabase
        .from('configuraciones_cercado')
        .select('id')
        .eq('activo', true)
      if (error) throw error
      idsCercado.push(...(configs || []).map((c) => String(c.id)))
    } else if (cercadoIds.length > 0) {
      idsCercado.push(...cercadoIds)
    }

    for (const id of idsCercado) {
      try {
        await recalcularPreciosCercado(id, supabase)
        cercadosRecalculados += 1
      } catch (err: any) {
        omitidos.push(`cercado ${id}: ${err.message || 'no se pudo recalcular'}`)
      }
    }

    return NextResponse.json({
      articulosActualizados,
      tejidosActualizados,
      cercadosRecalculados,
      omitidos,
    })
  } catch (error: any) {
    console.error('[precios/masivo]', error)
    return NextResponse.json(
      { error: error.message || 'No se pudo aplicar la actualización.' },
      { status: 500 }
    )
  }
}
