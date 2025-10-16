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
import { ArrowLeft, Save, Calculator, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'

export default function EditarTejidoPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [alambres, setAlambres] = useState<any[]>([])
  const [precioCalculado, setPrecioCalculado] = useState({ costo: 0, venta: 0 })

  const [formData, setFormData] = useState({
    calibre: '',
    altura: '',
    tamano_rombo: '',
    peso_kg: '',
    mano_obra: '',
    horas_fabricacion: '',
    alambre_articulo_id: '',
    margen_porcentaje: '30.00',
    descripcion: '',
    activo: true,
  })

  useEffect(() => {
    cargarAlambres()
    cargarTejido()
  }, [params.id])

  useEffect(() => {
    calcularPrecio()
  }, [formData.peso_kg, formData.mano_obra, formData.margen_porcentaje, formData.alambre_articulo_id])

  async function cargarAlambres() {
    const { data, error } = await supabase
      .from('articulos')
      .select('id, nombre')
      .in('id', [7, 8])
      .order('id')

    if (error) {
      console.error('Error al cargar alambres:', error)
    } else {
      console.log('Alambres cargados:', data)
      setAlambres(data || [])
    }
  }

  async function cargarTejido() {
    try {
      const { data, error } = await supabase
        .from('tejidos_configuraciones')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) {
        console.error('Error:', error)
        toast({
          title: "Error al cargar tejido",
          description: error.message,
          variant: "destructive",
        })
        router.push('/dashboard/tejidos')
        return
      }

      console.log('Tejido cargado:', data)
      
      setFormData({
        calibre: data.calibre.toString(),
        altura: parseFloat(data.altura).toFixed(2),
        tamano_rombo: data.tamano_rombo.toString(),
        peso_kg: (data.cantidad_alambre || data.peso_kg).toString(),
        mano_obra: (data.costo_mano_obra || data.mano_obra).toString(),
        horas_fabricacion: data.horas_fabricacion?.toString() || '',
        alambre_articulo_id: data.alambre_articulo_id?.toString() || '',
        margen_porcentaje: (data.margen_efectivo || data.margen_porcentaje)?.toString() || '45.00',
        descripcion: data.descripcion || '',
        activo: data.activo,
      })
      
      console.log('FormData después de cargar:', {
        ...formData,
        alambre_articulo_id: data.alambre_articulo_id?.toString()
      })
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoadingData(false)
    }
  }

  async function calcularPrecio() {
    if (!formData.peso_kg || !formData.mano_obra || !formData.alambre_articulo_id) {
      setPrecioCalculado({ costo: 0, venta: 0 })
      return
    }

    try {
      const { data: precios } = await supabase
        .from('precios_venta')
        .select('precio_costo')
        .eq('articulo_id', formData.alambre_articulo_id)
        .eq('vigente', true)
        .single()

      if (precios) {
        const pesoKg = parseFloat(formData.peso_kg) || 0
        const manoObra = parseFloat(formData.mano_obra) || 0
        const margen = parseFloat(formData.margen_porcentaje) || 30

        const costo = (pesoKg * precios.precio_costo) + manoObra
        const venta = costo * (1 + (margen / 100))

        setPrecioCalculado({ costo, venta })
      }
    } catch (error) {
      console.error('Error al calcular precio:', error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const codigo = `RC${formData.calibre}x${formData.tamano_rombo}x${formData.altura}`
      const nombre = `Tejido Romboidal Cal.${formData.calibre} - ${formData.altura}m - Rombo ${formData.tamano_rombo}"`

      const rombo = parseFloat(formData.tamano_rombo)
      let categoria_calidad = 'Standard'
      if (rombo === 3.5) categoria_calidad = 'Económica'
      else if (rombo >= 2.5 && rombo < 3) categoria_calidad = 'Reforzada'

      const tejidoData = {
        codigo,
        nombre,
        descripcion: formData.descripcion || nombre,
        calibre: parseInt(formData.calibre),
        altura: parseFloat(formData.altura),
        tamano_rombo: parseFloat(formData.tamano_rombo),
        cantidad_alambre: parseFloat(formData.peso_kg),
        costo_mano_obra: parseFloat(formData.mano_obra),
        horas_fabricacion: formData.horas_fabricacion ? parseFloat(formData.horas_fabricacion) : null,
        alambre_articulo_id: parseInt(formData.alambre_articulo_id),
        margen_efectivo: parseFloat(formData.margen_porcentaje),
        categoria_calidad,
        activo: formData.activo,
      }

      const { error } = await supabase
        .from('tejidos_configuraciones')
        .update(tejidoData)
        .eq('id', params.id)

      if (error) throw error

      toast({
        title: "¡Éxito!",
        description: "Tejido actualizado correctamente",
      })

      setTimeout(() => {
        router.push('/dashboard/tejidos')
      }, 1000)
    } catch (error: any) {
      console.error('Error:', error)
      toast({
        title: "Error al actualizar tejido",
        description: error.message,
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  async function handleEliminar() {
    if (!confirm('¿Estás seguro de eliminar este tejido? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('tejidos_configuraciones')
        .delete()
        .eq('id', params.id)

      if (error) throw error

      toast({
        title: "¡Eliminado!",
        description: "Tejido eliminado correctamente",
      })

      setTimeout(() => {
        router.push('/dashboard/tejidos')
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
          <Link href="/dashboard/tejidos">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Editar Tejido Romboidal</h1>
          <p className="text-muted-foreground">Modificar configuración existente</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Especificaciones Técnicas</CardTitle>
                <CardDescription>
                  Define las características del tejido romboidal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="calibre">Calibre *</Label>
                    <Select
                      value={formData.calibre}
                      onValueChange={(value) => setFormData({ ...formData, calibre: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12">Calibre 12</SelectItem>
                        <SelectItem value="14">Calibre 14</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="altura">Altura (metros) *</Label>
                    <Select
                      value={formData.altura}
                      onValueChange={(value) => setFormData({ ...formData, altura: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1.00">1.0 m</SelectItem>
                        <SelectItem value="1.20">1.2 m</SelectItem>
                        <SelectItem value="1.50">1.5 m</SelectItem>
                        <SelectItem value="1.80">1.8 m</SelectItem>
                        <SelectItem value="2.00">2.0 m</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tamano_rombo">Tamaño Rombo (pulgadas) *</Label>
                    <Select
                      value={formData.tamano_rombo}
                      onValueChange={(value) => setFormData({ ...formData, tamano_rombo: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2.0">2.0"</SelectItem>
                        <SelectItem value="2.5">2.5"</SelectItem>
                        <SelectItem value="3.0">3.0"</SelectItem>
                        <SelectItem value="3.5">3.5"</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Código generado:</p>
                  <p className="text-lg font-mono font-bold">
                    RC{formData.calibre}x{formData.tamano_rombo}x{formData.altura}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción (opcional)</Label>
                  <Textarea
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Descripción adicional del tejido"
                    rows={2}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="activo">Estado del Tejido</Label>
                    <p className="text-sm text-muted-foreground">
                      {formData.activo ? 'Disponible para usar' : 'Desactivado'}
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

            <Card>
              <CardHeader>
                <CardTitle>Fabricación y Costos</CardTitle>
                <CardDescription>
                  Especifica los materiales y costos de fabricación
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="peso_kg">Peso Alambre (kg) *</Label>
                    <Input
                      id="peso_kg"
                      type="number"
                      step="0.01"
                      value={formData.peso_kg}
                      onChange={(e) => setFormData({ ...formData, peso_kg: e.target.value })}
                      placeholder="12.00"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Kilogramos de alambre galvanizado necesarios
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mano_obra">Mano de Obra ($) *</Label>
                    <Input
                      id="mano_obra"
                      type="number"
                      step="0.01"
                      value={formData.mano_obra}
                      onChange={(e) => setFormData({ ...formData, mano_obra: e.target.value })}
                      placeholder="7600.00"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Costo fijo de mano de obra de fabricación
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="alambre">Alambre Galvanizado *</Label>
                    <Select
                      value={formData.alambre_articulo_id}
                      onValueChange={(value) => setFormData({ ...formData, alambre_articulo_id: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar alambre" />
                      </SelectTrigger>
                      <SelectContent>
                        {alambres.map((alambre) => (
                          <SelectItem key={alambre.id} value={alambre.id.toString()}>
                            {alambre.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="horas">Horas de Fabricación (opcional)</Label>
                    <Input
                      id="horas"
                      type="number"
                      step="0.5"
                      value={formData.horas_fabricacion}
                      onChange={(e) => setFormData({ ...formData, horas_fabricacion: e.target.value })}
                      placeholder="4.0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="margen">Margen de Ganancia (%)</Label>
                  <Input
                    id="margen"
                    type="number"
                    step="0.01"
                    value={formData.margen_porcentaje}
                    onChange={(e) => setFormData({ ...formData, margen_porcentaje: e.target.value })}
                    placeholder="30.00"
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
                  <Link href="/dashboard/tejidos">Cancelar</Link>
                </Button>
                <Button type="submit" disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </div>
          </form>
        </div>

        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Preview de Precios
              </CardTitle>
              <CardDescription>
                Cálculo automático basado en los datos ingresados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Código:</span>
                  <span className="font-mono font-semibold">
                    RC{formData.calibre}x{formData.tamano_rombo}x{formData.altura}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Peso:</span>
                  <span className="font-medium">{formData.peso_kg || '0'} kg</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Mano de obra:</span>
                  <span className="font-medium">${parseFloat(formData.mano_obra || '0').toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Margen:</span>
                  <span className="font-medium">{formData.margen_porcentaje || '30'}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Estado:</span>
                  <Badge variant={formData.activo ? 'default' : 'outline'}>
                    {formData.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Precio Costo:</span>
                  <span className="text-xl font-bold text-orange-600">
                    ${precioCalculado.costo.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Precio Venta:</span>
                  <span className="text-2xl font-bold text-green-600">
                    ${precioCalculado.venta.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="bg-muted p-3 rounded-lg text-xs text-muted-foreground">
                <p className="font-medium mb-1">Fórmula:</p>
                <p>Costo = (Peso × Precio Alambre) + Mano de Obra</p>
                <p>Venta = Costo × (1 + Margen/100)</p>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs">
                <p className="font-semibold text-amber-900 mb-1">⚠️ Nota Importante:</p>
                <p className="text-amber-800">
                  Al guardar, los precios se recalcularán automáticamente usando el precio actual del alambre galvanizado.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

