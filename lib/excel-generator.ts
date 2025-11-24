import * as XLSX from 'xlsx'

/**
 * Exporta lista de precios a Excel con formato profesional
 * @param datos Array de objetos con los datos de precios
 * @param nombreArchivo Nombre del archivo (sin extensión)
 */
export function exportarPreciosAExcel(
  datos: Array<{
    codigo: string | null
    nombre: string
    categoria: string | null
    unidad: string
    precioEfectivo: number
    precioFactura: number
    precioTarjeta: number
    estado: string
  }>,
  nombreArchivo: string = 'Lista_Precios'
) {
  // Preparar datos para Excel
  const datosParaExcel = datos.map((item) => ({
    'Código': item.codigo || '-',
    'Nombre/Descripción': item.nombre,
    'Categoría': item.categoria || 'Sin categoría',
    'Unidad': item.unidad,
    'Precio Efectivo': item.precioEfectivo,
    'Precio Factura/Lista (con IVA 21%)': item.precioFactura,
    'Precio Tarjeta (con IVA 21%)': item.precioTarjeta,
    'Estado': item.estado,
  }))

  // Crear workbook
  const wb = XLSX.utils.book_new()

  // Crear worksheet desde los datos
  const ws = XLSX.utils.json_to_sheet(datosParaExcel)

  // Ajustar ancho de columnas
  const columnWidths = [
    { wch: 15 }, // Código
    { wch: 40 }, // Nombre/Descripción
    { wch: 20 }, // Categoría
    { wch: 12 }, // Unidad
    { wch: 18 }, // Precio Efectivo
    { wch: 30 }, // Precio Factura/Lista
    { wch: 25 }, // Precio Tarjeta
    { wch: 15 }, // Estado
  ]
  ws['!cols'] = columnWidths

  // Nota: La librería xlsx básica no soporta estilos avanzados como colores.
  // Se mantiene el formato básico con anchos de columna ajustados.
  // El formato de números se aplica como texto formateado en las columnas de precios.
  
  // Formatear precios como números con formato de moneda (Excel interpretará estos como números)
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
  
  // Formatear columnas de precios como números (Excel formateará automáticamente)
  // Las columnas E, F, G (índices 4, 5, 6) contienen los precios
  // No aplicamos formato de celda personalizado ya que la versión básica no lo soporta bien
  // Los valores numéricos serán reconocidos por Excel y podrán formatearse manualmente si es necesario

  // Agregar worksheet al workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Lista de Precios')

  // Generar nombre de archivo con timestamp
  const fecha = new Date()
  const fechaStr = fecha.toISOString().split('T')[0].replace(/-/g, '-')
  const horaStr = fecha.toTimeString().split(' ')[0].replace(/:/g, '-').slice(0, 5)
  const nombreCompleto = `${nombreArchivo}_${fechaStr}_${horaStr}.xlsx`

  // Descargar archivo
  XLSX.writeFile(wb, nombreCompleto)
  
  return nombreCompleto
}

/**
 * Exporta lista de tejidos a Excel con formato profesional
 * @param datos Array de objetos con los datos de tejidos
 * @param nombreArchivo Nombre del archivo (sin extensión)
 */
export function exportarTejidosAExcel(
  datos: Array<{
    codigo: string
    nombre: string | null
    categoria: string | null
    unidad: string
    precioEfectivo: number
    precioFactura: number
    precioTarjeta: number
    estado: string
  }>,
  nombreArchivo: string = 'Lista_Tejidos'
) {
  // Preparar datos para Excel
  const datosParaExcel = datos.map((item) => ({
    'Código': item.codigo || '-',
    'Nombre/Descripción': item.nombre || item.codigo || '-',
    'Categoría': item.categoria || 'Sin categoría',
    'Unidad': item.unidad,
    'Precio Efectivo': item.precioEfectivo,
    'Precio Factura/Lista (con IVA 21%)': item.precioFactura,
    'Precio Tarjeta (con IVA 21%)': item.precioTarjeta,
    'Estado': item.estado,
  }))

  // Crear workbook
  const wb = XLSX.utils.book_new()

  // Crear worksheet desde los datos
  const ws = XLSX.utils.json_to_sheet(datosParaExcel)

  // Ajustar ancho de columnas
  const columnWidths = [
    { wch: 20 }, // Código
    { wch: 40 }, // Nombre/Descripción
    { wch: 20 }, // Categoría
    { wch: 12 }, // Unidad
    { wch: 18 }, // Precio Efectivo
    { wch: 30 }, // Precio Factura/Lista
    { wch: 25 }, // Precio Tarjeta
    { wch: 15 }, // Estado
  ]
  ws['!cols'] = columnWidths

  // Nota: La librería xlsx básica no soporta estilos avanzados como colores.
  // Se mantiene el formato básico con anchos de columna ajustados.
  // El formato de números se aplica como texto formateado en las columnas de precios.
  
  // Formatear precios como números con formato de moneda (Excel interpretará estos como números)
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
  
  // Formatear columnas de precios como números (Excel formateará automáticamente)
  // Las columnas E, F, G (índices 4, 5, 6) contienen los precios
  // No aplicamos formato de celda personalizado ya que la versión básica no lo soporta bien
  // Los valores numéricos serán reconocidos por Excel y podrán formatearse manualmente si es necesario

  // Agregar worksheet al workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Lista de Tejidos')

  // Generar nombre de archivo con timestamp
  const fecha = new Date()
  const fechaStr = fecha.toISOString().split('T')[0].replace(/-/g, '-')
  const horaStr = fecha.toTimeString().split(' ')[0].replace(/:/g, '-').slice(0, 5)
  const nombreCompleto = `${nombreArchivo}_${fechaStr}_${horaStr}.xlsx`

  // Descargar archivo
  XLSX.writeFile(wb, nombreCompleto)
  
  return nombreCompleto
}

/**
 * Exporta control de stock a Excel con formato profesional
 * @param datos Array de objetos con los datos de stock
 * @param nombreArchivo Nombre del archivo (sin extensión)
 */
export function exportarStockAExcel(
  datos: Array<{
    nombre: string
    categoria: string | null
    stock_actual: number
    stock_minimo: number
    unidad: string
  }>,
  nombreArchivo: string = 'Control_Stock'
) {
  // Preparar datos para Excel
  const datosParaExcel = datos.map((item) => ({
    'Artículo': item.nombre,
    'Categoría': item.categoria || 'Sin categoría',
    'Stock Actual': item.stock_actual,
    'Stock Mínimo': item.stock_minimo,
    'Unidad': item.unidad,
    'Estado': item.stock_actual <= item.stock_minimo ? '⚠️ BAJO' : '✅ OK',
    'Diferencia': item.stock_actual - item.stock_minimo,
  }))

  // Crear workbook
  const wb = XLSX.utils.book_new()

  // Crear worksheet desde los datos
  const ws = XLSX.utils.json_to_sheet(datosParaExcel)

  // Ajustar ancho de columnas
  const columnWidths = [
    { wch: 40 }, // Artículo
    { wch: 20 }, // Categoría
    { wch: 15 }, // Stock Actual
    { wch: 15 }, // Stock Mínimo
    { wch: 12 }, // Unidad
    { wch: 15 }, // Estado
    { wch: 15 }, // Diferencia
  ]
  ws['!cols'] = columnWidths

  // Agregar worksheet al workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Control de Stock')

  // Generar nombre de archivo con timestamp
  const fecha = new Date()
  const fechaStr = fecha.toISOString().split('T')[0].replace(/-/g, '-')
  const horaStr = fecha.toTimeString().split(' ')[0].replace(/:/g, '-').slice(0, 5)
  const nombreCompleto = `${nombreArchivo}_${fechaStr}_${horaStr}.xlsx`

  // Descargar archivo
  XLSX.writeFile(wb, nombreCompleto)
  
  return nombreCompleto
}
