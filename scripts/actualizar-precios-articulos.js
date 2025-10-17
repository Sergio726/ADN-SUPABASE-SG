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

async function actualizarPrecios() {
  console.log('🚀 Actualizando precios de artículos desde Excel...\n')

  try {
    // Leer Excel
    const wb = XLSX.readFile('app/files/Articulos.xlsx')
    const ws = wb.Sheets[wb.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json(ws)

    console.log(`📦 Total de artículos en Excel: ${data.length}\n`)

    let actualizados = 0
    let errores = 0

    for (const item of data) {
      try {
        const nombre = item['Articulo Detalle']
        const precioCosto = parseFloat(item['Precio Costo(neto + impuestos)'])
        const precioEfectivo = parseFloat(item['Precio Efectivo/Transf.'])
        const precioLista = parseFloat(item['Precio Venta/Lista'])
        const precioTarjeta = parseFloat(item['Precio Tarjeta'])

        // Buscar el artículo por nombre
        const { data: articulo, error: errorBuscar } = await supabase
          .from('articulos')
          .select('id')
          .eq('nombre', nombre)
          .single()

        if (errorBuscar || !articulo) {
          console.log(`⚠️  No encontrado: ${nombre}`)
          continue
        }

        const articuloId = articulo.id

        // Desactivar precios anteriores
        await supabase
          .from('precios_venta')
          .update({ vigente: false })
          .eq('articulo_id', articuloId)
          .eq('vigente', true)

        // Crear nuevo precio vigente
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
          console.error(`❌ Error al crear precio para: ${nombre}`)
          console.error(`   ${errorPrecio.message}`)
          errores++
          continue
        }

        console.log(`✅ ${nombre}`)
        console.log(`   ID: ${articuloId}`)
        console.log(`   Costo: $${precioCosto.toLocaleString()}`)
        console.log(`   Efectivo: $${precioEfectivo.toLocaleString()}`)
        console.log(`   Lista: $${precioLista.toLocaleString()}`)
        console.log(`   Tarjeta: $${precioTarjeta.toLocaleString()}`)
        console.log('')

        actualizados++

      } catch (error) {
        console.error(`❌ Error en: ${item['Articulo Detalle']}`)
        console.error(`   ${error.message}\n`)
        errores++
      }
    }

    console.log('\n' + '='.repeat(80))
    console.log(`📊 RESUMEN:`)
    console.log(`   ✅ Precios creados: ${actualizados}`)
    console.log(`   ❌ Errores: ${errores}`)
    console.log(`   📦 Total procesados: ${data.length}`)
    console.log('='.repeat(80) + '\n')

    if (actualizados > 0) {
      console.log('🎉 ¡Precios actualizados exitosamente!')
      console.log('📍 Ve a: http://localhost:3000/dashboard/precios')
    }

  } catch (error) {
    console.error('❌ Error general:', error)
    process.exit(1)
  }
}

// Ejecutar
actualizarPrecios()

