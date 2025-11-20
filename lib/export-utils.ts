/**
 * Exporta datos a CSV
 * @param datos Array de objetos con los datos
 * @param columnas Array con los nombres de las columnas en orden
 * @param nombreArchivo Nombre del archivo (sin extensión)
 */
export function exportarACSV<T extends Record<string, any>>(
  datos: T[],
  columnas: { key: keyof T; label: string }[],
  nombreArchivo: string = 'exportacion'
) {
  if (datos.length === 0) {
    throw new Error('No hay datos para exportar')
  }

  // Crear encabezados CSV
  const headers = columnas.map((col) => col.label).join(',')
  
  // Crear filas de datos
  const filas = datos.map((item) => {
    return columnas.map((col) => {
      const valor = item[col.key]
      // Manejar valores que contienen comas, comillas o saltos de línea
      if (valor == null) return ''
      const valorStr = String(valor)
      // Si contiene comas, comillas o saltos de línea, envolver en comillas y escapar comillas internas
      if (valorStr.includes(',') || valorStr.includes('"') || valorStr.includes('\n')) {
        return `"${valorStr.replace(/"/g, '""')}"`
      }
      return valorStr
    }).join(',')
  })

  // Combinar encabezados y filas
  const csvContent = [headers, ...filas].join('\n')

  // Agregar BOM para UTF-8 (para que Excel abra correctamente caracteres especiales)
  const BOM = '\uFEFF'
  const csvConBOM = BOM + csvContent

  // Crear blob y descargar
  const blob = new Blob([csvConBOM], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    // Generar nombre de archivo con timestamp
    const fecha = new Date()
    const fechaStr = fecha.toISOString().split('T')[0].replace(/-/g, '-')
    const horaStr = fecha.toTimeString().split(' ')[0].replace(/:/g, '-').slice(0, 5)
    const nombreCompleto = `${nombreArchivo}_${fechaStr}_${horaStr}.csv`
    
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', nombreCompleto)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    return nombreCompleto
  } else {
    throw new Error('Tu navegador no soporta la descarga de archivos')
  }
}

