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
import { useToast } from '@/hooks/use-toast'

export default function EditarArticuloPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
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
    altura_compatible: '',
  })
  
  const [alturasSeleccionadas, setAlturasSeleccionadas] = useState<string[]>([])

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
          altura_compatible: articuloData.altura_compatible || '',
        })
        
        // Pre-cargar alturas seleccionadas (alturas finales del cerco, no del tejido)
        // Alturas finales típicas: 1.3, 1.5, 1.8, 2.3, 2.5, 3.0, 3.5
        const alturasDisponibles = ['1.3', '1.5', '1.8', '2.3', '2.5', '3.0', '3.5']
        if (articuloData.altura_compatible) {
          if (articuloData.altura_compatible === 'todas') {
            setAlturasSeleccionadas(['todas'])
          } else {
            // Filtrar solo las alturas que están disponibles en los checkboxes
            const alturasCargadas = articuloData.altura_compatible.split(',').map((a: string) => a.trim())
            const alturasValidas = alturasCargadas.filter((a: string) => alturasDisponibles.includes(a))
            setAlturasSeleccionadas(alturasValidas)
            // Actualizar formData solo con las alturas válidas
            if (alturasValidas.length > 0) {
              setFormData(prev => ({ ...prev, altura_compatible: alturasValidas.join(',') }))
            }
          }
        }
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
          altura_compatible: formData.altura_compatible || null,
        })
        .eq('id', params.id)

      if (error) throw error

      toast({
        title: "¡Éxito!",
        description: "Artículo actualizado correctamente",
      })
      
      setTimeout(() => {
        router.push('/dashboard/articulos')
      }, 1500)
      
    } catch (error: any) {
      console.error('Error al actualizar artículo:', error)
      toast({
        title: "Error al actualizar",
        description: error.message,
        variant: "destructive",
      })
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

      toast({
        title: "Artículo eliminado",
        description: "El artículo se eliminó correctamente",
      })
      
      setTimeout(() => {
        router.push('/dashboard/articulos')
      }, 1500)
      
    } catch (error: any) {
      console.error('Error al eliminar artículo:', error)
      toast({
        title: "Error al eliminar",
        description: error.message,
        variant: "destructive",
      })
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
                    <SelectItem value="Construcción">Construcción</SelectItem>
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

        {/* Altura Compatible (Opcional) */}
        <Card>
          <CardHeader>
            <CardTitle>Compatibilidad con Cercado (Opcional)</CardTitle>
            <CardDescription>
              Indica para qué alturas finales de cerco es compatible este artículo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label>Alturas Finales de Cerco Compatibles</Label>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="altura_todas"
                    checked={alturasSeleccionadas.includes('todas')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setAlturasSeleccionadas(['todas'])
                        setFormData({ ...formData, altura_compatible: 'todas' })
                      } else {
                        setAlturasSeleccionadas([])
                        setFormData({ ...formData, altura_compatible: '' })
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="altura_todas" className="font-semibold">
                    Todas las alturas
                  </Label>
                </div>

                {!alturasSeleccionadas.includes('todas') && (
                  <div className="grid grid-cols-2 gap-2 ml-6">
                    {[
                      { valor: '1.3', label: '1.3m (altura final)' },
                      { valor: '1.5', label: '1.5m (altura final)' },
                      { valor: '1.8', label: '1.8m (altura final)' },
                      { valor: '2.3', label: '2.3m (altura final)' },
                      { valor: '2.5', label: '2.5m (altura final)' },
                      { valor: '3.0', label: '3.0m (altura final)' },
                      { valor: '3.5', label: '3.5m (altura final)' }
                    ].map(({ valor, label }) => (
                      <div key={valor} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`altura_${valor}`}
                          checked={alturasSeleccionadas.includes(valor)}
                          onChange={(e) => {
                            let nuevas = [...alturasSeleccionadas]
                            if (e.target.checked) {
                              nuevas.push(valor)
                            } else {
                              nuevas = nuevas.filter(a => a !== valor)
                            }
                            setAlturasSeleccionadas(nuevas)
                            setFormData({ 
                              ...formData, 
                              altura_compatible: nuevas.length > 0 ? nuevas.join(',') : '' 
                            })
                          }}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label htmlFor={`altura_${valor}`}>
                          {label}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {alturasSeleccionadas.length > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <span className="font-semibold">Compatible con:</span>{' '}
                    {alturasSeleccionadas.includes('todas') 
                      ? 'Todas las alturas finales de cerco'
                      : alturasSeleccionadas.map(a => `${a}m (altura final)`).join(', ')
                    }
                  </p>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                💡 <strong>Importante:</strong> Estas alturas se refieren a la <strong>altura final del cerco</strong> (no a la altura del tejido).
                La altura final = altura poste - 40cm enterrado + cordón + tejido + púas.
                Si no seleccionas ninguna altura, el artículo será compatible con todas las alturas finales.
              </p>
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

