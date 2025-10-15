'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Save, User } from 'lucide-react'
import Link from 'next/link'
import { Textarea } from '@/components/ui/textarea'

export default function NuevoClientePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    tipo_documento: 'DNI',
    numero_documento: '',
    nombre_completo: '',
    razon_social: '',
    email: '',
    telefono: '',
    telefono_alternativo: '',
    direccion: '',
    ciudad: '',
    provincia: 'Salta',
    codigo_postal: '',
    categoria: 'Particular',
    notas: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const clienteData = {
        tipo_documento: formData.tipo_documento,
        numero_documento: formData.numero_documento.replace(/[-\s]/g, ''), // Quitar guiones y espacios
        nombre_completo: formData.nombre_completo,
        razon_social: formData.razon_social || null,
        email: formData.email || null,
        telefono: formData.telefono,
        telefono_alternativo: formData.telefono_alternativo || null,
        direccion: formData.direccion || null,
        ciudad: formData.ciudad || null,
        provincia: formData.provincia || null,
        codigo_postal: formData.codigo_postal || null,
        categoria: formData.categoria,
        notas: formData.notas || null,
        activo: true,
      }

      const { data, error } = await supabase
        .from('clientes')
        .insert(clienteData)
        .select()
        .single()

      if (error) throw error

      toast({
        title: "¡Éxito!",
        description: "Cliente creado correctamente",
      })

      setTimeout(() => {
        router.push('/dashboard/clientes')
      }, 1000)
    } catch (error: any) {
      console.error('Error:', error)
      toast({
        title: "Error al crear cliente",
        description: error.message,
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" asChild>
          <Link href="/dashboard/clientes">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nuevo Cliente</h1>
          <p className="text-muted-foreground">Registrar un nuevo cliente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Datos Fiscales</CardTitle>
            <CardDescription>Información de identificación del cliente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="tipo_doc">Tipo Documento *</Label>
                <Select
                  value={formData.tipo_documento}
                  onValueChange={(value) => setFormData({ ...formData, tipo_documento: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DNI">DNI</SelectItem>
                    <SelectItem value="CUIL">CUIL</SelectItem>
                    <SelectItem value="CUIT">CUIT</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="numero_doc">Número de Documento *</Label>
                <Input
                  id="numero_doc"
                  value={formData.numero_documento}
                  onChange={(e) => setFormData({ ...formData, numero_documento: e.target.value })}
                  placeholder="12345678 o 20-12345678-9"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Puedes incluir guiones, se limpiarán automáticamente
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre Completo *</Label>
              <Input
                id="nombre"
                value={formData.nombre_completo}
                onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                placeholder="Juan Pérez o Empresa SRL"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="razon_social">Razón Social (para empresas)</Label>
              <Input
                id="razon_social"
                value={formData.razon_social}
                onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })}
                placeholder="Empresa SRL"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoría *</Label>
              <Select
                value={formData.categoria}
                onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Particular">Particular</SelectItem>
                  <SelectItem value="Empresa">Empresa</SelectItem>
                  <SelectItem value="Gobierno">Gobierno</SelectItem>
                  <SelectItem value="Revendedor">Revendedor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Datos de Contacto</CardTitle>
            <CardDescription>Información para comunicarse con el cliente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="cliente@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono *</Label>
                <Input
                  id="telefono"
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="+54 387 123-4567"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono_alt">Teléfono Alternativo</Label>
              <Input
                id="telefono_alt"
                type="tel"
                value={formData.telefono_alternativo}
                onChange={(e) => setFormData({ ...formData, telefono_alternativo: e.target.value })}
                placeholder="+54 387 987-6543"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dirección</CardTitle>
            <CardDescription>Ubicación del cliente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección Completa</Label>
              <Input
                id="direccion"
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                placeholder="Av. Principal 123"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="ciudad">Ciudad</Label>
                <Input
                  id="ciudad"
                  value={formData.ciudad}
                  onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                  placeholder="Salta"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="provincia">Provincia</Label>
                <Input
                  id="provincia"
                  value={formData.provincia}
                  onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
                  placeholder="Salta"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cp">Código Postal</Label>
                <Input
                  id="cp"
                  value={formData.codigo_postal}
                  onChange={(e) => setFormData({ ...formData, codigo_postal: e.target.value })}
                  placeholder="4400"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notas Adicionales</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              placeholder="Observaciones sobre el cliente..."
              rows={3}
            />
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Guardando...' : 'Crear Cliente'}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/clientes">Cancelar</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}

