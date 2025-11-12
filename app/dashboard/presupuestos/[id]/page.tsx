'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { ArrowLeft, Download, Copy, Calendar, User, Phone, Mail, MapPin, FileText, Package, MessageSquareText, Trash, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { generarPDFPresupuesto } from '@/lib/pdf-generator'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

export default function VerPresupuestoPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [presupuesto, setPresupuesto] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [vendedorNombre, setVendedorNombre] = useState<string>('')
  const [eliminando, setEliminando] = useState(false)
  const [confirmacionAbierta, setConfirmacionAbierta] = useState(false)
  const [textoConfirmacion, setTextoConfirmacion] = useState('')
  const [itemsAbiertos, setItemsAbiertos] = useState(true)

  useEffect(() => {
    cargarPresupuesto()
  }, [params.id])

  async function cargarPresupuesto() {
    try {
      setLoading(true)
      
      // Cargar presupuesto
      const { data: presData, error: presError } = await supabase
        .from('presupuestos')
        .select('*')
        .eq('id', params.id)
        .single()

      if (presError) throw presError

      // Cargar items
      const { data: itemsData, error: itemsError } = await supabase
        .from('presupuestos_items')
        .select('*')
        .eq('presupuesto_id', params.id)
        .order('orden')

      if (itemsError) throw itemsError

      // Cargar vendedor
      if (presData?.usuario_id) {
        const { data: vend } = await supabase
          .from('usuarios')
          .select('nombre')
          .eq('id', presData.usuario_id)
          .single()
        setVendedorNombre(vend?.nombre || '')
      } else {
        setVendedorNombre('')
      }

      let clienteInfo: any = null
      if (presData?.cliente_id) {
        const { data: clienteData } = await supabase
          .from('clientes')
          .select('nombre_completo, telefono, email, direccion, tipo_documento, numero_documento')
          .eq('id', presData.cliente_id)
          .single()
        clienteInfo = clienteData
      }

      setPresupuesto({
        ...presData,
        cliente_nombre:
          presData?.cliente_nombre ||
          clienteInfo?.nombre_completo ||
          '',
        cliente_telefono:
          presData?.cliente_telefono ||
          clienteInfo?.telefono ||
          '',
        cliente_email:
          presData?.cliente_email ||
          clienteInfo?.email ||
          '',
        cliente_direccion:
          presData?.cliente_direccion ||
          clienteInfo?.direccion ||
          '',
        tipo_documento:
          presData?.tipo_documento ||
          clienteInfo?.tipo_documento ||
          '',
        numero_documento:
          presData?.numero_documento ||
          clienteInfo?.numero_documento ||
          '',
      })
      setItems(itemsData || [])
    } catch (error: any) {
      console.error('Error:', error)
      toast({
        title: "Error al cargar presupuesto",
        description: error.message,
        variant: "destructive",
      })
      router.push('/dashboard/presupuestos')
    } finally {
      setLoading(false)
    }
  }

  async function cambiarEstado(nuevoEstado: string) {
    try {
      const { error } = await supabase
        .from('presupuestos')
        .update({ estado: nuevoEstado })
        .eq('id', params.id)

      if (error) throw error

      toast({
        title: "¡Actualizado!",
        description: `Estado cambiado a ${nuevoEstado}`,
      })

      cargarPresupuesto()
    } catch (error: any) {
      console.error('Error:', error)
      toast({
        title: "Error al cambiar estado",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  function descargarPDF() {
    try {
      generarPDFPresupuesto({ ...presupuesto, vendedor_nombre: vendedorNombre }, items)
      toast({
        title: "¡PDF Generado!",
        description: "El presupuesto se ha descargado correctamente",
      })
    } catch (error: any) {
      console.error('Error:', error)
      toast({
        title: "Error al generar PDF",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  function abrirDialogoBaja() {
    if (!presupuesto || presupuesto.estado === 'baja') {
      if (presupuesto?.estado === 'baja') {
        toast({
          title: 'El presupuesto ya está dado de baja',
          description: 'No es necesario realizar ninguna acción adicional.',
        })
      }
      return
    }
    setTextoConfirmacion('')
    setConfirmacionAbierta(true)
  }

  async function confirmarBaja() {
    if (!presupuesto || presupuesto.estado === 'baja') {
      if (presupuesto?.estado === 'baja') {
        toast({
          title: 'El presupuesto ya está dado de baja',
          description: 'No es necesario realizar ninguna acción adicional.',
        })
      }
      return
    }
    if (textoConfirmacion.trim().toUpperCase() !== 'BAJA') {
      toast({
        title: 'Acción cancelada',
        description: 'Debes escribir la palabra BAJA para confirmar la operación.',
      })
      return
    }
    await darDeBajaPresupuesto()
  }

  async function darDeBajaPresupuesto() {
    if (!presupuesto || presupuesto.estado === 'baja') {
      return
    }
    try {
      setEliminando(true)
      const { error } = await supabase
        .from('presupuestos')
        .update({ estado: 'baja' })
        .eq('id', presupuesto.id)

      if (error) throw error

      toast({
        title: 'Presupuesto dado de baja',
        description: `El presupuesto ${presupuesto.numero} fue marcado como baja.`,
      })

      setConfirmacionAbierta(false)
      setTextoConfirmacion('')
      router.push('/dashboard/presupuestos')
    } catch (error: any) {
      console.error('Error al dar de baja:', error)
      toast({
        title: 'Error al dar de baja',
        description: error.message,
        variant: 'destructive',
      })
      setEliminando(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!presupuesto) return null

  const formatearMoneda = (valor?: number | null) =>
    (valor ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const generarResumenWhatsapp = () => {
    const lineas: string[] = []
    lineas.push(`💼 *Presupuesto ${presupuesto.numero}*`)
    lineas.push(`📅 ${new Date(presupuesto.fecha_emision).toLocaleDateString('es-AR')} | Validez: ${presupuesto.validez_dias} días`)
    lineas.push(`👤 Cliente: ${presupuesto.cliente_nombre}`)
    if (presupuesto.cliente_telefono) {
      lineas.push(`📞 Tel: ${presupuesto.cliente_telefono}`)
    }
    if (vendedorNombre) {
      lineas.push(`🧑‍💼 Vendedor: ${vendedorNombre}`)
    }
    if (presupuesto.forma_pago) {
      const etiquetasFormaPago: Record<string, string> = {
        efectivo: 'Efectivo',
        lista: 'Factura / Lista',
        tarjeta: 'Tarjeta',
        echeq45: 'E-cheq 45 días',
        echeq60: 'E-cheq 60 días',
        echeq90: 'E-cheq 90 días',
      }
      lineas.push(`💳 Forma de pago: ${etiquetasFormaPago[presupuesto.forma_pago] || presupuesto.forma_pago}`)
    }
    lineas.push('')
    lineas.push('📝 *Detalle:*')
    if (items.length === 0) {
      lineas.push('• (sin ítems cargados)')
    } else {
      items.forEach((item, index) => {
        const descripcion = item.descripcion || `Item ${index + 1}`
        const cantidad = item.cantidad ? `${item.cantidad} ${item.unidad || ''}`.trim() : ''
        const precioUnitario = item.precio_unitario ? `u$ ${formatearMoneda(item.precio_unitario)}` : ''
        const total = item.precio_total ? `Total $${formatearMoneda(item.precio_total)}` : ''
        const partes = [descripcion]
        if (cantidad) partes.push(cantidad)
        if (precioUnitario) partes.push(precioUnitario)
        if (total) partes.push(total)
        lineas.push(`• ${partes.join(' | ')}`)
      })
    }
    lineas.push('')
    lineas.push(`💵 Subtotal: $${formatearMoneda(presupuesto.subtotal)}`)
    if (presupuesto.descuento > 0) {
      lineas.push(`🎯 Descuento: -$${formatearMoneda(presupuesto.descuento)}`)
    }
    if (presupuesto.forma_pago !== 'efectivo' && presupuesto.total > 0) {
      const baseSinIva = presupuesto.total / 1.21
      const iva = baseSinIva * 0.21
      lineas.push(`🧾 Base imponible: $${formatearMoneda(baseSinIva)}`)
      lineas.push(`📈 IVA 21%: $${formatearMoneda(iva)}`)
    }
    lineas.push(`✅ *TOTAL: $${formatearMoneda(presupuesto.total)}*`)

    if (presupuesto.condiciones_comerciales) {
      lineas.push('')
      lineas.push('📌 Condiciones:')
      lineas.push(presupuesto.condiciones_comerciales)
    }

    return lineas.join('\n')
  }

  const copiarResumen = async () => {
    try {
      const texto = generarResumenWhatsapp()
      await navigator.clipboard.writeText(texto)
      toast({
        title: 'Copiado al portapapeles',
        description: 'Resumen listo para compartir por WhatsApp.',
      })
    } catch (error: any) {
      console.error('Error al copiar:', error)
      toast({
        title: 'Error al copiar',
        description: 'No se pudo copiar el resumen. Intenta nuevamente.',
        variant: 'destructive',
      })
    }
  }

  const estadoBadgeVariant = (estado: string) => {
    switch (estado) {
      case 'aprobado':
        return 'default'
      case 'enviado':
        return 'secondary'
      case 'borrador':
        return 'outline'
      case 'rechazado':
      case 'vencido':
      case 'baja':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const tipoBadge = presupuesto.tipo === 'cercado' ? 'default' : 'secondary'
  const fechaEmision = new Date(presupuesto.fecha_emision).toLocaleDateString('es-AR')
  const fechaVencimiento = presupuesto.fecha_vencimiento
    ? new Date(presupuesto.fecha_vencimiento).toLocaleDateString('es-AR')
    : null
  const etiquetasFormaPago: Record<string, string> = {
    efectivo: 'Efectivo',
    lista: 'Factura / Lista',
    tarjeta: 'Tarjeta',
    echeq45: 'E-cheq 45 días',
    echeq60: 'E-cheq 60 días',
    echeq90: 'E-cheq 90 días',
  }
  const formaPagoLabel = presupuesto.forma_pago
    ? etiquetasFormaPago[presupuesto.forma_pago] || presupuesto.forma_pago
    : '—'
  const resumenRapidoMobile = [
    {
      label: 'Total',
      value: `$${formatearMoneda(presupuesto.total)}`,
      tone: 'text-green-600',
      helper: presupuesto.forma_pago === 'efectivo' ? 'Sin IVA' : 'IVA incluido',
    },
    {
      label: 'Validez',
      value: `${presupuesto.validez_dias} día${presupuesto.validez_dias === 1 ? '' : 's'}`,
      helper: fechaVencimiento ? `Vence ${fechaVencimiento}` : undefined,
    },
    {
      label: 'Forma de pago',
      value: formaPagoLabel,
      helper: presupuesto.estado ? `Estado: ${presupuesto.estado}` : undefined,
    },
    {
      label: 'Emitido',
      value: fechaEmision,
      helper: vendedorNombre ? `Vendedor: ${vendedorNombre}` : undefined,
    },
  ]

  const detallesCliente = [
    presupuesto.tipo_documento && presupuesto.numero_documento
      ? {
          icon: FileText,
          label: presupuesto.tipo_documento,
          value: presupuesto.numero_documento,
        }
      : null,
    presupuesto.cliente_telefono
      ? {
          icon: Phone,
          label: 'Teléfono',
          value: presupuesto.cliente_telefono,
        }
      : null,
    presupuesto.cliente_email
      ? {
          icon: Mail,
          label: 'Email',
          value: presupuesto.cliente_email,
        }
      : null,
    presupuesto.cliente_direccion
      ? {
          icon: MapPin,
          label: 'Dirección',
          value: presupuesto.cliente_direccion,
        }
      : null,
  ].filter(Boolean) as Array<{ icon: typeof Phone; label: string; value: string }>

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="w-full space-y-3">
            <Button
              variant="outline"
              asChild
              className="w-full justify-center gap-2 sm:w-auto sm:justify-start"
            >
              <Link href="/dashboard/presupuestos">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Volver</span>
                <span className="sm:hidden">Atrás</span>
              </Link>
            </Button>
            <div className="space-y-2 rounded-lg border border-border/60 bg-card px-4 py-4 sm:border-none sm:bg-transparent sm:px-0 sm:py-0">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="text-2xl font-bold sm:text-3xl">{presupuesto.numero}</h1>
                <Badge variant={tipoBadge}>
                  {presupuesto.tipo === 'articulos' ? 'Artículos' : 'Cercado'}
                </Badge>
                <Badge variant={estadoBadgeVariant(presupuesto.estado)}>
                  {presupuesto.estado?.charAt(0).toUpperCase() + presupuesto.estado?.slice(1)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground sm:text-base">
                Presupuesto para {presupuesto.cliente_nombre}
              </p>
            </div>
          </div>
          <div className="grid w-full gap-2 sm:w-[220px]">
            <Button
              className="h-12 w-full justify-center gap-2 text-sm font-semibold sm:justify-center sm:text-base"
              onClick={descargarPDF}
            >
              <Download className="h-5 w-5" />
              <span className="hidden sm:inline">Descargar PDF</span>
              <span className="sm:hidden">PDF</span>
            </Button>
            <Button
              className="h-12 w-full justify-center gap-2 text-sm font-semibold sm:justify-center sm:text-base"
              variant="secondary"
              onClick={copiarResumen}
            >
              <MessageSquareText className="h-5 w-5" />
              <span className="hidden sm:inline">Resumen WhatsApp</span>
              <span className="sm:hidden">WhatsApp</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:hidden">
          {resumenRapidoMobile.map((chip) => (
            <div
              key={chip.label}
              className="rounded-lg border border-border/60 bg-card p-3 text-xs"
            >
              <p className="font-semibold uppercase tracking-wide text-muted-foreground">
                {chip.label}
              </p>
              <p className={`text-base font-bold ${chip.tone ?? ''}`}>{chip.value}</p>
              {chip.helper && (
                <p className="mt-1 text-[11px] text-muted-foreground/80">{chip.helper}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Datos del Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <User className="h-5 w-5" />
                Datos del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-border/50 bg-muted/40 px-3 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nombre</p>
                <p className="text-base font-semibold">{presupuesto.cliente_nombre}</p>
              </div>
              {detallesCliente.length > 0 ? (
                <div className="space-y-3">
                  {detallesCliente.map((detalle) => {
                    const Icono = detalle.icon
                    return (
                      <div
                        key={detalle.label}
                        className="flex items-start gap-3 rounded-lg border border-border/40 p-3"
                      >
                        <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          <Icono className="h-4 w-4" />
                        </span>
                        <div className="flex-1">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {detalle.label}
                          </p>
                          <p className="text-sm font-medium break-words text-foreground">
                            {detalle.value}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sin información adicional del cliente.</p>
              )}
            </CardContent>
          </Card>

          {/* Items del Presupuesto */}
          <Collapsible open={itemsAbiertos} onOpenChange={setItemsAbiertos}>
            <Card>
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Package className="h-5 w-5" />
                    Items del Presupuesto
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {items.length} ítem{items.length === 1 ? '' : 's'} en total
                  </CardDescription>
                </div>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto inline-flex data-[state=open]:rotate-180"
                  >
                    <ChevronDown className="h-5 w-5" />
                  </Button>
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent>
                  <div className="rounded-lg border">
                    <div className="hidden overflow-x-auto sm:block">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="p-3 text-left font-semibold">#</th>
                            <th className="p-3 text-left font-semibold">Descripción</th>
                            <th className="p-3 text-right font-semibold">Cant.</th>
                            <th className="p-3 text-left font-semibold">Unidad</th>
                            <th className="p-3 text-right font-semibold">P. Unit.</th>
                            <th className="p-3 text-right font-semibold">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item, index) => (
                            <tr key={item.id} className="border-b">
                              <td className="p-3 text-muted-foreground">{index + 1}</td>
                              <td className="p-3">
                                {item.descripcion || 'Sin descripción'}
                              </td>
                              <td className="p-3 text-right font-medium">{item.cantidad}</td>
                              <td className="p-3">{item.unidad}</td>
                              <td className="p-3 text-right">
                                ${formatearMoneda(item.precio_unitario)}
                              </td>
                              <td className="p-3 text-right font-bold text-green-600">
                                ${formatearMoneda(item.precio_total)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="divide-y sm:hidden">
                      {items.map((item, index) => (
                        <div key={item.id} className="space-y-2 p-3 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground">#{index + 1}</span>
                            <span className="font-bold text-green-600">
                              ${formatearMoneda(item.precio_total)}
                            </span>
                          </div>
                          <p className="font-medium leading-snug">
                            {item.descripcion || 'Sin descripción'}
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <div>
                              <p className="font-semibold uppercase">Cant.</p>
                              <p>{item.cantidad}</p>
                            </div>
                            <div>
                              <p className="font-semibold uppercase">Unidad</p>
                              <p>{item.unidad}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="font-semibold uppercase">P. Unit.</p>
                              <p>${formatearMoneda(item.precio_unitario)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 rounded-lg bg-muted/40 p-3 text-sm sm:text-base">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-muted-foreground">Subtotal:</span>
                      <span className="font-bold">${formatearMoneda(presupuesto.subtotal)}</span>
                    </div>
                    {presupuesto.descuento > 0 && (
                      <div className="flex items-center justify-between text-red-600">
                        <span className="font-semibold">Descuento:</span>
                        <span className="font-bold">-${formatearMoneda(presupuesto.descuento)}</span>
                      </div>
                    )}
                    {presupuesto.forma_pago && presupuesto.forma_pago !== 'efectivo' && presupuesto.total > 0 && (
                      <>
                        <div className="flex items-center justify-between text-xs text-muted-foreground sm:text-sm">
                          <span>Base imponible (sin IVA)</span>
                          <span className="font-semibold">
                            ${(presupuesto.total / 1.21).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground sm:text-sm">
                          <span>IVA 21%</span>
                          <span className="font-semibold">
                            ${((presupuesto.total / 1.21) * 0.21).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </>
                    )}
                    <div className="flex items-center justify-between border-t border-muted pt-2 text-base font-bold text-green-600 sm:text-xl">
                      <span>Total:</span>
                      <span>${formatearMoneda(presupuesto.total)}</span>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {(presupuesto.observaciones || presupuesto.condiciones_comerciales) && (
            <div className="grid gap-6 md:grid-cols-2">
              {presupuesto.observaciones && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Observaciones</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-line">{presupuesto.observaciones}</p>
                  </CardContent>
                </Card>
              )}
              {presupuesto.condiciones_comerciales && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Condiciones Comerciales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-line">{presupuesto.condiciones_comerciales}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Información</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Fecha Emisión</p>
                  <p className="text-sm font-medium">
                    {new Date(presupuesto.fecha_emision).toLocaleDateString('es-AR')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Vencimiento</p>
                  <p className="text-sm font-medium">
                    {new Date(presupuesto.fecha_vencimiento).toLocaleDateString('es-AR')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Validez</p>
                  <p className="text-sm font-medium">{presupuesto.validez_dias} días</p>
                </div>
              </div>

              <div className="border-t pt-3">
                <p className="text-xs text-muted-foreground mb-2">Estado del Presupuesto</p>
                <Select value={presupuesto.estado} onValueChange={cambiarEstado}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="borrador">Borrador</SelectItem>
                    <SelectItem value="enviado">Enviado</SelectItem>
                    <SelectItem value="aprobado">Aprobado</SelectItem>
                    <SelectItem value="rechazado">Rechazado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm sm:text-base">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Items:</span>
                <span className="font-semibold">{items.length}</span>
              </div>
              {vendedorNombre && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vendedor:</span>
                  <span className="font-semibold">{vendedorNombre}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-semibold">${presupuesto.subtotal?.toLocaleString()}</span>
              </div>
              {presupuesto.descuento > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Descuento:</span>
                  <span className="font-semibold">-${presupuesto.descuento?.toLocaleString()}</span>
                </div>
              )}
              {presupuesto.forma_pago && presupuesto.forma_pago !== 'efectivo' && presupuesto.total > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base imponible (sin IVA):</span>
                    <span className="font-semibold">
                      ${(presupuesto.total / 1.21).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IVA 21%:</span>
                    <span className="font-semibold">
                      ${((presupuesto.total / 1.21) * 0.21).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between border-t-2 pt-3">
                <span className="font-bold">TOTAL:</span>
                <span className="text-2xl font-bold text-green-600">
                  ${presupuesto.total?.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" variant="destructive" onClick={abrirDialogoBaja} disabled={eliminando || presupuesto.estado === 'baja'}>
                <Trash className="h-4 w-4 mr-2" />
                {presupuesto.estado === 'baja'
                  ? 'Presupuesto dado de baja'
                  : eliminando
                    ? 'Marcando como baja...'
                    : 'Dar de baja'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={confirmacionAbierta}
        onOpenChange={(abierta) => {
          setConfirmacionAbierta(abierta)
          if (!abierta) {
            setTextoConfirmacion('')
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar baja del presupuesto</DialogTitle>
            <DialogDescription>
              Esta acción marcará el presupuesto como no vigente. Escribe la palabra "BAJA" para confirmar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              autoFocus
              placeholder="Escribe BAJA para confirmar"
              value={textoConfirmacion}
              onChange={(event) => setTextoConfirmacion(event.target.value)}
              className="uppercase tracking-[0.2em]"
            />
            <p className="text-xs text-muted-foreground">
              Esta operación es irreversible. El presupuesto seguirá disponible en modo lectura, pero no podrá utilizarse.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConfirmacionAbierta(false)
                setTextoConfirmacion('')
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmarBaja}
              disabled={eliminando}
            >
              {eliminando ? 'Marcando...' : 'Confirmar baja'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

