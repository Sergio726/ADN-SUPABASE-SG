const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const filePath = path.join(__dirname, '../app/files/Cotizacion cercado.xlsx');
const workbook = XLSX.readFile(filePath);

console.log('📊 ANÁLISIS DETALLADO: Cercado Perimetral\n');
console.log('='.repeat(120));

// Analizar la hoja de 2mt en detalle
const sheetName = 'Cerco con rollo de 2mt';
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log('\n📄 ANÁLISIS DE HOJA: Cerco con rollo de 2mt');
console.log('='.repeat(120));

// Datos del terreno base
console.log('\n📏 DIMENSIONES DEL TERRENO BASE:');
console.log('-'.repeat(120));
console.log(`Dimensión: ${data[0][2]}`);
console.log(`Metros lineales: ${data[1][2]} metros`);

// Encontrar el presupuesto seleccionado
console.log('\n🎯 PRESUPUESTO SELECCIONADO:');
console.log('-'.repeat(120));
console.log(`Tipo de Tejido: ${data[2][9]}`);
console.log(`Tipo de Poste: ${data[3][9]}`);
console.log(`Tipo de Cordón: ${data[4][9]}`);
console.log(`Hilos de Púa: ${data[5][9]}`);
console.log(`Total del Presupuesto: $${data[6][9]}`);
console.log(`Precio por metro lineal: $${data[7][9]}`);
console.log(`Precio x mtl < 50ml: $${data[8][9]}`);

// Análisis de materiales por grupo
console.log('\n\n📦 DESGLOSE DE MATERIALES:');
console.log('='.repeat(120));

const grupos = {};
let currentGroup = null;

for (let i = 3; i <= 45; i++) {
  const row = data[i];
  if (!row || !row[0]) continue;
  
  const grupo = row[0];
  const item = row[1];
  const unidad = row[2];
  const cantidad = row[3];
  const precioUnit = row[4];
  const subtotal = row[5];
  const total = row[6];
  
  if (total !== '') {
    // Es un total de grupo
    if (!grupos[grupo]) {
      grupos[grupo] = {
        total: total,
        items: []
      };
    }
    currentGroup = grupo;
  } else if (currentGroup) {
    // Es un item del grupo
    grupos[currentGroup].items.push({
      item,
      unidad,
      cantidad,
      precioUnit,
      subtotal
    });
  }
}

// Mostrar cada grupo
Object.entries(grupos).forEach(([nombre, datos]) => {
  console.log(`\n\n${nombre}:`);
  console.log('-'.repeat(120));
  console.log(`TOTAL: $${datos.total}`);
  console.log(`\nItems:`);
  datos.items.forEach(item => {
    console.log(`  - ${item.item}`);
    console.log(`    Cantidad: ${item.cantidad} ${item.unidad}`);
    console.log(`    Precio Unit: $${item.precioUnit}`);
    console.log(`    Subtotal: $${item.subtotal}`);
  });
});

// Buscar opciones de configuración
console.log('\n\n⚙️ OPCIONES DE CONFIGURACIÓN DISPONIBLES:');
console.log('='.repeat(120));

// Tipos de Tejido disponibles
const tejidos = [];
for (let i = 3; i <= 10; i++) {
  if (data[i] && data[i][0] === 'TEJIDO') {
    tejidos.push({
      nombre: data[i][1],
      precio: data[i][4],
      cantidad: data[i][3]
    });
  }
}

console.log('\n📦 TEJIDOS DISPONIBLES (Cal 14 y Cal 12):');
tejidos.forEach(t => {
  console.log(`  - ${t.nombre}: $${t.precio} x ${t.cantidad}un = $${t.precio * t.cantidad}`);
});

// Tipos de Postes
const postesOlimp = [];
const postesDiamante = [];
const postesEucalipto = [];

for (let i = 21; i <= 40; i++) {
  if (!data[i]) continue;
  
  if (data[i][0] === 'POSTES OLIMP') {
    postesOlimp.push({
      tipo: data[i][1],
      cantidad: data[i][3],
      precio: data[i][4],
      subtotal: data[i][5]
    });
  }
  
  if (data[i][0] === 'POSTES P DIAMANTE') {
    postesDiamante.push({
      tipo: data[i][1],
      cantidad: data[i][3],
      precio: data[i][4],
      subtotal: data[i][5]
    });
  }
  
  if (data[i][0] === 'POSTE EUCALIPTO') {
    postesEucalipto.push({
      tipo: data[i][1],
      cantidad: data[i][3],
      precio: data[i][4],
      subtotal: data[i][5]
    });
  }
}

console.log('\n🏗️ POSTES OLIMP (Rectos):');
console.log(`Total: $${grupos['POSTES OLIMP']?.total || 'N/A'}`);
postesOlimp.forEach(p => {
  console.log(`  - ${p.tipo}: ${p.cantidad}un × $${p.precio} = $${p.subtotal}`);
});

console.log('\n🏗️ POSTES PUNTA DIAMANTE:');
console.log(`Total: $${grupos['POSTES P DIAMANTE']?.total || 'N/A'}`);
postesDiamante.forEach(p => {
  console.log(`  - ${p.tipo}: ${p.cantidad}un × $${p.precio} = $${p.subtotal}`);
});

console.log('\n🏗️ POSTES EUCALIPTO:');
console.log(`Total: $${grupos['POSTE EUCALIPTO']?.total || 'N/A'}`);
postesEucalipto.forEach(p => {
  console.log(`  - ${p.tipo}: ${p.cantidad}un × $${p.precio} = $${p.subtotal}`);
});

// Cordones
const cordones = [];
for (let i = 33; i <= 41; i++) {
  if (!data[i]) continue;
  
  if (data[i][0] && data[i][0].includes('CORDON')) {
    cordones.push({
      tipo: data[i][0],
      item: data[i][1],
      cantidad: data[i][3],
      precio: data[i][4],
      subtotal: data[i][5],
      total: data[i][6]
    });
  }
}

console.log('\n🧱 CORDONES DE HORMIGÓN:');
cordones.forEach(c => {
  if (c.total) {
    console.log(`\n${c.tipo} - TOTAL: $${c.total}`);
  } else {
    console.log(`  - ${c.item}: ${c.cantidad}un × $${c.precio} = $${c.subtotal}`);
  }
});

// Mano de obra
console.log('\n👷 MANO DE OBRA:');
console.log('-'.repeat(120));
if (data[42]) {
  console.log(`Item: ${data[42][1]}`);
  console.log(`Cantidad: ${data[42][3]} ${data[42][2]}`);
  console.log(`Precio por unidad: $${data[42][4]}`);
  console.log(`Total: $${data[42][5]}`);
}

// Análisis de cálculo auxiliar
console.log('\n\n🧮 CÁLCULOS AUXILIARES:');
console.log('='.repeat(120));
console.log(`Tejido: $${data[2][11]}`);
console.log(`Postes: $${data[3][11]}`);
console.log(`Cordón: $${data[4][11]}`);
console.log(`Hilos de Púa: $${data[5][11]}`);
console.log(`Instalación (Mano de Obra): $${data[3][12]}`);
console.log(`Total General: $${data[6][9]}`);

// Fórmula de cálculo por metro lineal
const totalGeneral = parseFloat(data[6][9]);
const metrosLineales = parseFloat(data[1][2]);
const precioPorMetro = totalGeneral / metrosLineales;

console.log('\n📐 FÓRMULA DE CÁLCULO:');
console.log('-'.repeat(120));
console.log(`Total General: $${totalGeneral}`);
console.log(`Metros Lineales: ${metrosLineales}m`);
console.log(`Precio por metro lineal = Total / Metros`);
console.log(`= $${totalGeneral} / ${metrosLineales}m`);
console.log(`= $${precioPorMetro.toFixed(2)} por metro`);
console.log(`\nPrecio en Excel: $${data[7][9]}`);
console.log(`¿Coincide? ${Math.abs(precioPorMetro - parseFloat(data[7][9])) < 1 ? '✅ SÍ' : '❌ NO (diferencia: $' + Math.abs(precioPorMetro - parseFloat(data[7][9])).toFixed(2) + ')'}`);

// Resumen de todas las alturas
console.log('\n\n📊 RESUMEN DE TODAS LAS ALTURAS:');
console.log('='.repeat(120));

const alturas = [
  { nombre: 'Cerco con rollo de 2mt', sheet: 'Cerco con rollo de 2mt' },
  { nombre: 'Cerco con rollo de 1.8mt', sheet: 'Cerco con rollo de  1.8mt' },
  { nombre: 'Cerco con rollo de 1.5mt', sheet: 'Cerco con rollo de  1.5mt' },
  { nombre: 'Cerco con rollo de 1.2mt', sheet: 'Cerco con rollo de 1.2mt' }
];

const resumenAlturas = [];

alturas.forEach(altura => {
  const ws = workbook.Sheets[altura.sheet];
  if (!ws) return;
  
  const d = XLSX.utils.sheet_to_json(ws, { header: 1 });
  
  resumenAlturas.push({
    altura: altura.nombre,
    dimension: d[0][2],
    metrosLineales: d[1][2],
    tejidoSeleccionado: d[2][9],
    posteSeleccionado: d[3][9],
    cordonSeleccionado: d[4][9],
    hilosPua: d[5][9],
    total: d[6][9],
    precioMetro: d[7][9],
    precioMetroMenor50: d[8][9]
  });
});

resumenAlturas.forEach(r => {
  console.log(`\n${r.altura}:`);
  console.log(`  Terreno: ${r.dimension} (${r.metrosLineales}m lineales)`);
  console.log(`  Tejido: ${r.tejidoSeleccionado}`);
  console.log(`  Postes: ${r.posteSeleccionado}`);
  console.log(`  Cordón: ${r.cordonSeleccionado}`);
  console.log(`  Hilos Púa: ${r.hilosPua}`);
  console.log(`  Total: $${r.total}`);
  console.log(`  Precio/metro: $${r.precioMetro}`);
  console.log(`  Precio/metro (<50ml): $${r.precioMetroMenor50}`);
});

// Exportar análisis a JSON
const output = {
  terrenoBase: {
    dimension: data[0][2],
    metrosLineales: data[1][2]
  },
  alturas: resumenAlturas,
  formula_calculo: {
    precio_por_metro: 'Total / Metros_Lineales',
    recargo_menor_50ml: 'Aprox 30% adicional'
  },
  componentes: {
    tejidos: tejidos.length,
    tipos_postes: 3,
    opciones_cordon: cordones.length / 3, // Aproximado
    incluye_mano_obra: true
  }
};

fs.writeFileSync(
  path.join(__dirname, 'cercado-analisis.json'),
  JSON.stringify(output, null, 2)
);

console.log('\n\n✅ Análisis exportado a: scripts/cercado-analisis.json');
console.log('='.repeat(120) + '\n');

