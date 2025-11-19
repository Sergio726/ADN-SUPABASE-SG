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
import { ArrowLeft } from 'lucide-react'
import { ImageUpload } from '@/components/ImageUpload'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'

export default function NuevoArticuloPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)
  const [proveedores, setProveedores] = useState<any[]>([])
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categoria: '',
    unidad: 'unidad',
    stock_actual: '0',
    stock_minimo: '0',
    proveedor_id: '',
    precio_costo: '',
    precio_venta: '',
    imagen_url: '',
    publicado: false,
    mostrar_precio_publico: false,
  })

  useEffect(() => {
    const fetchProveedores = async () => {
      const { data } = await supabase.from('proveedores').select('*').order('nombre')
      setProveedores(data || [])
    }
    fetchProveedores()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Crear artículo
      const { data: articulo, error: articuloError } = await supabase
        .from('articulos')
        .insert({
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
        .select()
        .single()

      if (articuloError) throw articuloError

      const costoNumerico = parseFloat(formData.precio_costo)
      const ventaNumerica = parseFloat(formData.precio_venta)
      const tieneCosto = !Number.isNaN(costoNumerico) && Number.isFinite(costoNumerico) && costoNumerico > 0
      const tieneVenta = !Number.isNaN(ventaNumerica) && Number.isFinite(ventaNumerica) && ventaNumerica > 0

      if (tieneCosto || tieneVenta) {
        const costoCalculado = tieneCosto
          ? costoNumerico
          : parseFloat((ventaNumerica / 1.56).toFixed(2))

        const ventaCalculada = tieneVenta
          ? ventaNumerica
          : parseFloat((costoCalculado * 1.56).toFixed(2))

        const { error: precioError } = await supabase
          .from('precios_venta')
          .insert({
            articulo_id: articulo.id,
            precio_costo: costoCalculado,
            precio_venta: ventaCalculada,
            vigente: true,
          })

        if (precioError) throw precioError
      }

      toast({
        title: "¡Éxito!",
        description: "Artículo creado correctamente",
      })
      
      setTimeout(() => {
        router.push('/dashboard/articulos')
      }, 1500)
      
    } catch (error: any) {
      console.error('Error al crear artículo:', error)
      toast({
        title: "Error al crear artículo",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Nuevo Artículo</h2>
          <p className="text-muted-foreground mt-1">
          Agrega un nuevo artículo al catálogo
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
                  placeholder="Ej: Alambre de Púas 2.5mm"
                />
              </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Describe el artículo..."
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
                    <SelectItem value="Construcción">Construcción</SelectItem>
                    <SelectItem value="Servicios">Servicios</SelectItem>
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
                    <SelectItem value="m3">Metros cúbicos (m³)</SelectItem>
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
                placeholder="0"
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
                placeholder="0"
              />
            </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Precios</CardTitle>
            <CardDescription>Costos y precios de venta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="precio_costo">Precio de costo</Label>
              <Input
                  id="precio_costo"
                type="number"
                step="0.01"
                value={formData.precio_costo}
                onChange={(e) => setFormData({ ...formData, precio_costo: e.target.value })}
                placeholder="0.00"
              />
              </div>
              <div className="space-y-2">
                <Label htmlFor="precio_venta">Precio de venta</Label>
              <Input
                  id="precio_venta"
                type="number"
                step="0.01"
                value={formData.precio_venta}
                onChange={(e) => setFormData({ ...formData, precio_venta: e.target.value })}
                placeholder="0.00"
              />
              </div>
            </div>
            {formData.precio_costo && formData.precio_venta && (
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-sm">
                  Margen estimado:{' '}
                  <span className="font-semibold text-primary">
                    {(
                      ((parseFloat(formData.precio_venta) - parseFloat(formData.precio_costo)) /
                        parseFloat(formData.precio_costo)) *
                      100
                    ).toFixed(2)}
                    %
                  </span>
                </p>
              </div>
            )}
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

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Crear Artículo'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  )
}

