// Script para verificar los datos de precios
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testPrecios() {
  console.log('🔍 Verificando datos de precios...\n')
  
  // Obtener todos los precios como en la página de listado
  const { data: preciosLista, error: errorLista } = await supabase
    .from('precios_venta')
    .select(`
      *,
      articulos(id, nombre, categoria)
    `)
  
  if (errorLista) {
    console.error('❌ Error al cargar lista:', errorLista)
    return
  }

  console.log('📋 LISTA DE PRECIOS (como aparece en /dashboard/precios):\n')
  preciosLista.forEach(p => {
    console.log(`ID: ${p.id}`)
    console.log(`  Artículo: ${p.articulos.nombre}`)
    console.log(`  Precio Costo: ${p.precio_costo} (tipo: ${typeof p.precio_costo})`)
    console.log(`  Precio Venta: ${p.precio_venta} (tipo: ${typeof p.precio_venta})`)
    console.log(`  Margen: ${p.margen}%`)
    console.log(`  Vigente: ${p.vigente}`)
    console.log('')
  })

  // Obtener el precio con ID 1 como en la página de edición
  const { data: precioEdit, error: errorEdit } = await supabase
    .from('precios_venta')
    .select(`
      *,
      articulos(id, nombre, categoria)
    `)
    .eq('id', 1)
    .single()

  if (errorEdit) {
    console.error('❌ Error al cargar precio ID 1:', errorEdit)
    return
  }

  console.log('✏️ PRECIO ID 1 (como aparece en /dashboard/precios/editar/1):\n')
  console.log(`ID: ${precioEdit.id}`)
  console.log(`  Artículo: ${precioEdit.articulos.nombre}`)
  console.log(`  Precio Costo: ${precioEdit.precio_costo} (tipo: ${typeof precioEdit.precio_costo})`)
  console.log(`  Precio Venta: ${precioEdit.precio_venta} (tipo: ${typeof precioEdit.precio_venta})`)
  console.log(`  Margen: ${precioEdit.margen}%`)
  console.log(`  Vigente: ${precioEdit.vigente}`)
  console.log(`  Fecha Inicio: ${precioEdit.fecha_inicio}`)
  console.log(`  Fecha Fin: ${precioEdit.fecha_fin}`)
  
  console.log('\n─────────────────────────────────────')
  console.log('🔍 COMPARACIÓN:')
  const precioEnLista = preciosLista.find(p => p.id === 1)
  if (precioEnLista) {
    console.log(`\nPrecio Costo en Lista: ${precioEnLista.precio_costo}`)
    console.log(`Precio Costo en Edit:  ${precioEdit.precio_costo}`)
    console.log(`¿Son iguales? ${precioEnLista.precio_costo === precioEdit.precio_costo ? '✅ SÍ' : '❌ NO'}`)
    
    console.log(`\nPrecio Venta en Lista: ${precioEnLista.precio_venta}`)
    console.log(`Precio Venta en Edit:  ${precioEdit.precio_venta}`)
    console.log(`¿Son iguales? ${precioEnLista.precio_venta === precioEdit.precio_venta ? '✅ SÍ' : '❌ NO'}`)
  }
}

testPrecios()

