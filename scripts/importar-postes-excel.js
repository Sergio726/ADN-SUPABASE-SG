require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const XLSX = require('xlsx')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Faltan variables de entorno')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// =====================================================
// Función para categorizar postes automáticamente
// =====================================================
function categorizarPoste(nombre) {
  const n = nombre.toLowerCase()
  
  if (n.includes('hormigón') || n.includes('hormigon') || n.includes('concreto')) {
    if (n.includes('ménsula') || n.includes('mensula')) return 'Postes'
    if (n.includes('punta diamante') || n.includes('punta diamante')) return 'Postes'
    if (n.includes('puntal')) return 'Postes'
    return 'Postes'
  }
  if (n.includes('eucalipto')) return 'Postes'
  if (n.includes('metal')) return 'Postes'
  if (n.includes('madera')) return 'Postes'
  
  return 'Postes'
}

// =====================================================
// Función para asignar altura compatible
// =====================================================
function asignarAlturaCompatible(nombre, categoria) {
  // No asignar alturas automáticamente
  // El usuario debe configurarlas manualmente en el dashboard si lo desea
  return null
}

// =====================================================
// Importación principal
// =====================================================
async function importarPostes() {
  console.log('🚀 Iniciando importación de postes desde Excel...\n')

  try {
    // Leer Excel
    const wb = XLSX.readFile('app/files/Postes.xlsx')
    const ws = wb.Sheets[wb.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json(ws)

    console.log(`📦 Total de postes en Excel: ${data.length}\n`)

    let importados = 0
    let actualizados = 0
    let errores = 0

    for (const [index, item] of data.entries()) {
      try {
        const nombre = item['Articulo Detalle']
        if (!nombre || nombre.trim() === '') {
          console.log(`⏭️  Fila ${index + 2} vacía, saltando...`)
          continue
        }

        const unidad = item['Unidad'] || 'unidad'
        const dimensiones = item['Dimensiones'] || null
        const precioCosto = parseFloat(item['Precio Costo(neto + impuestos)']) || 0
        const precioEfectivoRaw = parseFloat(item['Precio Efectivo/Transf.']) || 0
        const precioListaRaw = parseFloat(item['Precio Venta/Lista']) || 0
        const precioTarjetaRaw = parseFloat(item['Precio Tarjeta']) || 0

        // Si no se proporcionó precio efectivo, calcular desde costo con margen 56%
        const precioEfectivo = precioEfectivoRaw > 0 ? precioEfectivoRaw : (precioCosto * 1.56)

        // Categorizar
        const categoria = categorizarPoste(nombre)
        const alturaCompatible = asignarAlturaCompatible(nombre, categoria)

        // Verificar si ya existe por nombre
        const { data: articuloExistente } = await supabase
          .from('articulos')
          .select('id')
          .eq('nombre', nombre)
          .single()

        let articuloId = null

        if (articuloExistente) {
          // Actualizar artículo existente
          const { error: errorUpdate } = await supabase
            .from('articulos')
            .update({
              nombre,
              categoria,
              unidad,
              altura_compatible: alturaCompatible,
              descripcion: dimensiones ? `Dimensiones: ${dimensiones}` : null,
            })
            .eq('id', articuloExistente.id)

          if (errorUpdate) throw errorUpdate

          articuloId = articuloExistente.id
          console.log(`🔄 Actualizado: ${nombre} (ID: ${articuloId})`)
          actualizados++
        } else {
          // Crear nuevo artículo
          const { data: articuloData, error: errorArticulo } = await supabase
            .from('articulos')
            .insert({
              nombre,
              descripcion: dimensiones ? `Dimensiones: ${dimensiones}` : null,
              categoria,
              unidad,
              stock_actual: 0,
              stock_minimo: 0,
              proveedor_id: null,
              imagen_url: null,
              publicado: true, // Importados como publicados por defecto
              mostrar_precio_publico: true,
              altura_compatible: alturaCompatible,
            })
            .select()
            .single()

          if (errorArticulo) throw errorArticulo
          articuloId = articuloData.id

          console.log(`✅ Creado: ${nombre} (ID: ${articuloId})`)
          importados++
        }

        // Crear o actualizar precio vigente
        // Primero desactivar precios anteriores
        await supabase
          .from('precios_venta')
          .update({ vigente: false })
          .eq('articulo_id', articuloId)
          .eq('vigente', true)

        // Crear nuevo precio (precio_venta debe ser precio base = efectivo)
        const { error: errorPrecio } = await supabase
          .from('precios_venta')
          .insert({
            articulo_id: articuloId,
            precio_costo: precioCosto,
            precio_venta: precioEfectivo, // Precio base (efectivo)
            vigente: true,
            fecha_inicio: new Date().toISOString().split('T')[0],
          })

        if (errorPrecio) {
          console.error(`   ⚠️  Error al crear precio: ${errorPrecio.message}`)
          throw errorPrecio
        }

        console.log(`   Categoría: ${categoria}`)
        console.log(`   Unidad: ${unidad}`)
        console.log(`   Altura: ${alturaCompatible ? alturaCompatible : 'Sin restricción (null)'}`)
        console.log(`   Costo: $${precioCosto.toLocaleString()}`)
        console.log(`   Precio Base (Efectivo): $${precioEfectivo.toLocaleString()}`)
        if (precioCosto > 0) {
          const margen = ((precioEfectivo / precioCosto) - 1) * 100
          console.log(`   Margen: ${margen.toFixed(2)}%`)
        }
        console.log('')

      } catch (error) {
        console.error(`❌ Error en: ${item['Articulo Detalle'] || `Fila ${index + 2}`}`)
        console.error(`   ${error.message}\n`)
        errores++
      }
    }

    console.log('\n' + '='.repeat(80))
    console.log(`📊 RESUMEN DE IMPORTACIÓN:`)
    console.log(`   ✅ Nuevos postes: ${importados}`)
    console.log(`   🔄 Actualizados: ${actualizados}`)
    console.log(`   ❌ Errores: ${errores}`)
    console.log(`   📦 Total procesados: ${data.length}`)
    console.log('='.repeat(80) + '\n')

    if (importados + actualizados > 0) {
      console.log('🎉 ¡Postes importados exitosamente!')
      console.log('📍 Ve a: http://localhost:3000/dashboard/articulos')
      console.log('\n💡 Notas importantes:')
      console.log('   • Los postes fueron marcados como publicados')
      console.log('   • Se asignó categoría "Postes" automáticamente')
      console.log('   • Las alturas compatibles NO se asignan automáticamente')
      console.log('   • Puedes configurar las alturas compatibles manualmente en el dashboard')
      console.log('   • Si no se proporcionó precio efectivo, se calculó como costo × 1.56')
      console.log('   • Todos tienen precio vigente en precios_venta')
      console.log('   • Los precios derivados (Factura/Lista, Tarjeta) se calculan automáticamente')
    }

  } catch (error) {
    console.error('❌ Error general:', error)
    process.exit(1)
  }
}

// Ejecutar
importarPostes()

