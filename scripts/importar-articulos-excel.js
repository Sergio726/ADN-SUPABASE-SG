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
// Función para categorizar artículos automáticamente
// =====================================================
function categorizarArticulo(nombre) {
  const n = nombre.toLowerCase()
  
  if (n.includes('alambre')) return 'Alambres'
  if (n.includes('gancho') || n.includes('torniqueta') || n.includes('esparra')) return 'Accesorios'
  if (n.includes('varilla') || n.includes('planchuela')) return 'Estructurales'
  if (n.includes('arena') || n.includes('ripio') || n.includes('cemento')) return 'Construcción'
  if (n.includes('hierro') || n.includes('barra')) return 'Hierros'
  if (n.includes('mano de obra') || n.includes('transporte')) return 'Servicios'
  if (n.includes('electrodo') || n.includes('disco') || n.includes('travilla') || n.includes('concertina')) return 'Otros'
  
  return 'General'
}

// =====================================================
// Función para asignar altura compatible
// =====================================================
function asignarAlturaCompatible(nombre, categoria) {
  const n = nombre.toLowerCase()
  
  // Alambres, servicios y materiales básicos
  if (categoria === 'Alambres' || categoria === 'Servicios' || categoria === 'Construcción') {
    return 'todas'
  }
  
  // Accesorios pequeños para alturas bajas
  if (n.includes('micro') || n.includes('mini')) {
    return '1.0,1.2,1.5'
  }
  
  // Accesorios grandes para alturas grandes
  if (n.includes('n 7') || n.includes('n7') || n.includes('x 10"')) {
    return '1.8,2.0'
  }
  
  // Ganchos medianos
  if (n.includes('gancho') && (n.includes('x 7') || n.includes('x 8'))) {
    return '1.2,1.5,1.8'
  }
  
  // Concertinas para cercados altos
  if (n.includes('concertina')) {
    return '1.8,2.0'
  }
  
  // Estructurales compatibles con todas
  if (categoria === 'Estructurales') {
    return 'todas'
  }
  
  // Resto: sin restricción
  return null
}

// =====================================================
// Función para calcular márgenes desde precios
// =====================================================
function calcularMargenes(precioCosto, precioEfectivo, precioLista, precioTarjeta) {
  const margenEfectivo = ((precioEfectivo / precioCosto) - 1) * 100
  const margenLista = ((precioLista / precioCosto) - 1) * 100
  const margenTarjeta = ((precioTarjeta / precioCosto) - 1) * 100
  
  return {
    margen_efectivo: Math.round(margenEfectivo * 100) / 100,
    margen_lista: Math.round(margenLista * 100) / 100,
    margen_tarjeta: Math.round(margenTarjeta * 100) / 100
  }
}

// =====================================================
// Importación principal
// =====================================================
async function importarArticulos() {
  console.log('🚀 Iniciando importación de artículos desde Excel...\n')

  try {
    // Leer Excel
    const wb = XLSX.readFile('app/files/Articulos.xlsx')
    const ws = wb.Sheets[wb.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json(ws)

    console.log(`📦 Total de artículos en Excel: ${data.length}\n`)

    let importados = 0
    let actualizados = 0
    let errores = 0

    for (const [index, item] of data.entries()) {
      try {
        const nombre = item['Articulo Detalle']
        const unidad = item['Unidad']
        const dimensiones = item['Dimensiones'] || null
        const precioCosto = parseFloat(item['Precio Costo(neto + impuestos)'])
        const precioEfectivo = parseFloat(item['Precio Efectivo/Transf.'])
        const precioLista = parseFloat(item['Precio Venta/Lista'])
        const precioTarjeta = parseFloat(item['Precio Tarjeta'])

        // Categorizar
        const categoria = categorizarArticulo(nombre)
        const alturaCompatible = asignarAlturaCompatible(nombre, categoria)
        const margenes = calcularMargenes(precioCosto, precioEfectivo, precioLista, precioTarjeta)

        // Verificar si ya existe (especialmente IDs 7 y 8)
        let articuloId = null
        
        // Casos especiales para Alambre Galvanizado Cal.12 y 14
        if (nombre === 'Alambre Galvanizado Calibre 12') {
          articuloId = 7
        } else if (nombre === 'Alambre Galvanizado Calibre 14') {
          articuloId = 8
        }

        if (articuloId) {
          // Actualizar artículo existente
          const { error: errorUpdate } = await supabase
            .from('articulos')
            .update({
              nombre,
              categoria,
              unidad,
              altura_compatible: alturaCompatible,
            })
            .eq('id', articuloId)

          if (errorUpdate) throw errorUpdate

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

          console.log(`✅ Creado: ${nombre}`)
          importados++
        }

        // Crear o actualizar precio vigente
        // Primero desactivar precios anteriores
        await supabase
          .from('precios_venta')
          .update({ vigente: false })
          .eq('articulo_id', articuloId)
          .eq('vigente', true)

        // Crear nuevo precio
        const { error: errorPrecio } = await supabase
          .from('precios_venta')
          .insert({
            articulo_id: articuloId,
            precio_costo: precioCosto,
            precio_venta: precioEfectivo,
            vigente: true,
            fecha_inicio: new Date().toISOString().split('T')[0],
          })

        if (errorPrecio) {
          console.error(`   ⚠️  Error al crear precio: ${errorPrecio.message}`)
        }

        console.log(`   Categoría: ${categoria}`)
        console.log(`   Unidad: ${unidad}`)
        console.log(`   Altura: ${alturaCompatible || 'Sin restricción'}`)
        console.log(`   Costo: $${precioCosto.toLocaleString()}`)
        console.log(`   Efectivo: $${precioEfectivo.toLocaleString()} (${margenes.margen_efectivo}%)`)
        console.log(`   Lista: $${precioLista.toLocaleString()} (${margenes.margen_lista}%)`)
        console.log(`   Tarjeta: $${precioTarjeta.toLocaleString()} (${margenes.margen_tarjeta}%)`)
        console.log('')

      } catch (error) {
        console.error(`❌ Error en: ${item['Articulo Detalle']}`)
        console.error(`   ${error.message}\n`)
        errores++
      }
    }

    console.log('\n' + '='.repeat(80))
    console.log(`📊 RESUMEN DE IMPORTACIÓN:`)
    console.log(`   ✅ Nuevos artículos: ${importados}`)
    console.log(`   🔄 Actualizados: ${actualizados}`)
    console.log(`   ❌ Errores: ${errores}`)
    console.log(`   📦 Total procesados: ${data.length}`)
    console.log('='.repeat(80) + '\n')

    if (importados + actualizados > 0) {
      console.log('🎉 ¡Artículos importados exitosamente!')
      console.log('📍 Ve a: http://localhost:3000/dashboard/articulos')
      console.log('\n💡 Notas importantes:')
      console.log('   • Los artículos fueron marcados como publicados')
      console.log('   • Se asignaron categorías automáticamente')
      console.log('   • Se configuraron alturas compatibles donde aplica')
      console.log('   • Los IDs 7 y 8 fueron actualizados (Alambre Cal.12 y 14)')
      console.log('   • Todos tienen precio vigente en precios_venta')
    }

  } catch (error) {
    console.error('❌ Error general:', error)
    process.exit(1)
  }
}

// Ejecutar
importarArticulos()

