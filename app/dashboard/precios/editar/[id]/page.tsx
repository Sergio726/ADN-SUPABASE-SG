'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Trash2, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function EditarPrecioPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)
  const [precio, setPrecio] = useState<any>(null)
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    precio_costo: '',
    precio_venta: '',
    vigente: true,
    fecha_inicio: '',
    fecha_fin: '',
  })

  // Helpers de formato
  const fmt = (n: number) => isFinite(n) ? n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00'
  const costoNum = parseFloat(formData.precio_costo) || 0

  // Porcentajes definidos (aplicados sobre costo)
  // Efectivo (sin factura): costo + 56%
  const precioEfectivo = costoNum * 1.56
  // Factura / Lista (incluye IVA): costo + 70%
  const precioFacturaLista = costoNum * 1.70
  // Tarjeta (incluye IVA): costo + 78%
  const precioTarjeta = costoNum * 1.78
  // E-cheq (incluye IVA):
  const precioECheq45 = costoNum * 1.70
  const precioECheq60 = costoNum * 1.78
  const precioECheq90 = costoNum * 1.87

  useEffect(() => {
    const fetchData = async () => {
      const { data: precioData } = await supabase
        .from('precios_venta')
        .select(`
          *,
          articulos(id, nombre, categoria)
        `)
        .eq('id', params.id)
        .single()

      if (precioData) {
        setPrecio(precioData)
        setFormData({
          precio_costo: precioData.precio_costo.toString(),
          // si no tiene precio_venta, completar con factura/lista por defecto
          precio_venta: (precioData.precio_venta || (precioData.precio_costo * 1.70)).toString(),
          vigente: precioData.vigente,
          fecha_inicio: precioData.fecha_inicio || '',
          fecha_fin: precioData.fecha_fin || '',
        })
      }
    }
    
    fetchData()
  }, [params.id, supabase])

  const calcularMargen = () => {
    const costo = parseFloat(formData.precio_costo)
    const venta = parseFloat(formData.precio_venta)
    if (costo > 0 && venta > 0) {
      return (((venta - costo) / costo) * 100).toFixed(2)
    }
    return '0.00'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const costo = parseFloat(formData.precio_costo)
      const ventaIngresada = parseFloat(formData.precio_venta)
      // Precio Factura/Lista por defecto
      const listaPorDefecto = isFinite(costo) ? costo * 1.70 : 0
      const precioVentaFinal = isFinite(ventaIngresada) && ventaIngresada > 0 ? ventaIngresada : listaPorDefecto

      const { error } = await supabase
        .from('precios_venta')
        .update({
          precio_costo: costo,
          precio_venta: precioVentaFinal,
          vigente: formData.vigente,
          fecha_inicio: formData.fecha_inicio || null,
          fecha_fin: formData.fecha_fin || null,
        })
        .eq('id', params.id)

      if (error) throw error

      toast({
        title: "¡Éxito!",
        description: "Precio actualizado correctamente",
      })
      
      setTimeout(() => {
        router.push('/dashboard/precios')
      }, 1500)
      
    } catch (error: any) {
      console.error('Error al actualizar precio:', error)
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
    if (!confirm('¿Estás seguro de eliminar este precio? Esta acción no se puede deshacer.')) {
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('precios_venta')
        .delete()
        .eq('id', params.id)

      if (error) throw error

      toast({
        title: "Precio eliminado",
        description: "El precio se eliminó correctamente",
      })
      
      setTimeout(() => {
        router.push('/dashboard/precios')
      }, 1500)
      
    } catch (error: any) {
      console.error('Error al eliminar precio:', error)
      toast({
        title: "Error al eliminar",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!precio) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const margen = calcularMargen()

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Editar Precio</h2>
          <p className="text-muted-foreground mt-1">
            Artículo: <span className="font-semibold text-primary">{precio.articulos?.nombre}</span>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información del Artículo */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Artículo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Artículo:</span>
                  <p className="font-semibold">{precio.articulos?.nombre}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Categoría:</span>
                  <Badge variant="secondary" className="mt-1">
                    {precio.articulos?.categoria || 'Sin categoría'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Precios */}
        <Card>
          <CardHeader>
            <CardTitle>Precios</CardTitle>
            <CardDescription>Actualiza los precios de costo y venta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="precio_costo">Precio de Costo *</Label>
                <Input
                  id="precio_costo"
                  type="number"
                  step="0.01"
                  value={formData.precio_costo}
                  onChange={(e) => setFormData({ ...formData, precio_costo: e.target.value })}
                  required
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground">Costo del producto (base de cálculo)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="precio_venta">Precio de Venta (opcional)</Label>
                <Input
                  id="precio_venta"
                  type="number"
                  step="0.01"
                  value={formData.precio_venta}
                  onChange={(e) => setFormData({ ...formData, precio_venta: e.target.value })}
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground">Si lo dejas vacío, se toman los valores calculados</p>
              </div>
            </div>

            {/* Desglose de precios según política definida */}
            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Precio Efectivo</p>
                  <p className="text-xs text-muted-foreground">Costo + 56% (sin factura)</p>
                  <div className="text-lg font-semibold">${fmt(precioEfectivo)}</div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium">Precio Factura / Lista</p>
                  <p className="text-xs text-muted-foreground">Costo + 70% (incluye IVA)</p>
                  <div className="text-lg font-semibold">${fmt(precioFacturaLista)}</div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium">Precio Tarjeta</p>
                  <p className="text-xs text-muted-foreground">Costo + 78% (incluye IVA)</p>
                  <div className="text-lg font-semibold">${fmt(precioTarjeta)}</div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium">E‑cheq 45 días</p>
                  <p className="text-xs text-muted-foreground">Costo + 70% (incluye IVA)</p>
                  <div className="text-lg font-semibold">${fmt(precioECheq45)}</div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium">E‑cheq 60 días</p>
                  <p className="text-xs text-muted-foreground">Costo + 78% (incluye IVA)</p>
                  <div className="text-lg font-semibold">${fmt(precioECheq60)}</div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium">E‑cheq 90 días</p>
                  <p className="text-xs text-muted-foreground">Costo + 87% (incluye IVA)</p>
                  <div className="text-lg font-semibold">${fmt(precioECheq90)}</div>
                </div>
              </div>
            </div>

            {/* Margen Calculado */}
            {formData.precio_costo && formData.precio_venta && (
              <div className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border-l-4 border-primary">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Margen de Ganancia</p>
                    <p className="text-3xl font-bold text-primary">{margen}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground mb-1">Ganancia por Unidad</p>
                    <p className="text-2xl font-semibold">
                      ${(parseFloat(formData.precio_venta) - parseFloat(formData.precio_costo)).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  {parseFloat(margen) >= 30 ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="text-sm text-green-700 font-medium">Margen excelente</span>
                    </>
                  ) : parseFloat(margen) >= 15 ? (
                    <>
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                      <span className="text-sm text-yellow-700 font-medium">Margen aceptable</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <span className="text-sm text-red-700 font-medium">Margen bajo - Revisar</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vigencia */}
        <Card>
          <CardHeader>
            <CardTitle>Vigencia del Precio</CardTitle>
            <CardDescription>Controla cuándo es válido este precio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
              <div className="space-y-0.5 flex-1">
                <Label htmlFor="vigente" className="text-base cursor-pointer">
                  Precio Vigente
                </Label>
                <p className="text-sm text-muted-foreground">
                  Si está desactivado, este precio no se mostrará al público
                </p>
              </div>
              <Switch
                id="vigente"
                checked={formData.vigente}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, vigente: checked })
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha_inicio">Fecha de Inicio</Label>
                <Input
                  id="fecha_inicio"
                  type="date"
                  value={formData.fecha_inicio}
                  onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Fecha desde la cual es válido este precio</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fecha_fin">Fecha de Fin (opcional)</Label>
                <Input
                  id="fecha_fin"
                  type="date"
                  value={formData.fecha_fin}
                  onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Dejar vacío si no tiene fecha de vencimiento</p>
              </div>
            </div>

            {formData.fecha_fin && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Precio con fecha de vencimiento</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Este precio dejará de ser vigente el {new Date(formData.fecha_fin).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Botones de acción */}
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
            Eliminar Precio
          </Button>
        </div>
      </form>
    </div>
  )
}
