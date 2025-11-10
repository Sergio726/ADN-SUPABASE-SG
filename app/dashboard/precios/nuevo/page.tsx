'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, PlusCircle } from 'lucide-react'

type ArticuloConPrecio = {
  id: string
  nombre: string
  categoria: string | null
  precios_venta: Array<{ id: string; vigente: boolean }>
}

export default function NuevoPrecioPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  const articuloPreseleccionado = searchParams.get('articulo')

  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [articulos, setArticulos] = useState<ArticuloConPrecio[]>([])
  const [articuloId, setArticuloId] = useState<string>('')
  const [precioCosto, setPrecioCosto] = useState('')
  const [precioVenta, setPrecioVenta] = useState('')

  useEffect(() => {
    async function cargarArticulos() {
      setCargando(true)
      const { data, error } = await supabase
        .from('articulos')
        .select('id, nombre, categoria, precios_venta(id, vigente)')
        .order('nombre')

      if (error) {
        console.error('Error al cargar artículos:', error)
        toast({
          title: 'Error al cargar artículos',
          description: error.message,
          variant: 'destructive',
        })
        setArticulos([])
      } else {
        const normalizados = (data || []).map((articulo: any) => ({
          ...articulo,
          id: String(articulo.id),
        })) as ArticuloConPrecio[]

        setArticulos(normalizados)

        const existePreseleccion = normalizados.some((articulo) => articulo.id === String(articuloPreseleccionado))
        if (articuloPreseleccionado && existePreseleccion) {
          setArticuloId(String(articuloPreseleccionado))
        }
      }
      setCargando(false)
    }

    cargarArticulos()
  }, [supabase, articuloPreseleccionado, toast])

  const articulosSinPrecioVigente = useMemo(() => {
    return articulos.filter((articulo) => !(articulo.precios_venta || []).some((precio) => precio.vigente))
  }, [articulos])

  useEffect(() => {
    if (!articuloId && articulosSinPrecioVigente.length > 0) {
      setArticuloId(articulosSinPrecioVigente[0].id)
    }
  }, [articuloId, articulosSinPrecioVigente])

  const articuloSeleccionado = articulos.find((articulo) => articulo.id === articuloId) || null
  const tienePrecioVigente = articuloSeleccionado?.precios_venta?.some((precio) => precio.vigente)

  const costoNumerico = parseFloat(precioCosto)
  const ventaNumerica = parseFloat(precioVenta)
  const costoValido = !Number.isNaN(costoNumerico) && Number.isFinite(costoNumerico) && costoNumerico > 0
  const ventaValida = !Number.isNaN(ventaNumerica) && Number.isFinite(ventaNumerica) && ventaNumerica > 0

  const costoCalculado = costoValido
    ? costoNumerico
    : ventaValida
      ? parseFloat((ventaNumerica / 1.56).toFixed(2))
      : 0

  const ventaCalculada = ventaValida
    ? ventaNumerica
    : costoValido
      ? parseFloat((costoNumerico * 1.56).toFixed(2))
      : 0

  const precioFactura = ventaCalculada * 1.21
  const precioTarjeta = ventaCalculada * 1.3
  const precioECheq45 = ventaCalculada * 1.21
  const precioECheq60 = ventaCalculada * 1.3
  const precioECheq90 = ventaCalculada * 1.4

  const margenCalculado = costoValido && ventaCalculada > 0
    ? (((ventaCalculada - costoCalculado) / costoCalculado) * 100).toFixed(2)
    : '0.00'

  const manejarSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!articuloId) {
      toast({
        title: 'Selecciona un artículo',
        description: 'Debes elegir el artículo al que deseas asignar el precio.',
        variant: 'destructive',
      })
      return
    }

    if (!costoValido && !ventaValida) {
      toast({
        title: 'Completa los importes',
        description: 'Ingresa al menos el precio de costo o el precio base (venta en efectivo).',
        variant: 'destructive',
      })
      return
    }

    setGuardando(true)
    try {
      const precioCostoFinal = costoValido ? costoCalculado : parseFloat((ventaCalculada / 1.56).toFixed(2))
      const precioVentaFinal = ventaCalculada

      const { error } = await supabase.from('precios_venta').insert({
        articulo_id: articuloId,
        precio_costo: precioCostoFinal,
        precio_venta: precioVentaFinal,
        vigente: true,
      })

      if (error) throw error

      toast({
        title: 'Precio creado',
        description: 'El artículo ya cuenta con un precio base y derivados.',
      })

      router.push('/dashboard/precios')
    } catch (error: any) {
      console.error('Error al crear precio:', error)
      toast({
        title: 'Error al crear precio',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Nuevo Precio</h2>
          <p className="text-muted-foreground mt-1">
            Define el precio base (efectivo) y calcula automáticamente el resto de la política de precios.
          </p>
        </div>
      </div>

      <form onSubmit={manejarSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Selecciona el artículo</CardTitle>
            <CardDescription>
              Solo se muestran los artículos disponibles. Los que ya tienen precio vigente aparecen igualmente para permitir reajustes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Artículo</Label>
              <Select value={articuloId} onValueChange={setArticuloId} disabled={cargando}>
                <SelectTrigger>
                  <SelectValue placeholder={cargando ? 'Cargando artículos...' : 'Selecciona un artículo'} />
                </SelectTrigger>
                <SelectContent>
                  {articulos.map((articulo) => {
                    const sinPrecio = !(articulo.precios_venta || []).some((precio) => precio.vigente)
                    return (
                      <SelectItem key={articulo.id} value={articulo.id}>
                        <div className="flex flex-col">
                          <span>{articulo.nombre}</span>
                          <span className="text-xs text-muted-foreground">
                            {articulo.categoria || 'Sin categoría'}
                            {!sinPrecio && ' · Con precio vigente'}
                          </span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {tienePrecioVigente && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <p className="text-sm text-yellow-700">
                  Este artículo ya posee un precio vigente. Crear uno nuevo marcará este como activo y podrás desactivar el anterior desde la gestión de precios.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Precio base</CardTitle>
            <CardDescription>
              La política establece que el precio base (efectivo) se calcula desde el costo × 1.56, pero puedes ajustarlo manualmente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="precio_costo">Precio de costo</Label>
                <Input
                  id="precio_costo"
                  type="number"
                  step="0.01"
                  min="0"
                  value={precioCosto}
                  onChange={(event) => setPrecioCosto(event.target.value)}
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground">
                  Si solo ingresas este valor, calcularemos el precio base con el margen estándar (56%).
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="precio_venta">Precio base (efectivo)</Label>
                <Input
                  id="precio_venta"
                  type="number"
                  step="0.01"
                  min="0"
                  value={precioVenta}
                  onChange={(event) => setPrecioVenta(event.target.value)}
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground">
                  Si lo dejas vacío, tomaremos el costo × 1.56. Siempre puedes ajustarlo luego.
                </p>
              </div>
            </div>

            {articuloId && (costoValido || ventaValida) && (
              <div className="rounded-lg border bg-muted/40 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">Margen: {margenCalculado}%</Badge>
                  <Badge variant="outline">Costo registrado: ${costoCalculado.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Badge>
                  <Badge variant="outline">Precio base: ${ventaCalculada.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Badge>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <div>
                    <p className="text-sm font-medium">Factura / Lista</p>
                    <p className="text-xs text-muted-foreground">Precio base × 1.21</p>
                    <p className="text-lg font-semibold">${precioFactura.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Tarjeta</p>
                    <p className="text-xs text-muted-foreground">Precio base × 1.3</p>
                    <p className="text-lg font-semibold">${precioTarjeta.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">E‑cheq 45 días</p>
                    <p className="text-xs text-muted-foreground">Igual que Factura/Lista</p>
                    <p className="text-lg font-semibold">${precioECheq45.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">E‑cheq 60 días</p>
                    <p className="text-xs text-muted-foreground">Igual que Tarjeta</p>
                    <p className="text-lg font-semibold">${precioECheq60.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">E‑cheq 90 días</p>
                    <p className="text-xs text-muted-foreground">Precio base × 1.4</p>
                    <p className="text-lg font-semibold">${precioECheq90.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="submit" disabled={guardando || !articuloId}>
            <PlusCircle className="h-4 w-4 mr-2" />
            {guardando ? 'Guardando...' : 'Crear precio'}
          </Button>
        </div>
      </form>
    </div>
  )
}
