'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { Settings, Mail, TestTube, Save, Eye, EyeOff, Image as ImageIcon } from 'lucide-react'

export default function ConfiguracionesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [configExists, setConfigExists] = useState(false)
  const [configId, setConfigId] = useState<string | null>(null)
  const [portadaUrl, setPortadaUrl] = useState<string>('')
  const [uploadingPortada, setUploadingPortada] = useState(false)

  const [formData, setFormData] = useState({
    smtp_host: '',
    smtp_port: 587,
    smtp_secure: false,
    smtp_usuario: '',
    smtp_password: '',
    email_from: '',
    email_from_name: 'Alambres del Norte',
    email_to: '',
    activo: true,
  })

  useEffect(() => {
    cargarConfiguracion()
  }, [])

  async function cargarConfiguracion() {
    try {
      // Cargar configuración SMTP
      const { data: smtpData, error: smtpError } = await supabase
        .from('configuraciones')
        .select('*')
        .eq('tipo', 'smtp')
        .single()

      if (smtpData) {
        setConfigExists(true)
        setConfigId(smtpData.id)
        setFormData({
          smtp_host: smtpData.smtp_host || '',
          smtp_port: smtpData.smtp_port || 587,
          smtp_secure: smtpData.smtp_secure || false,
          smtp_usuario: smtpData.smtp_usuario || '',
          smtp_password: smtpData.smtp_password || '',
          email_from: smtpData.email_from || '',
          email_from_name: smtpData.email_from_name || 'Alambres del Norte',
          email_to: smtpData.email_to || '',
          activo: smtpData.activo !== false,
        })
      }

      // Cargar configuración de portada
      const { data: portadaData } = await supabase
        .from('configuraciones')
        .select('*')
        .eq('tipo', 'portada_imagen')
        .eq('clave', 'hero_background')
        .single()

      if (portadaData?.valor) {
        setPortadaUrl(portadaData.valor)
      }
    } catch (error) {
      console.error('Error al cargar configuración:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuario no autenticado')

      const configData = {
        tipo: 'smtp',
        clave: 'smtp_principal',
        ...formData,
        usuario_id: user.id,
      }

      let error
      if (configExists && configId) {
        // Actualizar
        const result = await supabase
          .from('configuraciones')
          .update(configData)
          .eq('id', configId)
        error = result.error
      } else {
        // Insertar
        const result = await supabase
          .from('configuraciones')
          .insert([configData])
        error = result.error
      }

      if (error) throw error

      toast({
        title: '✅ Configuración guardada',
        description: 'La configuración SMTP se ha guardado correctamente',
      })

      // Recargar para obtener el ID si es nuevo
      if (!configExists) {
        await cargarConfiguracion()
      }
    } catch (error: any) {
      console.error('Error:', error)
      toast({
        title: '❌ Error',
        description: error.message || 'No se pudo guardar la configuración',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  async function subirImagenPortada(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploadingPortada(true)
      
      if (!event.target.files || event.target.files.length === 0) {
        return
      }

      const file = event.target.files[0]
      
      // Validar tamaño (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Error de tamaño",
          description: "La imagen no debe superar 10MB",
          variant: "destructive",
        })
        return
      }

      // Validar tipo
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Tipo de archivo inválido",
          description: "Solo se permiten imágenes",
          variant: "destructive",
        })
        return
      }

      // Generar nombre único
      const fileExt = file.name.split('.').pop()
      const fileName = `portada-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `portadas/${fileName}`

      // Subir a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('articulos-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        console.error('Error detallado de Storage:', {
          message: uploadError.message,
          name: uploadError.name
        })
        throw uploadError
      }

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('articulos-images')
        .getPublicUrl(filePath)

      // Guardar URL en configuraciones
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuario no autenticado')

      // Guardar URL en configuraciones
      const { error: configError } = await supabase
        .from('configuraciones')
        .upsert({
          tipo: 'portada_imagen',
          clave: 'hero_background',
          valor: publicUrl,
          usuario_id: user.id,
          activo: true
        }, {
          onConflict: 'tipo,clave'
        })

      if (configError) throw configError

      setPortadaUrl(publicUrl)
      
      toast({
        title: "✅ Imagen subida",
        description: "La imagen de portada se actualizó correctamente",
      })
      
    } catch (error: any) {
      console.error('Error al subir la imagen:', error)
      console.error('Detalles del error:', JSON.stringify(error, null, 2))
      console.error('Tipo de error:', typeof error)
      console.error('Stack trace:', error.stack)
      
      let errorMessage = 'No se pudo subir la imagen'
      
      if (error.message) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error.error_description) {
        errorMessage = error.error_description
      } else if (error.msg) {
        errorMessage = error.msg
      }
      
      // Mensajes más específicos según el tipo de error
      if (errorMessage.includes('Bucket') || errorMessage.includes('bucket')) {
        errorMessage = 'El bucket de almacenamiento no existe. Contacta al administrador.'
      } else if (errorMessage.includes('permission') || errorMessage.includes('Policy')) {
        errorMessage = 'No tienes permiso para subir imágenes. Verifica tu autenticación.'
      } else if (errorMessage.includes('413') || errorMessage.includes('too large')) {
        errorMessage = 'La imagen es demasiado grande. Máximo 10MB.'
      }
      
      toast({
        title: "Error al subir imagen",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setUploadingPortada(false)
    }
  }

  async function probarConexion() {
    setTesting(true)

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'test',
          datos: {
            email_prueba: formData.email_to,
          },
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: '✅ ¡Conexión exitosa!',
          description: `Email de prueba enviado a ${formData.email_to}. Revisa tu bandeja de entrada.`,
        })
      } else {
        throw new Error(result.error || 'Error al enviar email de prueba')
      }
    } catch (error: any) {
      console.error('Error:', error)
      toast({
        title: '❌ Error en la conexión',
        description: error.message || 'No se pudo conectar con el servidor SMTP',
        variant: 'destructive',
      })
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Cargando configuración...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-8 h-8 text-brand-red" />
          <h1 className="text-3xl font-bold text-gray-900">Configuraciones del Sistema</h1>
        </div>
        <p className="text-gray-600">Gestiona las configuraciones generales de tu sistema</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader className="bg-gradient-to-r from-brand-red to-brand-darkred text-white">
            <div className="flex items-center gap-3">
              <Mail className="w-6 h-6" />
              <div>
                <CardTitle>Configuración de Email (SMTP)</CardTitle>
                <CardDescription className="text-white/80">
                  Configura tu servidor SMTP para enviar emails desde el sistema
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {/* Estado */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <Label className="text-base font-semibold">Estado del Servicio</Label>
                <p className="text-sm text-gray-600">Activar o desactivar el envío de emails</p>
              </div>
              <Switch
                checked={formData.activo}
                onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Host */}
              <div>
                <Label htmlFor="smtp_host">Host SMTP *</Label>
                <Input
                  id="smtp_host"
                  type="text"
                  placeholder="smtp.tudominio.com"
                  value={formData.smtp_host}
                  onChange={(e) => setFormData({ ...formData, smtp_host: e.target.value })}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Ej: mail.tudominio.com</p>
              </div>

              {/* Puerto */}
              <div>
                <Label htmlFor="smtp_port">Puerto *</Label>
                <Select
                  value={formData.smtp_port.toString()}
                  onValueChange={(value) => {
                    const port = parseInt(value)
                    setFormData({
                      ...formData,
                      smtp_port: port,
                      smtp_secure: port === 465,
                    })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="587">587 (TLS)</SelectItem>
                    <SelectItem value="465">465 (SSL)</SelectItem>
                    <SelectItem value="25">25 (Sin cifrado)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.smtp_port === 587 && 'Recomendado para TLS/STARTTLS'}
                  {formData.smtp_port === 465 && 'Recomendado para SSL'}
                  {formData.smtp_port === 25 && 'No recomendado (sin cifrado)'}
                </p>
              </div>

              {/* Usuario */}
              <div>
                <Label htmlFor="smtp_usuario">Usuario SMTP *</Label>
                <Input
                  id="smtp_usuario"
                  type="text"
                  placeholder="ventas@tudominio.com"
                  value={formData.smtp_usuario}
                  onChange={(e) => setFormData({ ...formData, smtp_usuario: e.target.value })}
                  required
                />
              </div>

              {/* Contraseña */}
              <div>
                <Label htmlFor="smtp_password">Contraseña SMTP *</Label>
                <div className="relative">
                  <Input
                    id="smtp_password"
                    type={mostrarPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.smtp_password}
                    onChange={(e) => setFormData({ ...formData, smtp_password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {mostrarPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Email From */}
              <div>
                <Label htmlFor="email_from">Email Remitente *</Label>
                <Input
                  id="email_from"
                  type="email"
                  placeholder="noreply@tudominio.com"
                  value={formData.email_from}
                  onChange={(e) => setFormData({ ...formData, email_from: e.target.value })}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Desde qué email se enviarán los mensajes</p>
              </div>

              {/* Nombre From */}
              <div>
                <Label htmlFor="email_from_name">Nombre Remitente</Label>
                <Input
                  id="email_from_name"
                  type="text"
                  placeholder="Alambres del Norte"
                  value={formData.email_from_name}
                  onChange={(e) => setFormData({ ...formData, email_from_name: e.target.value })}
                />
              </div>

              {/* Email To */}
              <div className="md:col-span-2">
                <Label htmlFor="email_to">Email Destinatario *</Label>
                <Input
                  id="email_to"
                  type="email"
                  placeholder="ventas@tudominio.com"
                  value={formData.email_to}
                  onChange={(e) => setFormData({ ...formData, email_to: e.target.value })}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  A qué email llegarán las cotizaciones y consultas
                </p>
              </div>
            </div>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                type="submit"
                disabled={saving}
                className="flex-1 bg-brand-red hover:bg-brand-darkred"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Guardando...' : 'Guardar Configuración'}
              </Button>

              {configExists && formData.activo && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={probarConexion}
                  disabled={testing || !formData.email_to}
                  className="flex-1 border-green-600 text-green-600 hover:bg-green-50"
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  {testing ? 'Enviando...' : 'Probar Conexión'}
                </Button>
              )}
            </div>

            {/* Info adicional */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <h4 className="font-semibold text-blue-900 mb-2">💡 Información importante:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• La configuración se guarda de forma segura en la base de datos</li>
                <li>• Usa el botón "Probar Conexión" para verificar que todo funcione</li>
                <li>• El puerto 587 (TLS) es el más recomendado</li>
                <li>• Asegúrate de que tu servidor SMTP permita envíos desde esta aplicación</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Sección de Imagen de Portada */}
      <Card className="mt-6">
        <CardHeader className="bg-gradient-to-r from-brand-red to-brand-darkred text-white">
          <div className="flex items-center gap-3">
            <ImageIcon className="w-6 h-6" />
            <div>
              <CardTitle>Imagen de Portada</CardTitle>
              <CardDescription className="text-white/80">
                Personaliza la imagen de fondo del hero principal
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <Label>Imagen de Fondo del Hero</Label>
              <p className="text-sm text-gray-600 mb-4">
                Sube una imagen que se mostrará como fondo de la sección hero principal
              </p>
            </div>

            {portadaUrl ? (
              <div className="relative w-full max-w-3xl mx-auto">
                <div className="relative w-full aspect-video border rounded-lg overflow-hidden bg-muted">
                  <img
                    src={portadaUrl}
                    alt="Imagen de portada actual"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20"></div>
                </div>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Imagen actual de portada
                </p>
              </div>
            ) : (
              <div className="bg-gray-50 border-2 border-dashed rounded-lg p-8 text-center">
                <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-sm text-gray-600 mb-4">
                  No hay imagen de portada configurada. Se usará el patrón predeterminado.
                </p>
              </div>
            )}

            <div className="flex justify-center">
              <Label
                htmlFor="portada-upload"
                className="cursor-pointer"
              >
                <div className="space-y-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    disabled={uploadingPortada}
                    asChild
                  >
                    <span>
                      <ImageIcon className="mr-2 h-4 w-4" />
                      {uploadingPortada ? 'Subiendo...' : portadaUrl ? 'Cambiar Imagen' : 'Subir Imagen'}
                    </span>
                  </Button>
                  <p className="text-sm text-gray-500">
                    PNG, JPG, WEBP hasta 10MB
                  </p>
                  <p className="text-xs text-gray-400">
                    Recomendado: Imágenes grandes (1920x1080px o superior)
                  </p>
                </div>
              </Label>
              <input
                id="portada-upload"
                type="file"
                accept="image/*"
                onChange={subirImagenPortada}
                disabled={uploadingPortada}
                className="hidden"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

