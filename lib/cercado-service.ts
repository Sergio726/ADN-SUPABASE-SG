import { supabase } from '@/lib/supabaseClient'

/**
 * Recalcula los precios de una configuración de cercado
 * basándose en los precios vigentes actuales de los artículos
 */
export async function recalcularPreciosCercado(configuracionId: string) {
  try {
    // 1) Leer configuración base (con IDs) desde la tabla
    const { data: cfg, error: errCfg } = await supabase
      .from('configuraciones_cercado')
      .select('*')
      .eq('id', configuracionId)
      .single()
    
    if (errCfg) throw errCfg
    if (!cfg) throw new Error('Configuración no encontrada')

    // 2) Precios actuales de tejido
    let precioTejido = 0
    let largoRollo = 10
    if (cfg.tejido_config_id) {
      const { data: t, error: errT } = await supabase
        .from('tejidos_configuraciones')
        .select('precio_venta, largo')
        .eq('id', cfg.tejido_config_id)
        .single()
      if (errT) throw errT
      precioTejido = t?.precio_venta || 0
      largoRollo = t?.largo || 10
    }
    const rollosNecesarios = Math.ceil(180 / (largoRollo || 10))
    const costoTejido = precioTejido * rollosNecesarios

    // 3) Helper para artículo con precio vigente
    const fetchArticuloVigente = async (articuloId: any) => {
      if (!articuloId) return { precio_venta: 0, nombre: '', unidad: '' }
      const { data: art } = await supabase
        .from('articulos')
        .select('id, nombre, unidad')
        .eq('id', articuloId)
        .maybeSingle()
      const { data: pv } = await supabase
        .from('precios_venta')
        .select('precio_venta')
        .eq('articulo_id', articuloId)
        .eq('vigente', true)
        .maybeSingle()
      return { precio_venta: pv?.precio_venta || 0, nombre: art?.nombre || '', unidad: art?.unidad || '' }
    }

    // 3b) Servicios (mano de obra / transporte)
    let precioManoObraMetro = cfg.precio_mano_obra_por_metro || 0
    let precioTransporteMetro = cfg.precio_transporte_por_metro || 0
    if (cfg.mano_obra_id) precioManoObraMetro = (await fetchArticuloVigente(cfg.mano_obra_id)).precio_venta || 0
    if (cfg.transporte_id) precioTransporteMetro = (await fetchArticuloVigente(cfg.transporte_id)).precio_venta || 0

    // 4) Postes (usar precio vigente si hay IDs)
    const precioPoste = async (idCol: any, fallback: number) => {
      if (!idCol) return fallback || 0
      const a = await fetchArticuloVigente(idCol)
      return a.precio_venta || fallback || 0
    }
    const nuevoPrecioEsquinero = await precioPoste(cfg.poste_esquinero_id, cfg.precio_poste_esquinero)
    const nuevoPrecioRefuerzo = await precioPoste(cfg.poste_refuerzo_id, cfg.precio_poste_refuerzo)
    const nuevoPrecioIntermedio = await precioPoste(cfg.poste_intermedio_id, cfg.precio_poste_intermedio)
    const nuevoPrecioPuntal = await precioPoste(cfg.poste_puntal_id, cfg.precio_puntal)

    const subtotalPostes =
      (cfg.cantidad_postes_esquineros * nuevoPrecioEsquinero) +
      (cfg.cantidad_postes_refuerzos * nuevoPrecioRefuerzo) +
      (cfg.cantidad_postes_intermedios * nuevoPrecioIntermedio) +
      (cfg.cantidad_puntales * nuevoPrecioPuntal)

    // Púa (precio por metro desde artículo si existe)
    let precioPuaMetro = cfg.precio_pua_por_metro || 0
    if (cfg.pua_id) precioPuaMetro = (await fetchArticuloVigente(cfg.pua_id)).precio_venta || precioPuaMetro
    const costoPua = 180 * (cfg.hilos_pua || 0) * (precioPuaMetro || 0)

    // Accesorios unitarios
    const precioUnitGanchos = cfg.ganchos_id ? (await fetchArticuloVigente(cfg.ganchos_id)).precio_venta : cfg.precio_unitario_ganchos
    const precioUnitPlanch = cfg.planchuelas_id ? (await fetchArticuloVigente(cfg.planchuelas_id)).precio_venta : cfg.precio_unitario_planchuelas
    const precioUnitTorn = cfg.torniquetes_id ? (await fetchArticuloVigente(cfg.torniquetes_id)).precio_venta : cfg.precio_unitario_torniquetes
    const precioUnitEsp = cfg.esparragos_id ? (await fetchArticuloVigente(cfg.esparragos_id)).precio_venta : cfg.precio_unitario_esparragos

    // Alambre A/R (deducir precio por metro si el artículo es por rollo)
    let precioMetroAlambreAR = cfg.precio_metro_alambre_ar || 0
    if (cfg.alambre_ar_id) {
      const ar = await fetchArticuloVigente(cfg.alambre_ar_id)
      const unidad = (ar.unidad || '').toLowerCase()
      const nombre = (ar.nombre || '').toLowerCase()
      if (unidad.includes('metro') || unidad === 'm') {
        precioMetroAlambreAR = ar.precio_venta || precioMetroAlambreAR
      } else {
        const match = nombre.match(/(\d+)\s*m/) || nombre.match(/(\d+)\s*metros/)
        const metros = match ? parseInt(match[1]) : 500
        precioMetroAlambreAR = (ar.precio_venta || 0) / (metros || 500)
      }
    }

    // Clavos y alambre negro (por kg)
    const precioKgClavos = cfg.clavos_id ? (await fetchArticuloVigente(cfg.clavos_id)).precio_venta : cfg.precio_kg_clavos
    const precioKgAlambreNegro = cfg.alambre_negro_id ? (await fetchArticuloVigente(cfg.alambre_negro_id)).precio_venta : cfg.precio_kg_alambre_negro

    const subtotalAccesorios =
      (cfg.cantidad_ganchos * (precioUnitGanchos || 0)) +
      (cfg.cantidad_planchuelas * (precioUnitPlanch || 0)) +
      (cfg.cantidad_torniquetes * (precioUnitTorn || 0)) +
      (cfg.cantidad_esparragos * (precioUnitEsp || 0)) +
      (cfg.metros_alambre_ar * (precioMetroAlambreAR || 0)) +
      (cfg.kg_clavos * (precioKgClavos || 0)) +
      (cfg.kg_alambre_negro * (precioKgAlambreNegro || 0))
    const costoManoObra = 180 * (precioManoObraMetro || 0)
    const costoTransporte = 180 * (precioTransporteMetro || 0)

    // Cordón dinámico
    let costoCordon = cfg.cordon_precio_total || 0
    const precioArena = cfg.cordon_arena_id ? (await fetchArticuloVigente(cfg.cordon_arena_id)).precio_venta : 0
    const precioRipio = cfg.cordon_ripio_id ? (await fetchArticuloVigente(cfg.cordon_ripio_id)).precio_venta : 0
    const precioCemento = cfg.cordon_cemento_id ? (await fetchArticuloVigente(cfg.cordon_cemento_id)).precio_venta : 0
    const arenaM3 = cfg.cordon_arena_m3 || 0
    const ripioM3 = cfg.cordon_ripio_m3 || 0
    const bolsasCem = cfg.cordon_cemento_bolsas || 0
    if (cfg.cordon_tipo && (cfg.cordon_arena_id || cfg.cordon_ripio_id || cfg.cordon_cemento_id)) {
      costoCordon = (arenaM3 * (precioArena || 0)) + (ripioM3 * (precioRipio || 0)) + (bolsasCem * (precioCemento || 0))
    }

    const total180 = (costoTejido || 0) + (subtotalPostes || 0) + (costoCordon || 0) + (costoPua || 0) + (subtotalAccesorios || 0) + (costoManoObra || 0) + (costoTransporte || 0)
    const precioMetro = total180 / 180
    const precioMetroMenor50 = precioMetro * 1.5

    // 5) Actualizar configuración
    const { error: errUpd } = await supabase
      .from('configuraciones_cercado')
      .update({
        precio_mano_obra_por_metro: precioManoObraMetro,
        precio_transporte_por_metro: precioTransporteMetro,
        precio_poste_esquinero: nuevoPrecioEsquinero,
        precio_poste_refuerzo: nuevoPrecioRefuerzo,
        precio_poste_intermedio: nuevoPrecioIntermedio,
        precio_puntal: nuevoPrecioPuntal,
        precio_pua_por_metro: precioPuaMetro,
        precio_metro_alambre_ar: precioMetroAlambreAR,
        precio_kg_clavos: precioKgClavos,
        precio_kg_alambre_negro: precioKgAlambreNegro,
        precio_unitario_ganchos: precioUnitGanchos,
        precio_unitario_planchuelas: precioUnitPlanch,
        precio_unitario_torniquetes: precioUnitTorn,
        precio_unitario_esparragos: precioUnitEsp,
        cordon_precio_total: costoCordon,
        precio_base_180m: total180,
        precio_por_metro_lineal: precioMetro,
        precio_por_metro_menor_50m: precioMetroMenor50,
        actualizado_en: new Date().toISOString(),
      })
      .eq('id', cfg.id)
    
    if (errUpd) throw errUpd

    return { success: true }
  } catch (error: any) {
    console.error('Error al recalcular precios:', error)
    throw error
  }
}

/**
 * Verifica si una configuración tiene precios desactualizados (más de 30 días)
 */
export function esPrecioDesactualizado(actualizadoEn: string | null | undefined): boolean {
  if (!actualizadoEn) return true // Si nunca se actualizó, considerar desactualizado
  
  const fechaActualizacion = new Date(actualizadoEn)
  const fechaLimite = new Date()
  fechaLimite.setDate(fechaLimite.getDate() - 30)
  
  return fechaActualizacion < fechaLimite
}

/**
 * Calcula los días desde la última actualización
 */
export function diasDesdeActualizacion(actualizadoEn: string | null | undefined): number | null {
  if (!actualizadoEn) return null
  
  const fechaActualizacion = new Date(actualizadoEn)
  const ahora = new Date()
  const diffTime = ahora.getTime() - fechaActualizacion.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays
}

