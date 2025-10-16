require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Faltan variables de entorno')
  console.log('Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// =====================================================
// Configuraciones base de cercado
// =====================================================
// Basadas en el Excel "Cotizacion cercado.xlsx"
// Para terreno base: 60m × 30m = 180 metros lineales

const configuraciones = [
  // ===== ALTURA 2.0m =====
  {
    nombre: 'Cerco 2.0m Económico - Eucalipto sin Cordón',
    descripcion: 'Cerco perimetral 2.0m con postes de eucalipto, sin cordón de hormigón, sin alambre de púa',
    altura: 2.00,
    
    // Tejido: Cal.14, Rombo 3.5" (el más económico)
    tejido_calibre: 14,
    tejido_rombo: 3.5,
    
    // Postes Eucalipto (más económicos)
    tipo_poste: 'Eucalipto',
    cantidad_postes_esquineros: 4,
    precio_poste_esquinero: 22500,
    cantidad_postes_refuerzos: 2,
    precio_poste_refuerzo: 22500,
    cantidad_postes_intermedios: 34,
    precio_poste_intermedio: 22500,
    cantidad_puntales: 12,
    precio_puntal: 17500,
    
    // Sin cordón
    cordon_tipo: 'Sin cordón',
    cordon_bolsas_ripio: 0,
    cordon_bolsas_cemento: 0,
    cordon_precio_total: 0,
    
    // Sin púa
    hilos_pua: 0,
    precio_pua_por_metro: 1168.02,
    
    // Accesorios (del Excel original)
    cantidad_ganchos: 48,
    precio_unitario_ganchos: 12337.50,
    cantidad_planchuelas: 12,
    precio_unitario_planchuelas: 5456.45,
    cantidad_torniquetes: 6,
    precio_unitario_torniquetes: 12337.50,
    cantidad_esparragos: 6,
    precio_unitario_esparragos: 1330.00,
    metros_alambre_ar: 720,
    precio_metro_alambre_ar: 3105.48,
    kg_clavos: 2,
    precio_kg_clavos: 1330.00,
    kg_alambre_negro: 8,
    precio_kg_alambre_negro: 844.20,
    
    // Mano de obra y transporte
    precio_mano_obra_por_metro: 11438.00,
    precio_transporte_por_metro: 3580.50,
  },
  {
    nombre: 'Cerco 2.0m Standard - Eucalipto con Cordón 10cm',
    descripcion: 'Cerco perimetral 2.0m con postes de eucalipto, cordón de hormigón 10cm, sin alambre de púa',
    altura: 2.00,
    tejido_calibre: 14,
    tejido_rombo: 3.5,
    tipo_poste: 'Eucalipto',
    cantidad_postes_esquineros: 4,
    precio_poste_esquinero: 22500,
    cantidad_postes_refuerzos: 2,
    precio_poste_refuerzo: 22500,
    cantidad_postes_intermedios: 34,
    precio_poste_intermedio: 22500,
    cantidad_puntales: 12,
    precio_puntal: 17500,
    cordon_tipo: '10cm',
    cordon_bolsas_ripio: 4,
    cordon_bolsas_cemento: 25,
    cordon_precio_total: 997920,
    hilos_pua: 0,
    precio_pua_por_metro: 1168.02,
    cantidad_ganchos: 48,
    precio_unitario_ganchos: 12337.50,
    cantidad_planchuelas: 12,
    precio_unitario_planchuelas: 5456.45,
    cantidad_torniquetes: 6,
    precio_unitario_torniquetes: 12337.50,
    cantidad_esparragos: 6,
    precio_unitario_esparragos: 1330.00,
    metros_alambre_ar: 720,
    precio_metro_alambre_ar: 3105.48,
    kg_clavos: 2,
    precio_kg_clavos: 1330.00,
    kg_alambre_negro: 8,
    precio_kg_alambre_negro: 844.20,
    precio_mano_obra_por_metro: 11438.00,
    precio_transporte_por_metro: 3580.50,
  },
  {
    nombre: 'Cerco 2.0m Premium - Eucalipto con Cordón 10cm + Púa',
    descripcion: 'Cerco perimetral 2.0m con postes de eucalipto, cordón 10cm, 2 hilos de alambre de púa',
    altura: 2.00,
    tejido_calibre: 14,
    tejido_rombo: 3.5,
    tipo_poste: 'Eucalipto',
    cantidad_postes_esquineros: 4,
    precio_poste_esquinero: 22500,
    cantidad_postes_refuerzos: 2,
    precio_poste_refuerzo: 22500,
    cantidad_postes_intermedios: 34,
    precio_poste_intermedio: 22500,
    cantidad_puntales: 12,
    precio_puntal: 17500,
    cordon_tipo: '10cm',
    cordon_bolsas_ripio: 4,
    cordon_bolsas_cemento: 25,
    cordon_precio_total: 997920,
    hilos_pua: 2,
    precio_pua_por_metro: 1168.02,
    cantidad_ganchos: 48,
    precio_unitario_ganchos: 12337.50,
    cantidad_planchuelas: 12,
    precio_unitario_planchuelas: 5456.45,
    cantidad_torniquetes: 6,
    precio_unitario_torniquetes: 12337.50,
    cantidad_esparragos: 6,
    precio_unitario_esparragos: 1330.00,
    metros_alambre_ar: 720,
    precio_metro_alambre_ar: 3105.48,
    kg_clavos: 2,
    precio_kg_clavos: 1330.00,
    kg_alambre_negro: 8,
    precio_kg_alambre_negro: 844.20,
    precio_mano_obra_por_metro: 11438.00,
    precio_transporte_por_metro: 3580.50,
  },
  {
    nombre: 'Cerco 2.0m Reforzado - Punta Diamante con Cordón 15cm + Púa',
    descripcion: 'Cerco premium con postes Punta Diamante, cordón 15cm, 3 hilos de púa',
    altura: 2.00,
    tejido_calibre: 12,
    tejido_rombo: 2.5,
    tipo_poste: 'Punta Diamante',
    cantidad_postes_esquineros: 4,
    precio_poste_esquinero: 31250,
    cantidad_postes_refuerzos: 2,
    precio_poste_refuerzo: 27500,
    cantidad_postes_intermedios: 34,
    precio_poste_intermedio: 25000,
    cantidad_puntales: 12,
    precio_puntal: 22500,
    cordon_tipo: '15cm',
    cordon_bolsas_ripio: 4,
    cordon_bolsas_cemento: 25,
    cordon_precio_total: 791805,
    hilos_pua: 3,
    precio_pua_por_metro: 1168.02,
    cantidad_ganchos: 48,
    precio_unitario_ganchos: 12337.50,
    cantidad_planchuelas: 12,
    precio_unitario_planchuelas: 5456.45,
    cantidad_torniquetes: 6,
    precio_unitario_torniquetes: 12337.50,
    cantidad_esparragos: 6,
    precio_unitario_esparragos: 1330.00,
    metros_alambre_ar: 720,
    precio_metro_alambre_ar: 3105.48,
    kg_clavos: 2,
    precio_kg_clavos: 1330.00,
    kg_alambre_negro: 8,
    precio_kg_alambre_negro: 844.20,
    precio_mano_obra_por_metro: 11438.00,
    precio_transporte_por_metro: 3580.50,
  },

  // ===== ALTURA 1.8m =====
  {
    nombre: 'Cerco 1.8m Económico - Eucalipto sin Cordón',
    descripcion: 'Cerco perimetral 1.8m con postes de eucalipto, sin cordón',
    altura: 1.80,
    tejido_calibre: 14,
    tejido_rombo: 3.5,
    tipo_poste: 'Eucalipto',
    cantidad_postes_esquineros: 4,
    precio_poste_esquinero: 22500,
    cantidad_postes_refuerzos: 2,
    precio_poste_refuerzo: 22500,
    cantidad_postes_intermedios: 34,
    precio_poste_intermedio: 22500,
    cantidad_puntales: 12,
    precio_puntal: 17500,
    cordon_tipo: 'Sin cordón',
    cordon_bolsas_ripio: 0,
    cordon_bolsas_cemento: 0,
    cordon_precio_total: 0,
    hilos_pua: 0,
    precio_pua_por_metro: 1168.02,
    cantidad_ganchos: 48,
    precio_unitario_ganchos: 12337.50,
    cantidad_planchuelas: 12,
    precio_unitario_planchuelas: 5456.45,
    cantidad_torniquetes: 6,
    precio_unitario_torniquetes: 12337.50,
    cantidad_esparragos: 6,
    precio_unitario_esparragos: 1330.00,
    metros_alambre_ar: 720,
    precio_metro_alambre_ar: 3105.48,
    kg_clavos: 2,
    precio_kg_clavos: 1330.00,
    kg_alambre_negro: 8,
    precio_kg_alambre_negro: 844.20,
    precio_mano_obra_por_metro: 11438.00,
    precio_transporte_por_metro: 3580.50,
  },
  {
    nombre: 'Cerco 1.8m Standard - Eucalipto con Cordón 10cm',
    descripcion: 'Cerco perimetral 1.8m con cordón de hormigón 10cm',
    altura: 1.80,
    tejido_calibre: 14,
    tejido_rombo: 3.5,
    tipo_poste: 'Eucalipto',
    cantidad_postes_esquineros: 4,
    precio_poste_esquinero: 22500,
    cantidad_postes_refuerzos: 2,
    precio_poste_refuerzo: 22500,
    cantidad_postes_intermedios: 34,
    precio_poste_intermedio: 22500,
    cantidad_puntales: 12,
    precio_puntal: 17500,
    cordon_tipo: '10cm',
    cordon_bolsas_ripio: 4,
    cordon_bolsas_cemento: 25,
    cordon_precio_total: 997920,
    hilos_pua: 0,
    precio_pua_por_metro: 1168.02,
    cantidad_ganchos: 48,
    precio_unitario_ganchos: 12337.50,
    cantidad_planchuelas: 12,
    precio_unitario_planchuelas: 5456.45,
    cantidad_torniquetes: 6,
    precio_unitario_torniquetes: 12337.50,
    cantidad_esparragos: 6,
    precio_unitario_esparragos: 1330.00,
    metros_alambre_ar: 720,
    precio_metro_alambre_ar: 3105.48,
    kg_clavos: 2,
    precio_kg_clavos: 1330.00,
    kg_alambre_negro: 8,
    precio_kg_alambre_negro: 844.20,
    precio_mano_obra_por_metro: 11438.00,
    precio_transporte_por_metro: 3580.50,
  },

  // ===== ALTURA 1.5m =====
  {
    nombre: 'Cerco 1.5m Económico - Eucalipto sin Cordón',
    descripcion: 'Cerco perimetral 1.5m con postes de eucalipto',
    altura: 1.50,
    tejido_calibre: 14,
    tejido_rombo: 3.5,
    tipo_poste: 'Eucalipto',
    cantidad_postes_esquineros: 4,
    precio_poste_esquinero: 22500,
    cantidad_postes_refuerzos: 2,
    precio_poste_refuerzo: 22500,
    cantidad_postes_intermedios: 34,
    precio_poste_intermedio: 22500,
    cantidad_puntales: 12,
    precio_puntal: 17500,
    cordon_tipo: 'Sin cordón',
    cordon_bolsas_ripio: 0,
    cordon_bolsas_cemento: 0,
    cordon_precio_total: 0,
    hilos_pua: 0,
    precio_pua_por_metro: 1168.02,
    cantidad_ganchos: 48,
    precio_unitario_ganchos: 12337.50,
    cantidad_planchuelas: 12,
    precio_unitario_planchuelas: 5456.45,
    cantidad_torniquetes: 6,
    precio_unitario_torniquetes: 12337.50,
    cantidad_esparragos: 6,
    precio_unitario_esparragos: 1330.00,
    metros_alambre_ar: 720,
    precio_metro_alambre_ar: 3105.48,
    kg_clavos: 2,
    precio_kg_clavos: 1330.00,
    kg_alambre_negro: 8,
    precio_kg_alambre_negro: 844.20,
    precio_mano_obra_por_metro: 11438.00,
    precio_transporte_por_metro: 3580.50,
  },
  {
    nombre: 'Cerco 1.5m Standard - Eucalipto con Cordón 10cm',
    descripcion: 'Cerco perimetral 1.5m con cordón de hormigón',
    altura: 1.50,
    tejido_calibre: 14,
    tejido_rombo: 3.5,
    tipo_poste: 'Eucalipto',
    cantidad_postes_esquineros: 4,
    precio_poste_esquinero: 22500,
    cantidad_postes_refuerzos: 2,
    precio_poste_refuerzo: 22500,
    cantidad_postes_intermedios: 34,
    precio_poste_intermedio: 22500,
    cantidad_puntales: 12,
    precio_puntal: 17500,
    cordon_tipo: '10cm',
    cordon_bolsas_ripio: 4,
    cordon_bolsas_cemento: 25,
    cordon_precio_total: 997920,
    hilos_pua: 0,
    precio_pua_por_metro: 1168.02,
    cantidad_ganchos: 48,
    precio_unitario_ganchos: 12337.50,
    cantidad_planchuelas: 12,
    precio_unitario_planchuelas: 5456.45,
    cantidad_torniquetes: 6,
    precio_unitario_torniquetes: 12337.50,
    cantidad_esparragos: 6,
    precio_unitario_esparragos: 1330.00,
    metros_alambre_ar: 720,
    precio_metro_alambre_ar: 3105.48,
    kg_clavos: 2,
    precio_kg_clavos: 1330.00,
    kg_alambre_negro: 8,
    precio_kg_alambre_negro: 844.20,
    precio_mano_obra_por_metro: 11438.00,
    precio_transporte_por_metro: 3580.50,
  },

  // ===== ALTURA 1.2m =====
  {
    nombre: 'Cerco 1.2m Económico - Eucalipto sin Cordón',
    descripcion: 'Cerco perimetral 1.2m altura final aprox. 1.5m',
    altura: 1.20,
    tejido_calibre: 14,
    tejido_rombo: 3.5,
    tipo_poste: 'Eucalipto',
    cantidad_postes_esquineros: 4,
    precio_poste_esquinero: 22500,
    cantidad_postes_refuerzos: 2,
    precio_poste_refuerzo: 22500,
    cantidad_postes_intermedios: 34,
    precio_poste_intermedio: 22500,
    cantidad_puntales: 12,
    precio_puntal: 17500,
    cordon_tipo: 'Sin cordón',
    cordon_bolsas_ripio: 0,
    cordon_bolsas_cemento: 0,
    cordon_precio_total: 0,
    hilos_pua: 0,
    precio_pua_por_metro: 1168.02,
    cantidad_ganchos: 48,
    precio_unitario_ganchos: 12337.50,
    cantidad_planchuelas: 12,
    precio_unitario_planchuelas: 5456.45,
    cantidad_torniquetes: 6,
    precio_unitario_torniquetes: 12337.50,
    cantidad_esparragos: 6,
    precio_unitario_esparragos: 1330.00,
    metros_alambre_ar: 720,
    precio_metro_alambre_ar: 3105.48,
    kg_clavos: 2,
    precio_kg_clavos: 1330.00,
    kg_alambre_negro: 8,
    precio_kg_alambre_negro: 844.20,
    precio_mano_obra_por_metro: 11438.00,
    precio_transporte_por_metro: 3580.50,
  },

  // ===== VARIANTES PREMIUM =====
  {
    nombre: 'Cerco 2.0m Ultra Premium - Olimp con Cordón 20cm + 4 Púas',
    descripcion: 'Máxima seguridad: Postes Olimp, cordón reforzado 20cm, 4 hilos de púa',
    altura: 2.00,
    tejido_calibre: 12,
    tejido_rombo: 2.0,
    tipo_poste: 'Olimp',
    cantidad_postes_esquineros: 4,
    precio_poste_esquinero: 35000,
    cantidad_postes_refuerzos: 2,
    precio_poste_refuerzo: 31250,
    cantidad_postes_intermedios: 34,
    precio_poste_intermedio: 28750,
    cantidad_puntales: 12,
    precio_puntal: 22500,
    cordon_tipo: '20cm',
    cordon_bolsas_ripio: 4,
    cordon_bolsas_cemento: 25,
    cordon_precio_total: 1164380,
    hilos_pua: 4,
    precio_pua_por_metro: 1168.02,
    cantidad_ganchos: 48,
    precio_unitario_ganchos: 12337.50,
    cantidad_planchuelas: 12,
    precio_unitario_planchuelas: 5456.45,
    cantidad_torniquetes: 6,
    precio_unitario_torniquetes: 12337.50,
    cantidad_esparragos: 6,
    precio_unitario_esparragos: 1330.00,
    metros_alambre_ar: 720,
    precio_metro_alambre_ar: 3105.48,
    kg_clavos: 2,
    precio_kg_clavos: 1330.00,
    kg_alambre_negro: 8,
    precio_kg_alambre_negro: 844.20,
    precio_mano_obra_por_metro: 11438.00,
    precio_transporte_por_metro: 3580.50,
  },
  {
    nombre: 'Cerco 1.8m Premium - Punta Diamante con Cordón 10cm + 2 Púas',
    descripcion: 'Cerco 1.8m con postes Punta Diamante y 2 hilos de púa',
    altura: 1.80,
    tejido_calibre: 14,
    tejido_rombo: 3.0,
    tipo_poste: 'Punta Diamante',
    cantidad_postes_esquineros: 4,
    precio_poste_esquinero: 31250,
    cantidad_postes_refuerzos: 2,
    precio_poste_refuerzo: 27500,
    cantidad_postes_intermedios: 34,
    precio_poste_intermedio: 25000,
    cantidad_puntales: 12,
    precio_puntal: 22500,
    cordon_tipo: '10cm',
    cordon_bolsas_ripio: 4,
    cordon_bolsas_cemento: 25,
    cordon_precio_total: 997920,
    hilos_pua: 2,
    precio_pua_por_metro: 1168.02,
    cantidad_ganchos: 48,
    precio_unitario_ganchos: 12337.50,
    cantidad_planchuelas: 12,
    precio_unitario_planchuelas: 5456.45,
    cantidad_torniquetes: 6,
    precio_unitario_torniquetes: 12337.50,
    cantidad_esparragos: 6,
    precio_unitario_esparragos: 1330.00,
    metros_alambre_ar: 720,
    precio_metro_alambre_ar: 3105.48,
    kg_clavos: 2,
    precio_kg_clavos: 1330.00,
    kg_alambre_negro: 8,
    precio_kg_alambre_negro: 844.20,
    precio_mano_obra_por_metro: 11438.00,
    precio_transporte_por_metro: 3580.50,
  },
]

async function importarConfiguraciones() {
  console.log('🚀 Iniciando importación de configuraciones de cercado...\n')

  try {
    // Obtener tejidos disponibles para asociar
    const { data: tejidosDisponibles, error: errorTejidos } = await supabase
      .from('tejidos_configuraciones')
      .select('id, codigo, calibre, altura, tamano_rombo')
      .eq('activo', true)

    if (errorTejidos) {
      console.error('❌ Error al cargar tejidos:', errorTejidos)
      process.exit(1)
    }

    console.log(`✅ Tejidos disponibles: ${tejidosDisponibles.length}\n`)

    let importadas = 0
    let errores = 0

    for (const config of configuraciones) {
      try {
        // Buscar el tejido correspondiente
        const tejido = tejidosDisponibles.find(t => 
          t.calibre === config.tejido_calibre &&
          Math.abs(t.altura - config.altura) < 0.01 &&
          Math.abs(t.tamano_rombo - config.tejido_rombo) < 0.01
        )

        if (!tejido) {
          console.log(`⚠️  No se encontró tejido para: ${config.nombre}`)
          console.log(`   Buscando: Cal.${config.tejido_calibre}, ${config.altura}m, Rombo ${config.tejido_rombo}"`)
          errores++
          continue
        }

        // Calcular total de accesorios
        const totalAccesorios = 
          (config.cantidad_ganchos * config.precio_unitario_ganchos) +
          (config.cantidad_planchuelas * config.precio_unitario_planchuelas) +
          (config.cantidad_torniquetes * config.precio_unitario_torniquetes) +
          (config.cantidad_esparragos * config.precio_unitario_esparragos) +
          (config.metros_alambre_ar * config.precio_metro_alambre_ar) +
          (config.kg_clavos * config.precio_kg_clavos) +
          (config.kg_alambre_negro * config.precio_kg_alambre_negro)

        // Obtener precio del tejido
        const { data: tejidoConPrecio } = await supabase
          .from('v_tejidos_con_precios')
          .select('precio_venta')
          .eq('id', tejido.id)
          .single()

        const precioTejido = tejidoConPrecio?.precio_venta || 0
        const costoTejido = 18 * precioTejido // 18 rollos para 180m

        const totalPostes =
          (config.cantidad_postes_esquineros * config.precio_poste_esquinero) +
          (config.cantidad_postes_refuerzos * config.precio_poste_refuerzo) +
          (config.cantidad_postes_intermedios * config.precio_poste_intermedio) +
          (config.cantidad_puntales * config.precio_puntal)

        const costoPua = 180 * config.hilos_pua * config.precio_pua_por_metro
        const costoManoObra = 180 * config.precio_mano_obra_por_metro
        const costoTransporte = 180 * config.precio_transporte_por_metro

        const total180m = costoTejido + totalPostes + config.cordon_precio_total +
                          costoPua + totalAccesorios + costoManoObra + costoTransporte

        const precioMetro = total180m / 180
        const precioMetroMenor50 = precioMetro * 1.30

        // Insertar configuración
        const configData = {
          ...config,
          tejido_config_id: tejido.id,
          precio_total_accesorios: totalAccesorios,
          precio_base_180m: total180m,
          precio_por_metro_lineal: precioMetro,
          precio_por_metro_menor_50m: precioMetroMenor50,
          activo: true,
        }

        // Remover campos que no van en la tabla
        delete configData.tejido_calibre
        delete configData.tejido_rombo

        const { error } = await supabase
          .from('configuraciones_cercado')
          .insert(configData)

        if (error) throw error

        console.log(`✅ ${config.nombre}`)
        console.log(`   Altura: ${config.altura}m | Tejido: ${tejido.codigo}`)
        console.log(`   Precio/metro: $${precioMetro.toLocaleString()}`)
        console.log(`   Total 180m: $${total180m.toLocaleString()}\n`)
        
        importadas++
      } catch (error) {
        console.error(`❌ Error en: ${config.nombre}`)
        console.error(`   ${error.message}\n`)
        errores++
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log(`📊 RESUMEN:`)
    console.log(`   ✅ Importadas: ${importadas}`)
    console.log(`   ❌ Errores: ${errores}`)
    console.log(`   📦 Total: ${configuraciones.length}`)
    console.log('='.repeat(60) + '\n')

    if (importadas > 0) {
      console.log('🎉 ¡Configuraciones importadas exitosamente!')
      console.log('📍 Ve a: http://localhost:3000/dashboard/cercado')
    }

  } catch (error) {
    console.error('❌ Error general:', error)
    process.exit(1)
  }
}

// Ejecutar
importarConfiguraciones()

