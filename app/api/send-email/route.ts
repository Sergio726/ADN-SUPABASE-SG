import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tipo, datos } = body

    // Crear cliente de Supabase
    const supabase = createRouteHandlerClient({ cookies })

    // Obtener configuración SMTP activa
    const { data: config, error: configError } = await supabase
      .from('configuraciones')
      .select('*')
      .eq('tipo', 'smtp')
      .eq('activo', true)
      .single()

    if (configError || !config) {
      return NextResponse.json(
        { error: 'No hay configuración SMTP activa' },
        { status: 500 }
      )
    }

    // Configurar transporter de Nodemailer
    const transporter = nodemailer.createTransport({
      host: config.smtp_host,
      port: config.smtp_port,
      secure: config.smtp_secure, // true para SSL, false para TLS
      auth: {
        user: config.smtp_usuario,
        pass: config.smtp_password, // TODO: Descifrar en producción
      },
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
    const info = await transporter.sendMail(mailOptions)

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
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; text-align: center; }
        .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 24px;">📬 Nueva Suscripción</h1>
        </div>
        
        <div class="content">
          <p style="font-size: 18px; margin-top: 0;">Un nuevo contacto se ha suscrito al newsletter:</p>
          
          <div style="padding: 20px; background: white; border-radius: 8px; margin: 20px 0;">
            <p style="font-size: 24px; margin: 0; color: #dc2626; font-weight: bold;">${datos.email}</p>
          </div>
          
          <p style="color: #6b7280; margin-bottom: 0;">Recuerda agregar este email a tu lista de correos para enviar promociones y novedades.</p>
        </div>
        
        <div class="footer">
          <p style="margin: 0;">Alambres del Norte SRL - Sistema de Gestión</p>
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

