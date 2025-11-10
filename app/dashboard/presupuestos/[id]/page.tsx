'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { ArrowLeft, Download, Copy, Calendar, User, Phone, Mail, MapPin, FileText, Package, MessageSquareText, Trash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { generarPDFPresupuesto } from '@/lib/pdf-generator'

export default function VerPresupuestoPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [presupuesto, setPresupuesto] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [vendedorNombre, setVendedorNombre] = useState<string>('')
  const [eliminando, setEliminando] = useState(false)

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

  async function darDeBajaPresupuesto() {
    if (!presupuesto || presupuesto.estado === 'baja') {
      if (presupuesto?.estado === 'baja') {
        toast({
          title: 'El presupuesto ya está dado de baja',
          description: 'No es necesario realizar ninguna acción adicional.',
        })
      }
      return
    }
    const confirmar = window.confirm(
      '¿Estás seguro de que quieres dar de baja este presupuesto? Esta acción no eliminará el registro, pero lo marcará como no vigente.'
    )
    if (!confirmar) return
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link href="/dashboard/presupuestos">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{presupuesto.numero}</h1>
              <Badge variant={tipoBadge}>
                {presupuesto.tipo === 'articulos' ? 'Artículos' : 'Cercado'}
              </Badge>
              <Badge variant={estadoBadgeVariant(presupuesto.estado)}>
                {presupuesto.estado?.charAt(0).toUpperCase() + presupuesto.estado?.slice(1)}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              Presupuesto para {presupuesto.cliente_nombre}
            </p>
          </div>
        </div>
        <div />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Datos del Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Datos del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Nombre</p>
                  <p className="font-semibold">{presupuesto.cliente_nombre}</p>
                </div>
                {presupuesto.cliente_telefono && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Teléfono</p>
                      <p className="font-medium">{presupuesto.cliente_telefono}</p>
                    </div>
                  </div>
                )}
              </div>
              {vendedorNombre && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Vendedor</p>
                    <p className="font-medium">{vendedorNombre}</p>
                  </div>
                </div>
              )}
              {presupuesto.cliente_email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{presupuesto.cliente_email}</p>
                  </div>
                </div>
              )}
              {presupuesto.cliente_direccion && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Dirección</p>
                    <p className="font-medium">{presupuesto.cliente_direccion}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items del Presupuesto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Items del Presupuesto
              </CardTitle>
              <CardDescription>{items.length} items en total</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 bg-muted/50">
                      <th className="p-3 text-left font-semibold text-sm">#</th>
                      <th className="p-3 text-left font-semibold text-sm">Descripción</th>
                      <th className="p-3 text-right font-semibold text-sm">Cant.</th>
                      <th className="p-3 text-left font-semibold text-sm">Unidad</th>
                      <th className="p-3 text-right font-semibold text-sm">P. Unit.</th>
                      <th className="p-3 text-right font-semibold text-sm">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={item.id} className="border-b">
                        <td className="p-3 text-muted-foreground">{index + 1}</td>
                        <td className="p-3">{item.descripcion}</td>
                        <td className="p-3 text-right font-medium">{item.cantidad}</td>
                        <td className="p-3">{item.unidad}</td>
                        <td className="p-3 text-right">${item.precio_unitario?.toLocaleString()}</td>
                        <td className="p-3 text-right font-bold text-green-600">
                          ${item.precio_total?.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t-2 bg-muted/30">
                      <td colSpan={5} className="p-3 text-right font-semibold">Subtotal:</td>
                      <td className="p-3 text-right font-bold text-lg">
                        ${presupuesto.subtotal?.toLocaleString()}
                      </td>
                    </tr>
                    {presupuesto.descuento > 0 && (
                      <tr className="border-b">
                        <td colSpan={5} className="p-3 text-right font-semibold">Descuento:</td>
                        <td className="p-3 text-right font-bold text-red-600">
                          -${presupuesto.descuento?.toLocaleString()}
                        </td>
                      </tr>
                    )}
                    {/* Mostrar IVA solo si NO es efectivo */}
                    {presupuesto.forma_pago && presupuesto.forma_pago !== 'efectivo' && presupuesto.total > 0 && (
                      <>
                        <tr className="border-b">
                          <td colSpan={5} className="p-3 text-right font-semibold">Base imponible (sin IVA):</td>
                          <td className="p-3 text-right font-semibold">
                            ${(presupuesto.total / 1.21).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td colSpan={5} className="p-3 text-right font-semibold">IVA 21%:</td>
                          <td className="p-3 text-right font-semibold">
                            ${((presupuesto.total / 1.21) * 0.21).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </>
                    )}
                    <tr className="border-t-2 bg-green-50">
                      <td colSpan={5} className="p-4 text-right font-bold text-lg">TOTAL:</td>
                      <td className="p-4 text-right font-bold text-2xl text-green-600">
                        ${presupuesto.total?.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Observaciones y Condiciones */}
          {(presupuesto.observaciones || presupuesto.condiciones_comerciales) && (
            <div className="grid gap-6 md:grid-cols-2">
              {presupuesto.observaciones && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Observaciones</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-line">{presupuesto.observaciones}</p>
                  </CardContent>
                </Card>
              )}
              {presupuesto.condiciones_comerciales && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Condiciones Comerciales</CardTitle>
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
          {/* Información General */}
          <Card>
            <CardHeader>
              <CardTitle>Información</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Fecha Emisión</p>
                  <p className="font-medium">
                    {new Date(presupuesto.fecha_emision).toLocaleDateString('es-AR')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Vencimiento</p>
                  <p className="font-medium">
                    {new Date(presupuesto.fecha_vencimiento).toLocaleDateString('es-AR')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Validez</p>
                  <p className="font-medium">{presupuesto.validez_dias} días</p>
                </div>
              </div>

              <div className="pt-3 border-t">
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

          {/* Totales */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Items:</span>
                <span className="font-semibold">{items.length}</span>
              </div>
              {vendedorNombre && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Vendedor:</span>
                  <span className="font-semibold">{vendedorNombre}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Subtotal:</span>
                <span className="font-semibold">${presupuesto.subtotal?.toLocaleString()}</span>
              </div>
              {presupuesto.descuento > 0 && (
                <div className="flex justify-between text-red-600">
                  <span className="text-sm">Descuento:</span>
                  <span className="font-semibold">-${presupuesto.descuento?.toLocaleString()}</span>
                </div>
              )}
              {/* Mostrar IVA solo si NO es efectivo */}
              {presupuesto.forma_pago && presupuesto.forma_pago !== 'efectivo' && presupuesto.total > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Base imponible (sin IVA):</span>
                    <span className="text-sm font-semibold">
                      ${(presupuesto.total / 1.21).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">IVA 21%:</span>
                    <span className="text-sm font-semibold">
                      ${((presupuesto.total / 1.21) * 0.21).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between pt-3 border-t-2">
                <span className="font-bold">TOTAL:</span>
                <span className="text-2xl font-bold text-green-600">
                  ${presupuesto.total?.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Acciones */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" onClick={descargarPDF}>
                <Download className="h-4 w-4 mr-2" />
                Descargar PDF
              </Button>
            <Button className="w-full" variant="secondary" onClick={copiarResumen}>
              <MessageSquareText className="h-4 w-4 mr-2" />
              Copiar resumen para WhatsApp
            </Button>
            <Button
              className="w-full"
              variant="destructive"
              onClick={darDeBajaPresupuesto}
              disabled={eliminando || presupuesto.estado === 'baja'}
            >
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
    </div>
  )
}

