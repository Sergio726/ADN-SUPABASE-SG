const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../app/files/Tejido romboidal.xlsx');
const workbook = XLSX.readFile(filePath);
const worksheet = workbook.Sheets['Tejidos romboidales'];

// Convertir a JSON
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log('📊 ANÁLISIS DETALLADO: Tejidos Romboidales\n');
console.log('='.repeat(100));

// Analizar encabezados
console.log('\n📋 ENCABEZADOS (Fila 0):');
console.log('-'.repeat(100));
const headers = data[0];
headers.forEach((header, index) => {
  console.log(`Col ${index}: ${header}`);
});

// Analizar todas las configuraciones
console.log('\n\n📦 TODAS LAS CONFIGURACIONES DE TEJIDO:');
console.log('='.repeat(100));

const configuraciones = [];

for (let i = 1; i < data.length; i++) {
  const row = data[i];
  
  // Solo procesar filas que tengan datos
  if (row[0] && row[1]) {
    const config = {
      fila: i,
      codigo: row[0],
      descripcion: row[1],
      calibre: row[2],
      separacion_rombo: row[3],
      altura: row[4],
      peso_kg: row[5],
      precio_kg_alambre: row[6],
      mano_obra: row[7],
      precio_costo: row[8],
      precio_venta_plus: row[9],
      margen: row[10],
      precio_competencia: row[11]
    };
    
    configuraciones.push(config);
  }
}

console.log(`\nTotal de configuraciones encontradas: ${configuraciones.length}\n`);

// Agrupar por calibre
const porCalibre = {
  '12': [],
  '14': []
};

configuraciones.forEach(config => {
  if (config.calibre === 12) porCalibre['12'].push(config);
  if (config.calibre === 14) porCalibre['14'].push(config);
});

console.log(`Calibre 12: ${porCalibre['12'].length} configuraciones`);
console.log(`Calibre 14: ${porCalibre['14'].length} configuraciones`);

// Mostrar primeras configuraciones de cada calibre
console.log('\n\n🔧 CALIBRE 14 - Primeras 10 configuraciones:');
console.log('-'.repeat(100));
porCalibre['14'].slice(0, 10).forEach(config => {
  console.log(`\n${config.codigo} | ${config.descripcion}`);
  console.log(`  Altura: ${config.altura}m | Rombo: ${config.separacion_rombo}" | Peso: ${config.peso_kg} kg`);
  console.log(`  Precio Alambre/kg: $${config.precio_kg_alambre}`);
  console.log(`  Mano de Obra: $${config.mano_obra}`);
  console.log(`  COSTO: $${config.precio_costo} | VENTA: $${config.precio_venta_plus} | Margen: ${config.margen}`);
});

console.log('\n\n🔧 CALIBRE 12 - Primeras 10 configuraciones:');
console.log('-'.repeat(100));
porCalibre['12'].slice(0, 10).forEach(config => {
  console.log(`\n${config.codigo} | ${config.descripcion}`);
  console.log(`  Altura: ${config.altura}m | Rombo: ${config.separacion_rombo}" | Peso: ${config.peso_kg} kg`);
  console.log(`  Precio Alambre/kg: $${config.precio_kg_alambre}`);
  console.log(`  Mano de Obra: $${config.mano_obra}`);
  console.log(`  COSTO: $${config.precio_costo} | VENTA: $${config.precio_venta_plus} | Margen: ${config.margen}`);
});

// Analizar fórmula de cálculo
console.log('\n\n🧮 ANÁLISIS DE FÓRMULA DE CÁLCULO:');
console.log('='.repeat(100));

const muestra = configuraciones[0];
console.log(`\nUsando como ejemplo: ${muestra.codigo}`);
console.log(`  Peso rollo: ${muestra.peso_kg} kg`);
console.log(`  Precio alambre/kg: $${muestra.precio_kg_alambre}`);
console.log(`  Mano de obra: $${muestra.mano_obra}`);
console.log(`  Precio costo: $${muestra.precio_costo}`);

const costoCalculado = (muestra.peso_kg * muestra.precio_kg_alambre) + muestra.mano_obra;
console.log(`\n  Cálculo: (${muestra.peso_kg} kg × $${muestra.precio_kg_alambre}) + $${muestra.mano_obra}`);
console.log(`  = $${muestra.peso_kg * muestra.precio_kg_alambre} + $${muestra.mano_obra}`);
console.log(`  = $${costoCalculado}`);
console.log(`  Precio en Excel: $${muestra.precio_costo}`);
console.log(`  ¿Coincide? ${Math.abs(costoCalculado - muestra.precio_costo) < 1 ? '✅ SÍ' : '❌ NO'}`);

// Margen de ganancia
const precioVentaCalculado = muestra.precio_costo + muestra.precio_venta_plus;
console.log(`\n  Precio venta = Costo + Plus`);
console.log(`  = $${muestra.precio_costo} + $${muestra.precio_venta_plus}`);
console.log(`  = $${precioVentaCalculado}`);

const margenPorcentaje = (muestra.precio_venta_plus / muestra.precio_costo) * 100;
console.log(`\n  Margen: ${margenPorcentaje.toFixed(2)}%`);

// Obtener valores únicos
console.log('\n\n📊 VALORES ÚNICOS:');
console.log('='.repeat(100));

const calibresUnicos = [...new Set(configuraciones.map(c => c.calibre))];
const alturasUnicas = [...new Set(configuraciones.map(c => c.altura))].sort((a, b) => b - a);
const rombosUnicos = [...new Set(configuraciones.map(c => c.separacion_rombo))].sort((a, b) => b - a);

console.log(`\nCalibres: ${calibresUnicos.join(', ')}`);
console.log(`Alturas (metros): ${alturasUnicas.join(', ')}`);
console.log(`Tamaños de rombo (pulgadas): ${rombosUnicos.join(', ')}`);

// Obtener precio del alambre galvanizado
console.log('\n\n💰 PRECIO DEL ALAMBRE GALVANIZADO:');
console.log('='.repeat(100));

const preciosAlambreCal12 = [...new Set(porCalibre['12'].map(c => c.precio_kg_alambre))];
const preciosAlambreCal14 = [...new Set(porCalibre['14'].map(c => c.precio_kg_alambre))];

console.log(`\nCalbre 12: $${preciosAlambreCal12.join(', ')}`);
console.log(`Calibre 14: $${preciosAlambreCal14.join(', ')}`);

// Exportar a JSON
const output = {
  encabezados: headers,
  total_configuraciones: configuraciones.length,
  calibres: calibresUnicos,
  alturas: alturasUnicas,
  tamaños_rombo: rombosUnicos,
  precio_alambre: {
    calibre_12: preciosAlambreCal12[0],
    calibre_14: preciosAlambreCal14[0]
  },
  formula_calculo: {
    precio_costo: '(peso_kg × precio_alambre_kg) + mano_obra',
    precio_venta: 'precio_costo + precio_plus',
    margen_aprox: '30%'
  },
  configuraciones: configuraciones.slice(0, 5) // Solo primeras 5 para muestra
};

const fs = require('fs');
fs.writeFileSync(
  path.join(__dirname, 'tejidos-analisis.json'),
  JSON.stringify(output, null, 2)
);

console.log('\n\n✅ Análisis exportado a: scripts/tejidos-analisis.json');
console.log('='.repeat(100) + '\n');

