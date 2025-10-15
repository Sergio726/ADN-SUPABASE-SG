'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Save, Plus, Trash2, Package, DollarSign, FileText } from 'lucide-react'
import Link from 'next/link'
import { Textarea } from '@/components/ui/textarea'
import { ProductoCombobox } from '@/components/ProductoCombobox'

interface PresupuestoItem {
  id: string
  tipo: 'articulo' | 'tejido'
  articulo_id?: number
  tejido_id?: string
  descripcion: string
  cantidad: string
  unidad: string
  precio_unitario: string
  precio_total: number
}

export default function NuevoPresupuestoArticulosPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [articulos, setArticulos] = useState<any[]>([])
  const [tejidos, setTejidos] = useState<any[]>([])
  const [userId, setUserId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    cliente_nombre: '',
    cliente_email: '',
    cliente_telefono: '',
    cliente_direccion: '',
    descuento: '0',
    validez_dias: '15',
    observaciones: '',
    condiciones_comerciales: 'Pago: Contado o transferencia\nGarantía: 12 meses\nInstalación no incluida',
  })

  const [items, setItems] = useState<PresupuestoItem[]>([])

  useEffect(() => {
    cargarUsuario()
    cargarArticulos()
    cargarTejidos()
  }, [])

  async function cargarUsuario() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserId(user.id)
    }
  }

  async function cargarArticulos() {
    const { data } = await supabase
      .from('articulos')
      .select('id, nombre, unidad')
      .eq('publicado', true)
      .order('nombre')

    setArticulos(data || [])
  }

  async function cargarTejidos() {
    const { data } = await supabase
      .from('v_tejidos_con_precios')
      .select('id, codigo, nombre, precio_venta')
      .eq('activo', true)
      .order('codigo')

    setTejidos(data || [])
  }

  function agregarItem() {
    const nuevoItem: PresupuestoItem = {
      id: Math.random().toString(36).substring(7),
      tipo: 'articulo',
      descripcion: '',
      cantidad: '1',
      unidad: 'unidad',
      precio_unitario: '0',
      precio_total: 0,
    }
    setItems([...items, nuevoItem])
  }

  function eliminarItem(id: string) {
    setItems(items.filter(item => item.id !== id))
  }

  async function actualizarItem(id: string, campo: string, valor: any) {
    const nuevosItems = items.map(item => {
      if (item.id === id) {
        const itemActualizado = { ...item, [campo]: valor }
        
        // Si cambió cantidad o precio, recalcular total
        if (campo === 'cantidad' || campo === 'precio_unitario') {
          const cantidad = parseFloat(campo === 'cantidad' ? valor : item.cantidad) || 0
          const precio = parseFloat(campo === 'precio_unitario' ? valor : item.precio_unitario) || 0
          itemActualizado.precio_total = cantidad * precio
        }
        
        // Si seleccionó un artículo, obtener sus datos
        if (campo === 'articulo_id' && valor) {
          const articulo = articulos.find(a => a.id === parseInt(valor))
          if (articulo) {
            itemActualizado.descripcion = articulo.nombre
            itemActualizado.unidad = articulo.unidad
            
            // Obtener precio vigente
            supabase
              .from('precios_venta')
              .select('precio_venta')
              .eq('articulo_id', valor)
              .eq('vigente', true)
              .single()
              .then(({ data }) => {
                if (data) {
                  actualizarItem(id, 'precio_unitario', data.precio_venta.toString())
                }
              })
          }
        }
        
        // Si seleccionó un tejido, obtener sus datos
        if (campo === 'tejido_id' && valor) {
          const tejido = tejidos.find(t => t.id === valor)
          if (tejido) {
            itemActualizado.descripcion = `${tejido.codigo} - ${tejido.nombre}`
            itemActualizado.unidad = 'rollo'
            itemActualizado.precio_unitario = tejido.precio_venta?.toString() || '0'
            const cantidad = parseFloat(item.cantidad) || 0
            itemActualizado.precio_total = cantidad * (tejido.precio_venta || 0)
          }
        }
        
        return itemActualizado
      }
      return item
    })
    
    setItems(nuevosItems)
  }

  const subtotal = items.reduce((sum, item) => sum + item.precio_total, 0)
  const descuentoMonto = parseFloat(formData.descuento) || 0
  const total = subtotal - descuentoMonto

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (items.length === 0) {
      toast({
        title: "Error",
        description: "Debes agregar al menos un item al presupuesto",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Generar número de presupuesto
      const { data: numeroData, error: errorNumero } = await supabase
        .rpc('generar_numero_presupuesto', { p_tipo: 'articulos' })

      if (errorNumero) throw errorNumero

      const numero = numeroData

      // Verificar usuario
      if (!userId) {
        throw new Error('Usuario no autenticado')
      }

      // Crear presupuesto
      const presupuestoData = {
        numero,
        tipo: 'articulos',
        cliente_nombre: formData.cliente_nombre,
        cliente_email: formData.cliente_email || null,
        cliente_telefono: formData.cliente_telefono,
        cliente_direccion: formData.cliente_direccion || null,
        subtotal,
        descuento: descuentoMonto,
        total,
        observaciones: formData.observaciones || null,
        condiciones_comerciales: formData.condiciones_comerciales || null,
        validez_dias: parseInt(formData.validez_dias),
        estado: 'borrador',
        usuario_id: userId,
      }

      const { data: presupuesto, error: errorPresupuesto } = await supabase
        .from('presupuestos')
        .insert(presupuestoData)
        .select()
        .single()

      if (errorPresupuesto) throw errorPresupuesto

      // Insertar items
      const itemsData = items.map((item, index) => ({
        presupuesto_id: presupuesto.id,
        articulo_id: item.articulo_id || null,
        tejido_config_id: item.tejido_id || null,
        descripcion: item.descripcion,
        cantidad: parseFloat(item.cantidad),
        unidad: item.unidad,
        precio_unitario: parseFloat(item.precio_unitario),
        precio_total: item.precio_total,
        orden: index + 1,
      }))

      const { error: errorItems } = await supabase
        .from('presupuestos_items')
        .insert(itemsData)

      if (errorItems) throw errorItems

      toast({
        title: "¡Éxito!",
        description: `Presupuesto ${numero} creado correctamente`,
      })

      setTimeout(() => {
        router.push(`/dashboard/presupuestos/${presupuesto.id}`)
      }, 1500)

    } catch (error: any) {
      console.error('Error:', error)
      toast({
        title: "Error al crear presupuesto",
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
          <Link href="/dashboard/presupuestos/nuevo/tipo">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Presupuesto de Artículos</h1>
          <p className="text-muted-foreground">Crear presupuesto de productos individuales</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Datos del Cliente */}
          <Card>
            <CardHeader>
              <CardTitle>Datos del Cliente</CardTitle>
              <CardDescription>Información del cliente para el presupuesto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre Completo *</Label>
                  <Input
                    id="nombre"
                    value={formData.cliente_nombre}
                    onChange={(e) => setFormData({ ...formData, cliente_nombre: e.target.value })}
                    placeholder="Juan Pérez"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono *</Label>
                  <Input
                    id="telefono"
                    type="tel"
                    value={formData.cliente_telefono}
                    onChange={(e) => setFormData({ ...formData, cliente_telefono: e.target.value })}
                    placeholder="+54 387 123-4567"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.cliente_email}
                    onChange={(e) => setFormData({ ...formData, cliente_email: e.target.value })}
                    placeholder="juan@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="validez">Validez (días)</Label>
                  <Input
                    id="validez"
                    type="number"
                    value={formData.validez_dias}
                    onChange={(e) => setFormData({ ...formData, validez_dias: e.target.value })}
                    placeholder="15"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  value={formData.cliente_direccion}
                  onChange={(e) => setFormData({ ...formData, cliente_direccion: e.target.value })}
                  placeholder="Av. Principal 123, Salta"
                />
              </div>
            </CardContent>
          </Card>

          {/* Items del Presupuesto - Estilo Tabla */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Items del Presupuesto</CardTitle>
                  <CardDescription>
                    Presiona Tab para navegar | Enter para agregar fila | Clic en ❌ para eliminar
                  </CardDescription>
                </div>
                <Button type="button" onClick={agregarItem} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Fila
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    No hay items en el presupuesto
                  </p>
                  <Button type="button" onClick={agregarItem} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Primer Item
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b-2 bg-muted/50">
                        <th className="p-2 text-left font-semibold text-sm w-12">#</th>
                        <th className="p-2 text-left font-semibold text-sm w-32">Tipo</th>
                        <th className="p-2 text-left font-semibold text-sm min-w-[200px]">Producto</th>
                        <th className="p-2 text-left font-semibold text-sm min-w-[250px]">Descripción</th>
                        <th className="p-2 text-left font-semibold text-sm w-24">Cant.</th>
                        <th className="p-2 text-left font-semibold text-sm w-20">Unidad</th>
                        <th className="p-2 text-left font-semibold text-sm w-32">P. Unit.</th>
                        <th className="p-2 text-left font-semibold text-sm w-32">Total</th>
                        <th className="p-2 text-center font-semibold text-sm w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => (
                        <tr 
                          key={item.id} 
                          className="border-b hover:bg-muted/30 transition-colors"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              agregarItem()
                            }
                          }}
                        >
                          <td className="p-2 text-center text-muted-foreground font-medium">
                            {index + 1}
                          </td>
                          <td className="p-2">
                            <Select
                              value={item.tipo}
                              onValueChange={(value: any) => actualizarItem(item.id, 'tipo', value)}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="articulo">Artículo</SelectItem>
                                <SelectItem value="tejido">Tejido</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-2">
                            {item.tipo === 'articulo' ? (
                              <ProductoCombobox
                                value={item.articulo_id?.toString()}
                                onChange={(value) => actualizarItem(item.id, 'articulo_id', value)}
                                productos={articulos.map((art) => ({
                                  id: art.id,
                                  label: art.nombre,
                                  sublabel: art.unidad
                                }))}
                                placeholder="Buscar artículo..."
                                emptyMessage="No se encontraron artículos"
                              />
                            ) : (
                              <ProductoCombobox
                                value={item.tejido_id}
                                onChange={(value) => actualizarItem(item.id, 'tejido_id', value)}
                                productos={tejidos.map((tej) => ({
                                  id: tej.id,
                                  label: tej.codigo,
                                  sublabel: `$${tej.precio_venta?.toLocaleString()}`
                                }))}
                                placeholder="Buscar tejido..."
                                emptyMessage="No se encontraron tejidos"
                              />
                            )}
                          </td>
                          <td className="p-2">
                            <Input
                              value={item.descripcion}
                              onChange={(e) => actualizarItem(item.id, 'descripcion', e.target.value)}
                              placeholder="Descripción..."
                              className="h-9"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  agregarItem()
                                }
                              }}
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={item.cantidad}
                              onChange={(e) => actualizarItem(item.id, 'cantidad', e.target.value)}
                              placeholder="1"
                              className="h-9"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  agregarItem()
                                }
                              }}
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              value={item.unidad}
                              onChange={(e) => actualizarItem(item.id, 'unidad', e.target.value)}
                              placeholder="un"
                              className="h-9"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  agregarItem()
                                }
                              }}
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={item.precio_unitario}
                              onChange={(e) => actualizarItem(item.id, 'precio_unitario', e.target.value)}
                              placeholder="0.00"
                              className="h-9"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  agregarItem()
                                }
                              }}
                            />
                          </td>
                          <td className="p-2">
                            <div className="font-bold text-green-600 text-right">
                              ${item.precio_total.toLocaleString()}
                            </div>
                          </td>
                          <td className="p-2 text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => eliminarItem(item.id)}
                              className="h-8 w-8 p-0 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {/* Fila de totales */}
                      <tr className="border-t-2 bg-muted/30">
                        <td colSpan={7} className="p-3 text-right font-semibold">
                          Subtotal:
                        </td>
                        <td className="p-3 font-bold text-lg text-green-600">
                          ${subtotal.toLocaleString()}
                        </td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="mt-4 flex justify-end">
                    <Button 
                      type="button" 
                      onClick={agregarItem} 
                      variant="outline"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Nueva Fila (Enter)
                    </Button>
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
                    <p className="font-semibold mb-1">💡 Atajos de teclado:</p>
                    <ul className="space-y-1">
                      <li>• <kbd className="px-1.5 py-0.5 bg-white border rounded">Tab</kbd> - Navegar entre columnas</li>
                      <li>• <kbd className="px-1.5 py-0.5 bg-white border rounded">Enter</kbd> - Agregar nueva fila</li>
                      <li>• <kbd className="px-1.5 py-0.5 bg-white border rounded">Clic en ❌</kbd> - Eliminar fila</li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Observaciones y Condiciones */}
          <Card>
            <CardHeader>
              <CardTitle>Observaciones y Condiciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea
                  id="observaciones"
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  placeholder="Observaciones adicionales..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="condiciones">Condiciones Comerciales</Label>
                <Textarea
                  id="condiciones"
                  value={formData.condiciones_comerciales}
                  onChange={(e) => setFormData({ ...formData, condiciones_comerciales: e.target.value })}
                  placeholder="Condiciones de pago, garantía, etc."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard/presupuestos">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={loading || items.length === 0}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Guardando...' : 'Guardar Presupuesto'}
            </Button>
          </div>
        </div>

        {/* Preview Lateral */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Resumen
              </CardTitle>
              <CardDescription>
                Preview del presupuesto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cliente:</span>
                  <span className="font-medium text-right">
                    {formData.cliente_nombre || 'Sin nombre'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Items:</span>
                  <span className="font-medium">{items.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Validez:</span>
                  <span className="font-medium">{formData.validez_dias} días</span>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Subtotal:</span>
                  <span className="text-lg font-bold">
                    ${subtotal.toLocaleString()}
                  </span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descuento">Descuento ($)</Label>
                  <Input
                    id="descuento"
                    type="number"
                    step="0.01"
                    value={formData.descuento}
                    onChange={(e) => setFormData({ ...formData, descuento: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div className="flex justify-between items-center pt-3 border-t-2">
                  <span className="text-lg font-bold">Total:</span>
                  <span className="text-2xl font-bold text-green-600">
                    ${total.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="bg-muted p-3 rounded-lg text-xs text-muted-foreground">
                <p className="font-semibold mb-2">Items incluidos:</p>
                {items.length === 0 ? (
                  <p>No hay items agregados</p>
                ) : (
                  <ul className="space-y-1">
                    {items.map((item, index) => (
                      <li key={item.id}>
                        {index + 1}. {item.descripcion || 'Sin descripción'} ({item.cantidad} {item.unidad})
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {items.length > 0 && (
                <div className="bg-green-50 border border-green-200 p-3 rounded-lg text-xs">
                  <p className="font-semibold text-green-900 mb-1">✅ Listo para guardar</p>
                  <p className="text-green-800">
                    El presupuesto se guardará como borrador y podrás generar el PDF después.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}

