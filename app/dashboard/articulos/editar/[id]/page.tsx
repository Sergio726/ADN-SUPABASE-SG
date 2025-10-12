'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Trash2 } from 'lucide-react'
import { ImageUpload } from '@/components/ImageUpload'
import { Switch } from '@/components/ui/switch'

export default function EditarArticuloPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)
  const [proveedores, setProveedores] = useState<any[]>([])
  const [articulo, setArticulo] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categoria: '',
    unidad: 'unidad',
    stock_actual: '0',
    stock_minimo: '0',
    proveedor_id: '',
    imagen_url: '',
    publicado: false,
    mostrar_precio_publico: false,
  })

  useEffect(() => {
    const fetchData = async () => {
      // Cargar artículo
      const { data: articuloData } = await supabase
        .from('articulos')
        .select('*')
        .eq('id', params.id)
        .single()

      if (articuloData) {
        setArticulo(articuloData)
        setFormData({
          nombre: articuloData.nombre,
          descripcion: articuloData.descripcion || '',
          categoria: articuloData.categoria || '',
          unidad: articuloData.unidad,
          stock_actual: articuloData.stock_actual.toString(),
          stock_minimo: articuloData.stock_minimo.toString(),
          proveedor_id: articuloData.proveedor_id || '',
          imagen_url: articuloData.imagen_url || '',
          publicado: articuloData.publicado || false,
          mostrar_precio_publico: articuloData.mostrar_precio_publico || false,
        })
      }

      // Cargar proveedores
      const { data: provData } = await supabase
        .from('proveedores')
        .select('*')
        .order('nombre')
      setProveedores(provData || [])
    }
    
    fetchData()
  }, [params.id, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('articulos')
        .update({
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          categoria: formData.categoria,
          unidad: formData.unidad,
          stock_actual: parseFloat(formData.stock_actual),
          stock_minimo: parseFloat(formData.stock_minimo),
          proveedor_id: formData.proveedor_id || null,
          imagen_url: formData.imagen_url || null,
          publicado: formData.publicado,
          mostrar_precio_publico: formData.mostrar_precio_publico,
        })
        .eq('id', params.id)

      if (error) throw error

      alert('Artículo actualizado exitosamente')
      router.push('/dashboard/articulos')
    } catch (error: any) {
      console.error('Error:', error)
      alert('Error al actualizar el artículo: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar este artículo? Esta acción no se puede deshacer.')) {
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('articulos')
        .delete()
        .eq('id', params.id)

      if (error) throw error

      alert('Artículo eliminado exitosamente')
      router.push('/dashboard/articulos')
    } catch (error: any) {
      console.error('Error:', error)
      alert('Error al eliminar el artículo: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!articulo) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Editar Artículo</h2>
          <p className="text-muted-foreground mt-1">
            Modifica los datos del artículo
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
            <CardDescription>Detalles principales del artículo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del artículo *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoría</Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Alambres">Alambres</SelectItem>
                    <SelectItem value="Postes">Postes</SelectItem>
                    <SelectItem value="Tejidos">Tejidos</SelectItem>
                    <SelectItem value="Accesorios">Accesorios</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unidad">Unidad de medida *</Label>
                <Select
                  value={formData.unidad}
                  onValueChange={(value) => setFormData({ ...formData, unidad: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unidad">Unidad</SelectItem>
                    <SelectItem value="rollo">Rollo</SelectItem>
                    <SelectItem value="paquete">Paquete</SelectItem>
                    <SelectItem value="metro">Metro</SelectItem>
                    <SelectItem value="kg">Kilogramo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="proveedor">Proveedor</Label>
                <Select
                  value={formData.proveedor_id || undefined}
                  onValueChange={(value) => setFormData({ ...formData, proveedor_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {proveedores.map((prov) => (
                      <SelectItem key={prov.id} value={prov.id}>
                        {prov.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stock</CardTitle>
            <CardDescription>Control de inventario</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock_actual">Stock actual</Label>
                <Input
                  id="stock_actual"
                  type="number"
                  step="0.01"
                  value={formData.stock_actual}
                  onChange={(e) => setFormData({ ...formData, stock_actual: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock_minimo">Stock mínimo</Label>
                <Input
                  id="stock_minimo"
                  type="number"
                  step="0.01"
                  value={formData.stock_minimo}
                  onChange={(e) => setFormData({ ...formData, stock_minimo: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuración Pública</CardTitle>
            <CardDescription>Imagen y visibilidad en el sitio web</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Upload de imagen */}
            <ImageUpload
              articuloId={params.id}
              currentImageUrl={formData.imagen_url}
              onImageUploaded={(url) => setFormData({ ...formData, imagen_url: url })}
              onImageRemoved={() => setFormData({ ...formData, imagen_url: '' })}
            />

            {/* Switch para publicar */}
            <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
              <div className="space-y-0.5 flex-1">
                <Label htmlFor="publicado" className="text-base cursor-pointer">
                  Publicar en Web
                </Label>
                <p className="text-sm text-muted-foreground">
                  El artículo será visible en la página pública
                </p>
              </div>
              <Switch
                id="publicado"
                checked={formData.publicado}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, publicado: checked })
                }
              />
            </div>

            {/* Switch para mostrar precio */}
            <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
              <div className="space-y-0.5 flex-1">
                <Label htmlFor="mostrar_precio" className="text-base cursor-pointer">
                  Mostrar Precio al Público
                </Label>
                <p className="text-sm text-muted-foreground">
                  El precio de venta será visible en la web pública
                </p>
              </div>
              <Switch
                id="mostrar_precio"
                checked={formData.mostrar_precio_publico}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, mostrar_precio_publico: checked })
                }
                disabled={!formData.publicado}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancelar
            </Button>
          </div>
          
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </Button>
        </div>
      </form>
    </div>
  )
}

