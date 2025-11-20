"use client"

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { SortableHeader } from '@/components/ui/sortable-header'
import { ColumnDef } from '@tanstack/react-table'
import Link from 'next/link'
import { DollarSign, Edit, ExternalLink, CheckCircle, XCircle, PlusCircle, Eye, FileText, CreditCard, Receipt, Copy, MessageCircle, Download, FileSpreadsheet, FileDown } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { exportarPreciosAExcel } from '@/lib/excel-generator'
import { generarPDFListaPrecios } from '@/lib/pdf-generator'

type Precio = {
  id: string
  precio_costo: number
  precio_venta: number
  margen: number
  vigente: boolean
  fecha_fin: string | null
  articulos: {
    id: string
    nombre: string
    categoria: string | null
    unidad: string | null
  } | null
}

export default function PreciosPage() {
  const [precios, setPrecio] = useState<Precio[]>([])
  const [loading, setLoading] = useState(true)
  const [precioSeleccionado, setPrecioSeleccionado] = useState<Precio | null>(null)
  const [dialogAbierto, setDialogAbierto] = useState(false)
  const [copiando, setCopiando] = useState(false)
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  useEffect(() => {
async function getTodosLosPrecios() {
  const { data, error } = await supabase
    .from('precios_venta')
    .select(`
      *,
      articulos(id, nombre, categoria, unidad)
    `)

  if (error) {
    console.error('Error:', error)
        setPrecio([])
      } else {
        const sorted = data?.sort((a: any, b: any) => {
    if (a.vigente === b.vigente) {
      return (a.articulos?.nombre || '').localeCompare(b.articulos?.nombre || '')
    }
    return a.vigente ? -1 : 1
  }) || []
        setPrecio(sorted)
      }
      setLoading(false)
    }

    getTodosLosPrecios()
  }, [supabase])

  const columns: ColumnDef<Precio>[] = [
    {
      id: "articulo",
      accessorFn: (row) => row.articulos?.nombre,
      header: ({ column }) => <SortableHeader column={column} title="Artículo" />,
      cell: ({ row }) => (
        <div className="font-medium">{row.original.articulos?.nombre}</div>
      ),
    },
    {
      accessorKey: "articulos.categoria",
      header: ({ column }) => <SortableHeader column={column} title="Categoría" />,
      cell: ({ row }) => (
        <Badge variant="secondary">
          {row.original.articulos?.categoria || 'Sin categoría'}
        </Badge>
      ),
    },
    {
      accessorKey: "precio_costo",
      header: ({ column }) => (
        <div className="text-right">
          <SortableHeader column={column} title="Costo" />
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-right">{formatCurrency(row.original.precio_costo)}</div>
      ),
    },
    {
      accessorKey: "precio_venta",
      header: ({ column }) => (
        <div className="text-right">
          <SortableHeader column={column} title="Venta" />
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-right font-medium">{formatCurrency(row.original.precio_venta)}</div>
      ),
    },
    {
      accessorKey: "margen",
      header: ({ column }) => (
        <div className="text-right">
          <SortableHeader column={column} title="Margen" />
        </div>
      ),
      cell: ({ row }) => {
        const margen = row.original.margen
        return (
          <div className="text-right">
            <span 
              className={`font-medium ${
                margen >= 30 
                  ? 'text-green-600' 
                  : margen >= 15 
                  ? 'text-yellow-600' 
                  : 'text-red-600'
              }`}
            >
              {margen.toFixed(2)}%
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: "vigente",
      header: ({ column }) => (
        <div className="text-center">
          <SortableHeader column={column} title="Vigencia" />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex flex-col items-center gap-1">
          {row.original.vigente ? (
            <Badge variant="default" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              Vigente
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <XCircle className="h-3 w-3" />
              No vigente
            </Badge>
          )}
          {row.original.fecha_fin && (
            <span className="text-xs text-muted-foreground">
              Vence: {new Date(row.original.fecha_fin).toLocaleDateString('es-AR')}
            </span>
          )}
        </div>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Acciones</div>,
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setPrecioSeleccionado(row.original)
                    setDialogAbierto(true)
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ver detalles</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/dashboard/precios/editar/${row.original.id}`}>
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Editar precio</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/dashboard/articulos/editar/${row.original.articulos?.id}`}>
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Editar artículo</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      ),
    },
  ]

  const preciosVigentes = precios.filter((p) => p.vigente).length
  const preciosNoVigentes = precios.filter((p) => !p.vigente).length

  // Función para calcular precios por tipo de pago para un precio dado
  const calcularPreciosPorTipoPagoParaExportacion = (precioVenta: number) => {
    return {
      efectivo: precioVenta * 1.0, // sin IVA
      facturaLista: precioVenta * 1.21, // con IVA 21%
      tarjeta: precioVenta * 1.3, // con IVA 21%
    }
  }

  // Función auxiliar para generar código desde ID
  const generarCodigoDesdeId = (id: string | number | undefined): string => {
    if (!id) return '-'
    if (typeof id === 'string') {
      return `ART-${id.slice(0, 8)}`
    }
    return `ART-${String(id).padStart(6, '0')}`
  }

  // Función para exportar a Excel
  const exportarAExcel = () => {
    try {
      const datosParaExportar = precios.map((precio) => {
        const preciosCalculados = calcularPreciosPorTipoPagoParaExportacion(precio.precio_venta)
        // Usar el ID del artículo como código si no hay campo codigo en la tabla
        return {
          codigo: generarCodigoDesdeId(precio.articulos?.id),
          nombre: precio.articulos?.nombre || 'Sin nombre',
          categoria: precio.articulos?.categoria || null,
          unidad: precio.articulos?.unidad || 'unidad',
          precioEfectivo: preciosCalculados.efectivo,
          precioFactura: preciosCalculados.facturaLista,
          precioTarjeta: preciosCalculados.tarjeta,
          estado: precio.vigente ? 'Vigente' : 'No vigente',
        }
      })

      exportarPreciosAExcel(datosParaExportar, 'Lista_Precios')
      
      toast({
        title: 'Excel exportado',
        description: `Se exportaron ${datosParaExportar.length} precios correctamente.`,
      })
    } catch (error) {
      console.error('Error al exportar a Excel:', error)
      toast({
        title: 'Error al exportar',
        description: 'No se pudo exportar la lista de precios. Intenta nuevamente.',
        variant: 'destructive',
      })
    }
  }

  // Función para exportar a PDF
  const exportarAPDF = () => {
    try {
      const datosParaExportar = precios.map((precio) => {
        const preciosCalculados = calcularPreciosPorTipoPagoParaExportacion(precio.precio_venta)
        // Usar el ID del artículo como código si no hay campo codigo en la tabla
        return {
          codigo: generarCodigoDesdeId(precio.articulos?.id),
          nombre: precio.articulos?.nombre || 'Sin nombre',
          categoria: precio.articulos?.categoria || null,
          unidad: precio.articulos?.unidad || 'unidad',
          precioEfectivo: preciosCalculados.efectivo,
          precioFactura: preciosCalculados.facturaLista,
          precioTarjeta: preciosCalculados.tarjeta,
          estado: precio.vigente ? 'Vigente' : 'No vigente',
        }
      })

      generarPDFListaPrecios(datosParaExportar, 'Lista_Precios')
      
      toast({
        title: 'PDF exportado',
        description: `Se exportaron ${datosParaExportar.length} precios correctamente.`,
      })
    } catch (error) {
      console.error('Error al exportar a PDF:', error)
      toast({
        title: 'Error al exportar',
        description: 'No se pudo exportar la lista de precios. Intenta nuevamente.',
        variant: 'destructive',
      })
    }
  }

  // Calcular precios por tipo de pago
  const calcularPreciosPorTipoPago = (precio: Precio | null) => {
    if (!precio) return null
    
    const precioBase = precio.precio_venta || 0
    const costo = precio.precio_costo || 0
    
    return {
      precioBase,
      costo,
      efectivo: precioBase * 1.0, // sin IVA
      facturaLista: precioBase * 1.21, // con IVA 21%
      tarjeta: precioBase * 1.3, // con IVA 21%
      echeq45: precioBase * 1.21, // con IVA 21%
      echeq60: precioBase * 1.3, // con IVA 21%
      echeq90: precioBase * 1.4, // con IVA 21%
      margen: precio.margen || 0,
    }
  }

  const preciosCalculados = calcularPreciosPorTipoPago(precioSeleccionado)

  // Función para formatear moneda sin símbolo (para WhatsApp)
  const formatearMonedaSinSimbolo = (valor: number | null | undefined) => {
    if (valor == null || isNaN(valor)) return '0,00'
    return valor.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  // Generar resumen para WhatsApp
  const generarResumenWhatsapp = () => {
    if (!precioSeleccionado || !preciosCalculados) return ''
    
    const lineas: string[] = []
    lineas.push(`💰 *${precioSeleccionado.articulos?.nombre || 'Precio'}*`)
    lineas.push('')
    lineas.push('💵 *Precios:*')
    lineas.push(`• Efectivo (c/descuento): $${formatearMonedaSinSimbolo(preciosCalculados.efectivo)}`)
    lineas.push(`• Factura/Lista: $${formatearMonedaSinSimbolo(preciosCalculados.facturaLista)} (con IVA 21%)`)
    lineas.push(`• Tarjeta: $${formatearMonedaSinSimbolo(preciosCalculados.tarjeta)} (con IVA 21%)`)
    lineas.push(`• E-cheq 45 días: $${formatearMonedaSinSimbolo(preciosCalculados.echeq45)} (con IVA 21%)`)
    lineas.push(`• E-cheq 60 días: $${formatearMonedaSinSimbolo(preciosCalculados.echeq60)} (con IVA 21%)`)
    lineas.push(`• E-cheq 90 días: $${formatearMonedaSinSimbolo(preciosCalculados.echeq90)} (con IVA 21%)`)
    
    return lineas.join('\n')
  }

  // Copiar resumen a portapapeles
  const copiarResumen = async () => {
    try {
      setCopiando(true)
      const resumen = generarResumenWhatsapp()
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(resumen)
        toast({
          title: 'Resumen copiado',
          description: 'Listo para pegar en WhatsApp.',
        })
      } else {
        toast({
          title: 'No soportado',
          description: 'Tu navegador no permite copiar automáticamente.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error al copiar resumen:', error)
      toast({
        title: 'Error al copiar',
        description: 'No se pudo copiar el resumen. Intenta nuevamente.',
        variant: 'destructive',
      })
    } finally {
      setCopiando(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestión de Precios</h2>
          <p className="text-muted-foreground mt-2">
            Total: {precios.length} precios ({preciosVigentes} vigentes, {preciosNoVigentes} no vigentes)
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportarAExcel}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Exportar a Excel (.xlsx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportarAPDF}>
                <FileDown className="mr-2 h-4 w-4" />
                Exportar a PDF (.pdf)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button asChild>
            <Link href="/dashboard/precios/nuevo">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nuevo precio
            </Link>
          </Button>
        </div>
      </div>

      {precios.length > 0 ? (
        <Card>
          <CardContent className="pt-6">
            <DataTable 
              columns={columns} 
              data={precios}
              searchKey="articulo"
              searchPlaceholder="Buscar por artículo..."
              pageSize={20}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DollarSign className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">
            No hay precios configurados
          </h3>
            <p className="text-muted-foreground mb-6 text-center">
            Agrega precios a tus artículos desde la gestión de artículos
          </p>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/dashboard/articulos">
                  Ir a Artículos
                </Link>
              </Button>
              <Button asChild>
                <Link href="/dashboard/precios/nuevo">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Crear precio
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Vista Rápida */}
      <Dialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-2xl">
                <DollarSign className="h-6 w-6 text-primary" />
                Vista Rápida de Precio
              </DialogTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={copiarResumen}
                disabled={copiando}
              >
                {copiando ? (
                  <>
                    <Copy className="h-4 w-4 mr-2 animate-spin" />
                    Copiando...
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Copiar para WhatsApp
                  </>
                )}
              </Button>
            </div>
            <DialogDescription>
              Información detallada del precio y tipos de pago disponibles
            </DialogDescription>
          </DialogHeader>

          {precioSeleccionado && preciosCalculados && (
            <div className="space-y-6 py-4">
              {/* Información del Artículo */}
              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1 font-bold">Artículo</p>
                      <p className="text-xl font-bold text-foreground">{precioSeleccionado.articulos?.nombre || 'Sin nombre'}</p>
                      {precioSeleccionado.articulos?.categoria && (
                        <Badge variant="secondary" className="mt-2">
                          {precioSeleccionado.articulos.categoria}
                        </Badge>
                      )}
                    </div>

                    {/* Precio Base y Costo */}
                    <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Precio de Costo</p>
                        <p className="text-2xl font-bold text-muted-foreground">
                          {formatCurrency(preciosCalculados.costo)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Precio Base (Venta)</p>
                        <p className="text-2xl font-bold text-primary">
                          {formatCurrency(preciosCalculados.precioBase)}
                        </p>
                      </div>
                    </div>

                    {/* Margen */}
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Margen de Ganancia</p>
                        <p className={`text-lg font-bold ${
                          preciosCalculados.margen >= 30 
                            ? 'text-green-600' 
                            : preciosCalculados.margen >= 15 
                            ? 'text-yellow-600' 
                            : 'text-red-600'
                        }`}>
                          {preciosCalculados.margen.toFixed(2)}%
                        </p>
                      </div>
                      <Badge 
                        variant={precioSeleccionado.vigente ? "default" : "secondary"}
                        className="gap-1"
                      >
                        {precioSeleccionado.vigente ? (
                          <>
                            <CheckCircle className="h-3 w-3" />
                            Vigente
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3" />
                            No vigente
                          </>
                        )}
                      </Badge>
                    </div>

                    {/* Fechas */}
                    {(precioSeleccionado.fecha_fin) && (
                      <div className="text-xs text-muted-foreground pt-2 border-t">
                        {precioSeleccionado.fecha_fin && (
                          <p>Fecha de finalización: {new Date(precioSeleccionado.fecha_fin).toLocaleDateString('es-AR')}</p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Precios por Tipo de Pago */}
              <Card className="border-2 border-primary/20">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3 font-bold">Precios por Tipo de Pago</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Precios calculados desde el precio base ({formatCurrency(preciosCalculados.precioBase)})
                      </p>
                    </div>

                    <div className="grid gap-3">
                      {/* Efectivo */}
                      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <DollarSign className="h-5 w-5 text-green-700" />
                          <div>
                            <p className="font-semibold text-green-900">Efectivo</p>
                            <p className="text-xs text-green-700">Sin IVA</p>
                          </div>
                        </div>
                        <p className="text-lg font-bold text-green-700">
                          {formatCurrency(preciosCalculados.efectivo)}
                        </p>
                      </div>

                      {/* Factura / Lista */}
                      <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-blue-700" />
                          <div>
                            <p className="font-semibold text-blue-900">Factura / Lista</p>
                            <p className="text-xs text-blue-700">Incluye IVA 21% (×1.21)</p>
                          </div>
                        </div>
                        <p className="text-lg font-bold text-blue-700">
                          {formatCurrency(preciosCalculados.facturaLista)}
                        </p>
                      </div>

                      {/* Tarjeta */}
                      <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-5 w-5 text-purple-700" />
                          <div>
                            <p className="font-semibold text-purple-900">Tarjeta</p>
                            <p className="text-xs text-purple-700">Incluye IVA 21% (×1.30)</p>
                          </div>
                        </div>
                        <p className="text-lg font-bold text-purple-700">
                          {formatCurrency(preciosCalculados.tarjeta)}
                        </p>
                      </div>

                      {/* E-cheq 45 días */}
                      <div className="flex items-center justify-between p-3 bg-purple-50/50 border border-purple-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Receipt className="h-5 w-5 text-purple-600" />
                          <div>
                            <p className="font-semibold text-purple-900">E-cheq 45 días</p>
                            <p className="text-xs text-purple-700">Incluye IVA 21% (×1.21)</p>
                          </div>
                        </div>
                        <p className="text-lg font-bold text-purple-700">
                          {formatCurrency(preciosCalculados.echeq45)}
                        </p>
                      </div>

                      {/* E-cheq 60 días */}
                      <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Receipt className="h-5 w-5 text-purple-700" />
                          <div>
                            <p className="font-semibold text-purple-900">E-cheq 60 días</p>
                            <p className="text-xs text-purple-700">Incluye IVA 21% (×1.30)</p>
                          </div>
                        </div>
                        <p className="text-lg font-bold text-purple-700">
                          {formatCurrency(preciosCalculados.echeq60)}
                        </p>
                      </div>

                      {/* E-cheq 90 días */}
                      <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-300 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Receipt className="h-5 w-5 text-purple-800" />
                          <div>
                            <p className="font-semibold text-purple-900">E-cheq 90 días</p>
                            <p className="text-xs text-purple-700">Incluye IVA 21% (×1.40)</p>
                          </div>
                        </div>
                        <p className="text-lg font-bold text-purple-800">
                          {formatCurrency(preciosCalculados.echeq90)}
                        </p>
                      </div>
                    </div>

                    {/* Resumen de cálculo */}
                    <div className="pt-4 border-t text-xs text-muted-foreground">
                      <p className="font-semibold mb-1">Fórmula:</p>
                      <p>Precio Base × Factor = Precio Final</p>
                      <p className="mt-1">Ejemplo: {formatCurrency(preciosCalculados.precioBase)} × 1.21 = {formatCurrency(preciosCalculados.facturaLista)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Acciones */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setDialogAbierto(false)}
                >
                  Cerrar
                </Button>
                <Button asChild>
                  <Link href={`/dashboard/precios/editar/${precioSeleccionado.id}`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Precio
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
