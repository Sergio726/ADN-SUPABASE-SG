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
import { ArrowLeft, Save, Plus, Trash2, Package, DollarSign, FileText, CreditCard, Receipt, AlertCircle, X } from 'lucide-react'
import Link from 'next/link'
import { Textarea } from '@/components/ui/textarea'
import { ProductoCombobox } from '@/components/ProductoCombobox'
import { BuscarCliente } from '@/components/BuscarCliente'

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

  const unidadesDisponibles = useMemo(() => {
    const unidades = new Set<string>()
    articulos.forEach((articulo) => {
      if (articulo?.unidad) unidades.add(articulo.unidad)
    })
    items.forEach((item) => {
      if (item.unidad) unidades.add(item.unidad)
    })
    return Array.from(unidades).sort((a, b) => a.localeCompare(b))
  }, [articulos, items])

  const filtrosTejidos = useMemo(() => {
    const alturas = new Set<string>()
    const rombos = new Set<string>()
    const calibres = new Set<string>()

    tejidos.forEach((tejido) => {
      if (tejido?.altura !== undefined && tejido?.altura !== null) {
        alturas.add(tejido.altura.toString())
      }
      if (tejido?.tamano_rombo !== undefined && tejido?.tamano_rombo !== null) {
        rombos.add(tejido.tamano_rombo.toString())
      }
      if (tejido?.calibre !== undefined && tejido?.calibre !== null) {
        calibres.add(tejido.calibre.toString())
      }
    })

    const formatOptions = (values: Set<string>, suffix?: string) => {
      const arr = Array.from(values).filter(Boolean).sort((a, b) => a.localeCompare(b, 'es', { numeric: true }))
      return [
        { value: 'todos', label: 'Todos' },
        ...arr.map((value) => ({
          value,
          label: suffix ? `${value}${suffix}` : value,
        })),
      ]
    }

    return [
      {
        key: 'altura',
        label: 'Altura',
        options: formatOptions(alturas, 'm'),
      },
      {
        key: 'tamano_rombo',
        label: 'Rombo',
        options: formatOptions(rombos),
      },
      {
        key: 'calibre',
        label: 'Calibre',
        options: formatOptions(calibres),
      },
    ]
  }, [tejidos])

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
    cargarArticulos()
    cargarTejidos()
  }, [])

  async function cargarUsuario() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserId(user.id)
      setUserEmail(user.email || null)
    }
  }

  async function cargarArticulos() {
    const { data, error } = await supabase
      .from('articulos')
      .select('id, nombre, unidad, publicado')
      .order('nombre')

    if (error) {
      console.error('Error cargando artículos:', error)
      toast({
        title: 'Error al cargar artículos',
        description: 'No se pudieron obtener los artículos. Intenta nuevamente.',
        variant: 'destructive',
      })
      return
    }

    setArticulos(data || [])
  }

  async function cargarTejidos() {
    const { data } = await supabase
      .from('v_tejidos_con_precios')
      .select('id, codigo, nombre, precio_venta, precio_lista, altura, tamano_rombo, calibre')
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
    setItems((prevItems) => {
      const nuevos = prevItems.map((item) => {
        if (item.id !== id) return item
        const itemActualizado: PresupuestoItem = { ...item, [campo]: valor }

        if (campo === 'cantidad' || campo === 'precio_unitario') {
          const cantidad = parseFloat(campo === 'cantidad' ? valor : item.cantidad) || 0
          const precio = parseFloat(campo === 'precio_unitario' ? valor : item.precio_unitario) || 0
          itemActualizado.precio_total = cantidad * precio
        }
        
        // Tejido: obtener precio según forma de pago
        if (campo === 'tejido_id' && valor) {
          const tejido = tejidos.find((t) => t.id === valor)
          if (tejido) {
            itemActualizado.descripcion = `${tejido.codigo} - ${tejido.nombre}`
            itemActualizado.unidad = 'rollo'
            
            // Obtener precio base y calcular según forma de pago
            const precioBase = tejido.precio_venta || 0 // Precio base (efectivo)
            const factor = factorFormaPago(formaPago)
            const precioTejido = precioBase * factor
            
            itemActualizado.precio_unitario = precioTejido.toString()
            const cantidad = parseFloat(item.cantidad) || 0
            itemActualizado.precio_total = cantidad * precioTejido
          }
        }

        // Artículo: setear descripción/unidad ahora (precio luego con costo)
        if (campo === 'articulo_id' && valor) {
          const articulo = articulos.find((a) => a.id === parseInt(valor))
          if (articulo) {
            itemActualizado.descripcion = articulo.nombre
            itemActualizado.unidad = articulo.unidad
          }
        }

        return itemActualizado
      })
      return nuevos
    })

    // Si es artículo, obtener precio base (precio_venta) vigente y calcular según forma de pago
    if (campo === 'articulo_id' && valor) {
      const { data } = await supabase
              .from('precios_venta')
              .select('precio_venta')
              .eq('articulo_id', valor)
              .eq('vigente', true)
              .single()

      const precioBase = data?.precio_venta || 0
      const factor = factorFormaPago(formaPago)
      const precioUnidad = precioBase * factor

      setItems((prev) => prev.map((it) => {
        if (it.id !== id) return it
        const cantidad = parseFloat(it.cantidad) || 0
        return {
          ...it,
          precio_unitario: precioUnidad.toString(),
          precio_total: cantidad * precioUnidad,
        }
      }))
    }
  }

  // Recalcular todos los items al cambiar forma de pago
  useEffect(() => {
    if (items.length === 0) return
    const recalc = async () => {
      const nuevos = await Promise.all(items.map(async (it) => {
        // Recalcular artículo según forma de pago
        if (it.articulo_id) {
          const { data } = await supabase
            .from('precios_venta')
            .select('precio_venta')
            .eq('articulo_id', it.articulo_id)
            .eq('vigente', true)
            .single()
          const precioBase = data?.precio_venta || 0
          const factor = factorFormaPago(formaPago)
          const pu = precioBase * factor
          const cantidad = parseFloat(it.cantidad) || 0
          return { ...it, precio_unitario: pu.toString(), precio_total: cantidad * pu }
        }
        
        // Recalcular tejido según forma de pago
        if (it.tejido_id) {
          const tejido = tejidos.find((t) => t.id === it.tejido_id)
          if (tejido) {
            const precioBase = tejido.precio_venta || 0 // Precio base (efectivo)
            const factor = factorFormaPago(formaPago)
            const precioTejido = precioBase * factor
            const cantidad = parseFloat(it.cantidad) || 0
            return { ...it, precio_unitario: precioTejido.toString(), precio_total: cantidad * precioTejido }
          }
        }
        
        return it
      }))
      setItems(nuevos)
    }
    recalc()
  }, [formaPago, tejidos])

  const subtotal = items.reduce((sum, item) => sum + item.precio_total, 0)
  const descuentoMonto = parseFloat(formData.descuento) || 0
  const total = subtotal - descuentoMonto
  
  // Calcular IVA solo si NO es efectivo
  // Efectivo: precio final sin IVA
  // Otros: precio incluye IVA, calcular base imponible
  const esEfectivo = formaPago === 'efectivo'
  const baseSinIva = !esEfectivo && total > 0 ? total / 1.21 : 0
  const iva21 = baseSinIva * 0.21

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
        cliente_id: formData.cliente_id,
        cliente_nombre: formData.cliente_nombre,
        cliente_email: formData.cliente_email || null,
        cliente_telefono: formData.cliente_telefono,
        cliente_direccion: formData.cliente_direccion || null,
        subtotal,
        descuento: descuentoMonto,
        total,
        forma_pago: formaPago, // Guardar forma de pago seleccionada
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
          <h1 className="text-2xl font-bold sm:text-3xl">Presupuesto de Artículos</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Crear presupuesto de productos individuales
          </p>
        </div>
      </div>

      {/* Búsqueda de Cliente */}
      {!clienteSeleccionado && (
        <BuscarCliente onClienteSeleccionado={handleClienteSeleccionado} />
      )}

      {/* Formulario de Presupuesto - Solo visible cuando hay cliente seleccionado */}
      {clienteSeleccionado && (
        <form onSubmit={handleSubmit} className="grid gap-6 grid-cols-1">
          <div className="lg:col-span-2 space-y-6">
            {/* Datos del Cliente - Solo lectura */}
            <Card>
              <CardHeader className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Cliente Seleccionado</CardTitle>
                    <CardDescription className="text-xs">Datos del cliente para el presupuesto</CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
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
                    }}
                  >
                    Cambiar Cliente
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-[11px] text-muted-foreground">Nombre</p>
                    <p className="font-semibold text-sm">{formData.cliente_nombre}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Documento</p>
                    <p className="font-mono font-semibold text-sm">
                      {clienteSeleccionado.tipo_documento} {clienteSeleccionado.numero_documento}
                    </p>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-[11px] text-muted-foreground">Teléfono</p>
                    <p className="text-sm">{formData.cliente_telefono || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Email</p>
                    <p className="text-sm">{formData.cliente_email || '-'}</p>
                  </div>
                </div>
                {formData.cliente_direccion && (
                  <div>
                    <p className="text-[11px] text-muted-foreground">Dirección</p>
                    <p className="text-sm">{formData.cliente_direccion}</p>
                  </div>
                )}
                <div className="pt-2 border-t">
                  <Label htmlFor="validez" className="text-sm">Validez del Presupuesto (días)</Label>
                  <Input
                    id="validez"
                    type="number"
                    value={formData.validez_dias}
                    onChange={(e) => setFormData({ ...formData, validez_dias: e.target.value })}
                    placeholder="1"
                    className="mt-1 max-w-[200px] h-9"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Forma de pago - Destacado */}
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
                    <CardDescription className="text-xs leading-relaxed text-muted-foreground sm:text-sm sm:leading-relaxed">
                      Define la forma de pago para calcular los precios de los items. Esta selección afectará todos los precios del presupuesto.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 sm:space-y-4">
                      <Select value={formaPago} onValueChange={(v: any) => setFormaPago(v)}>
                        <SelectTrigger className={`w-full h-11 sm:h-12 text-sm sm:text-base font-semibold border-2 ${formaPagoInfo.borderColor} ${formaPagoInfo.bgColor}`}>
                          <div className="flex items-center gap-2 truncate">
                            <IconoFormaPago className={`h-5 w-5 ${formaPagoInfo.color}`} />
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lista" className="py-2 text-sm sm:text-base">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Factura / Lista
                            </div>
                          </SelectItem>
                          <SelectItem value="efectivo" className="py-2 text-sm sm:text-base">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              Efectivo
                            </div>
                          </SelectItem>
                          <SelectItem value="tarjeta" className="py-2 text-sm sm:text-base">
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4" />
                              Tarjeta
                            </div>
                          </SelectItem>
                          <SelectItem value="echeq45" className="py-2 text-sm sm:text-base">
                            <div className="flex items-center gap-2">
                              <Receipt className="h-4 w-4" />
                              E‑cheq 45 días
                            </div>
                          </SelectItem>
                          <SelectItem value="echeq60" className="py-2 text-sm sm:text-base">
                            <div className="flex items-center gap-2">
                              <Receipt className="h-4 w-4" />
                              E‑cheq 60 días
                            </div>
                          </SelectItem>
                          <SelectItem value="echeq90" className="py-2 text-sm sm:text-base">
                            <div className="flex items-center gap-2">
                              <Receipt className="h-4 w-4" />
                              E‑cheq 90 días
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {/* Indicador visual de la selección actual */}
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
                    </div>
                  </CardContent>
                </Card>
              )
            })()}

          {/* Items del Presupuesto - Estilo Tabla */}
          <Card>
            <CardHeader>
              <div className="space-y-1">
                <CardTitle className="text-lg sm:text-xl">Items del Presupuesto</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Presiona Tab para navegar | Enter para agregar fila | Clic en ❌ para eliminar
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                  <div className="rounded-lg border-2 border-dashed py-10 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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
                          <th className="p-2 text-left text-xs font-semibold sm:text-sm w-24 sm:w-32">Tipo</th>
                          <th className="p-2 text-left text-xs font-semibold sm:text-sm min-w-[180px] sm:min-w-[200px]">Producto</th>
                          <th className="p-2 text-left text-xs font-semibold sm:text-sm min-w-[200px] sm:min-w-[250px]">Descripción</th>
                          <th className="p-2 text-left text-xs font-semibold sm:text-sm min-w-[90px] sm:min-w-[100px]">Cant.</th>
                          <th className="p-2 text-left text-xs font-semibold sm:text-sm w-20">Unidad</th>
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
                            <Select
                              value={item.tipo}
                              onValueChange={(value: any) => actualizarItem(item.id, 'tipo', value)}
                            >
                              <SelectTrigger className="h-9 w-full">
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
                                  searchPlaceholder="Buscar artículo..."
                                emptyMessage="No se encontraron artículos"
                              />
                            ) : (
                              <ProductoCombobox
                                value={item.tejido_id}
                                onChange={(value) => actualizarItem(item.id, 'tejido_id', value)}
                                productos={tejidos.map((tej) => ({
                                  id: tej.id,
                                  label: tej.codigo,
                                    sublabel: [
                                      tej.nombre,
                                      tej.altura ? `${tej.altura}m` : null,
                                      tej.tamano_rombo ? `Rombo ${tej.tamano_rombo}` : null,
                                      tej.calibre ? `Calibre ${tej.calibre}` : null,
                                    ]
                                      .filter(Boolean)
                                      .join(' • '),
                                    meta: {
                                      altura: tej.altura !== undefined && tej.altura !== null ? tej.altura.toString() : '',
                                      tamano_rombo: tej.tamano_rombo !== undefined && tej.tamano_rombo !== null ? tej.tamano_rombo.toString() : '',
                                      calibre: tej.calibre !== undefined && tej.calibre !== null ? tej.calibre.toString() : '',
                                    },
                                }))}
                                placeholder="Buscar tejido..."
                                  searchPlaceholder="Buscar tejido..."
                                emptyMessage="No se encontraron tejidos"
                                  filters={filtrosTejidos}
                              />
                            )}
                          </td>
                          <td className="p-2">
                            <Input
                              value={item.descripcion}
                              onChange={(e) => actualizarItem(item.id, 'descripcion', e.target.value)}
                              placeholder="Descripción..."
                                className="h-9 w-full"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  agregarItem()
                                }
                              }}
                            />
                          </td>
                          <td className="p-2 min-w-[90px] sm:min-w-[100px]">
                            <Input
                              type="number"
                              min={item.tipo === 'tejido' ? '0.01' : '1'}
                              step={item.tipo === 'tejido' ? '0.01' : '1'}
                              value={item.cantidad}
                              onChange={(e) => actualizarItem(item.id, 'cantidad', e.target.value)}
                              placeholder={item.tipo === 'tejido' ? '1.5' : '1'}
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
                                  <SelectValue placeholder="Seleccionar unidad" />
                                </SelectTrigger>
                                <SelectContent>
                                  {unidadesDisponibles.length === 0 && (
                                    <div className="px-2 py-2 text-xs text-muted-foreground">
                                      No hay unidades disponibles
                                    </div>
                                  )}
                                  {unidadesDisponibles.map((unidad) => (
                                    <SelectItem key={unidad} value={unidad}>
                                      {unidad}
                                    </SelectItem>
                                  ))}
                                  {item.unidad &&
                                    !unidadesDisponibles.includes(item.unidad) && (
                                      <SelectItem value={item.unidad}>
                                        {item.unidad}
                                      </SelectItem>
                                    )}
                                </SelectContent>
                              </Select>
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

                <div className="space-y-4 sm:hidden">
                  {items.map((item, index) => (
                    <div key={item.id} className="rounded-lg border p-4 shadow-sm">
                      <div className="mb-3 flex items-center justify-between text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Ítem #{index + 1}</span>
                        <button
                          type="button"
                          onClick={() => eliminarItem(item.id)}
                          className="text-destructive underline-offset-2 hover:underline"
                        >
                          Eliminar
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label className="text-xs uppercase text-muted-foreground">Tipo</Label>
                          <Select
                            value={item.tipo}
                            onValueChange={(value: any) => actualizarItem(item.id, 'tipo', value)}
                          >
                            <SelectTrigger className="h-10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="articulo">Artículo</SelectItem>
                              <SelectItem value="tejido">Tejido</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs uppercase text-muted-foreground">Producto</Label>
                          {item.tipo === 'articulo' ? (
                            <ProductoCombobox
                              value={item.articulo_id?.toString()}
                              onChange={(value) => actualizarItem(item.id, 'articulo_id', value)}
                              productos={articulos.map((art) => ({
                                id: art.id,
                                label: art.nombre,
                                sublabel: art.unidad,
                              }))}
                              placeholder="Buscar artículo..."
                              searchPlaceholder="Buscar artículo..."
                              emptyMessage="No se encontraron artículos"
                              className="h-10"
                            />
                          ) : (
                            <ProductoCombobox
                              value={item.tejido_id}
                              onChange={(value) => actualizarItem(item.id, 'tejido_id', value)}
                              productos={tejidos.map((tej) => ({
                                id: tej.id,
                                label: tej.codigo,
                                sublabel: [
                                  tej.nombre,
                                  tej.altura ? `${tej.altura}m` : null,
                                  tej.tamano_rombo ? `Rombo ${tej.tamano_rombo}` : null,
                                  tej.calibre ? `Calibre ${tej.calibre}` : null,
                                ]
                                  .filter(Boolean)
                                  .join(' • '),
                                meta: {
                                  altura: tej.altura !== undefined && tej.altura !== null ? tej.altura.toString() : '',
                                  tamano_rombo: tej.tamano_rombo !== undefined && tej.tamano_rombo !== null ? tej.tamano_rombo.toString() : '',
                                  calibre: tej.calibre !== undefined && tej.calibre !== null ? tej.calibre.toString() : '',
                                },
                              }))}
                              placeholder="Buscar tejido..."
                              searchPlaceholder="Buscar tejido..."
                              emptyMessage="No se encontraron tejidos"
                              filters={filtrosTejidos}
                              className="h-10"
                            />
                          )}
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs uppercase text-muted-foreground">Descripción</Label>
                          <div className="min-h-10 rounded-md border border-dashed border-input bg-muted/30 px-3 py-2 text-sm leading-relaxed text-muted-foreground">
                            {item.descripcion && item.descripcion.trim().length > 0 ? item.descripcion : 'Sin descripción'}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs uppercase text-muted-foreground">Cantidad</Label>
                            <Input
                              type="number"
                              min={item.tipo === 'tejido' ? '0.01' : '1'}
                              step={item.tipo === 'tejido' ? '0.01' : '1'}
                              value={item.cantidad}
                              onChange={(e) => actualizarItem(item.id, 'cantidad', e.target.value)}
                              placeholder={item.tipo === 'tejido' ? '1.5' : '1'}
                              className="h-10 text-right"
                            />
                          </div>
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
                                {unidadesDisponibles.map((unidad) => (
                                  <SelectItem key={unidad} value={unidad}>
                                    {unidad}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
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
                            <div className="h-10 rounded-md border border-input bg-muted/50 px-3 text-right font-semibold leading-[2.5rem] text-green-600">
                              ${item.precio_total.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 sm:hidden">
                  <Button type="button" onClick={agregarItem} className="w-full">
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
        </div>

        {/* Preview Lateral */}
        <div className="w-full">
            <Card className="">
            <CardHeader className="space-y-3">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <FileText className="h-5 w-5" />
                Resumen
              </CardTitle>
              <CardDescription className="text-sm">
                Preview del presupuesto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3">
                <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-muted-foreground">Cliente:</span>
                  <span className="font-medium text-right sm:text-left">
                    {formData.cliente_nombre || 'Sin nombre'}
                  </span>
                </div>
                  <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-muted-foreground">Vendedor:</span>
                    <span className="truncate text-right font-medium sm:text-left">
                      {userEmail || '—'}
                  </span>
                </div>
                <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-muted-foreground">Items:</span>
                  <span className="font-medium">{items.length}</span>
                </div>
                <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-muted-foreground">Validez:</span>
                  <span className="font-medium">{formData.validez_dias} días</span>
                </div>
                  <div className="flex flex-col gap-1 border-t pt-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-muted-foreground">Forma de pago:</span>
                    <div className="flex items-center gap-2 sm:justify-end">
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
                    min="0"
                    step="1"
                    value={formData.descuento}
                    onChange={(e) => setFormData({ ...formData, descuento: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                  {/* Mostrar IVA solo si NO es efectivo */}
                  {!esEfectivo && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Base imponible (sin IVA)</span>
                        <span className="text-sm font-semibold">
                          ${baseSinIva.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">IVA 21%</span>
                        <span className="text-sm font-semibold">
                          ${iva21.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </>
                  )}

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

          {/* Botones al final */}
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="submit"
              disabled={loading || items.length === 0}
              className="w-full justify-center sm:w-auto sm:justify-between"
            >
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline-block">{loading ? 'Guardar presupuesto' : 'Guardar presupuesto'}</span>
              <span className="sm:hidden">{loading ? 'Guardando' : 'Guardar'}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              asChild
              className="w-full justify-center sm:w-auto sm:justify-between"
            >
              <Link href="/dashboard/presupuestos" className="flex items-center gap-2">
                <X className="h-4 w-4" />
                <span className="hidden sm:inline-block">Cancelar</span>
                <span className="sm:hidden">Salir</span>
              </Link>
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

