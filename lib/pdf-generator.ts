import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface ConfiguracionCercado {
  nombre?: string
  descripcion?: string
  altura?: number
  altura_final_cerco?: number
  precio_por_metro_lineal?: number
  tejido_codigo?: string
  calibre?: number
  tamano_rombo?: number
  tipo_poste?: string
  cordon_tipo?: string
  hilos_pua?: number
  cantidad_ganchos?: number
  cantidad_planchuelas?: number
  cantidad_torniquetes?: number
  cantidad_esparragos?: number
  metros_alambre_ar?: number
  kg_clavos?: number
  kg_alambre_negro?: number
  descripciones_postes?: {
    esquinero?: { descripcion?: string; nombre?: string }
    intermedio?: { descripcion?: string; nombre?: string }
    refuerzo?: { descripcion?: string; nombre?: string }
    puntal?: { descripcion?: string; nombre?: string }
  }
}

interface PresupuestoData {
  numero: string
  tipo: string
  fecha_emision: string
  fecha_vencimiento: string
  validez_dias: number
  cliente_nombre: string
  cliente_email?: string
  cliente_telefono?: string
  cliente_direccion?: string
  // Nuevos datos básicos del cliente
  tipo_documento?: string
  numero_documento?: string
  razon_social?: string
  ciudad?: string
  provincia?: string
  codigo_postal?: string
  // Vendedor
  vendedor_nombre?: string
  terreno_largo?: number
  terreno_ancho?: number
  metros_lineales_total?: number
  subtotal: number
  descuento: number
  total: number
  forma_pago?: string
  observaciones?: string
  condiciones_comerciales?: string
  // Configuración de cercado (opcional)
  configuracion_cercado?: ConfiguracionCercado
}

interface PresupuestoItem {
  descripcion: string
  cantidad: number
  unidad: string
  precio_unitario: number
  precio_total: number
}

export function generarPDFPresupuesto(
  presupuesto: PresupuestoData,
  items: PresupuestoItem[]
) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  let yPos = 20

  // Helper simple para evitar que algo quede muy abajo
  const ensureSpace = (needed: number = 40) => {
    if (yPos + needed > pageHeight - 30) {
      doc.addPage()
      yPos = 20
    }
  }

  try {
    const logo = new Image()
    logo.src = '/logos/logo-color.png'
    doc.addImage(logo, 'PNG', 15, yPos - 10, 40, 20)
  } catch (error) {
    console.warn('No se pudo cargar el logo para el PDF', error)
  }

  // ===== HEADER =====
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.setFont('helvetica', 'normal')
  doc.text('Tu seguridad comienza con nosotros', 15, yPos + 15)

  // Número de presupuesto (derecha)
  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'bold')
  doc.text('PRESUPUESTO', pageWidth - 15, yPos, { align: 'right' })

  doc.setFontSize(14)
  doc.setTextColor(220, 38, 38)
  doc.text(presupuesto.numero, pageWidth - 15, yPos + 6, { align: 'right' })

  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.setFont('helvetica', 'normal')
  const fechaEmision = new Date(presupuesto.fecha_emision).toLocaleDateString('es-AR')
  const fechaVenc = new Date(presupuesto.fecha_vencimiento).toLocaleDateString('es-AR')
  doc.text(`Fecha: ${fechaEmision}`, pageWidth - 15, yPos + 12, { align: 'right' })
  doc.text(`Vencimiento: ${fechaVenc}`, pageWidth - 15, yPos + 17, { align: 'right' })

  yPos = 50

  // Línea separadora
  doc.setDrawColor(220, 38, 38)
  doc.setLineWidth(0.5)
  doc.line(15, yPos, pageWidth - 15, yPos)

  yPos += 10

  // ===== DATOS DEL CLIENTE =====
  doc.setFontSize(11)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'bold')
  doc.text('CLIENTE:', 15, yPos)

  yPos += 6
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(presupuesto.cliente_nombre, 15, yPos)

  if (presupuesto.razon_social) {
    yPos += 5
    doc.text(`Razón social: ${presupuesto.razon_social}`, 15, yPos)
  }

  if (presupuesto.tipo_documento && presupuesto.numero_documento) {
    yPos += 5
    doc.text(`Documento: ${presupuesto.tipo_documento} ${presupuesto.numero_documento}`, 15, yPos)
  }

  if (presupuesto.cliente_telefono) {
    yPos += 5
    doc.text(`Tel: ${presupuesto.cliente_telefono}`, 15, yPos)
  }

  if (presupuesto.cliente_email) {
    yPos += 5
    doc.text(`Email: ${presupuesto.cliente_email}`, 15, yPos)
  }

  if (presupuesto.cliente_direccion) {
    yPos += 5
    doc.text(`Dirección: ${presupuesto.cliente_direccion}`, 15, yPos)
  }

  if (presupuesto.vendedor_nombre) {
    yPos += 7
    doc.setFont('helvetica', 'bold')
    doc.text('VENDEDOR:', 15, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(presupuesto.vendedor_nombre, 45, yPos)
  }

  // Si es cercado, mostrar datos del terreno
  if (presupuesto.tipo === 'cercado' && presupuesto.metros_lineales_total) {
    yPos += 8
    doc.setFont('helvetica', 'bold')
    doc.text('TERRENO:', 15, yPos)

    yPos += 6
    doc.setFont('helvetica', 'normal')
    if (presupuesto.terreno_largo && presupuesto.terreno_ancho) {
      doc.text(`Dimensiones: ${presupuesto.terreno_largo}m × ${presupuesto.terreno_ancho}m`, 15, yPos)
      yPos += 5
    }
    doc.text(`Perímetro total: ${presupuesto.metros_lineales_total} metros lineales`, 15, yPos)
    yPos += 5
  }

  // ===== DETALLE DEL CERCO PERIMETRAL (VERSIÓN COMERCIAL) =====
  if (presupuesto.tipo === 'cercado' && presupuesto.configuracion_cercado) {
    const config = presupuesto.configuracion_cercado

    // Aseguramos espacio para el bloque
    ensureSpace(70)

    // Bloque de título
    doc.setFillColor(245, 245, 245)
    doc.rect(15, yPos, pageWidth - 30, 8, 'F')

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text('DETALLE DEL CERCO PERIMETRAL', 20, yPos + 6)

    yPos += 14

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)

    // ===== Características principales (en tono comercial) =====
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text('Características principales:', 15, yPos)
    yPos += 5

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)

    const bulletLines: string[] = []

    if (config.tejido_codigo || config.calibre || config.altura) {
      let linea = 'Tejido romboidal de alambre galvanizado'
      const detalles: string[] = []
      if (config.tejido_codigo) detalles.push(config.tejido_codigo)
      if (config.calibre) detalles.push(`Calibre ${config.calibre}`)
      if (config.altura) detalles.push(`${config.altura} m de altura`)
      if (detalles.length > 0) {
        linea += ` (${detalles.join(' · ')})`
      }
      bulletLines.push(linea)
    }

   
    if (config.cordon_tipo) {
      bulletLines.push(`Cordón de hormigón armado (${config.cordon_tipo}) para mayor estabilidad`)
    }

    if (typeof config.hilos_pua === 'number') {
      if (config.hilos_pua > 0) {
        bulletLines.push(`Alambre de púa de seguridad con ${config.hilos_pua} hilos`)
      } else {
        bulletLines.push('Opción sin alambre de púa (configurable según necesidad)')
      }
    }

    if (config.altura_final_cerco && !bulletLines.find(l => l.includes('altura final'))) {
      bulletLines.push(`Altura final estimada del cerco: ${config.altura_final_cerco} m`)
    }

    doc.setTextColor(0, 0, 0)
    bulletLines.forEach((text) => {
      ensureSpace(6)
      doc.text(`• ${text}`, 18, yPos)
      yPos += 4
    })

    yPos += 5

    // ===== Postes (detalle técnico pero claro) =====
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text('Postes incluidos:', 15, yPos)
    yPos += 5

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(60, 60, 60)

    if (config.descripciones_postes) {
      const ds = config.descripciones_postes

      const posteLines: string[] = []

      if (ds.esquinero?.descripcion || ds.esquinero?.nombre) {
        posteLines.push(`Esquineros: ${ds.esquinero.descripcion || ds.esquinero.nombre}`)
      }
      if (ds.intermedio?.descripcion || ds.intermedio?.nombre) {
        posteLines.push(`Intermedios: ${ds.intermedio.descripcion || ds.intermedio.nombre}`)
      }
      if (ds.refuerzo?.descripcion || ds.refuerzo?.nombre) {
        posteLines.push(`Refuerzos: ${ds.refuerzo.descripcion || ds.refuerzo.nombre}`)
      }
      if (ds.puntal?.descripcion || ds.puntal?.nombre) {
        posteLines.push(`Puntales: ${ds.puntal.descripcion || ds.puntal.nombre}`)
      }

      posteLines.forEach((line) => {
        ensureSpace(5)
        doc.text(`• ${line}`, 18, yPos)
        yPos += 4
      })
    }

    yPos += 5

    // ===== Accesorios incluidos (2 columnas) =====
    const accesorios: string[] = []
    if (config.cantidad_ganchos && config.cantidad_ganchos > 0) accesorios.push('Ganchos tensores')
    if (config.cantidad_planchuelas && config.cantidad_planchuelas > 0) accesorios.push('Planchuelas reforzadas')
    if (config.cantidad_torniquetes && config.cantidad_torniquetes > 0) accesorios.push('Torniquetes')
    if (config.cantidad_esparragos && config.cantidad_esparragos > 0) accesorios.push('Espárragos')
    if (config.metros_alambre_ar && config.metros_alambre_ar > 0) accesorios.push('Alambre de alta resistencia')
    if (config.kg_clavos && config.kg_clavos > 0) accesorios.push('Clavos')
    if (config.kg_alambre_negro && config.kg_alambre_negro > 0) accesorios.push('Alambre negro')

    if (accesorios.length > 0) {
      ensureSpace(40)

      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text('Accesorios incluidos para la instalación completa:', 15, yPos)
      yPos += 6

      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)

      const mitad = Math.ceil(accesorios.length / 2)
      const col1 = accesorios.slice(0, mitad)
      const col2 = accesorios.slice(mitad)

      const x1 = 18
      const x2 = pageWidth / 2 + 5

      const maxItems = Math.max(col1.length, col2.length)
      for (let i = 0; i < maxItems; i++) {
        ensureSpace(5)
        if (col1[i]) doc.text(`• ${col1[i]}`, x1, yPos)
        if (col2[i]) doc.text(`• ${col2[i]}`, x2, yPos)
        yPos += 4
      }

      yPos += 4

      doc.setFontSize(8)
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(90, 90, 90)
      const nota = 'Incluimos todos los accesorios necesarios para que la instalación sea completa, segura y con una terminación prolija.'
      const notaLines = doc.splitTextToSize(nota, pageWidth - 30)
      notaLines.forEach((line) => {
        ensureSpace(5)
        doc.text(line, 15, yPos)
        yPos += 4
      })
    }

    // Volvemos a seteo por defecto para el resto
    yPos += 6
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
  }

  yPos += 8

  // ===== TABLA DE ITEMS =====
  ensureSpace(30)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('DETALLE:', 15, yPos)

  yPos += 5

  const tableData = items.map((item, index) => [
    (index + 1).toString(),
    item.descripcion,
    item.cantidad.toLocaleString('es-AR'),
    item.unidad,
    `$${item.precio_unitario.toLocaleString('es-AR')}`,
    `$${item.precio_total.toLocaleString('es-AR')}`,
  ])

  autoTable(doc, {
    startY: yPos,
    head: [['#', 'Descripción', 'Cant.', 'Unidad', 'P. Unit.', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [220, 38, 38],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 20, halign: 'right' },
      3: { cellWidth: 20 },
      4: { cellWidth: 30, halign: 'right' },
      5: { cellWidth: 35, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 15, right: 15 },
  })

  // Obtener posición final de la tabla
  yPos = (doc as any).lastAutoTable.finalY + 10

  // ===== TOTALES =====
  const totalesX = pageWidth - 80

  ensureSpace(40)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.text('Subtotal:', totalesX, yPos)
  doc.text(`$${presupuesto.subtotal.toLocaleString('es-AR')}`, pageWidth - 15, yPos, {
    align: 'right',
  })

  if (presupuesto.descuento > 0) {
    yPos += 6
    doc.setTextColor(220, 38, 38)
    doc.text('Descuento:', totalesX, yPos)
    doc.text(`-$${presupuesto.descuento.toLocaleString('es-AR')}`, pageWidth - 15, yPos, {
      align: 'right',
    })
    doc.setTextColor(0, 0, 0)
  }

  // Discriminación de IVA (21%) - Solo si NO es efectivo
  const esEfectivo = presupuesto.forma_pago === 'efectivo'
  if (!esEfectivo && presupuesto.total > 0) {
    yPos += 6
    const baseSinIva = presupuesto.total / 1.21
    const iva21 = baseSinIva * 0.21
    doc.text('Base imponible (sin IVA):', totalesX, yPos)
    doc.text(
      `$${baseSinIva.toLocaleString('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      pageWidth - 15,
      yPos,
      { align: 'right' }
    )
    yPos += 6
    doc.text('IVA 21%:', totalesX, yPos)
    doc.text(
      `$${iva21.toLocaleString('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      pageWidth - 15,
      yPos,
      { align: 'right' }
    )
  }

  yPos += 8
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.5)
  doc.line(totalesX - 5, yPos - 3, pageWidth - 15, yPos - 3)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL:', totalesX, yPos + 4)
  doc.setTextColor(34, 139, 34) // Verde
  doc.setFontSize(14)
  doc.text(`$${presupuesto.total.toLocaleString('es-AR')}`, pageWidth - 15, yPos + 4, {
    align: 'right',
  })
  doc.setTextColor(0, 0, 0)

  yPos += 19

  // ===== CONDICIONES COMERCIALES =====
  if (presupuesto.condiciones_comerciales && yPos < pageHeight - 60) {
    ensureSpace(40)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('CONDICIONES COMERCIALES:', 15, yPos)

    yPos += 6
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    const condiciones = presupuesto.condiciones_comerciales.split('\n')
    condiciones.forEach((linea) => {
      if (yPos < pageHeight - 30) {
        doc.text(`• ${linea}`, 20, yPos)
        yPos += 5
      }
    })

    yPos += 5
  }

  // ===== OBSERVACIONES =====
  if (presupuesto.observaciones && yPos < pageHeight - 40) {
    ensureSpace(40)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('OBSERVACIONES:', 15, yPos)

    yPos += 6
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    const observaciones = doc.splitTextToSize(presupuesto.observaciones, pageWidth - 30)
    doc.text(observaciones, 15, yPos)
    yPos += observaciones.length * 5
  }

  // ===== FOOTER DINÁMICO =====
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.setFont('helvetica', 'italic')

  // Si el contenido llegó muy abajo, manda el footer a una nueva página
  if (yPos > pageHeight - 40) {
    doc.addPage()
  }

  const footerY = pageHeight - 20
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.3)
  doc.line(15, footerY - 5, pageWidth - 15, footerY - 5)

  doc.text('Alambres del Norte SRL', pageWidth / 2, footerY, { align: 'center' })
  doc.text(
    'Tel: +54 387 77-3393 | Email: info@alambresdelnortesrl.com.ar',
    pageWidth / 2,
    footerY + 4,
    { align: 'center' }
  )
  doc.text(`Validez: ${presupuesto.validez_dias} días`, pageWidth / 2, footerY + 8, {
    align: 'center',
  })

  // Descargar
  const filename = `${presupuesto.numero.replace(/\//g, '-')}_${presupuesto.cliente_nombre.replace(
    /\s/g,
    '_'
  )}.pdf`
  doc.save(filename)
}

export function generarPDFPresupuestoArticulos(
  presupuesto: PresupuestoData,
  items: PresupuestoItem[]
) {
  generarPDFPresupuesto(presupuesto, items)
}

export function generarPDFPresupuestoCercado(
  presupuesto: PresupuestoData,
  items: PresupuestoItem[]
) {
  // Mismo template, solo cambia el contenido
  generarPDFPresupuesto(presupuesto, items)
}

export function generarPDFRemito(
  presupuesto: PresupuestoData,
  items: PresupuestoItem[],
  numeroRemito?: string
) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  let yPos = 20

  // Generar número de remito si no se proporciona
  // Extrae el número del presupuesto (ej: PRES-2024-001 -> 2024-001)
  const numeroPresupuesto =
    presupuesto.numero.match(/\d{4}-\d{3}/)?.[0] || presupuesto.numero.replace(/^[A-Z]+-/, '')
  const remitoNumero = numeroRemito || `REM-${numeroPresupuesto}`

  try {
    const logo = new Image()
    logo.src = '/logos/logo-color.png'
    doc.addImage(logo, 'PNG', 15, yPos - 10, 40, 20)
  } catch (error) {
    console.warn('No se pudo cargar el logo para el PDF', error)
  }

  // ===== HEADER =====
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.setFont('helvetica', 'normal')
  doc.text('Tu seguridad comienza con nosotros', 15, yPos + 15)

  // Número de remito (derecha)
  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'bold')
  doc.text('REMITO', pageWidth - 15, yPos, { align: 'right' })

  doc.setFontSize(14)
  doc.setTextColor(220, 38, 38)
  doc.text(remitoNumero, pageWidth - 15, yPos + 6, { align: 'right' })

  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.setFont('helvetica', 'normal')
  const fechaEntrega = new Date().toLocaleDateString('es-AR')
  doc.text(`Fecha de entrega: ${fechaEntrega}`, pageWidth - 15, yPos + 12, { align: 'right' })

  // Referencia al presupuesto
  if (presupuesto.numero) {
    doc.text(`Presupuesto: ${presupuesto.numero}`, pageWidth - 15, yPos + 17, { align: 'right' })
  }

  yPos = 50

  // Línea separadora
  doc.setDrawColor(220, 38, 38)
  doc.setLineWidth(0.5)
  doc.line(15, yPos, pageWidth - 15, yPos)

  yPos += 10

  // ===== DATOS DEL REMITENTE =====
  doc.setFontSize(11)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'bold')
  doc.text('REMITENTE:', 15, yPos)

  yPos += 6
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Alambres del Norte SRL', 15, yPos)
  yPos += 5
  doc.text('Tel: +54 387 77-3393', 15, yPos)
  yPos += 5
  doc.text('Email: info@alambresdelnortesrl.com.ar', 15, yPos)

  yPos += 12

  // ===== DATOS DEL DESTINATARIO =====
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('DESTINATARIO:', 15, yPos)

  yPos += 6
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(presupuesto.cliente_nombre, 15, yPos)

  if (presupuesto.razon_social) {
    yPos += 5
    doc.text(`Razón social: ${presupuesto.razon_social}`, 15, yPos)
  }

  if (presupuesto.tipo_documento && presupuesto.numero_documento) {
    yPos += 5
    doc.text(`Documento: ${presupuesto.tipo_documento} ${presupuesto.numero_documento}`, 15, yPos)
  }

  if (presupuesto.cliente_telefono) {
    yPos += 5
    doc.text(`Tel: ${presupuesto.cliente_telefono}`, 15, yPos)
  }

  if (presupuesto.cliente_email) {
    yPos += 5
    doc.text(`Email: ${presupuesto.cliente_email}`, 15, yPos)
  }

  if (presupuesto.cliente_direccion) {
    yPos += 5
    doc.text(`Dirección: ${presupuesto.cliente_direccion}`, 15, yPos)
  }

  yPos += 12

  // ===== TABLA DE ITEMS (SIN PRECIOS) =====
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('MERCADERÍA ENTREGADA:', 15, yPos)

  yPos += 5

  const tableData = items.map((item, index) => [
    (index + 1).toString(),
    item.descripcion,
    item.cantidad.toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    item.unidad,
    '', // Estado/observaciones (vacío por defecto)
  ])

  autoTable(doc, {
    startY: yPos,
    head: [['#', 'Descripción', 'Cantidad', 'Unidad', 'Estado']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [220, 38, 38],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 25, halign: 'right' },
      3: { cellWidth: 25 },
      4: { cellWidth: 30 },
    },
    margin: { left: 15, right: 15 },
  })

  // Obtener posición final de la tabla
  yPos = (doc as any).lastAutoTable.finalY + 15

  // ===== OBSERVACIONES =====
  if (presupuesto.observaciones && yPos < pageHeight - 80) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('OBSERVACIONES:', 15, yPos)

    yPos += 6
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    const observaciones = doc.splitTextToSize(presupuesto.observaciones, pageWidth - 30)
    doc.text(observaciones, 15, yPos)
    yPos += observaciones.length * 5 + 10
  }

  // ===== FIRMA DEL CLIENTE =====
  if (yPos < pageHeight - 60) {
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(0.3)

    // Línea para firma
    const firmaY = pageHeight - 50
    doc.line(15, firmaY, pageWidth - 15, firmaY)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('Firma y aclaración del destinatario:', 15, firmaY - 5)

    // Espacio para firma
    doc.setDrawColor(200, 200, 200)
    doc.rect(15, firmaY + 5, pageWidth - 30, 20)
  }

  // ===== FOOTER =====
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.setFont('helvetica', 'italic')

  const footerY = pageHeight - 10
  doc.text('Alambres del Norte SRL', pageWidth / 2, footerY, { align: 'center' })
  doc.text(
    'Tel: +54 387 77-3393 | Email: info@alambresdelnortesrl.com.ar',
    pageWidth / 2,
    footerY + 4,
    { align: 'center' }
  )

  // Descargar
  const filename = `REMITO_${remitoNumero.replace(/\//g, '-')}_${presupuesto.cliente_nombre.replace(
    /\s/g,
    '_'
  )}.pdf`
  doc.save(filename)
}
