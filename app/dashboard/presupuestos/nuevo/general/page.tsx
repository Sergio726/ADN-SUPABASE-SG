'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Save, Plus, Trash2, FileText, DollarSign, CreditCard, Receipt, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Textarea } from '@/components/ui/textarea'
import { BuscarCliente } from '@/components/BuscarCliente'

interface PresupuestoItem {
  id: string
  descripcion: string
  cantidad: string
  unidad: string
  precio_base: string // Precio base (efectivo)
  precio_unitario: string // Precio calculado según forma de pago
  precio_total: number
}

export default function NuevoPresupuestoGeneralPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  const [clienteSeleccionado, setClienteSeleccionado] = useState<any>(null)

  const [formData, setFormData] = useState({
    cliente_id: null as string | null,
    cliente_nombre: '',
    cliente_email: '',
    cliente_telefono: '',
    cliente_direccion: '',
    descuento: '0',
    validez_dias: '1',
    observaciones: '',
    condiciones_comerciales: 'Pago: Contado o transferencia\nInstalación no incluida',
  })

  function handleClienteSeleccionado(cliente: any) {
    setClienteSeleccionado(cliente)
    setFormData({
      ...formData,
      cliente_id: cliente.id,
      cliente_nombre: cliente.nombre_completo,
      cliente_email: cliente.email || '',
      cliente_telefono: cliente.telefono || '',
      cliente_direccion: cliente.direccion || '',
    })
  }

  const [items, setItems] = useState<PresupuestoItem[]>([])
  const [formaPago, setFormaPago] = useState<'efectivo'|'lista'|'tarjeta'|'echeq45'|'echeq60'|'echeq90'>('lista')

  const unidadesComunes = ['unidad', 'metro', 'kg', 'rollo', 'hora', 'día', 'm2', 'm3', 'servicio']

  function factorFormaPago(fp: typeof formaPago): number {
    switch (fp) {
      case 'efectivo': return 1.0 // precio_base × 1.0 (sin IVA)
      case 'lista': return 1.21 // precio_base × 1.21 (incluye IVA 21%)
      case 'tarjeta': return 1.3 // precio_base × 1.3 (incluye IVA 21%)
      case 'echeq45': return 1.21 // igual que Factura/Lista (incluye IVA 21%)
      case 'echeq60': return 1.3 // igual que Tarjeta (incluye IVA 21%)
      case 'echeq90': return 1.4 // precio_base × 1.4 (incluye IVA 21%)
      default: return 1.21
    }
  }

  function getFormaPagoInfo(fp: typeof formaPago) {
    const info: Record<typeof formaPago, { label: string; icon: any; color: string; bgColor: string; borderColor: string }> = {
      efectivo: { label: 'Efectivo', icon: DollarSign, color: 'text-green-700', bgColor: 'bg-green-50', borderColor: 'border-green-300' },
      lista: { label: 'Factura / Lista', icon: FileText, color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-300' },
      tarjeta: { label: 'Tarjeta', icon: CreditCard, color: 'text-purple-700', bgColor: 'bg-purple-50', borderColor: 'border-purple-300' },
      echeq45: { label: 'E-cheq 45 días', icon: Receipt, color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-300' },
      echeq60: { label: 'E-cheq 60 días', icon: Receipt, color: 'text-purple-700', bgColor: 'bg-purple-50', borderColor: 'border-purple-300' },
      echeq90: { label: 'E-cheq 90 días', icon: Receipt, color: 'text-purple-800', bgColor: 'bg-purple-50', borderColor: 'border-purple-300' },
    }
    return info[fp] || info.lista
  }

  useEffect(() => {
    cargarUsuario()
  }, [])

  async function cargarUsuario() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserId(user.id)
      setUserEmail(user.email || null)
    }
  }

  function agregarItem() {
    const nuevoItem: PresupuestoItem = {
      id: Math.random().toString(36).substring(7),
      descripcion: '',
      cantidad: '1',
      unidad: 'unidad',
      precio_base: '0',
      precio_unitario: '0',
      precio_total: 0,
    }
    setItems([...items, nuevoItem])
  }

  function eliminarItem(id: string) {
    setItems(items.filter(item => item.id !== id))
  }

  function actualizarItem(id: string, campo: string, valor: any) {
    setItems((prevItems) => {
      return prevItems.map((item) => {
        if (item.id !== id) return item
        
        const itemActualizado: PresupuestoItem = { ...item, [campo]: valor }

        // Si cambia precio_base, recalcular precio_unitario según forma de pago
        if (campo === 'precio_base') {
          const precioBase = parseFloat(valor) || 0
          const factor = factorFormaPago(formaPago)
          itemActualizado.precio_unitario = (precioBase * factor).toString()
        }

        // Recalcular precio_total
        if (campo === 'cantidad' || campo === 'precio_base') {
          const cantidad = parseFloat(campo === 'cantidad' ? valor : item.cantidad) || 0
          const precioBase = parseFloat(itemActualizado.precio_base) || 0
          const factor = factorFormaPago(formaPago)
          const precioUnitario = precioBase * factor
          itemActualizado.precio_total = cantidad * precioUnitario
          itemActualizado.precio_unitario = precioUnitario.toString()
        }

        return itemActualizado
      })
    })
  }

  // Recalcular todos los items al cambiar forma de pago
  useEffect(() => {
    if (items.length === 0) return
    
    setItems((prevItems) => {
      return prevItems.map((item) => {
        const precioBase = parseFloat(item.precio_base) || 0
        const factor = factorFormaPago(formaPago)
        const precioUnitario = precioBase * factor
        const cantidad = parseFloat(item.cantidad) || 0
        
        return {
          ...item,
          precio_unitario: precioUnitario.toString(),
          precio_total: cantidad * precioUnitario,
        }
      })
    })
  }, [formaPago])

  const subtotal = items.reduce((sum, item) => sum + item.precio_total, 0)
  const descuentoMonto = parseFloat(formData.descuento) || 0
  const total = subtotal - descuentoMonto
  
  // Calcular IVA solo si NO es efectivo
  const esEfectivo = formaPago === 'efectivo'
  const baseSinIva = !esEfectivo && total > 0 ? total / 1.21 : 0
  const iva21 = baseSinIva * 0.21

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!clienteSeleccionado) {
      toast({
        title: "Error",
        description: "Debes seleccionar un cliente antes de guardar el presupuesto",
        variant: "destructive",
      })
      return
    }
    
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
        .rpc('generar_numero_presupuesto', { p_tipo: 'general' })

      if (errorNumero) throw errorNumero

      const numero = numeroData

      // Verificar usuario
      if (!userId) {
        throw new Error('Usuario no autenticado')
      }

      // Crear presupuesto
      const presupuestoData = {
        numero,
        tipo: 'general',
        cliente_id: formData.cliente_id,
        cliente_nombre: formData.cliente_nombre,
        cliente_email: formData.cliente_email || null,
        cliente_telefono: formData.cliente_telefono,
        cliente_direccion: formData.cliente_direccion || null,
        subtotal,
        descuento: descuentoMonto,
        total,
        forma_pago: formaPago,
        observaciones: formData.observaciones || null,
        condiciones_comerciales: formData.condiciones_comerciales || null,
        validez_dias: parseInt(formData.validez_dias),
        estado: 'borrador',
        usuario_id: userId,
        fecha_emision: obtenerFechaArgentina(),
      }

      const { data: presupuesto, error: errorPresupuesto } = await supabase
        .from('presupuestos')
        .insert(presupuestoData)
        .select()
        .single()

      if (errorPresupuesto) throw errorPresupuesto

      // Insertar items (sin articulo_id ni tejido_config_id)
      const itemsData = items.map((item, index) => ({
        presupuesto_id: presupuesto.id,
        articulo_id: null,
        tejido_config_id: null,
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

  const obtenerFechaArgentina = () =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <Button variant="outline" asChild className="w-full sm:w-auto">
          <Link href="/dashboard/presupuestos/nuevo/tipo">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Link>
        </Button>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold sm:text-3xl">Presupuesto General</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Presupuesto para productos o servicios particulares no estandarizados
          </p>
        </div>
      </div>

      {/* Búsqueda de Cliente - Paso 1 */}
      {!clienteSeleccionado && (
        <Card>
          <CardHeader>
            <CardTitle>Paso 1: Seleccionar Cliente</CardTitle>
            <CardDescription>Primero debes seleccionar un cliente para continuar con el presupuesto</CardDescription>
          </CardHeader>
          <CardContent>
            <BuscarCliente onClienteSeleccionado={handleClienteSeleccionado} />
          </CardContent>
        </Card>
      )}

      {/* Formulario de Presupuesto - Solo visible cuando hay cliente seleccionado */}
      {clienteSeleccionado && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cliente Seleccionado */}
          <Card className="border-2 border-green-300 bg-green-50/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Cliente Seleccionado</CardTitle>
                  <CardDescription>Datos del cliente para el presupuesto</CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setClienteSeleccionado(null)
                    setFormData({
                      ...formData,
                      cliente_id: null,
                      cliente_nombre: '',
                      cliente_email: '',
                      cliente_telefono: '',
                      cliente_direccion: '',
                    })
                    // Limpiar items al cambiar cliente
                    setItems([])
                  }}
                >
                  Cambiar Cliente
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Nombre</p>
                  <p className="font-semibold">{formData.cliente_nombre}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Documento</p>
                  <p className="font-mono font-semibold">
                    {clienteSeleccionado.tipo_documento} {clienteSeleccionado.numero_documento}
                  </p>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Teléfono</p>
                  <p>{formData.cliente_telefono}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm">{formData.cliente_email || '-'}</p>
                </div>
              </div>
              {formData.cliente_direccion && (
                <div>
                  <p className="text-xs text-muted-foreground">Dirección</p>
                  <p className="text-sm">{formData.cliente_direccion}</p>
                </div>
              )}
              <div className="pt-2 border-t">
                <Label htmlFor="validez">Validez del Presupuesto (días)</Label>
                <Input
                  id="validez"
                  type="number"
                  min="1"
                  step="1"
                  value={formData.validez_dias}
                  onChange={(e) => setFormData({ ...formData, validez_dias: e.target.value })}
                  placeholder="1"
                  className="mt-1 max-w-xs"
                />
              </div>
            </CardContent>
          </Card>

          {/* Forma de Pago */}
          {(() => {
            const formaPagoInfo = getFormaPagoInfo(formaPago)
            const IconoFormaPago = formaPagoInfo.icon
            return (
              <Card className={`w-full border-2 ${formaPagoInfo.borderColor} ${formaPagoInfo.bgColor} shadow-lg`}>
                <CardHeader className="pb-3 space-y-2 sm:space-y-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                    <AlertCircle className={`h-5 w-5 ${formaPagoInfo.color}`} />
                    <CardTitle className={`text-base sm:text-lg font-semibold ${formaPagoInfo.color}`}>
                      ⚠️ Forma de Pago para la Cotización
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs sm:text-sm">
                    Selecciona la forma de pago antes de agregar items. Los precios se calcularán automáticamente.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className={`text-sm font-semibold ${formaPagoInfo.color}`}>
                      Forma de Pago
                    </Label>
                    <Select value={formaPago} onValueChange={(v: any) => setFormaPago(v)}>
                      <SelectTrigger className={`w-full h-11 sm:h-12 text-sm sm:text-base font-semibold border-2 ${formaPagoInfo.borderColor} ${formaPagoInfo.bgColor}`}>
                        <div className="flex items-center gap-2 truncate">
                          <IconoFormaPago className={`h-5 w-5 ${formaPagoInfo.color}`} />
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="efectivo">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-700" />
                            <span>Efectivo (sin IVA)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="lista">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-700" />
                            <span>Factura / Lista (con IVA)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="tarjeta">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-purple-700" />
                            <span>Tarjeta (con IVA)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="echeq45">
                          <div className="flex items-center gap-2">
                            <Receipt className="h-4 w-4 text-purple-600" />
                            <span>E-cheq 45 días (con IVA)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="echeq60">
                          <div className="flex items-center gap-2">
                            <Receipt className="h-4 w-4 text-purple-700" />
                            <span>E-cheq 60 días (con IVA)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="echeq90">
                          <div className="flex items-center gap-2">
                            <Receipt className="h-4 w-4 text-purple-800" />
                            <span>E-cheq 90 días (con IVA)</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className={`rounded-lg border-2 ${formaPagoInfo.borderColor} ${formaPagoInfo.bgColor} p-3 sm:p-4`}>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2 text-sm sm:text-base">
                        <IconoFormaPago className={`h-5 w-5 ${formaPagoInfo.color}`} />
                        <span className={`font-semibold ${formaPagoInfo.color}`}>
                          Forma de pago seleccionada: {formaPagoInfo.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })()}

          {/* Items del Presupuesto */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg sm:text-xl">Items del Presupuesto</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Presiona Tab para navegar | Enter para agregar fila | Clic en ❌ para eliminar
                  </CardDescription>
                </div>
                <Button type="button" onClick={agregarItem} className="hidden sm:flex">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Fila
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <div className="rounded-lg border-2 border-dashed py-10 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="mb-4 text-sm text-muted-foreground">
                    No hay items en el presupuesto
                  </p>
                  <Button type="button" onClick={agregarItem} variant="outline" className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Primer Item
                  </Button>
                </div>
              ) : (
                <>
                  <div className="hidden overflow-x-auto sm:block">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b-2">
                          <th className="p-2 text-left text-xs font-semibold sm:text-sm w-10 sm:w-12">#</th>
                          <th className="p-2 text-left text-xs font-semibold sm:text-sm min-w-[350px] sm:min-w-[400px]">Descripción</th>
                          <th className="p-2 text-left text-xs font-semibold sm:text-sm min-w-[90px] sm:min-w-[100px]">Cant.</th>
                          <th className="p-2 text-left text-xs font-semibold sm:text-sm w-24 sm:w-28">Unidad</th>
                          <th className="p-2 text-left text-xs font-semibold sm:text-sm w-28 sm:w-32">P. Base</th>
                          <th className="p-2 text-left text-xs font-semibold sm:text-sm w-28 sm:w-32">P. Unit.</th>
                          <th className="p-2 text-left text-xs font-semibold sm:text-sm w-28 sm:w-32">Total</th>
                          <th className="p-2 text-center text-xs font-semibold sm:text-sm w-10 sm:w-12"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, index) => (
                          <tr 
                            key={item.id} 
                            className="border-b"
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
                              <Textarea
                                value={item.descripcion}
                                onChange={(e) => actualizarItem(item.id, 'descripcion', e.target.value)}
                                placeholder="Descripción del producto/servicio..."
                                className="min-h-[80px] w-full resize-y"
                                rows={3}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && e.ctrlKey) {
                                    e.preventDefault()
                                    agregarItem()
                                  }
                                }}
                              />
                            </td>
                            <td className="p-2 min-w-[90px] sm:min-w-[100px]">
                              <Input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={item.cantidad}
                                onChange={(e) => actualizarItem(item.id, 'cantidad', e.target.value)}
                                placeholder="1"
                                className="h-9 w-full text-right"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault()
                                    agregarItem()
                                  }
                                }}
                              />
                            </td>
                            <td className="p-2">
                              <Select
                                value={item.unidad}
                                onValueChange={(value) => actualizarItem(item.id, 'unidad', value)}
                              >
                                <SelectTrigger className="h-9 w-full">
                                  <SelectValue placeholder="Unidad" />
                                </SelectTrigger>
                                <SelectContent>
                                  {unidadesComunes.map((unidad) => (
                                    <SelectItem key={unidad} value={unidad}>
                                      {unidad}
                                    </SelectItem>
                                  ))}
                                  {item.unidad && !unidadesComunes.includes(item.unidad) && (
                                    <SelectItem value={item.unidad}>
                                      {item.unidad}
                                    </SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="p-2">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.precio_base}
                                onChange={(e) => actualizarItem(item.id, 'precio_base', e.target.value)}
                                placeholder="0.00"
                                className="h-9 w-full text-right"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault()
                                    agregarItem()
                                  }
                                }}
                              />
                            </td>
                            <td className="p-2">
                              <span className="block h-9 w-full leading-9 text-right text-sm font-semibold text-muted-foreground">
                                ${Number(item.precio_unitario || 0).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            </td>
                            <td className="p-2">
                              <div className="font-bold text-green-600 text-right">
                                ${item.precio_total.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </div>
                            </td>
                            <td className="p-2 text-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => eliminarItem(item.id)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Vista móvil */}
                  <div className="space-y-4 sm:hidden">
                    {items.map((item, index) => (
                      <Card key={item.id} className="border">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="text-xs text-muted-foreground mb-1">#{index + 1}</div>
                              <div className="min-h-10 rounded-md border border-dashed border-input bg-muted/30 px-3 py-2 text-sm leading-relaxed text-muted-foreground">
                                {item.descripcion && item.descripcion.trim().length > 0 ? item.descripcion : 'Sin descripción'}
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => eliminarItem(item.id)}
                              className="h-8 w-8 p-0 text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs uppercase text-muted-foreground">Descripción</Label>
                            <Textarea
                              value={item.descripcion}
                              onChange={(e) => actualizarItem(item.id, 'descripcion', e.target.value)}
                              placeholder="Descripción del producto/servicio..."
                              className="min-h-[80px] w-full resize-y"
                              rows={3}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs uppercase text-muted-foreground">Cantidad</Label>
                              <Input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={item.cantidad}
                                onChange={(e) => actualizarItem(item.id, 'cantidad', e.target.value)}
                                placeholder="1"
                                className="h-10 text-right"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs uppercase text-muted-foreground">Unidad</Label>
                              <Select
                                value={item.unidad}
                                onValueChange={(value) => actualizarItem(item.id, 'unidad', value)}
                              >
                                <SelectTrigger className="h-10">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {unidadesComunes.map((unidad) => (
                                    <SelectItem key={unidad} value={unidad}>
                                      {unidad}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs uppercase text-muted-foreground">Precio Base</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.precio_base}
                                onChange={(e) => actualizarItem(item.id, 'precio_base', e.target.value)}
                                placeholder="0.00"
                                className="h-10 text-right"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                            <div className="space-y-1">
                              <Label className="text-xs uppercase text-muted-foreground">Precio unitario</Label>
                              <div className="h-10 rounded-md border border-input bg-muted/50 px-3 text-right font-semibold leading-[2.5rem] text-muted-foreground">
                                ${Number(item.precio_unitario || 0).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs uppercase text-muted-foreground">Total</Label>
                              <div className="h-10 rounded-md border border-input bg-green-50 px-3 text-right font-bold leading-[2.5rem] text-green-600">
                                ${item.precio_total.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="mt-4 sm:hidden">
                    <Button type="button" onClick={agregarItem} variant="outline" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Fila
                    </Button>
                  </div>
                </>
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

          {/* Resumen */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <CardTitle>Resumen</CardTitle>
              </div>
              <CardDescription>Preview del presupuesto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cliente:</span>
                  <span className="font-medium text-right">
                    {formData.cliente_nombre || 'Sin cliente'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Items:</span>
                  <span className="font-medium">{items.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Vendedor:</span>
                  <span className="font-medium">{userEmail || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Validez:</span>
                  <span className="font-medium">{formData.validez_dias} días</span>
                </div>
              </div>
              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Subtotal:</span>
                  <span className="text-lg font-bold">${subtotal.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span className="text-sm">Descuento:</span>
                  <span className="font-semibold">-${descuentoMonto.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}</span>
                </div>
                {!esEfectivo && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Base Imponible (sin IVA):</span>
                      <span className="text-lg font-bold">${baseSinIva.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">IVA 21%:</span>
                      <span className="text-lg font-bold">${iva21.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center pt-3 border-t-2">
                  <span className="text-lg font-bold">TOTAL:</span>
                  <span className="text-2xl font-bold text-green-600">${total.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}</span>
                </div>
              </div>
              <div className="bg-muted p-3 rounded-lg text-xs text-muted-foreground">
                <p className="font-semibold mb-2">Items incluidos:</p>
                <ul className="space-y-1">
                  {items.map((item, idx) => (
                    <li key={item.id}>
                      {idx + 1}. {item.descripcion || 'Sin descripción'} x {item.cantidad} {item.unidad}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-green-50 border border-green-200 p-3 rounded-lg text-xs">
                <p className="font-semibold text-green-900 mb-1">✅ Listo para guardar</p>
                <p className="text-green-800">El presupuesto se guardará como borrador y podrás generar el PDF después.</p>
              </div>
              <div className="pt-2 border-t">
                <div className="flex items-center gap-2 text-sm">
                  {(() => {
                    const formaPagoInfo = getFormaPagoInfo(formaPago)
                    const IconoFormaPago = formaPagoInfo.icon
                    return (
                      <>
                        <IconoFormaPago className={`h-4 w-4 ${formaPagoInfo.color}`} />
                        <span className={`font-semibold ${formaPagoInfo.color}`}>
                          {formaPagoInfo.label}
                        </span>
                      </>
                    )
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button type="button" variant="outline" asChild className="flex-1 sm:flex-initial">
              <Link href="/dashboard/presupuestos">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 sm:flex-initial">
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Guardando...' : 'Guardar Presupuesto'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

