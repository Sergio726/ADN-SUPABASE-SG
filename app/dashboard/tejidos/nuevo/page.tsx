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
import { ArrowLeft, Save, Calculator } from 'lucide-react'
import Link from 'next/link'
import { Textarea } from '@/components/ui/textarea'

export default function NuevoTejidoPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [alambres, setAlambres] = useState<any[]>([])
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
    margen_factura: '57.00',
    margen_tarjeta: '65.00',
    margen_echeq45: '57.00',
    margen_echeq60: '65.00',
    margen_echeq90: '73.00',
    descripcion: '',
  })

  useEffect(() => {
    cargarAlambres()
  }, [])

  useEffect(() => {
    if (formData.calibre && formData.altura && formData.tamano_rombo) {
      generarCodigo()
    }
  }, [formData.calibre, formData.altura, formData.tamano_rombo])

  useEffect(() => {
    calcularPrecio()
  }, [formData.peso_kg, formData.mano_obra, formData.margen_efectivo, formData.margen_factura, formData.margen_tarjeta, formData.margen_echeq45, formData.margen_echeq60, formData.margen_echeq90, formData.alambre_articulo_id])

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

  async function calcularPrecio() {
    if (!formData.peso_kg || !formData.mano_obra || !formData.alambre_articulo_id) {
      setPrecioCalculado({ costo: 0, efectivo: 0, lista: 0, tarjeta: 0, echeq45: 0, echeq60: 0, echeq90: 0 })
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
        const margenEfectivo = parseFloat(formData.margen_efectivo) || 45
        const margenFactura = parseFloat(formData.margen_factura) || 57
        const margenTarjeta = parseFloat(formData.margen_tarjeta) || 65
        const margenEcheq45 = parseFloat(formData.margen_echeq45) || 57
        const margenEcheq60 = parseFloat(formData.margen_echeq60) || 65
        const margenEcheq90 = parseFloat(formData.margen_echeq90) || 73

        setPrecioAlambre(precios.precio_costo)

        const costo = (pesoKg * precios.precio_costo) + manoObra
        const efectivo = costo * (1 + (margenEfectivo / 100))
        const lista = costo * (1 + (margenFactura / 100))
        const tarjeta = costo * (1 + (margenTarjeta / 100))
        const echeq45 = costo * (1 + (margenEcheq45 / 100))
        const echeq60 = costo * (1 + (margenEcheq60 / 100))
        const echeq90 = costo * (1 + (margenEcheq90 / 100))

        setPrecioCalculado({ costo, efectivo, lista, tarjeta, echeq45, echeq60, echeq90 })
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
        cantidad_alambre: parseFloat(formData.peso_kg), // Renombrado de peso_kg
        costo_mano_obra: parseFloat(formData.mano_obra), // Renombrado de mano_obra
        horas_fabricacion: formData.horas_fabricacion ? parseFloat(formData.horas_fabricacion) : null,
        alambre_articulo_id: parseInt(formData.alambre_articulo_id),
        margen_efectivo: parseFloat(formData.margen_efectivo),
        margen_factura: parseFloat(formData.margen_factura),
        margen_tarjeta: parseFloat(formData.margen_tarjeta),
        margen_echeq45: parseFloat(formData.margen_echeq45),
        margen_echeq60: parseFloat(formData.margen_echeq60),
        margen_echeq90: parseFloat(formData.margen_echeq90),
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
                        <SelectItem value="1.00">1.0 m</SelectItem>
                        <SelectItem value="1.20">1.2 m</SelectItem>
                        <SelectItem value="1.50">1.5 m</SelectItem>
                        <SelectItem value="1.80">1.8 m</SelectItem>
                        <SelectItem value="2.00">2.0 m</SelectItem>
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
                <CardTitle>Fabricación y Costos</CardTitle>
                <CardDescription>
                  Especifica los materiales y costos de fabricación
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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

                {/* Desglose del costo de alambre */}
                {formData.alambre_articulo_id && formData.peso_kg && precioAlambre > 0 && (
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
                      <Label htmlFor="margen_efectivo">Efectivo</Label>
                      <Input
                        id="margen_efectivo"
                        type="number"
                        step="0.01"
                        value={formData.margen_efectivo}
                        onChange={(e) => setFormData({ ...formData, margen_efectivo: e.target.value })}
                        placeholder="45.00"
                      />
                      <p className="text-xs text-muted-foreground">
                        Precio efectivo = Costo × 1.45
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="margen_factura">Lista/Factura</Label>
                      <Input
                        id="margen_factura"
                        type="number"
                        step="0.01"
                        value={formData.margen_factura}
                        onChange={(e) => setFormData({ ...formData, margen_factura: e.target.value })}
                        placeholder="57.00"
                      />
                      <p className="text-xs text-muted-foreground">
                        Precio lista = Costo × 1.57
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="margen_tarjeta">Tarjeta</Label>
                      <Input
                        id="margen_tarjeta"
                        type="number"
                        step="0.01"
                        value={formData.margen_tarjeta}
                        onChange={(e) => setFormData({ ...formData, margen_tarjeta: e.target.value })}
                        placeholder="65.00"
                      />
                      <p className="text-xs text-muted-foreground">
                        Precio tarjeta = Costo × 1.65
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="margen_echeq45">E-cheq 45 días</Label>
                      <Input
                        id="margen_echeq45"
                        type="number"
                        step="0.01"
                        value={formData.margen_echeq45}
                        onChange={(e) => setFormData({ ...formData, margen_echeq45: e.target.value })}
                        placeholder="57.00"
                      />
                      <p className="text-xs text-muted-foreground">
                        Precio E-cheq 45 días = Costo × 1.57
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="margen_echeq60">E-cheq 60 días</Label>
                      <Input
                        id="margen_echeq60"
                        type="number"
                        step="0.01"
                        value={formData.margen_echeq60}
                        onChange={(e) => setFormData({ ...formData, margen_echeq60: e.target.value })}
                        placeholder="65.00"
                      />
                      <p className="text-xs text-muted-foreground">
                        Precio E-cheq 60 días = Costo × 1.65
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="margen_echeq90">E-cheq 90 días</Label>
                      <Input
                        id="margen_echeq90"
                        type="number"
                        step="0.01"
                        value={formData.margen_echeq90}
                        onChange={(e) => setFormData({ ...formData, margen_echeq90: e.target.value })}
                        placeholder="73.00"
                      />
                      <p className="text-xs text-muted-foreground">
                        Precio E-cheq 90 días = Costo × 1.73
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
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Alambre:</span>
                  <span className="font-medium">{formData.peso_kg || '0'} kg</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Mano de obra:</span>
                  <span className="font-medium">${parseFloat(formData.mano_obra || '0').toLocaleString()}</span>
                </div>
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
                    <span className="text-sm font-medium text-blue-900">Lista ({formData.margen_factura}%):</span>
                    <span className="text-lg font-bold text-blue-600">
                      ${precioCalculado.lista.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-blue-700">Con factura</p>
                </div>

                <div className="bg-purple-50 p-3 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-purple-900">Tarjeta ({formData.margen_tarjeta}%):</span>
                    <span className="text-lg font-bold text-purple-600">
                      ${precioCalculado.tarjeta.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-purple-700">Pago con tarjeta</p>
                </div>

                <div className="bg-orange-50 p-3 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-orange-900">E-cheq 45 días ({formData.margen_echeq45}%):</span>
                    <span className="text-lg font-bold text-orange-600">
                      ${precioCalculado.echeq45.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-orange-700">E-cheque a 45 días</p>
                </div>

                <div className="bg-amber-50 p-3 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-amber-900">E-cheq 60 días ({formData.margen_echeq60}%):</span>
                    <span className="text-lg font-bold text-amber-600">
                      ${precioCalculado.echeq60.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-amber-700">E-cheque a 60 días</p>
                </div>

                <div className="bg-yellow-50 p-3 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-yellow-900">E-cheq 90 días ({formData.margen_echeq90}%):</span>
                    <span className="text-lg font-bold text-yellow-600">
                      ${precioCalculado.echeq90.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-yellow-700">E-cheque a 90 días</p>
                </div>
              </div>

              <div className="bg-muted p-3 rounded-lg text-xs text-muted-foreground">
                <p className="font-medium mb-1">Fórmulas:</p>
                <p>• Costo = (Alambre kg × Precio/kg) + Mano de Obra</p>
                <p>• Efectivo = Costo × (1 + {formData.margen_efectivo}/100)</p>
                <p>• Lista = Costo × (1 + {formData.margen_factura}/100)</p>
                <p>• Tarjeta = Costo × (1 + {formData.margen_tarjeta}/100)</p>
                <p>• E-cheq 45 días = Costo × (1 + {formData.margen_echeq45}/100)</p>
                <p>• E-cheq 60 días = Costo × (1 + {formData.margen_echeq60}/100)</p>
                <p>• E-cheq 90 días = Costo × (1 + {formData.margen_echeq90}/100)</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

