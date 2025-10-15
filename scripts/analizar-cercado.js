const XLSX = require('xlsx');
const path = require('path');

// Leer el archivo Excel
const filePath = path.join(__dirname, '../app/files/Cotizacion cercado.xlsx');
const workbook = XLSX.readFile(filePath);

console.log('📊 ANÁLISIS DEL EXCEL: Cotización Cercado\n');
console.log('='.repeat(100));

// Listar todas las hojas
console.log('\n📋 HOJAS DISPONIBLES:');
console.log('-'.repeat(100));
workbook.SheetNames.forEach((sheetName, index) => {
  console.log(`${index + 1}. ${sheetName}`);
});

// Analizar cada hoja
workbook.SheetNames.forEach((sheetName) => {
  console.log('\n' + '='.repeat(100));
  console.log(`📄 HOJA: ${sheetName}`);
  console.log('='.repeat(100));
  
  const worksheet = workbook.Sheets[sheetName];
  
  // Obtener el rango de celdas
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  console.log(`\nRango de celdas: ${worksheet['!ref']}`);
  console.log(`Filas: ${range.e.r + 1}, Columnas: ${range.e.c + 1}`);
  
  // Convertir a JSON para análisis
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  
  // Mostrar las primeras 30 filas
  console.log('\n📝 PRIMERAS 30 FILAS:');
  console.log('-'.repeat(100));
  data.slice(0, 30).forEach((row, index) => {
    const rowStr = row.map(cell => {
      if (cell === '') return '[vacío]';
      if (typeof cell === 'number') return cell.toString();
      return cell;
    }).join(' | ');
    console.log(`Fila ${index}: ${rowStr}`);
  });
  
  // Buscar palabras clave
  console.log('\n🔍 ANÁLISIS DE ESTRUCTURA:');
  console.log('-'.repeat(100));
  
  const keywords = [
    'altura', 'tejido', 'metro', 'poste', 'cordon', 'hormigon', 
    'alambre', 'pua', 'porton', 'mano de obra', 'precio', 'total',
    'terreno', 'perimetro', 'lineal', 'instalacion', 'material'
  ];
  const foundKeywords = {};
  
  data.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (typeof cell === 'string') {
        const cellLower = cell.toLowerCase();
        keywords.forEach(keyword => {
          if (cellLower.includes(keyword)) {
            if (!foundKeywords[keyword]) foundKeywords[keyword] = [];
            foundKeywords[keyword].push({ row: rowIndex, col: colIndex, value: cell });
          }
        });
      }
    });
  });
  
  console.log('Palabras clave encontradas:');
  Object.entries(foundKeywords).forEach(([keyword, positions]) => {
    console.log(`\n  "${keyword}" (${positions.length} veces):`);
    positions.slice(0, 5).forEach(pos => {
      console.log(`    - Fila ${pos.row}, Col ${pos.col}: "${pos.value}"`);
    });
    if (positions.length > 5) {
      console.log(`    ... y ${positions.length - 5} más`);
    }
  });
  
  // Buscar números que podrían ser precios o cantidades
  console.log('\n💰 NÚMEROS ENCONTRADOS (muestra):');
  console.log('-'.repeat(100));
  const numbers = [];
  data.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (typeof cell === 'number' && cell > 0) {
        numbers.push({ row: rowIndex, col: colIndex, value: cell });
      }
    });
  });
  
  console.log(`Total de números encontrados: ${numbers.length}`);
  console.log('Primeros 15:');
  numbers.slice(0, 15).forEach(num => {
    console.log(`  Fila ${num.row}, Col ${num.col}: ${num.value}`);
  });
  
  // Buscar dimensiones específicas (60x30, 180m, etc.)
  console.log('\n📏 BÚSQUEDA DE DIMENSIONES:');
  console.log('-'.repeat(100));
  data.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (typeof cell === 'string' || typeof cell === 'number') {
        const cellStr = cell.toString().toLowerCase();
        if (cellStr.includes('60') && cellStr.includes('30')) {
          console.log(`  Fila ${rowIndex}, Col ${colIndex}: "${cell}"`);
        }
        if (cellStr.includes('180') && (cellStr.includes('m') || cellStr.includes('metro'))) {
          console.log(`  Fila ${rowIndex}, Col ${colIndex}: "${cell}"`);
        }
      }
    });
  });
});

console.log('\n' + '='.repeat(100));
console.log('✅ ANÁLISIS COMPLETADO');
console.log('='.repeat(100) + '\n');

