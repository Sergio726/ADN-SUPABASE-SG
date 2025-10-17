const XLSX = require('xlsx')

const wb = XLSX.readFile('app/files/Articulos.xlsx')
const ws = wb.Sheets[wb.SheetNames[0]]
const data = XLSX.utils.sheet_to_json(ws)

console.log('📊 ANÁLISIS DE ARTÍCULOS\n')
console.log('Total de artículos:', data.length)
console.log('\n' + '='.repeat(80) + '\n')

data.forEach((item, i) => {
  console.log(`${i+1}. ${item['Articulo Detalle']}`)
  console.log(`   Unidad: ${item.Unidad}`)
  console.log(`   Dimensiones: ${item.Dimensiones || 'N/A'}`)
  console.log(`   Costo: $${item['Precio Costo(neto + impuestos)']}`)
  console.log(`   Efectivo: $${item['Precio Efectivo/Transf.']}`)
  console.log(`   Lista: $${item['Precio Venta/Lista']}`)
  console.log(`   Tarjeta: $${item['Precio Tarjeta']}`)
  console.log('')
})

