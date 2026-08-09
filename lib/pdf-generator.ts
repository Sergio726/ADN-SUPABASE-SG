import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import QRCode from 'qrcode'

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

export async function generarPDFPresupuesto(
  presupuesto: PresupuestoData,
  items: PresupuestoItem[]
) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - (margin * 2)
  let yPos = 15

  // Paleta de colores - Rojo como acento principal, fondos claros
  const colores = {
    // Rojo de marca (acento principal)
    rojo: [220, 38, 38] as [number, number, number],
    rojoOscuro: [185, 28, 28] as [number, number, number],
    rojoClaro: [254, 226, 226] as [number, number, number],
    rojoMuyClaro: [254, 242, 242] as [number, number, number],
    // Neutros
    grisOscuro: [55, 65, 81] as [number, number, number],
    gris: [107, 114, 128] as [number, number, number],
    grisClaro: [249, 250, 251] as [number, number, number],
    grisBorde: [229, 231, 235] as [number, number, number],
    blanco: [255, 255, 255] as [number, number, number],
    // Acentos suaves (más claros para no competir con el rojo)
    verdeExito: [34, 197, 94] as [number, number, number],
    verdeMuyClaro: [240, 253, 244] as [number, number, number],
    azulInfo: [59, 130, 246] as [number, number, number],
    azulMuyClaro: [239, 246, 255] as [number, number, number],
  }

  // Helper simple para evitar que algo quede muy abajo
  const ensureSpace = (needed: number = 40) => {
    if (yPos + needed > pageHeight - 35) {
      doc.addPage()
      yPos = 20
    }
  }

  // Helper para dibujar un rectángulo redondeado
  const roundedRect = (x: number, y: number, w: number, h: number, r: number, style: 'F' | 'S' | 'FD' = 'F') => {
    doc.roundedRect(x, y, w, h, r, r, style)
  }

  // ===== HEADER PROFESIONAL (Fondo blanco con línea roja) =====
  // Fondo blanco del header
  doc.setFillColor(...colores.blanco)
  roundedRect(margin, yPos, contentWidth, 35, 0, 'F')
  
  // Línea roja decorativa superior
  doc.setFillColor(...colores.rojo)
  doc.rect(margin, yPos, contentWidth, 3, 'F')

  // Logo de la empresa
  try {
    const logo = new Image()
    logo.src = '/logos/logo-color.png'
    doc.addImage(logo, 'PNG', margin + 5, yPos + 8, 45, 22)
  } catch {
    doc.setFontSize(22)
    doc.setTextColor(...colores.rojo)
    doc.setFont('helvetica', 'bold')
    doc.text('ADN', margin + 8, yPos + 20)
    doc.setFontSize(7)
    doc.setTextColor(...colores.gris)
    doc.text('ALAMBRES DEL NORTE SRL', margin + 8, yPos + 26)
  }

  // Slogan debajo del logo
  doc.setFontSize(8)
  doc.setTextColor(...colores.gris)
  doc.setFont('helvetica', 'italic')
  doc.text('Tu seguridad comienza con nosotros', margin + 5, yPos + 33)

  // Número de presupuesto (derecha, destacado con borde rojo)
  const badgeWidth = 58
  const badgeX = pageWidth - margin - badgeWidth
  doc.setFillColor(...colores.rojoMuyClaro)
  doc.setDrawColor(...colores.rojo)
  doc.setLineWidth(1)
  roundedRect(badgeX, yPos + 6, badgeWidth, 26, 3, 'FD')
  
  doc.setFontSize(8)
  doc.setTextColor(...colores.gris)
  doc.setFont('helvetica', 'normal')
  doc.text('PRESUPUESTO', badgeX + badgeWidth/2, yPos + 13, { align: 'center' })
  
  doc.setFontSize(14)
  doc.setTextColor(...colores.rojo)
  doc.setFont('helvetica', 'bold')
  doc.text(presupuesto.numero, badgeX + badgeWidth/2, yPos + 23, { align: 'center' })

  // Fechas debajo del header
  yPos += 40
  doc.setFillColor(...colores.grisClaro)
  doc.setDrawColor(...colores.grisBorde)
  doc.setLineWidth(0.3)
  roundedRect(margin, yPos, contentWidth, 12, 2, 'FD')
  
  const fechaEmision = new Date(presupuesto.fecha_emision).toLocaleDateString('es-AR', { 
    day: '2-digit', month: 'long', year: 'numeric' 
  })
  const fechaVenc = new Date(presupuesto.fecha_vencimiento).toLocaleDateString('es-AR', { 
    day: '2-digit', month: 'long', year: 'numeric' 
  })
  
  doc.setFontSize(9)
  doc.setTextColor(...colores.grisOscuro)
  doc.setFont('helvetica', 'normal')
  doc.text(`Emisión: ${fechaEmision}`, margin + 5, yPos + 8)
  doc.text(`Válido hasta: ${fechaVenc}`, pageWidth - margin - 5, yPos + 8, { align: 'right' })
  
  yPos += 18

  // ===== SECCIÓN CLIENTE (Fondo gris muy claro, título con acento rojo) =====
  const clienteBoxHeight = 42
  doc.setFillColor(...colores.grisClaro)
  doc.setDrawColor(...colores.grisBorde)
  doc.setLineWidth(0.3)
  roundedRect(margin, yPos, contentWidth, clienteBoxHeight, 3, 'FD')
  
  // Título de sección con fondo rojo
  doc.setFillColor(...colores.rojo)
  roundedRect(margin, yPos, 70, 8, 3, 'F')
  doc.setFontSize(9)
  doc.setTextColor(...colores.blanco)
  doc.setFont('helvetica', 'bold')
  doc.text('DATOS DEL CLIENTE', margin + 5, yPos + 6)
  
  // Datos del cliente en 2 columnas
  const col1X = margin + 5
  const col2X = pageWidth / 2 + 5
  let clienteY = yPos + 14
  
  doc.setFontSize(11)
  doc.setTextColor(...colores.grisOscuro)
  doc.setFont('helvetica', 'bold')
  doc.text(presupuesto.cliente_nombre, col1X, clienteY)
  
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  
  if (presupuesto.razon_social) {
    clienteY += 5
    doc.text(presupuesto.razon_social, col1X, clienteY)
  }

  if (presupuesto.tipo_documento && presupuesto.numero_documento) {
    clienteY += 5
    doc.text(`${presupuesto.tipo_documento}: ${presupuesto.numero_documento}`, col1X, clienteY)
  }

  // Columna derecha - contacto
  let contactoY = yPos + 14
  if (presupuesto.cliente_telefono) {
    doc.setTextColor(...colores.gris)
    doc.text('Tel:', col2X, contactoY)
    doc.setTextColor(...colores.grisOscuro)
    doc.text(presupuesto.cliente_telefono, col2X + 12, contactoY)
    contactoY += 5
  }
  
  if (presupuesto.cliente_email) {
    doc.setTextColor(...colores.gris)
    doc.text('Email:', col2X, contactoY)
    doc.setTextColor(...colores.grisOscuro)
    doc.text(presupuesto.cliente_email, col2X + 15, contactoY)
    contactoY += 5
  }
  
  if (presupuesto.cliente_direccion) {
    doc.setTextColor(...colores.gris)
    doc.text('Dir:', col2X, contactoY)
    doc.setTextColor(...colores.grisOscuro)
    const direccionLines = doc.splitTextToSize(presupuesto.cliente_direccion, 70)
    doc.text(direccionLines[0], col2X + 12, contactoY)
  }

  yPos += clienteBoxHeight + 5

  // Vendedor y Terreno en línea horizontal
  if (presupuesto.vendedor_nombre || (presupuesto.tipo === 'cercado' && presupuesto.metros_lineales_total)) {
    doc.setFillColor(...colores.blanco)
    doc.setDrawColor(...colores.grisBorde)
    doc.setLineWidth(0.3)
    roundedRect(margin, yPos, contentWidth, 10, 2, 'FD')
    
    doc.setFontSize(9)
    doc.setTextColor(...colores.grisOscuro)
    
    if (presupuesto.vendedor_nombre) {
      doc.setFont('helvetica', 'bold')
      doc.text('Vendedor:', margin + 5, yPos + 7)
      doc.setFont('helvetica', 'normal')
      doc.text(presupuesto.vendedor_nombre, margin + 28, yPos + 7)
    }
    
    if (presupuesto.tipo === 'cercado' && presupuesto.metros_lineales_total) {
      doc.setFont('helvetica', 'bold')
      doc.text('Terreno:', pageWidth / 2, yPos + 7)
      doc.setFont('helvetica', 'normal')
      let terrenoText = `${presupuesto.metros_lineales_total} m lineales`
      if (presupuesto.terreno_largo && presupuesto.terreno_ancho) {
        terrenoText = `${presupuesto.terreno_largo}m × ${presupuesto.terreno_ancho}m (${presupuesto.metros_lineales_total} m lineales)`
      }
      doc.text(terrenoText, pageWidth / 2 + 22, yPos + 7)
    }
    
    yPos += 14
  }

  // ===== DETALLE DEL CERCO PERIMETRAL (VERSIÓN VISUAL CON CARDS) =====
  if (presupuesto.tipo === 'cercado' && presupuesto.configuracion_cercado) {
    const config = presupuesto.configuracion_cercado

    // Aseguramos espacio para el bloque
    ensureSpace(80)

    // Título principal con fondo rojo
    doc.setFillColor(...colores.rojo)
    roundedRect(margin, yPos, contentWidth, 10, 2, 'F')
    
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...colores.blanco)
    doc.text('DETALLE DEL CERCO PERIMETRAL', margin + 5, yPos + 7)
    
    // Nombre del esquema
    if (config.nombre) {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text(config.nombre, pageWidth - margin - 5, yPos + 7, { align: 'right' })
    }

    yPos += 14

    // ===== CARD 1: Características del Tejido (Fondo muy claro) =====
    const cardHeight = 28
    const cardWidth = (contentWidth - 4) / 2
    
    // Card izquierda - Tejido
    doc.setFillColor(...colores.grisClaro)
    doc.setDrawColor(...colores.grisBorde)
    doc.setLineWidth(0.3)
    roundedRect(margin, yPos, cardWidth, cardHeight, 2, 'FD')
    
    // Línea de acento roja en el título
    doc.setFillColor(...colores.rojoClaro)
    roundedRect(margin, yPos, cardWidth, 7, 2, 'F')
    doc.setFontSize(8)
    doc.setTextColor(...colores.rojoOscuro)
    doc.setFont('helvetica', 'bold')
    doc.text('TEJIDO ROMBOIDAL', margin + 3, yPos + 5)
    
    doc.setFontSize(9)
    doc.setTextColor(...colores.grisOscuro)
    doc.setFont('helvetica', 'normal')
    
    let tejidoY = yPos + 12
    if (config.tejido_codigo) {
      doc.setFont('helvetica', 'bold')
      doc.text(config.tejido_codigo, margin + 3, tejidoY)
      tejidoY += 5
    }
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    const tejidoDetalles: string[] = []
    if (config.calibre) tejidoDetalles.push(`Calibre ${config.calibre}`)
    if (config.altura) tejidoDetalles.push(`${config.altura}m alto`)
    if (config.tamano_rombo) tejidoDetalles.push(`Rombo ${config.tamano_rombo}"`)
    doc.text(tejidoDetalles.join(' · '), margin + 3, tejidoY)
    tejidoY += 4
    doc.setTextColor(...colores.gris)
    doc.text('Alambre galvanizado de alta durabilidad', margin + 3, tejidoY)

    // Card derecha - Altura y Seguridad
    doc.setFillColor(...colores.grisClaro)
    doc.setDrawColor(...colores.grisBorde)
    roundedRect(margin + cardWidth + 4, yPos, cardWidth, cardHeight, 2, 'FD')
    
    doc.setFillColor(...colores.rojoClaro)
    roundedRect(margin + cardWidth + 4, yPos, cardWidth, 7, 2, 'F')
    doc.setFontSize(8)
    doc.setTextColor(...colores.rojoOscuro)
    doc.setFont('helvetica', 'bold')
    doc.text('ALTURA Y SEGURIDAD', margin + cardWidth + 7, yPos + 5)
    
    doc.setFontSize(9)
    doc.setTextColor(...colores.grisOscuro)
    
    let alturaY = yPos + 12
    if (config.altura_final_cerco) {
      doc.setFont('helvetica', 'bold')
      doc.text(`Altura final: ${config.altura_final_cerco}m`, margin + cardWidth + 7, alturaY)
      alturaY += 5
    }
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    if (typeof config.hilos_pua === 'number') {
      const puaText = config.hilos_pua > 0 
        ? `${config.hilos_pua} hilos de alambre de púa` 
        : 'Sin alambre de púa'
      doc.text(puaText, margin + cardWidth + 7, alturaY)
      alturaY += 4
    }
    if (config.cordon_tipo && config.cordon_tipo !== 'Sin cordón') {
      doc.setTextColor(...colores.gris)
      doc.text(`Cordón: ${config.cordon_tipo}`, margin + cardWidth + 7, alturaY)
    }

    yPos += cardHeight + 4

    // ===== CARD 2: Postes (Fondo claro con acento rojo) =====
    if (config.descripciones_postes) {
      const ds = config.descripciones_postes
      const tienePostes = ds.esquinero || ds.intermedio || ds.refuerzo || ds.puntal
      
      if (tienePostes) {
        // Contar cuántos postes hay para calcular altura dinámica
        const cantidadPostes = [ds.esquinero, ds.intermedio, ds.refuerzo, ds.puntal].filter(p => p?.descripcion || p?.nombre).length
        const postesBoxHeight = 10 + (cantidadPostes * 5) // Título + líneas
        
        ensureSpace(postesBoxHeight + 5)
        
        doc.setFillColor(...colores.blanco)
        doc.setDrawColor(...colores.grisBorde)
        doc.setLineWidth(0.3)
        roundedRect(margin, yPos, contentWidth, postesBoxHeight, 2, 'FD')
        
        // Borde izquierdo rojo como acento
        doc.setFillColor(...colores.rojo)
        doc.rect(margin, yPos, 3, postesBoxHeight, 'F')
        
        doc.setFontSize(8)
        doc.setTextColor(...colores.rojo)
        doc.setFont('helvetica', 'bold')
        doc.text(`POSTES ${config.tipo_poste ? `(${config.tipo_poste})` : ''}`, margin + 8, yPos + 6)
        
        doc.setFontSize(8)
        doc.setTextColor(...colores.grisOscuro)
        
        // Una línea por cada tipo de poste
        const posteX = margin + 8
        const labelWidth = 25
        let posteY = yPos + 12
        
        if (ds.esquinero?.descripcion || ds.esquinero?.nombre) {
          doc.setFont('helvetica', 'bold')
          doc.text('Esquineros:', posteX, posteY)
          doc.setFont('helvetica', 'normal')
          const textoEsquinero = doc.splitTextToSize(ds.esquinero.descripcion || ds.esquinero.nombre || '', contentWidth - labelWidth - 15)
          doc.text(textoEsquinero[0], posteX + labelWidth, posteY)
          posteY += 5
        }
        
        if (ds.intermedio?.descripcion || ds.intermedio?.nombre) {
          doc.setFont('helvetica', 'bold')
          doc.text('Intermedios:', posteX, posteY)
          doc.setFont('helvetica', 'normal')
          const textoIntermedio = doc.splitTextToSize(ds.intermedio.descripcion || ds.intermedio.nombre || '', contentWidth - labelWidth - 15)
          doc.text(textoIntermedio[0], posteX + labelWidth, posteY)
          posteY += 5
        }
        
        if (ds.refuerzo?.descripcion || ds.refuerzo?.nombre) {
          doc.setFont('helvetica', 'bold')
          doc.text('Refuerzos:', posteX, posteY)
          doc.setFont('helvetica', 'normal')
          const textoRefuerzo = doc.splitTextToSize(ds.refuerzo.descripcion || ds.refuerzo.nombre || '', contentWidth - labelWidth - 15)
          doc.text(textoRefuerzo[0], posteX + labelWidth, posteY)
          posteY += 5
        }
        
        if (ds.puntal?.descripcion || ds.puntal?.nombre) {
          doc.setFont('helvetica', 'bold')
          doc.text('Puntales:', posteX, posteY)
          doc.setFont('helvetica', 'normal')
          const textoPuntal = doc.splitTextToSize(ds.puntal.descripcion || ds.puntal.nombre || '', contentWidth - labelWidth - 15)
          doc.text(textoPuntal[0], posteX + labelWidth, posteY)
        }
        
        yPos += postesBoxHeight + 4
      }
    }

    // ===== CARD 3: Accesorios incluidos =====
    const accesorios: string[] = []
    if (config.cantidad_ganchos && config.cantidad_ganchos > 0) accesorios.push('Ganchos tensores')
    if (config.cantidad_planchuelas && config.cantidad_planchuelas > 0) accesorios.push('Planchuelas')
    if (config.cantidad_torniquetes && config.cantidad_torniquetes > 0) accesorios.push('Torniquetes')
    if (config.cantidad_esparragos && config.cantidad_esparragos > 0) accesorios.push('Espárragos')
    if (config.metros_alambre_ar && config.metros_alambre_ar > 0) accesorios.push('Alambre AR')
    if (config.kg_clavos && config.kg_clavos > 0) accesorios.push('Clavos')
    if (config.kg_alambre_negro && config.kg_alambre_negro > 0) accesorios.push('Alambre negro')

    if (accesorios.length > 0) {
      ensureSpace(18)
      
      doc.setFillColor(...colores.grisClaro)
      doc.setDrawColor(...colores.grisBorde)
      doc.setLineWidth(0.2)
      roundedRect(margin, yPos, contentWidth, 14, 2, 'FD')
      
      doc.setFontSize(8)
      doc.setTextColor(...colores.grisOscuro)
      doc.setFont('helvetica', 'bold')
      doc.text('ACCESORIOS INCLUIDOS:', margin + 3, yPos + 5)
      
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...colores.gris)
      doc.text(accesorios.join(' • '), margin + 3, yPos + 11)
      
      yPos += 18
    }

    // Nota final
    doc.setFontSize(7)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(...colores.gris)
    doc.text('* Instalación completa con todos los materiales necesarios para una terminación profesional.', margin, yPos)
    
    yPos += 8
  }

  yPos += 4

  // ===== TABLA DE ITEMS =====
  ensureSpace(35)
  
  // Título de sección con rojo
  doc.setFillColor(...colores.rojo)
  roundedRect(margin, yPos, 50, 8, 2, 'F')
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...colores.blanco)
  doc.text('DETALLE', margin + 5, yPos + 6)
  
  yPos += 12

  const tableData = items.map((item, index) => [
    (index + 1).toString(),
    item.descripcion,
    item.cantidad.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    item.unidad,
    `$${item.precio_unitario.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `$${item.precio_total.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  ])

  autoTable(doc, {
    startY: yPos,
    head: [['#', 'Descripción', 'Cantidad', 'Unidad', 'P. Unitario', 'Total']],
    body: tableData,
    theme: 'plain',
    headStyles: {
      fillColor: colores.rojo,
      textColor: colores.blanco,
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: 4,
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 3,
      textColor: colores.grisOscuro,
    },
    alternateRowStyles: {
      fillColor: [252, 252, 252],
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 22, halign: 'right' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 32, halign: 'right' },
      5: { cellWidth: 35, halign: 'right', fontStyle: 'bold', textColor: colores.grisOscuro },
    },
    margin: { left: margin, right: margin },
    tableLineColor: colores.grisBorde,
    tableLineWidth: 0.1,
  })

  // Obtener posición final de la tabla
  yPos = (doc as any).lastAutoTable.finalY + 8

  // ===== SECCIÓN DE TOTALES (BOX DESTACADO) =====
  ensureSpace(55)
  
  const totalesBoxWidth = 85
  const totalesBoxX = pageWidth - margin - totalesBoxWidth
  const totalesStartY = yPos
  
  // Calcular altura dinámica del box
  let totalesHeight = 35 // Base
  if (presupuesto.descuento > 0) totalesHeight += 8
  const esEfectivo = presupuesto.forma_pago === 'efectivo'
  if (!esEfectivo && presupuesto.total > 0) totalesHeight += 16

  // Fondo del box de totales (blanco con borde gris)
  doc.setFillColor(...colores.blanco)
  doc.setDrawColor(...colores.grisBorde)
  doc.setLineWidth(0.5)
  roundedRect(totalesBoxX, totalesStartY, totalesBoxWidth, totalesHeight, 3, 'FD')
  
  let totalesY = totalesStartY + 8
  const labelX = totalesBoxX + 5
  const valueX = totalesBoxX + totalesBoxWidth - 5
  
  // Subtotal
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...colores.grisOscuro)
  doc.text('Subtotal:', labelX, totalesY)
  doc.text(`$${presupuesto.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, valueX, totalesY, { align: 'right' })
  
  // Descuento
  if (presupuesto.descuento > 0) {
    totalesY += 6
    doc.setTextColor(...colores.rojo)
    doc.text('Descuento:', labelX, totalesY)
    doc.text(`-$${presupuesto.descuento.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, valueX, totalesY, { align: 'right' })
  }
  
  // Discriminación de IVA (21%) - Solo si NO es efectivo
  if (!esEfectivo && presupuesto.total > 0) {
    totalesY += 6
    const baseSinIva = presupuesto.total / 1.21
    const iva21 = baseSinIva * 0.21
    doc.setTextColor(...colores.gris)
    doc.setFontSize(8)
    doc.text('Neto gravado:', labelX, totalesY)
    doc.text(`$${baseSinIva.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, valueX, totalesY, { align: 'right' })
    totalesY += 5
    doc.text('IVA 21%:', labelX, totalesY)
    doc.text(`$${iva21.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, valueX, totalesY, { align: 'right' })
  }
  
  // Línea separadora antes del total
  totalesY += 5
  doc.setDrawColor(...colores.gris)
  doc.setLineWidth(0.5)
  doc.line(labelX, totalesY, valueX, totalesY)
  
  // TOTAL FINAL (destacado con fondo ROJO de marca)
  totalesY += 3
  const totalBoxY = totalesY
  doc.setFillColor(...colores.rojo)
  roundedRect(totalesBoxX + 2, totalBoxY, totalesBoxWidth - 4, 12, 2, 'F')
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...colores.blanco)
  doc.text('TOTAL', labelX + 2, totalBoxY + 8)
  doc.setFontSize(12)
  doc.text(`$${presupuesto.total.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, valueX - 2, totalBoxY + 8, { align: 'right' })
  
  // Badge de forma de pago (a la izquierda del box de totales)
  if (presupuesto.forma_pago) {
    const formasPago: Record<string, string> = {
      'efectivo': 'EFECTIVO',
      'lista': 'FACTURA',
      'tarjeta': 'TARJETA',
      'echeq45': 'E-CHEQ 45D',
      'echeq60': 'E-CHEQ 60D',
      'echeq90': 'E-CHEQ 90D',
    }
    const formaPagoLabel = formasPago[presupuesto.forma_pago] || presupuesto.forma_pago.toUpperCase()
    
    doc.setFillColor(...colores.grisClaro)
    doc.setDrawColor(...colores.grisBorde)
    doc.setLineWidth(0.3)
    roundedRect(margin, totalesStartY, 45, 14, 2, 'FD')
    
    doc.setFontSize(7)
    doc.setTextColor(...colores.gris)
    doc.setFont('helvetica', 'normal')
    doc.text('FORMA DE PAGO', margin + 3, totalesStartY + 5)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...colores.rojo)
    doc.text(formaPagoLabel, margin + 3, totalesStartY + 11)
  }
  
  yPos = totalesStartY + totalesHeight + 8

  // ===== CONDICIONES COMERCIALES =====
  if (presupuesto.condiciones_comerciales) {
    ensureSpace(35)
    
    // Título con borde izquierdo rojo
    doc.setFillColor(...colores.grisClaro)
    doc.setDrawColor(...colores.grisBorde)
    doc.setLineWidth(0.3)
    roundedRect(margin, yPos, contentWidth, 6, 2, 'FD')
    
    // Borde izquierdo rojo como acento
    doc.setFillColor(...colores.rojo)
    doc.rect(margin, yPos, 2, 6, 'F')
    
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...colores.grisOscuro)
    doc.text('CONDICIONES COMERCIALES', margin + 6, yPos + 4)
    
    yPos += 10
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...colores.grisOscuro)
    
    const condiciones = presupuesto.condiciones_comerciales.split('\n')
    condiciones.forEach((linea: string) => {
      if (linea.trim() && yPos < pageHeight - 40) {
        doc.setTextColor(...colores.rojo)
        doc.text('▸', margin + 3, yPos)
        doc.setTextColor(...colores.grisOscuro)
        doc.text(linea.trim(), margin + 8, yPos)
        yPos += 4
      }
    })
    
    yPos += 4
  }

  // ===== OBSERVACIONES =====
  if (presupuesto.observaciones) {
    ensureSpace(25)
    
    doc.setFillColor(...colores.rojoMuyClaro)
    doc.setDrawColor(...colores.rojoClaro)
    doc.setLineWidth(0.3)
    
    const obsLines = doc.splitTextToSize(presupuesto.observaciones, contentWidth - 10)
    const obsBoxHeight = Math.max(16, 10 + (obsLines.length * 4))
    
    roundedRect(margin, yPos, contentWidth, obsBoxHeight, 2, 'FD')
    
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...colores.rojo)
    doc.text('OBSERVACIONES', margin + 3, yPos + 5)
    
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...colores.grisOscuro)
    doc.text(obsLines, margin + 3, yPos + 11)
    
    yPos += obsBoxHeight + 4
  }

  // ===== FOOTER PROFESIONAL EN TODAS LAS PÁGINAS =====
  const totalPages = doc.getNumberOfPages()
  
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    
    const footerY = pageHeight - 20
    
    // Línea decorativa roja
    doc.setDrawColor(...colores.rojo)
    doc.setLineWidth(1.5)
    doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4)
    
    // Información de la empresa
    doc.setFontSize(8)
    doc.setTextColor(...colores.grisOscuro)
    doc.setFont('helvetica', 'bold')
    doc.text('Alambres del Norte SRL', margin, footerY + 3)
    
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...colores.gris)
    doc.setFontSize(7)
    doc.text('Tel: +54 387 773-0393 | info@alambresdelnortesrl.com.ar | www.alambresdelnortesrl.com.ar', margin, footerY + 8)
    
    // Validez (destacado en rojo)
    doc.setFontSize(8)
    doc.setTextColor(...colores.rojo)
    doc.setFont('helvetica', 'bold')
    doc.text(`Validez: ${presupuesto.validez_dias} días`, pageWidth - margin - 50, footerY + 3, { align: 'right' })
    
    // Número de página
    doc.setTextColor(...colores.gris)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, footerY + 8, { align: 'right' })
  }
  
  // ===== CÓDIGO QR CON INFORMACIÓN DE CONTACTO =====
  doc.setPage(1)
  const qrSize = 28
  const qrX = pageWidth - margin - qrSize - 3
  const qrY = pageHeight - 60
  
  // Datos de contacto en formato vCard
  const vCardData = `BEGIN:VCARD
VERSION:3.0
FN:Alambres del Norte SRL
TEL:+543877730393
EMAIL:info@alambresdelnortesrl.com.ar
URL:https://www.alambresdelnortesrl.com.ar
NOTE:Presupuesto ${presupuesto.numero}
END:VCARD`

  try {
    // Generar QR como Data URL
    const qrDataUrl = await QRCode.toDataURL(vCardData, {
      width: 200,
      margin: 1,
      color: {
        dark: '#374151',  // Gris oscuro
        light: '#ffffff'   // Blanco
      }
    })
    
    // Marco del QR con borde sutil
    doc.setFillColor(...colores.blanco)
    doc.setDrawColor(...colores.grisBorde)
    doc.setLineWidth(0.5)
    roundedRect(qrX - 3, qrY - 3, qrSize + 6, qrSize + 12, 2, 'FD')
    
    // Línea de acento roja superior
    doc.setFillColor(...colores.rojo)
    doc.rect(qrX - 3, qrY - 3, qrSize + 6, 2, 'F')
    
    // Insertar el QR real
    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize)
    
    // Texto debajo del QR
    doc.setFontSize(6)
    doc.setTextColor(...colores.gris)
    doc.setFont('helvetica', 'normal')
    doc.text('Escanear contacto', qrX + qrSize / 2, qrY + qrSize + 5, { align: 'center' })
  } catch (error) {
    console.warn('No se pudo generar el código QR:', error)
  }

  // Descargar
  const filename = `${presupuesto.numero.replace(/\//g, '-')}_${presupuesto.cliente_nombre.replace(
    /\s/g,
    '_'
  )}.pdf`
  doc.save(filename)
}

export async function generarPDFPresupuestoArticulos(
  presupuesto: PresupuestoData,
  items: PresupuestoItem[]
) {
  await generarPDFPresupuesto(presupuesto, items)
}

export async function generarPDFPresupuestoCercado(
  presupuesto: PresupuestoData,
  items: PresupuestoItem[]
) {
  // Mismo template, solo cambia el contenido
  await generarPDFPresupuesto(presupuesto, items)
}

/**
 * Genera un PDF con la lista de precios
 * @param datos Array de objetos con los datos de precios
 * @param nombreArchivo Nombre del archivo (sin extensión)
 */
export function generarPDFListaPrecios(
  datos: Array<{
    codigo: string
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
  const doc = new jsPDF('landscape', 'mm', 'a4') // Horizontal para mejor visualización de tabla
  const pageWidth = doc.internal.pageSize.getWidth()
  let yPos = 20

  // Helper para verificar espacio
  const ensureSpace = (needed: number = 40) => {
    const pageHeight = doc.internal.pageSize.getHeight()
    if (yPos + needed > pageHeight - 30) {
      doc.addPage('landscape')
      yPos = 20
      return true
    }
    return false
  }

  // ===== HEADER =====
  try {
    const logo = new Image()
    logo.src = '/logos/logo-color.png'
    doc.addImage(logo, 'PNG', 15, yPos - 10, 40, 20)
  } catch (error) {
    console.warn('No se pudo cargar el logo para el PDF', error)
  }

  // Título
  doc.setFontSize(18)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'bold')
  doc.text('LISTA DE PRECIOS', pageWidth / 2, yPos + 10, { align: 'center' })

  // Fecha de emisión
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.setFont('helvetica', 'normal')
  const fechaEmision = new Date().toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  doc.text(`Fecha de emisión: ${fechaEmision}`, pageWidth - 15, yPos + 5, { align: 'right' })

  yPos += 25

  // ===== TABLA DE PRECIOS =====
  const tableData = datos.map((item) => [
    item.codigo,
    item.nombre.substring(0, 40), // Limitar longitud del nombre
    item.categoria || 'Sin categoría',
    item.unidad,
    `$${item.precioEfectivo.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `$${item.precioFactura.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `$${item.precioTarjeta.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    item.estado,
  ])

  autoTable(doc, {
    head: [['Código', 'Nombre/Descripción', 'Categoría', 'Unidad', 'Precio Efectivo', 'Precio Factura/Lista\n(con IVA 21%)', 'Precio Tarjeta\n(con IVA 21%)', 'Estado']],
    body: tableData,
    startY: yPos,
    theme: 'striped',
    headStyles: {
      fillColor: [68, 114, 196], // Azul
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [0, 0, 0],
    },
    columnStyles: {
      0: { cellWidth: 25, halign: 'center' }, // Código
      1: { cellWidth: 60, halign: 'left' }, // Nombre
      2: { cellWidth: 35, halign: 'left' }, // Categoría
      3: { cellWidth: 20, halign: 'center' }, // Unidad
      4: { cellWidth: 30, halign: 'right' }, // Precio Efectivo
      5: { cellWidth: 35, halign: 'right' }, // Precio Factura
      6: { cellWidth: 30, halign: 'right' }, // Precio Tarjeta
      7: { cellWidth: 25, halign: 'center' }, // Estado
    },
    styles: {
      overflow: 'linebreak',
      cellPadding: 2,
    },
    margin: { left: 10, right: 10 },
  })

  // Obtener la posición final después de la tabla
  yPos = (doc as any).lastAutoTable.finalY + 15

  // ===== FOOTER =====
  ensureSpace(20)
  const pageHeight = doc.internal.pageSize.getHeight()
  
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.setFont('helvetica', 'italic')
  doc.text('Los precios están sujetos a cambios sin previo aviso.', pageWidth / 2, pageHeight - 15, { align: 'center' })
  doc.text(`Total de artículos: ${datos.length}`, pageWidth / 2, pageHeight - 10, { align: 'center' })
  
  // Número de página
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - 15, pageHeight - 10, { align: 'right' })
  }

  // Generar nombre de archivo con timestamp
  const fecha = new Date()
  const fechaStr = fecha.toISOString().split('T')[0].replace(/-/g, '-')
  const horaStr = fecha.toTimeString().split(' ')[0].replace(/:/g, '-').slice(0, 5)
  const nombreCompleto = `${nombreArchivo}_${fechaStr}_${horaStr}.pdf`

  // Descargar archivo
  doc.save(nombreCompleto)
  
  return nombreCompleto
}

/**
 * Genera un PDF con la lista de tejidos
 * @param datos Array de objetos con los datos de tejidos
 * @param nombreArchivo Nombre del archivo (sin extensión)
 */
export function generarPDFListaTejidos(
  datos: Array<{
    codigo: string
    nombre: string | null
    categoria: string | null
    unidad: string
    origen?: string
    precioEfectivo: number
    precioFactura: number
    precioTarjeta: number
    estado: string
  }>,
  nombreArchivo: string = 'Lista_Tejidos'
) {
  const doc = new jsPDF('landscape', 'mm', 'a4') // Horizontal para mejor visualización de tabla
  const pageWidth = doc.internal.pageSize.getWidth()
  let yPos = 20

  // Helper para verificar espacio
  const ensureSpace = (needed: number = 40) => {
    const pageHeight = doc.internal.pageSize.getHeight()
    if (yPos + needed > pageHeight - 30) {
      doc.addPage('landscape')
      yPos = 20
      return true
    }
    return false
  }

  // ===== HEADER =====
  try {
    const logo = new Image()
    logo.src = '/logos/logo-color.png'
    doc.addImage(logo, 'PNG', 15, yPos - 10, 40, 20)
  } catch (error) {
    console.warn('No se pudo cargar el logo para el PDF', error)
  }

  // Título
  doc.setFontSize(18)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'bold')
  doc.text('LISTA DE TEJIDOS ROMBOIDALES', pageWidth / 2, yPos + 10, { align: 'center' })

  // Fecha de emisión
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.setFont('helvetica', 'normal')
  const fechaEmision = new Date().toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  doc.text(`Fecha de emisión: ${fechaEmision}`, pageWidth - 15, yPos + 5, { align: 'right' })

  yPos += 25

  // ===== TABLA DE TEJIDOS =====
  const tableData = datos.map((item) => [
    item.codigo,
    item.nombre || item.codigo,
    item.categoria || 'Sin categoría',
    item.unidad,
    item.origen || 'Fabricado',
    `$${item.precioEfectivo.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `$${item.precioFactura.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `$${item.precioTarjeta.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    item.estado,
  ])

  autoTable(doc, {
    head: [['Código', 'Nombre/Descripción', 'Categoría', 'Unidad', 'Origen', 'Precio Efectivo', 'Precio Factura/Lista\n(con IVA 21%)', 'Precio Tarjeta\n(con IVA 21%)', 'Estado']],
    body: tableData,
    startY: yPos,
    theme: 'striped',
    headStyles: {
      fillColor: [68, 114, 196], // Azul
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [0, 0, 0],
    },
    // Anchos ajustados para que las 9 columnas entren en A4 apaisado (277 mm útiles)
    columnStyles: {
      0: { cellWidth: 25, halign: 'center' }, // Código
      1: { cellWidth: 45, halign: 'left' }, // Nombre
      2: { cellWidth: 30, halign: 'left' }, // Categoría
      3: { cellWidth: 18, halign: 'center' }, // Unidad
      4: { cellWidth: 32, halign: 'center' }, // Origen
      5: { cellWidth: 30, halign: 'right' }, // Precio Efectivo
      6: { cellWidth: 35, halign: 'right' }, // Precio Factura
      7: { cellWidth: 30, halign: 'right' }, // Precio Tarjeta
      8: { cellWidth: 22, halign: 'center' }, // Estado
    },
    styles: {
      overflow: 'linebreak',
      cellPadding: 2,
    },
    margin: { left: 10, right: 10 },
  })

  // Obtener la posición final después de la tabla
  yPos = (doc as any).lastAutoTable.finalY + 15

  // ===== FOOTER =====
  ensureSpace(20)
  const pageHeight = doc.internal.pageSize.getHeight()
  
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.setFont('helvetica', 'italic')
  doc.text('Los precios están sujetos a cambios sin previo aviso.', pageWidth / 2, pageHeight - 15, { align: 'center' })
  doc.text(`Total de tejidos: ${datos.length}`, pageWidth / 2, pageHeight - 10, { align: 'center' })
  
  // Número de página
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - 15, pageHeight - 10, { align: 'right' })
  }

  // Generar nombre de archivo con timestamp
  const fecha = new Date()
  const fechaStr = fecha.toISOString().split('T')[0].replace(/-/g, '-')
  const horaStr = fecha.toTimeString().split(' ')[0].replace(/:/g, '-').slice(0, 5)
  const nombreCompleto = `${nombreArchivo}_${fechaStr}_${horaStr}.pdf`

  // Descargar archivo
  doc.save(nombreCompleto)
  
  return nombreCompleto
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

/**
 * Genera un PDF con el control de stock de artículos
 * @param datos Array de objetos con los datos de artículos y stock
 * @param nombreArchivo Nombre del archivo (sin extensión)
 */
export function generarPDFListaStock(
  datos: Array<{
    nombre: string
    categoria: string | null
    stock_actual: number
    stock_minimo: number
    unidad: string
  }>,
  nombreArchivo: string = 'Control_Stock'
) {
  const doc = new jsPDF('portrait', 'mm', 'a4') // Vertical para mejor lectura de lista
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  let yPos = 20

  // Helper para verificar espacio
  const ensureSpace = (needed: number = 40) => {
    if (yPos + needed > pageHeight - 30) {
      doc.addPage()
      yPos = 20
      return true
    }
    return false
  }

  // ===== HEADER =====
  try {
    const logo = new Image()
    logo.src = '/logos/logo-color.png'
    doc.addImage(logo, 'PNG', 15, yPos - 10, 40, 20)
  } catch (error) {
    console.warn('No se pudo cargar el logo para el PDF', error)
  }

  // Título
  doc.setFontSize(18)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'bold')
  doc.text('CONTROL DE STOCK', pageWidth / 2, yPos + 12, { align: 'center' })

  // Fecha de emisión
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.setFont('helvetica', 'normal')
  const fechaEmision = new Date().toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  doc.text(`Fecha de control: ${fechaEmision}`, pageWidth - 15, yPos + 5, { align: 'right' })

  yPos += 25

  // Helper para formatear números con unidad
  const formatearStock = (valor: number, unidad: string) => {
    const esEntero = valor % 1 === 0
    return `${valor.toLocaleString('es-AR', { 
      minimumFractionDigits: esEntero ? 0 : 2,
      maximumFractionDigits: 2
    })} ${unidad}`
  }

  // ===== TABLA DE STOCK =====
  const tableData = datos.map((item) => {
    const stockBajo = item.stock_actual <= item.stock_minimo
    
    return [
      item.nombre.substring(0, 45), // Limitar longitud del nombre
      item.categoria || 'Sin categoría',
      formatearStock(item.stock_actual, item.unidad),
      formatearStock(item.stock_minimo, item.unidad),
      stockBajo ? 'BAJO' : 'OK', // Texto sin emojis para mejor compatibilidad PDF
    ]
  })

  autoTable(doc, {
    head: [['Artículo', 'Categoría', 'Stock Actual', 'Stock Mínimo', 'Estado']],
    body: tableData,
    startY: yPos,
    theme: 'striped',
    headStyles: {
      fillColor: [68, 114, 196], // Azul
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [0, 0, 0],
    },
    columnStyles: {
      0: { cellWidth: 75, halign: 'left' }, // Artículo
      1: { cellWidth: 32, halign: 'left' }, // Categoría (reducida 20%: 40 * 0.8 = 32)
      2: { cellWidth: 30, halign: 'right' }, // Stock Actual
      3: { cellWidth: 30, halign: 'right' }, // Stock Mínimo
      4: { cellWidth: 28, halign: 'center' }, // Estado (aumentado para compensar espacio)
    },
    styles: {
      overflow: 'linebreak',
      cellPadding: 3,
    },
    didParseCell: (data: any) => {
      // Resaltar estado con colores y estilos
      if (data.column.index === 4) {
        const textoEstado = Array.isArray(data.cell.text) ? data.cell.text[0] : data.cell.text
        if (textoEstado === 'BAJO') {
          data.cell.styles.textColor = [220, 38, 38] // Rojo para stock bajo
          data.cell.styles.fontStyle = 'bold'
        } else if (textoEstado === 'OK') {
          data.cell.styles.textColor = [34, 139, 34] // Verde para stock OK
          data.cell.styles.fontStyle = 'normal'
        }
      }
    },
    margin: { left: 15, right: 15 },
  })

  // Obtener la posición final después de la tabla
  yPos = (doc as any).lastAutoTable.finalY + 15

  // ===== RESUMEN =====
  ensureSpace(20)
  // Calcular stock bajo reutilizando la lógica de la tabla
  const stockBajoCount = tableData.filter((row: any) => row[4] === 'BAJO').length
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text('RESUMEN:', 15, yPos)
  
  yPos += 7
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Total de artículos: ${datos.length}`, 15, yPos)
  
  yPos += 5
  if (stockBajoCount > 0) {
    doc.setTextColor(220, 38, 38) // Rojo
    doc.setFont('helvetica', 'bold')
    doc.text(`Artículos con stock bajo: ${stockBajoCount}`, 15, yPos)
    doc.setTextColor(0, 0, 0)
  } else {
    doc.setTextColor(34, 139, 34) // Verde
    doc.setFont('helvetica', 'bold')
    doc.text(`Todos los artículos tienen stock suficiente`, 15, yPos)
    doc.setTextColor(0, 0, 0)
  }

  // ===== FOOTER =====
  ensureSpace(25)
  
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.setFont('helvetica', 'italic')
  doc.text('Documento generado para control interno de inventario.', pageWidth / 2, pageHeight - 15, { align: 'center' })
  doc.text('Alambres del Norte SRL', pageWidth / 2, pageHeight - 10, { align: 'center' })
  
  // Número de página
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - 15, pageHeight - 10, { align: 'right' })
  }

  // Generar nombre de archivo con timestamp
  const fecha = new Date()
  const fechaStr = fecha.toISOString().split('T')[0].replace(/-/g, '-')
  const horaStr = fecha.toTimeString().split(' ')[0].replace(/:/g, '-').slice(0, 5)
  const nombreCompleto = `${nombreArchivo}_${fechaStr}_${horaStr}.pdf`

  // Descargar archivo
  doc.save(nombreCompleto)
  
  return nombreCompleto
}
