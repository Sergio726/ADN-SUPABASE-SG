require('dotenv').config({ path: '.env.local' })
const XLSX = require('xlsx')

// =====================================================
// Plantilla para importar Postes
// =====================================================

const postes = [
  // Ejemplos de postes de hormigón
  {
    'Articulo Detalle': 'Poste de Hormigón con Ménsula 2.0m',
    'Unidad': 'unidad',
    'Dimensiones': '2.0m altura, ménsula incluida',
    'Precio Costo(neto + impuestos)': 0,
    'Precio Efectivo/Transf.': 0,
    'Precio Venta/Lista': 0,
    'Precio Tarjeta': 0,
    'Categoria': 'Postes',
    'Notas': 'Ejemplo - Completar precios'
  },
  {
    'Articulo Detalle': 'Poste de Hormigón con Ménsula 2.5m',
    'Unidad': 'unidad',
    'Dimensiones': '2.5m altura, ménsula incluida',
    'Precio Costo(neto + impuestos)': 0,
    'Precio Efectivo/Transf.': 0,
    'Precio Venta/Lista': 0,
    'Precio Tarjeta': 0,
    'Categoria': 'Postes',
    'Notas': 'Ejemplo - Completar precios'
  },
  {
    'Articulo Detalle': 'Poste de Hormigón Punta Diamante 2.0m',
    'Unidad': 'unidad',
    'Dimensiones': '2.0m altura, punta diamante',
    'Precio Costo(neto + impuestos)': 0,
    'Precio Efectivo/Transf.': 0,
    'Precio Venta/Lista': 0,
    'Precio Tarjeta': 0,
    'Categoria': 'Postes',
    'Notas': 'Ejemplo - Completar precios'
  },
  {
    'Articulo Detalle': 'Poste de Hormigón Punta Diamante 2.5m',
    'Unidad': 'unidad',
    'Dimensiones': '2.5m altura, punta diamante',
    'Precio Costo(neto + impuestos)': 0,
    'Precio Efectivo/Transf.': 0,
    'Precio Venta/Lista': 0,
    'Precio Tarjeta': 0,
    'Categoria': 'Postes',
    'Notas': 'Ejemplo - Completar precios'
  },
  {
    'Articulo Detalle': 'Poste de Hormigón Punta Diamante 3.0m',
    'Unidad': 'unidad',
    'Dimensiones': '3.0m altura, punta diamante',
    'Precio Costo(neto + impuestos)': 0,
    'Precio Efectivo/Transf.': 0,
    'Precio Venta/Lista': 0,
    'Precio Tarjeta': 0,
    'Categoria': 'Postes',
    'Notas': 'Ejemplo - Completar precios'
  },
  // Postes de Eucalipto
  {
    'Articulo Detalle': 'Poste de Eucalipto 2.0m',
    'Unidad': 'unidad',
    'Dimensiones': '2.0m altura, eucalipto tratado',
    'Precio Costo(neto + impuestos)': 0,
    'Precio Efectivo/Transf.': 0,
    'Precio Venta/Lista': 0,
    'Precio Tarjeta': 0,
    'Categoria': 'Postes',
    'Notas': 'Ejemplo - Completar precios'
  },
  {
    'Articulo Detalle': 'Poste de Eucalipto 2.5m',
    'Unidad': 'unidad',
    'Dimensiones': '2.5m altura, eucalipto tratado',
    'Precio Costo(neto + impuestos)': 0,
    'Precio Efectivo/Transf.': 0,
    'Precio Venta/Lista': 0,
    'Precio Tarjeta': 0,
    'Categoria': 'Postes',
    'Notas': 'Ejemplo - Completar precios'
  },
  {
    'Articulo Detalle': 'Poste de Eucalipto 3.0m',
    'Unidad': 'unidad',
    'Dimensiones': '3.0m altura, eucalipto tratado',
    'Precio Costo(neto + impuestos)': 0,
    'Precio Efectivo/Transf.': 0,
    'Precio Venta/Lista': 0,
    'Precio Tarjeta': 0,
    'Categoria': 'Postes',
    'Notas': 'Ejemplo - Completar precios'
  },
  // Puntales
  {
    'Articulo Detalle': 'Puntal de Hormigón 2.0m',
    'Unidad': 'unidad',
    'Dimensiones': '2.0m altura',
    'Precio Costo(neto + impuestos)': 0,
    'Precio Efectivo/Transf.': 0,
    'Precio Venta/Lista': 0,
    'Precio Tarjeta': 0,
    'Categoria': 'Postes',
    'Notas': 'Ejemplo - Completar precios'
  },
  {
    'Articulo Detalle': 'Puntal de Hormigón 2.5m',
    'Unidad': 'unidad',
    'Dimensiones': '2.5m altura',
    'Precio Costo(neto + impuestos)': 0,
    'Precio Efectivo/Transf.': 0,
    'Precio Venta/Lista': 0,
    'Precio Tarjeta': 0,
    'Categoria': 'Postes',
    'Notas': 'Ejemplo - Completar precios'
  },
  {
    'Articulo Detalle': 'Puntal de Hormigón 3.0m',
    'Unidad': 'unidad',
    'Dimensiones': '3.0m altura',
    'Precio Costo(neto + impuestos)': 0,
    'Precio Efectivo/Transf.': 0,
    'Precio Venta/Lista': 0,
    'Precio Tarjeta': 0,
    'Categoria': 'Postes',
    'Notas': 'Ejemplo - Completar precios'
  },
  // Agregar más filas según necesites...
]

// Crear workbook
const wb = XLSX.utils.book_new()
const ws = XLSX.utils.json_to_sheet(postes)

// Ajustar ancho de columnas
ws['!cols'] = [
  { wch: 40 }, // Articulo Detalle
  { wch: 12 }, // Unidad
  { wch: 30 }, // Dimensiones
  { wch: 25 }, // Precio Costo
  { wch: 25 }, // Precio Efectivo
  { wch: 25 }, // Precio Venta/Lista
  { wch: 25 }, // Precio Tarjeta
  { wch: 15 }, // Categoria
  { wch: 30 }, // Notas
]

// Agregar hoja al workbook
XLSX.utils.book_append_sheet(wb, ws, 'Postes')

// Guardar archivo
const filename = 'app/files/Postes.xlsx'
XLSX.writeFile(wb, filename)

console.log('✅ Plantilla creada exitosamente!')
console.log(`📄 Archivo: ${filename}`)
console.log('\n📋 INSTRUCCIONES:')
console.log('1. Abre el archivo Excel generado')
console.log('2. Completa los precios en las columnas:')
console.log('   - Precio Costo(neto + impuestos): Precio de compra + impuestos')
console.log('   - Precio Efectivo/Transf.: Precio base (efectivo) = costo × 1.56')
console.log('   - Precio Venta/Lista: Precio base × 1.21 (incluye IVA)')
console.log('   - Precio Tarjeta: Precio base × 1.3 (incluye IVA)')
console.log('3. Agrega o elimina filas según necesites')
console.log('4. Modifica los nombres de artículos según tus productos')
console.log('5. Una vez completado, ejecuta: node scripts/importar-postes-excel.js')
console.log('\n💡 Nota: Los precios se calcularán automáticamente según las políticas')
console.log('   - Precio Efectivo = Costo × 1.56 (margen 56%)')
console.log('   - Precio Factura/Lista = Precio Base × 1.21')
console.log('   - Precio Tarjeta = Precio Base × 1.3')

