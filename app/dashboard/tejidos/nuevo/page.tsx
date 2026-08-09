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
import { ArrowLeft, Save, Calculator, Store, Factory } from 'lucide-react'
import Link from 'next/link'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'

export default function NuevoTejidoPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [alambres, setAlambres] = useState<any[]>([])
  const [proveedores, setProveedores] = useState<any[]>([])
  const [precioAlambre, setPrecioAlambre] = useState(0)
  const [precioCalculado, setPrecioCalculado] = useState({ 
    costo: 0, 
    efectivo: 0, 
    lista: 0, 
    tarjeta: 0,
    echeq45: 0,
    echeq60: 0,
    echeq90: 0
  })

  const [formData, setFormData] = useState({
    calibre: '',
    altura: '',
    tamano_rombo: '',
    peso_kg: '',
    mano_obra: '',
    horas_fabricacion: '',
    alambre_articulo_id: '',
    margen_efectivo: '45.00',
    descripcion: '',
    // Origen: 'fabricado' (alambre + mano de obra) o 'reventa' (se compra al proveedor)
    origen: 'fabricado',
    proveedor_id: '',
    precio_compra: '',
  })

  const esReventa = formData.origen === 'reventa'

  useEffect(() => {
    cargarAlambres()
    cargarProveedores()
  }, [])

  useEffect(() => {
    if (formData.calibre && formData.altura && formData.tamano_rombo) {
      generarCodigo()
    }
  }, [formData.calibre, formData.altura, formData.tamano_rombo])

  useEffect(() => {
    calcularPrecio()
  }, [formData.peso_kg, formData.mano_obra, formData.margen_efectivo, formData.alambre_articulo_id, formData.origen, formData.precio_compra])

  async function cargarProveedores() {
    const { data, error } = await supabase
      .from('proveedores')
      .select('id, nombre')
      .order('nombre')

    if (error) {
      console.error('Error al cargar proveedores:', error)
      setProveedores([])
    } else {
      setProveedores(data || [])
    }
  }

  async function cargarAlambres() {
    const { data, error } = await supabase
      .from('articulos')
      .select('id, nombre, categoria')
      .order('nombre')

    console.log('Todos los artículos:', data)
    console.log('Error:', error)

    if (error) {
      console.error('Error al cargar alambres:', error)
      setAlambres([])
    } else {
      // Filtrar solo los que tengan "alambre" en categoría o nombre
      const alambres = (data || []).filter((a: any) => 
        a.categoria?.toLowerCase().includes('alambre') ||
        a.nombre?.toLowerCase().includes('alambre')
      )
      console.log('Alambres filtrados:', alambres)
      setAlambres(alambres)
    }
  }

  function generarCodigo() {
    // Formato: TR-{altura}-{rombo}-{calibre}
    // Ejemplo: TR-2.0-3.5-14
    const altura = parseFloat(formData.altura).toFixed(1)
    const rombo = parseFloat(formData.tamano_rombo).toFixed(1)
    const calibre = formData.calibre
    const codigo = `TR-${altura}-${rombo}-${calibre}`
    return codigo
  }

  function calcularDerivados(costo: number) {
    const margenEfectivo = parseFloat(formData.margen_efectivo) || 45
    const efectivo = costo * (1 + (margenEfectivo / 100)) // Precio base (efectivo)
    return {
      costo,
      efectivo,
      lista: efectivo * 1.21, // Factura/Lista = precio_base × 1.21 (incluye IVA 21%)
      tarjeta: efectivo * 1.3, // Tarjeta = precio_base × 1.3 (incluye IVA 21%)
      echeq45: efectivo * 1.21, // E-cheq 45 = igual que Factura/Lista (incluye IVA 21%)
      echeq60: efectivo * 1.3, // E-cheq 60 = igual que Tarjeta (incluye IVA 21%)
      echeq90: efectivo * 1.4, // E-cheq 90 = precio_base × 1.4 (incluye IVA 21%)
    }
  }

  async function calcularPrecio() {
    // Reventa: el costo es lo que se le paga al proveedor, sin alambre ni mano de obra
    if (formData.origen === 'reventa') {
      setPrecioAlambre(0)
      setPrecioCalculado(calcularDerivados(parseFloat(formData.precio_compra) || 0))
      return
    }

    if (!formData.peso_kg || !formData.mano_obra || !formData.alambre_articulo_id) {
      setPrecioCalculado({ costo: 0, efectivo: 0, lista: 0, tarjeta: 0, echeq45: 0, echeq60: 0, echeq90: 0 })
      // Nota: Los precios lista, tarjeta y echeq se calculan desde precio_base (efectivo) * 1.21
      return
    }

    try {
      // Obtener precio del alambre
      const { data: precios } = await supabase
        .from('precios_venta')
        .select('precio_costo')
        .eq('articulo_id', formData.alambre_articulo_id)
        .eq('vigente', true)
        .single()

      if (precios) {
        const pesoKg = parseFloat(formData.peso_kg) || 0
        const manoObra = parseFloat(formData.mano_obra) || 0

        setPrecioAlambre(precios.precio_costo)

        setPrecioCalculado(calcularDerivados((pesoKg * precios.precio_costo) + manoObra))
      } else {
        setPrecioAlambre(0)
      }
    } catch (error) {
      console.error('Error al calcular precio:', error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      if (esReventa && !formData.precio_compra) {
        throw new Error('Ingresá el precio de compra del rollo')
      }
      if (esReventa && !formData.proveedor_id) {
        throw new Error('Seleccioná el proveedor al que se le compra el rollo')
      }

      const codigo = generarCodigo()
      const nombre = `Tejido Romboidal Cal.${formData.calibre} - ${formData.altura}m - Rombo ${formData.tamano_rombo}"`

      // Determinar categoría
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
        largo: 10.00,
        // En reventa no hay alambre ni mano de obra: el costo sale de precio_compra
        cantidad_alambre: esReventa ? 0 : parseFloat(formData.peso_kg), // Renombrado de peso_kg
        costo_mano_obra: esReventa ? 0 : parseFloat(formData.mano_obra), // Renombrado de mano_obra
        horas_fabricacion: !esReventa && formData.horas_fabricacion ? parseFloat(formData.horas_fabricacion) : null,
        alambre_articulo_id: esReventa ? null : parseInt(formData.alambre_articulo_id),
        margen_efectivo: parseFloat(formData.margen_efectivo),
        origen: formData.origen,
        proveedor_id: esReventa ? parseInt(formData.proveedor_id) : null,
        precio_compra: esReventa ? parseFloat(formData.precio_compra) : null,
        categoria_calidad,
        activo: true,
      }

      const { data, error } = await supabase
        .from('tejidos_configuraciones')
        .insert(tejidoData)
        .select()
        .single()

      if (error) throw error

      toast({
        title: "¡Éxito!",
        description: "Tejido creado correctamente",
      })

      setTimeout(() => {
        router.push('/dashboard/tejidos')
      }, 1000)
    } catch (error: any) {
      console.error('Error:', error)
      toast({
        title: "Error al crear tejido",
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
          <Link href="/dashboard/tejidos">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nuevo Tejido Romboidal</h1>
          <p className="text-muted-foreground">Crear una nueva configuración de tejido</p>
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
                        <SelectItem value="1.0">1.0 m</SelectItem>
                        <SelectItem value="1.2">1.2 m</SelectItem>
                        <SelectItem value="1.5">1.5 m</SelectItem>
                        <SelectItem value="1.8">1.8 m</SelectItem>
                        <SelectItem value="2.0">2.0 m</SelectItem>
                        <SelectItem value="2.5">2.5 m</SelectItem>
                        <SelectItem value="3.0">3.0 m</SelectItem>
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

                {formData.calibre && formData.altura && formData.tamano_rombo && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Código generado:</p>
                    <p className="text-lg font-mono font-bold">{generarCodigo()}</p>
                  </div>
                )}

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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{esReventa ? 'Compra y Costos' : 'Fabricación y Costos'}</CardTitle>
                <CardDescription>
                  {esReventa
                    ? 'El rollo se compra hecho: el costo es el precio del proveedor'
                    : 'Especifica los materiales y costos de fabricación'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Origen: fabricado (alambre + mano de obra) o reventa (se compra hecho) */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    {esReventa
                      ? <Store className="h-5 w-5 text-blue-600" />
                      : <Factory className="h-5 w-5 text-muted-foreground" />}
                    <div className="space-y-0.5">
                      <Label htmlFor="origen">Es reventa</Label>
                      <p className="text-xs text-muted-foreground">
                        {esReventa
                          ? 'El rollo se compra a un proveedor y se revende'
                          : 'El rollo se fabrica con alambre galvanizado y mano de obra'}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="origen"
                    checked={esReventa}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, origen: checked ? 'reventa' : 'fabricado' })
                    }
                  />
                </div>

                {esReventa && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="proveedor">Proveedor *</Label>
                      <Select
                        value={formData.proveedor_id}
                        onValueChange={(value) => setFormData({ ...formData, proveedor_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar proveedor" />
                        </SelectTrigger>
                        <SelectContent>
                          {proveedores.map((proveedor) => (
                            <SelectItem key={proveedor.id} value={proveedor.id.toString()}>
                              {proveedor.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="precio_compra">Precio de Compra ($) *</Label>
                      <Input
                        id="precio_compra"
                        type="number"
                        step="0.01"
                        value={formData.precio_compra}
                        onChange={(e) => setFormData({ ...formData, precio_compra: e.target.value })}
                        placeholder="58000.00"
                      />
                      <p className="text-xs text-muted-foreground">
                        Lo que se le paga al proveedor por el rollo
                      </p>
                    </div>
                  </div>
                )}

                {!esReventa && (
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
                )}

                {!esReventa && (
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
                    {precioAlambre > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Precio: ${precioAlambre.toLocaleString()}/kg
                      </p>
                    )}
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
                )}

                {/* Desglose del costo de alambre */}
                {!esReventa && formData.alambre_articulo_id && formData.peso_kg && precioAlambre > 0 && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-sm text-blue-900 mb-2">Costo en Alambre:</h4>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-700">
                        {formData.peso_kg} kg × ${precioAlambre.toLocaleString()}/kg
                      </span>
                      <span className="text-lg font-bold text-blue-900">
                        = ${((parseFloat(formData.peso_kg) || 0) * precioAlambre).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                <div className="border-t pt-4 mt-4">
                  <h4 className="font-semibold mb-3">Márgenes de Ganancia (%)</h4>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="margen_efectivo">Margen Efectivo (%)</Label>
                      <Input
                        id="margen_efectivo"
                        type="number"
                        step="0.01"
                        value={formData.margen_efectivo}
                        onChange={(e) => setFormData({ ...formData, margen_efectivo: e.target.value })}
                        placeholder="45.00"
                      />
                      <p className="text-xs text-muted-foreground">
                        Precio efectivo (precio base) = Costo × (1 + margen/100)
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Guardando...' : 'Crear Tejido'}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/tejidos">Cancelar</Link>
              </Button>
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
                {esReventa ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Proveedor:</span>
                      <span className="font-medium">
                        {proveedores.find((p) => p.id.toString() === formData.proveedor_id)?.nombre || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Precio de compra:</span>
                      <span className="font-medium">${parseFloat(formData.precio_compra || '0').toLocaleString()}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Alambre:</span>
                      <span className="font-medium">{formData.peso_kg || '0'} kg</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Mano de obra:</span>
                      <span className="font-medium">${parseFloat(formData.mano_obra || '0').toLocaleString()}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Costo:</span>
                  <span className="text-xl font-bold text-gray-700">
                    ${precioCalculado.costo.toLocaleString()}
                  </span>
                </div>

                <div className="bg-green-50 p-3 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-green-900">Efectivo ({formData.margen_efectivo}%):</span>
                    <span className="text-lg font-bold text-green-600">
                      ${precioCalculado.efectivo.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-green-700">Precio más bajo (sin factura)</p>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-blue-900">Lista/Factura:</span>
                    <span className="text-lg font-bold text-blue-600">
                      ${precioCalculado.lista.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-blue-700">Precio base × 1.21 (incluye IVA 21%)</p>
                </div>

                <div className="bg-purple-50 p-3 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-purple-900">Tarjeta:</span>
                    <span className="text-lg font-bold text-purple-600">
                      ${precioCalculado.tarjeta.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-purple-700">Precio base × 1.3 (incluye IVA 21%)</p>
                </div>

                <div className="bg-purple-50 p-3 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-purple-900">E-cheq 45 días:</span>
                    <span className="text-lg font-bold text-purple-600">
                      ${precioCalculado.echeq45.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-purple-700">Igual que Factura/Lista (incluye IVA 21%)</p>
                </div>

                <div className="bg-purple-50 p-3 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-purple-900">E-cheq 60 días:</span>
                    <span className="text-lg font-bold text-purple-600">
                      ${precioCalculado.echeq60.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-purple-700">Igual que Tarjeta (incluye IVA 21%)</p>
                </div>

                <div className="bg-purple-50 p-3 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-purple-900">E-cheq 90 días:</span>
                    <span className="text-lg font-bold text-purple-600">
                      ${precioCalculado.echeq90.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-purple-700">Precio base × 1.4 (incluye IVA 21%)</p>
                </div>
              </div>

              <div className="bg-muted p-3 rounded-lg text-xs text-muted-foreground">
                <p className="font-medium mb-1">Fórmulas:</p>
                <p>
                  {esReventa
                    ? '• Costo = Precio de compra al proveedor'
                    : '• Costo = (Alambre kg × Precio/kg) + Mano de Obra'}
                </p>
                <p>• Precio Base (Efectivo) = Costo × (1 + {formData.margen_efectivo}/100)</p>
                <p>• Factura/Lista = Precio Base × 1.21 (incluye IVA 21%)</p>
                <p>• Tarjeta = Precio Base × 1.3 (incluye IVA 21%)</p>
                <p>• E-cheq 45 días = Precio Base × 1.21 (igual que Factura/Lista)</p>
                <p>• E-cheq 60 días = Precio Base × 1.3 (igual que Tarjeta)</p>
                <p>• E-cheq 90 días = Precio Base × 1.4 (incluye IVA 21%)</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

