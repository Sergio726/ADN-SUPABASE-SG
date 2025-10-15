const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 VERIFICACIÓN DE TEJIDOS ROMBOIDALES\n');
console.log('='.repeat(100));

async function verificar() {
  try {
    // 1. Contar tejidos
    const { count, error: errorCount } = await supabase
      .from('tejidos_configuraciones')
      .select('*', { count: 'exact', head: true });
    
    console.log('\n📊 ESTADÍSTICAS:');
    console.log('-'.repeat(100));
    console.log(`Total de tejidos: ${count}`);
    
    // 2. Ver tejidos sin precios calculados
    const { data: sinPrecios, error: errorSinPrecios } = await supabase
      .from('tejidos_configuraciones')
      .select('codigo, precio_costo, precio_venta')
      .or('precio_costo.is.null,precio_venta.is.null');
    
    console.log(`Tejidos SIN precios calculados: ${sinPrecios?.length || 0}`);
    
    if (sinPrecios && sinPrecios.length > 0) {
      console.log('\n⚠️  Tejidos que necesitan actualización de precios:');
      sinPrecios.slice(0, 10).forEach(t => {
        console.log(`  - ${t.codigo}: Costo=${t.precio_costo || 'NULL'}, Venta=${t.precio_venta || 'NULL'}`);
      });
      
      // Actualizar precios
      console.log('\n🔄 Actualizando precios...');
      
      const { data: todosTejidos } = await supabase
        .from('tejidos_configuraciones')
        .select('id');
      
      for (const tejido of todosTejidos || []) {
        const { data, error } = await supabase.rpc('actualizar_precio_tejido', {
          config_id: tejido.id
        });
        
        if (error) {
          console.log(`  ❌ Error actualizando ${tejido.id}: ${error.message}`);
        }
      }
      
      console.log('✅ Precios actualizados');
    }
    
    // 3. Ver muestra de tejidos con precios
    const { data: tejidos } = await supabase
      .from('v_tejidos_con_precios')
      .select('*')
      .limit(10);
    
    console.log('\n\n📦 MUESTRA DE TEJIDOS (Primeros 10):');
    console.log('='.repeat(100));
    
    if (tejidos) {
      tejidos.forEach(t => {
        console.log(`\n${t.codigo} - ${t.nombre}`);
        console.log(`  Calibre: ${t.calibre} | Altura: ${t.altura}m | Rombo: ${t.tamano_rombo}"`);
        console.log(`  Peso: ${t.peso_kg}kg | Mano Obra: $${t.mano_obra?.toLocaleString()}`);
        console.log(`  Alambre: ${t.alambre_nombre} ($${t.alambre_precio_kg}/kg)`);
        console.log(`  💰 COSTO: $${t.precio_costo?.toLocaleString() || 'N/A'} | VENTA: $${t.precio_venta?.toLocaleString() || 'N/A'}`);
        console.log(`  Calidad: ${t.categoria_calidad || t.calidad_sugerida} | Estado: ${t.activo ? '✅ Activo' : '❌ Inactivo'}`);
      });
    }
    
    // 4. Estadísticas por grupo
    const { data: stats } = await supabase
      .from('tejidos_configuraciones')
      .select('calibre, activo');
    
    if (stats) {
      const cal12 = stats.filter(t => t.calibre === 12).length;
      const cal14 = stats.filter(t => t.calibre === 14).length;
      const activos = stats.filter(t => t.activo).length;
      
      console.log('\n\n📈 ESTADÍSTICAS POR GRUPO:');
      console.log('='.repeat(100));
      console.log(`Calibre 12: ${cal12} tejidos`);
      console.log(`Calibre 14: ${cal14} tejidos`);
      console.log(`Activos: ${activos} tejidos`);
      console.log(`Inactivos: ${stats.length - activos} tejidos`);
    }
    
    console.log('\n' + '='.repeat(100));
    console.log('✅ VERIFICACIÓN COMPLETADA');
    console.log('='.repeat(100) + '\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
  }
}

verificar();

