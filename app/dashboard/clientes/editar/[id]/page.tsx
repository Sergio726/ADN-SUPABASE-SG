'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'

export default function EditarClientePage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

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
    provincia: '',
    codigo_postal: '',
    categoria: 'Particular',
    notas: '',
    activo: true,
  })

  useEffect(() => {
    cargarCliente()
  }, [params.id])

  async function cargarCliente() {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error

      setFormData({
        tipo_documento: data.tipo_documento,
        numero_documento: data.numero_documento,
        nombre_completo: data.nombre_completo,
        razon_social: data.razon_social || '',
        email: data.email || '',
        telefono: data.telefono || '',
        telefono_alternativo: data.telefono_alternativo || '',
        direccion: data.direccion || '',
        ciudad: data.ciudad || '',
        provincia: data.provincia || '',
        codigo_postal: data.codigo_postal || '',
        categoria: data.categoria,
        notas: data.notas || '',
        activo: data.activo,
      })
    } catch (error: any) {
      console.error('Error:', error)
      toast({
        title: "Error al cargar cliente",
        description: error.message,
        variant: "destructive",
      })
      router.push('/dashboard/clientes')
    } finally {
      setLoadingData(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const clienteData = {
        tipo_documento: formData.tipo_documento,
        numero_documento: formData.numero_documento.replace(/[-\s]/g, ''),
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
        activo: formData.activo,
      }

      const { error } = await supabase
        .from('clientes')
        .update(clienteData)
        .eq('id', params.id)

      if (error) throw error

      toast({
        title: "¡Éxito!",
        description: "Cliente actualizado correctamente",
      })

      setTimeout(() => {
        router.push('/dashboard/clientes')
      }, 1000)
    } catch (error: any) {
      console.error('Error:', error)
      toast({
        title: "Error al actualizar cliente",
        description: error.message,
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  async function handleEliminar() {
    if (!confirm('¿Estás seguro de eliminar este cliente? Los presupuestos asociados NO se eliminarán.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', params.id)

      if (error) throw error

      toast({
        title: "¡Eliminado!",
        description: "Cliente eliminado correctamente",
      })

      setTimeout(() => {
        router.push('/dashboard/clientes')
      }, 1000)
    } catch (error: any) {
      console.error('Error:', error)
      toast({
        title: "Error al eliminar",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
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
          <h1 className="text-3xl font-bold">Editar Cliente</h1>
          <p className="text-muted-foreground">Modificar datos del cliente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Datos Fiscales</CardTitle>
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
                  placeholder="12345678"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre Completo *</Label>
              <Input
                id="nombre"
                value={formData.nombre_completo}
                onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="razon_social">Razón Social</Label>
              <Input
                id="razon_social"
                value={formData.razon_social}
                onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })}
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono *</Label>
                <Input
                  id="telefono"
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
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
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dirección</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección Completa</Label>
              <Input
                id="direccion"
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="ciudad">Ciudad</Label>
                <Input
                  id="ciudad"
                  value={formData.ciudad}
                  onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="provincia">Provincia</Label>
                <Input
                  id="provincia"
                  value={formData.provincia}
                  onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cp">Código Postal</Label>
                <Input
                  id="cp"
                  value={formData.codigo_postal}
                  onChange={(e) => setFormData({ ...formData, codigo_postal: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notas y Estado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notas">Notas</Label>
              <Textarea
                id="notas"
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="activo">Estado del Cliente</Label>
                <p className="text-sm text-muted-foreground">
                  {formData.activo ? 'Cliente activo' : 'Cliente inactivo'}
                </p>
              </div>
              <Switch
                id="activo"
                checked={formData.activo}
                onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2 justify-between">
          <Button
            type="button"
            variant="destructive"
            onClick={handleEliminar}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard/clientes">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

