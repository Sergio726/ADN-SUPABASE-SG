const XLSX = require('xlsx');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno de Supabase no configuradas');
  console.log('Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('📊 IMPORTACIÓN DE TEJIDOS ROMBOIDALES\n');
console.log('='.repeat(100));

async function main() {
  try {
    // Leer Excel
    console.log('\n📖 Leyendo archivo Excel...');
    const filePath = path.join(__dirname, '../app/files/Tejido romboidal.xlsx');
    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets['Tejidos romboidales'];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log('✅ Excel leído correctamente');
    
    // Obtener IDs de alambre galvanizado
    console.log('\n🔍 Buscando artículos de alambre galvanizado...');
    const { data: alambres, error: errorAlambres } = await supabase
      .from('articulos')
      .select('id, nombre')
      .ilike('nombre', '%Alambre Galvanizado Calibre%');
    
    if (errorAlambres) {
      throw new Error(`Error al buscar alambres: ${errorAlambres.message}`);
    }
    
    const alambreCal12 = alambres.find(a => a.nombre.includes('Calibre 12'));
    const alambreCal14 = alambres.find(a => a.nombre.includes('Calibre 14') || a.nombre.includes('Calibre 13'));
    
    if (!alambreCal12 || !alambreCal14) {
      console.log('\n⚠️  Artículos de alambre no encontrados. Créalos primero:');
      console.log('  - Alambre Galvanizado Calibre 12');
      console.log('  - Alambre Galvanizado Calibre 14');
      process.exit(1);
    }
    
    console.log(`✅ Alambre Cal.12 encontrado: ID ${alambreCal12.id}`);
    console.log(`✅ Alambre Cal.14 encontrado: ID ${alambreCal14.id}`);
    
    // Procesar configuraciones
    const configuraciones = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      if (!row[0] || !row[1]) continue;
      
      const config = {
        codigo: row[0], // RC14x3,5x2
        nombre: row[1], // Calibre 14 Alt 2m con rombos de 3,5
        calibre: row[2], // 14 o 12
        tamano_rombo: row[3], // 3.5, 3, 2.5, 2
        altura: row[4], // 2, 1.8, 1.5, 1.2, 1
        peso_kg: row[5], // 12
        precio_kg_alambre: row[6], // 3135.77
        mano_obra: row[7], // 7600
        precio_costo: row[8], // Calculado
        precio_venta_plus: row[9], // Calculado
        margen: row[10] // 0.3
      };
      
      // Determinar categoría de calidad según tamaño de rombo
      let categoria_calidad;
      if (config.tamano_rombo === 3.5) categoria_calidad = 'Económica';
      else if (config.tamano_rombo === 3.0) categoria_calidad = 'Standard';
      else categoria_calidad = 'Reforzada';
      
      // Preparar datos para insertar
      const tejidoData = {
        codigo: config.codigo,
        nombre: `Tejido Romboidal Cal.${config.calibre} - ${config.altura}m - Rombo ${config.tamano_rombo}"`,
        descripcion: config.nombre,
        calibre: config.calibre,
        altura: config.altura,
        tamano_rombo: config.tamano_rombo,
        largo: 10.00,
        peso_kg: config.peso_kg,
        mano_obra: config.mano_obra,
        alambre_articulo_id: config.calibre === 12 ? alambreCal12.id : alambreCal14.id,
        margen_porcentaje: 30.00,
        categoria_calidad: categoria_calidad,
        activo: true
      };
      
      configuraciones.push(tejidoData);
    }
    
    console.log(`\n📦 ${configuraciones.length} configuraciones preparadas para importar`);
    
    // Insertar en base de datos
    console.log('\n💾 Insertando configuraciones...');
    
    let insertados = 0;
    let errores = 0;
    
    for (const config of configuraciones) {
      const { data, error } = await supabase
        .from('tejidos_configuraciones')
        .insert(config)
        .select();
      
      if (error) {
        console.log(`❌ Error insertando ${config.codigo}: ${error.message}`);
        errores++;
      } else {
        console.log(`✅ ${config.codigo} - ${config.nombre}`);
        insertados++;
      }
    }
    
    console.log('\n' + '='.repeat(100));
    console.log('📊 RESUMEN DE IMPORTACIÓN:');
    console.log('-'.repeat(100));
    console.log(`✅ Insertados exitosamente: ${insertados}`);
    console.log(`❌ Errores: ${errores}`);
    console.log(`📦 Total procesados: ${configuraciones.length}`);
    
    // Verificar precios calculados
    console.log('\n🧮 Verificando cálculo de precios...');
    const { data: tejidos, error: errorVerif } = await supabase
      .from('tejidos_configuraciones')
      .select('codigo, precio_costo, precio_venta')
      .limit(5);
    
    if (!errorVerif && tejidos) {
      console.log('\nPrimeros 5 tejidos con precios calculados:');
      tejidos.forEach(t => {
        console.log(`  ${t.codigo}: Costo=$${t.precio_costo?.toFixed(2) || 'N/A'}, Venta=$${t.precio_venta?.toFixed(2) || 'N/A'}`);
      });
    }
    
    console.log('\n✅ IMPORTACIÓN COMPLETADA');
    console.log('='.repeat(100) + '\n');
    
  } catch (error) {
    console.error('\n❌ Error durante la importación:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();

