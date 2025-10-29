'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { ArrowLeft, Edit, Download, Copy, Calendar, User, Phone, Mail, MapPin, FileText, Package } from 'lucide-react'
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

      setPresupuesto(presData)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!presupuesto) return null

  const estadoBadgeVariant = (estado: string) => {
    switch (estado) {
      case 'aprobado': return 'default'
      case 'enviado': return 'secondary'
      case 'borrador': return 'outline'
      case 'rechazado': return 'destructive'
      case 'vencido': return 'destructive'
      default: return 'outline'
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={descargarPDF}>
            <Download className="h-4 w-4 mr-2" />
            Descargar PDF
          </Button>
          <Button variant="outline">
            <Copy className="h-4 w-4 mr-2" />
            Duplicar
          </Button>
          <Button asChild>
            <Link href={`/dashboard/presupuestos/editar/${params.id}`}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Link>
          </Button>
        </div>
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
              <Button className="w-full" variant="outline">
                <Copy className="h-4 w-4 mr-2" />
                Duplicar Presupuesto
              </Button>
              <Button className="w-full" variant="outline" asChild>
                <Link href={`/dashboard/presupuestos/editar/${params.id}`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

