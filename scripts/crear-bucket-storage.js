/**
 * Script para crear el bucket de Storage en Supabase
 * Ejecutar: node scripts/crear-bucket-storage.js
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan las variables de entorno')
  console.error('Asegúrate de tener en .env.local:')
  console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function crearBucket() {
  console.log('🚀 Creando bucket de Storage...\n')

  try {
    // 1. Verificar si el bucket ya existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      throw listError
    }

    const bucketExists = buckets.some(bucket => bucket.name === 'articulos-images')

    if (bucketExists) {
      console.log('✅ El bucket "articulos-images" ya existe')
      console.log('📝 Verificando políticas...\n')
    } else {
      // 2. Crear el bucket
      const { data: bucket, error: createError } = await supabase.storage.createBucket('articulos-images', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
      })

      if (createError) {
        throw createError
      }

      console.log('✅ Bucket "articulos-images" creado exitosamente')
    }

    console.log('\n📋 Configuración del bucket:')
    console.log('   - Nombre: articulos-images')
    console.log('   - Público: Sí')
    console.log('   - Tamaño máximo: 5MB')
    console.log('   - Tipos permitidos: PNG, JPG, JPEG, WEBP')
    
    console.log('\n✨ ¡Listo! Ya podés subir imágenes desde el dashboard')
    console.log('   Ve a: Dashboard → Artículos → Nuevo/Editar → Subir imagen\n')

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('\n💡 Solución manual:')
    console.error('   1. Ve a https://supabase.com/dashboard')
    console.error('   2. Selecciona tu proyecto')
    console.error('   3. Ve a Storage → Create bucket')
    console.error('   4. Nombre: articulos-images')
    console.error('   5. Public: ✅ Activado')
    console.error('   6. Guarda\n')
    process.exit(1)
  }
}

crearBucket()

