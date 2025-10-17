require('dotenv').config({ path: '.env.local' })
const XLSX = require('xlsx')
const fs = require('fs')

console.log('🚀 Generando script SQL para crear precios...\n')

// Leer Excel
const wb = XLSX.readFile('app/files/Articulos.xlsx')
const ws = wb.Sheets[wb.SheetNames[0]]
const data = XLSX.utils.sheet_to_json(ws)

let sql = `-- =====================================================
-- Insertar precios de artículos desde Excel
-- =====================================================
-- Generado automáticamente desde Articulos.xlsx
-- Fecha: ${new Date().toISOString().split('T')[0]}

-- Desactivar triggers temporalmente
ALTER TABLE precios_venta DISABLE TRIGGER ALL;

-- Desactivar todos los precios vigentes actuales
UPDATE precios_venta SET vigente = false WHERE vigente = true;

-- Insertar nuevos precios
`

data.forEach((item) => {
  const nombre = item['Articulo Detalle'].replace(/'/g, "''") // Escapar comillas
  const precioCosto = parseFloat(item['Precio Costo(neto + impuestos)'])
  const precioEfectivo = parseFloat(item['Precio Efectivo/Transf.'])

  sql += `
-- ${nombre}
INSERT INTO precios_venta (articulo_id, precio_costo, precio_venta, vigente, fecha_inicio)
SELECT id, ${precioCosto}, ${precioEfectivo}, true, CURRENT_DATE
FROM articulos
WHERE nombre = '${nombre}'
LIMIT 1;
`
})

sql += `
-- Reactivar triggers
ALTER TABLE precios_venta ENABLE TRIGGER ALL;

-- Verificar
SELECT 
  COUNT(*) as total_precios_creados
FROM precios_venta
WHERE vigente = true;

-- =====================================================
-- Fin del script
-- =====================================================
`

// Guardar archivo SQL
const outputPath = 'supabase/migrations/insertar_precios_articulos.sql'
fs.writeFileSync(outputPath, sql)

console.log('✅ Script SQL generado exitosamente!')
console.log(`📄 Archivo: ${outputPath}`)
console.log(`📊 Total artículos: ${data.length}`)
console.log('\n🎯 SIGUIENTE PASO:')
console.log('   1. Abre Supabase SQL Editor')
console.log(`   2. Copia y ejecuta: ${outputPath}`)
console.log('   3. Verificará que se crearon los precios\n')

