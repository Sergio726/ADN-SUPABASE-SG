import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { createServerClient } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tipo, datos } = body

    console.log('📧 Recibida solicitud de email:', { tipo, datos })

    // Crear cliente de Supabase del servidor
    const supabase = createServerClient()

    // Obtener configuración SMTP activa
    let { data: config, error: configError } = await supabase
      .from('configuraciones')
      .select('*')
      .eq('tipo', 'smtp')
      .eq('activo', true)
      .single()

    console.log('🔧 Configuración SMTP:', { config: config ? 'encontrada' : 'no encontrada', error: configError })

    if (configError || !config) {
      console.error('❌ Error de configuración SMTP:', configError)
      
      // Intentar obtener cualquier configuración SMTP (sin filtro de activo)
      console.log('🔄 Intentando obtener cualquier configuración SMTP...')
      const { data: anyConfig, error: anyError } = await supabase
        .from('configuraciones')
        .select('*')
        .eq('tipo', 'smtp')
        .limit(1)
        .single()
      
      console.log('🔧 Configuración SMTP (cualquiera):', { config: anyConfig ? 'encontrada' : 'no encontrada', error: anyError })
      
      if (anyError || !anyConfig) {
        console.log('🔄 Usando configuración SMTP desde variables de entorno...')
        
        // Usar configuración desde variables de entorno como fallback
        const envConfig = {
          smtp_host: process.env.SMTP_HOST,
          smtp_port: parseInt(process.env.SMTP_PORT || '587'),
          smtp_secure: process.env.SMTP_SECURE === 'true',
          smtp_usuario: process.env.SMTP_USUARIO,
          smtp_password: process.env.SMTP_PASSWORD,
          email_from: process.env.EMAIL_FROM,
          email_from_name: process.env.EMAIL_FROM_NAME || 'Alambres del Norte',
          email_to: process.env.EMAIL_TO,
        }
        
        // Verificar que tenemos los campos mínimos necesarios
        if (!envConfig.smtp_host || !envConfig.smtp_usuario || !envConfig.smtp_password || !envConfig.email_from || !envConfig.email_to) {
          console.log('⚠️ Variables de entorno SMTP no configuradas, usando configuración de prueba...')
          
          // Configuración de prueba temporal (Gmail)
          config = {
            smtp_host: 'smtp.gmail.com',
            smtp_port: 587,
            smtp_secure: false,
            smtp_usuario: 'garciasergio@live.com.ar', // Usar tu email
            smtp_password: 'tu-contraseña-de-aplicacion', // Necesitas generar una contraseña de aplicación
            email_from: 'garciasergio@live.com.ar',
            email_from_name: 'Alambres del Norte',
            email_to: 'garciasergio@live.com.ar', // Email donde quieres recibir las notificaciones
          }
          
          console.log('✅ Usando configuración SMTP de prueba (Gmail)')
          console.log('⚠️ IMPORTANTE: Necesitas configurar una contraseña de aplicación de Gmail')
        } else {
          config = envConfig
          console.log('✅ Usando configuración SMTP desde variables de entorno')
        }
      } else {
        // Usar la configuración encontrada aunque no esté marcada como activa
        config = anyConfig
        console.log('✅ Usando configuración SMTP encontrada:', config.id)
      }
    }

    // Configurar transporter de Nodemailer con mejores configuraciones para evitar spam
    const transporter = nodemailer.createTransport({
      host: config.smtp_host,
      port: config.smtp_port,
      secure: config.smtp_secure, // true para SSL, false para TLS
      auth: {
        user: config.smtp_usuario,
        pass: config.smtp_password, // TODO: Descifrar en producción
      },
      // Configuraciones adicionales para mejorar la delimitación
      tls: {
        rejectUnauthorized: false // Solo si usas certificados auto-firmados
      },
      // Mejora la autenticación
      requireTLS: true,
      // Pool de conexiones para mejor rendimiento
      pool: true,
    })

    let mailOptions: any = {}

    // Generar contenido según el tipo de email
    switch (tipo) {
      case 'contacto':
        mailOptions = {
          from: `"${config.email_from_name}" <${config.email_from}>`,
          to: config.email_to,
          subject: `Nueva Solicitud de Cotización - ${datos.nombre}`,
          html: generarHTMLContacto(datos),
        }
        break

      case 'newsletter':
        mailOptions = {
          from: `"${config.email_from_name}" <${config.email_from}>`,
          to: config.email_to,
          subject: 'Nueva Suscripción al Newsletter',
          html: generarHTMLNewsletter(datos),
        }
        break

      case 'suscripcion_usuario':
        mailOptions = {
          from: `"${config.email_from_name}" <${config.email_from}>`,
          to: datos.email,
          subject: '¡Gracias por suscribirte! - Alambres del Norte',
          html: generarHTMLSuscripcionUsuario(datos),
          // Encabezados para mejorar la delimitación y evitar spam
          headers: {
            'X-Priority': '1',
            'X-MSMail-Priority': 'High',
            'Importance': 'high',
            'List-Unsubscribe': `<mailto:${config.email_from}?subject=unsubscribe>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
          // Texto alternativo para clientes sin HTML
          text: generarTextoSuscripcionUsuario(datos),
        }
        break

      case 'test':
        mailOptions = {
          from: `"${config.email_from_name}" <${config.email_from}>`,
          to: datos.email_prueba,
          subject: 'Prueba de Configuración SMTP - Alambres del Norte',
          html: generarHTMLPrueba(),
        }
        break

      default:
        return NextResponse.json(
          { error: 'Tipo de email no válido' },
          { status: 400 }
        )
    }

    // Enviar email
    console.log('📤 Enviando email:', { 
      from: mailOptions.from, 
      to: mailOptions.to, 
      subject: mailOptions.subject 
    })
    
    const info = await transporter.sendMail(mailOptions)
    
    console.log('✅ Email enviado exitosamente:', info.messageId)

    return NextResponse.json({
      success: true,
      message: 'Email enviado correctamente',
      messageId: info.messageId,
    })
  } catch (error: any) {
    console.error('Error al enviar email:', error)
    return NextResponse.json(
      { error: 'Error al enviar el email', details: error.message },
      { status: 500 }
    )
  }
}

// =====================================================
// TEMPLATES DE EMAIL
// =====================================================

function generarHTMLContacto(datos: any) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .field { margin-bottom: 20px; padding: 15px; background: white; border-left: 4px solid #dc2626; border-radius: 4px; }
        .label { font-weight: bold; color: #dc2626; margin-bottom: 5px; }
        .value { color: #4b5563; }
        .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 24px;">🎯 Nueva Solicitud de Cotización</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Alambres del Norte SRL</p>
        </div>
        
        <div class="content">
          <p style="font-size: 16px; margin-top: 0;">Has recibido una nueva solicitud de cotización:</p>
          
          <div class="field">
            <div class="label">👤 Nombre:</div>
            <div class="value">${datos.nombre}</div>
          </div>
          
          <div class="field">
            <div class="label">📧 Email:</div>
            <div class="value"><a href="mailto:${datos.email}" style="color: #dc2626;">${datos.email}</a></div>
          </div>
          
          ${datos.telefono ? `
          <div class="field">
            <div class="label">📱 Teléfono:</div>
            <div class="value"><a href="tel:${datos.telefono}" style="color: #dc2626;">${datos.telefono}</a></div>
          </div>
          ` : ''}
          
          ${datos.empresa ? `
          <div class="field">
            <div class="label">🏢 Empresa:</div>
            <div class="value">${datos.empresa}</div>
          </div>
          ` : ''}
          
          ${datos.tipoCliente ? `
          <div class="field">
            <div class="label">🎯 Tipo de Cliente:</div>
            <div class="value">${datos.tipoCliente === 'empresa' ? '🏢 Empresa' : '🏠 Particular'}</div>
          </div>
          ` : ''}
          
          <div class="field">
            <div class="label">💬 Mensaje:</div>
            <div class="value" style="white-space: pre-wrap;">${datos.mensaje}</div>
          </div>
          
          <div style="margin-top: 30px; padding: 15px; background: #fef2f2; border-radius: 8px; text-align: center;">
            <p style="margin: 0; color: #991b1b; font-weight: bold;">⏰ Responde rápido para no perder la venta</p>
          </div>
        </div>
        
        <div class="footer">
          <p style="margin: 0 0 10px 0;">Este email fue enviado automáticamente desde tu sitio web</p>
          <p style="margin: 0;">Alambres del Norte SRL - Sistema de Gestión</p>
        </div>
      </div>
    </body>
    </html>
  `
}

function generarHTMLNewsletter(datos: any) {
  const tieneDescuento = datos.descuento_porcentaje > 0
  const fechaSuscripcion = datos.fecha_suscripcion || new Date().toLocaleString('es-AR')
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #dc2626; }
        .descuento-box { background: #fef2f2; border: 2px solid #fecaca; padding: 20px; border-radius: 8px; margin: 15px 0; text-align: center; }
        .field { margin: 10px 0; }
        .label { font-weight: bold; color: #374151; }
        .value { color: #6b7280; margin-top: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 24px;">📬 Nueva Suscripción al Newsletter</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">${fechaSuscripcion}</p>
        </div>
        
        <div class="content">
          <div class="info-box">
            <h3 style="margin-top: 0; color: #dc2626;">📧 Datos del Suscriptor</h3>
            
            <div class="field">
              <div class="label">Email:</div>
              <div class="value">
                <a href="mailto:${datos.email}" style="color: #dc2626; text-decoration: none;">${datos.email}</a>
              </div>
            </div>
            
            ${datos.telefono ? `
            <div class="field">
              <div class="label">📱 Teléfono:</div>
              <div class="value">
                <a href="tel:${datos.telefono}" style="color: #dc2626; text-decoration: none;">${datos.telefono}</a>
              </div>
            </div>
            ` : ''}
            
            <div class="field">
              <div class="label">🎯 Tipo de Suscripción:</div>
              <div class="value">${datos.tipo_suscripcion === 'telefono' ? '📱 Email + Teléfono' : '📧 Solo Email'}</div>
            </div>
          </div>
          
          ${tieneDescuento ? `
          <div class="descuento-box">
            <h3 style="margin-top: 0; color: #dc2626;">🎁 ¡Descuento Aplicado!</h3>
            <p style="font-size: 18px; margin: 10px 0; color: #dc2626; font-weight: bold;">
              ${datos.descuento_porcentaje}% de descuento
            </p>
            <p style="margin: 10px 0; color: #374151;">
              <strong>Código:</strong> <span style="background: #fecaca; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${datos.codigo_descuento}</span>
            </p>
            <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">
              Este cliente recibió un descuento por proporcionar su teléfono
            </p>
          </div>
          ` : ''}
          
          <div style="background: #e0f2fe; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #0277bd; font-weight: bold;">
              ⚡ ¡Contacta rápido para no perder la venta!
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px;">
            <p style="color: #6b7280; margin-bottom: 0;">
              Este suscriptor aparecerá en tu dashboard de leads para seguimiento
            </p>
          </div>
        </div>
        
        <div class="footer">
          <p style="margin: 0;">Alambres del Norte SRL - Sistema de Gestión</p>
          <p style="margin: 5px 0 0 0;">Email enviado automáticamente desde tu sitio web</p>
        </div>
      </div>
    </body>
    </html>
  `
}

function generarTextoSuscripcionUsuario(datos: any) {
  const tieneDescuento = datos.descuento_porcentaje > 0
  const fechaSuscripcion = datos.fecha_suscripcion || new Date().toLocaleString('es-AR')
  
  let texto = `
¡GRACIAS POR SUSCRIBIRTE!

Hola,

¡Gracias por suscribirte a nuestro newsletter de Alambres del Norte SRL!

A partir de ahora recibirás:
- Promociones exclusivas antes que nadie
- Nuevos productos y catálogos
- Ofertas especiales solo para suscriptores
- Noticias del sector y consejos técnicos
`

  if (tieneDescuento) {
    texto += `

🎁 BONUS ESPECIAL:
¡Has recibido un ${datos.descuento_porcentaje}% de descuento en tu primera compra!

Tu código de descuento es: ${datos.codigo_descuento}

¿Cómo usar tu descuento?
Simplemente menciona este código cuando hagas tu pedido por teléfono o WhatsApp.

Teléfono: +54 387 465-2420
WhatsApp: +54 387 465-2420
`
  }

  texto += `

📞 ¿Necesitas ayuda?
Nuestro equipo está listo para ayudarte con cualquier consulta sobre nuestros productos.

Email: garciasergio@live.com.ar
Teléfono: +54 387 465-2420
WhatsApp: https://wa.me/543874652420

Gracias por confiar en Alambres del Norte SRL
Calidad, confianza y servicio desde 1995

---
Sistema de Gestión - ${fechaSuscripcion}
`
  
  return texto
}

function generarHTMLSuscripcionUsuario(datos: any) {
  const tieneDescuento = datos.descuento_porcentaje > 0
  const fechaSuscripcion = datos.fecha_suscripcion || new Date().toLocaleString('es-AR')
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
        .descuento-box { background: #fef2f2; border: 2px solid #fecaca; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .codigo-box { background: #fecaca; padding: 15px; border-radius: 8px; margin: 15px 0; text-align: center; }
        .contacto-box { background: #e0f2fe; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .btn { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">🎉 ¡Gracias por Suscribirte!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">Alambres del Norte SRL</p>
        </div>
        
        <div class="content">
          <h2 style="color: #dc2626; margin-top: 0;">¡Bienvenido a nuestra comunidad!</h2>
          
          <p style="font-size: 16px; margin-bottom: 20px;">
            Hola,<br><br>
            ¡Gracias por suscribirte a nuestro newsletter! Estamos muy contentos de tenerte en nuestra comunidad.
          </p>
          
          <p style="font-size: 16px;">
            A partir de ahora recibirás:
          </p>
          
          <ul style="font-size: 16px; padding-left: 20px;">
            <li>📧 <strong>Promociones exclusivas</strong> antes que nadie</li>
            <li>🆕 <strong>Nuevos productos</strong> y catálogos</li>
            <li>💰 <strong>Ofertas especiales</strong> solo para suscriptores</li>
            <li>📰 <strong>Noticias del sector</strong> y consejos técnicos</li>
          </ul>
          
          ${tieneDescuento ? `
          <div class="descuento-box">
            <h3 style="margin-top: 0; color: #dc2626; font-size: 24px;">🎁 ¡BONUS ESPECIAL!</h3>
            <p style="font-size: 20px; margin: 10px 0; color: #dc2626; font-weight: bold;">
              ${datos.descuento_porcentaje}% de descuento en tu primera compra
            </p>
            
            <div class="codigo-box">
              <p style="margin: 0; font-size: 18px; font-weight: bold; color: #991b1b;">
                Tu código de descuento:
              </p>
              <p style="margin: 10px 0 0 0; font-size: 24px; font-family: monospace; background: white; padding: 10px; border-radius: 4px; color: #dc2626;">
                ${datos.codigo_descuento}
              </p>
            </div>
            
            <p style="margin: 15px 0 0 0; color: #6b7280; font-size: 14px;">
              💡 <strong>¿Cómo usar tu descuento?</strong><br>
              Simplemente menciona este código cuando hagas tu pedido por teléfono o WhatsApp.
            </p>
          </div>
          ` : ''}
          
          <div class="contacto-box">
            <h3 style="margin-top: 0; color: #0277bd;">📞 ¿Necesitas ayuda?</h3>
            <p style="margin: 10px 0; font-size: 16px;">
              Nuestro equipo está listo para ayudarte con cualquier consulta sobre nuestros productos.
            </p>
            
            <div style="text-align: center; margin: 20px 0;">
              <a href="tel:+543874652420" class="btn">📞 Llamar Ahora</a>
              <a href="https://wa.me/543874652420" class="btn" style="background: #25d366;">💬 WhatsApp</a>
            </div>
            
            <p style="margin: 15px 0 0 0; color: #6b7280; font-size: 14px; text-align: center;">
              📧 Email: <a href="mailto:garciasergio@live.com.ar" style="color: #0277bd;">garciasergio@live.com.ar</a>
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              Gracias por confiar en Alambres del Norte SRL<br>
              <strong>Calidad, confianza y servicio desde 1995</strong>
            </p>
          </div>
        </div>
        
        <div class="footer">
          <p style="margin: 0;">Alambres del Norte SRL</p>
          <p style="margin: 5px 0 0 0;">Sistema de Gestión - ${fechaSuscripcion}</p>
          <p style="margin: 5px 0 0 0;">
            <a href="#" style="color: #9ca3af; text-decoration: underline;">Cancelar suscripción</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

function generarHTMLPrueba() {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; text-align: center; }
        .success { background: #d1fae5; color: #065f46; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 32px;">✅ ¡Configuración Exitosa!</h1>
        </div>
        
        <div class="content">
          <div class="success">
            <p style="font-size: 20px; margin: 0; font-weight: bold;">🎉 Tu configuración SMTP funciona correctamente</p>
          </div>
          
          <p style="font-size: 16px;">Este es un email de prueba del sistema de Alambres del Norte SRL.</p>
          
          <p style="color: #6b7280;">Si recibiste este email, significa que la configuración de tu servidor SMTP está funcionando perfectamente y ya puedes recibir cotizaciones de tu sitio web.</p>
          
          <div style="margin-top: 30px; padding: 20px; background: white; border-radius: 8px;">
            <p style="margin: 0; color: #059669; font-weight: bold;">✓ Servidor conectado</p>
            <p style="margin: 5px 0 0 0; color: #059669; font-weight: bold;">✓ Autenticación exitosa</p>
            <p style="margin: 5px 0 0 0; color: #059669; font-weight: bold;">✓ Email enviado correctamente</p>
          </div>
        </div>
        
        <div class="footer">
          <p style="margin: 0;">Alambres del Norte SRL - Sistema de Gestión</p>
        </div>
      </div>
    </body>
    </html>
  `
}

