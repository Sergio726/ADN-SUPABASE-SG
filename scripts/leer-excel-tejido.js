const XLSX = require('xlsx');
const path = require('path');

// Leer el archivo Excel
const filePath = path.join(__dirname, '../app/files/Tejido romboidal.xlsx');
const workbook = XLSX.readFile(filePath);

console.log('📊 ANÁLISIS DEL EXCEL: Tejido Romboidal\n');
console.log('='.repeat(80));

// Listar todas las hojas
console.log('\n📋 HOJAS DISPONIBLES:');
console.log('-'.repeat(80));
workbook.SheetNames.forEach((sheetName, index) => {
  console.log(`${index + 1}. ${sheetName}`);
});

// Analizar cada hoja
workbook.SheetNames.forEach((sheetName) => {
  console.log('\n' + '='.repeat(80));
  console.log(`📄 HOJA: ${sheetName}`);
  console.log('='.repeat(80));
  
  const worksheet = workbook.Sheets[sheetName];
  
  // Obtener el rango de celdas
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  console.log(`\nRango de celdas: ${worksheet['!ref']}`);
  console.log(`Filas: ${range.e.r + 1}, Columnas: ${range.e.c + 1}`);
  
  // Convertir a JSON para análisis
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  
  // Mostrar las primeras filas
  console.log('\n📝 PRIMERAS 20 FILAS:');
  console.log('-'.repeat(80));
  data.slice(0, 20).forEach((row, index) => {
    const rowStr = row.map(cell => {
      if (cell === '') return '[vacío]';
      if (typeof cell === 'number') return cell.toString();
      return cell;
    }).join(' | ');
    console.log(`Fila ${index}: ${rowStr}`);
  });
  
  // Intentar identificar estructura
  console.log('\n🔍 ANÁLISIS DE ESTRUCTURA:');
  console.log('-'.repeat(80));
  
  // Buscar palabras clave
  const keywords = ['calibre', 'altura', 'rombo', 'alambre', 'mano de obra', 'precio', 'kg', 'costo', 'total'];
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
  console.log('-'.repeat(80));
  const numbers = [];
  data.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (typeof cell === 'number' && cell > 0) {
        numbers.push({ row: rowIndex, col: colIndex, value: cell });
      }
    });
  });
  
  console.log(`Total de números encontrados: ${numbers.length}`);
  console.log('Primeros 10:');
  numbers.slice(0, 10).forEach(num => {
    console.log(`  Fila ${num.row}, Col ${num.col}: ${num.value}`);
  });
});

console.log('\n' + '='.repeat(80));
console.log('✅ ANÁLISIS COMPLETADO');
console.log('='.repeat(80) + '\n');

