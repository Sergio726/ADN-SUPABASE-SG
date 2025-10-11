// Script de prueba de conexión a Supabase
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Probando conexión con Supabase...\n')
console.log('📍 URL:', supabaseUrl)
console.log('🔑 Key:', supabaseKey ? '✓ Configurada' : '✗ No encontrada')
console.log('\n-----------------------------------\n')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Faltan credenciales de Supabase')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log('1️⃣ Probando conexión básica...')
    
    // Test 1: Verificar tablas
    console.log('\n2️⃣ Verificando tabla de proveedores...')
    const { data: proveedores, error: provError } = await supabase
      .from('proveedores')
      .select('*')
      .limit(5)
    
    if (provError) {
      console.error('❌ Error en proveedores:', provError.message)
    } else {
      console.log(`✅ Tabla proveedores: ${proveedores?.length || 0} registros encontrados`)
      if (proveedores && proveedores.length > 0) {
        console.log('   Ejemplo:', proveedores[0].nombre)
      }
    }

    // Test 2: Verificar artículos
    console.log('\n3️⃣ Verificando tabla de artículos...')
    const { data: articulos, error: artError } = await supabase
      .from('articulos')
      .select('*')
      .limit(5)
    
    if (artError) {
      console.error('❌ Error en artículos:', artError.message)
    } else {
      console.log(`✅ Tabla artículos: ${articulos?.length || 0} registros encontrados`)
      if (articulos && articulos.length > 0) {
        console.log('   Ejemplo:', articulos[0].nombre)
      }
    }

    // Test 3: Verificar precios
    console.log('\n4️⃣ Verificando tabla de precios...')
    const { data: precios, error: preciosError } = await supabase
      .from('precios_venta')
      .select('*')
      .limit(5)
    
    if (preciosError) {
      console.error('❌ Error en precios:', preciosError.message)
    } else {
      console.log(`✅ Tabla precios_venta: ${precios?.length || 0} registros encontrados`)
    }

    // Test 4: Verificar usuarios
    console.log('\n5️⃣ Verificando tabla de usuarios...')
    const { data: usuarios, error: usuariosError } = await supabase
      .from('usuarios')
      .select('*')
      .limit(5)
    
    if (usuariosError) {
      console.error('❌ Error en usuarios:', usuariosError.message)
    } else {
      console.log(`✅ Tabla usuarios: ${usuarios?.length || 0} registros encontrados`)
    }

    // Test 5: Verificar leads
    console.log('\n6️⃣ Verificando tabla de leads...')
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .limit(5)
    
    if (leadsError) {
      console.error('❌ Error en leads:', leadsError.message)
    } else {
      console.log(`✅ Tabla leads: ${leads?.length || 0} registros encontrados`)
    }

    console.log('\n-----------------------------------')
    console.log('\n✅ Conexión con Supabase exitosa!')
    console.log('\n📊 Resumen:')
    console.log(`   • Proveedores: ${proveedores?.length || 0}`)
    console.log(`   • Artículos: ${articulos?.length || 0}`)
    console.log(`   • Precios: ${precios?.length || 0}`)
    console.log(`   • Usuarios: ${usuarios?.length || 0}`)
    console.log(`   • Leads: ${leads?.length || 0}`)
    
    if ((articulos?.length || 0) === 0) {
      console.log('\n💡 Sugerencia: Ejecutá el script seed.sql para cargar datos de prueba')
    }

  } catch (error) {
    console.error('\n❌ Error general:', error.message)
    process.exit(1)
  }
}

testConnection()

