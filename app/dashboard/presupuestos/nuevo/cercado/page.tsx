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
import { ArrowLeft, ArrowRight, Save, Calculator, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { Textarea } from '@/components/ui/textarea'
import { BuscarCliente } from '@/components/BuscarCliente'
import { Badge } from '@/components/ui/badge'

export default function NuevoPresupuestoCercadoPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [paso, setPaso] = useState(1)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [clienteSeleccionado, setClienteSeleccionado] = useState<any>(null)
  const [tejidos, setTejidos] = useState<any[]>([])
  const [calculoRealizado, setCalculoRealizado] = useState(false)
  const [formaPago, setFormaPago] = useState<'efectivo'|'lista'|'tarjeta'|'echeq45'|'echeq60'|'echeq90'>('lista')

  const obtenerFechaArgentina = () =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date())

  const [formData, setFormData] = useState({
    // Cliente
    cliente_id: null as string | null,
    cliente_nombre: '',
    cliente_email: '',
    cliente_telefono: '',
    cliente_direccion: '',
    
    // Terreno
    terreno_largo: '',
    terreno_ancho: '',
    metros_lineales_total: '',
    
    // Configuración
    altura_tejido: '2.00',
    tejido_calibre: '14',
    tejido_rombo: '3.5',
    tipo_poste: 'Eucalipto',
    tipo_cordon: '10cm',
    hilos_pua: '0',
    
    // Costos calculados
    costo_tejido: 0,
    costo_postes: 0,
    costo_cordon: 0,
    costo_pua: 0,
    costo_accesorios: 0,
    costo_mano_obra: 0,
    costo_transporte: 0,
    subtotal: 0,
    descuento: '0',
    total: 0,
    precio_por_metro: 0,
    
    // Otros
    validez_dias: '15',
    observaciones: '',
    condiciones_comerciales: 'Pago: Contado o transferencia\nIncluye materiales y mano de obra',
  })

  useEffect(() => {
    cargarUsuario()
    cargarTejidos()
  }, [])

  useEffect(() => {
    if (formData.terreno_largo && formData.terreno_ancho) {
      const largo = parseFloat(formData.terreno_largo)
      const ancho = parseFloat(formData.terreno_ancho)
      const perimetro = 2 * (largo + ancho)
      setFormData({ ...formData, metros_lineales_total: perimetro.toFixed(2) })
    }
  }, [formData.terreno_largo, formData.terreno_ancho])

  async function cargarUsuario() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setUserId(user.id)
  }

  async function cargarTejidos() {
    const { data } = await supabase
      .from('v_tejidos_con_precios')
      .select('*')
      .eq('activo', true)
      .order('codigo')
    setTejidos(data || [])
  }

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

  function calcularPresupuesto() {
    const metros = parseFloat(formData.metros_lineales_total) || 0
    if (metros === 0) {
      toast({
        title: "Error",
        description: "Ingresa las dimensiones del terreno",
        variant: "destructive",
      })
      return
    }

    // Obtener tejido seleccionado
    const tejidoKey = `RC${formData.tejido_calibre}x${formData.tejido_rombo}x${formData.altura_tejido}`
    const tejido = tejidos.find(t => t.codigo === tejidoKey)

    if (!tejido) {
      toast({
        title: "Error",
        description: "No se encontró el tejido seleccionado",
        variant: "destructive",
      })
      return
    }

    // Calcular rollos necesarios
    const rollosNecesarios = Math.ceil(metros / 10)
    const costoTejido = rollosNecesarios * (tejido.precio_venta || 0)

    // Precios base según tipo de poste (para 180m)
    const preciosPostes: any = {
      'Eucalipto': 1110000,
      'Punta Diamante': 1300000,
      'Olimp': 1450000
    }

    const preciosCordones: any = {
      'Sin cordón': 0,
      '10cm': 997920,
      '15cm': 791805,
      '20cm': 1164380
    }

    // Calcular proporcional a 180m
    const factor = metros / 180
    const costoPostes = (preciosPostes[formData.tipo_poste] || 0) * factor
    const costoCordon = (preciosCordones[formData.tipo_cordon] || 0) * factor

    // Costo de púa
    const preciosPua: any = {
      '0': 0,
      '1': 1168.02,
      '2': 1168.02 * 2,
      '3': 1168.02 * 3,
      '4': 1168.02 * 4,
    }
    const costoPua = metros * (preciosPua[formData.hilos_pua] || 0)

    // Accesorios (proporcional)
    const accesoriosBase = 3629532 // Para 180m
    const costoAccesorios = accesoriosBase * factor

    // Mano de obra y transporte
    const costoManoObra = metros * 11438
    const costoTransporte = metros * 3580.50

    // Total
    let subtotal = costoTejido + costoPostes + costoCordon + costoPua + costoAccesorios + costoManoObra + costoTransporte

    // Recargo para terrenos pequeños
    if (metros < 50) {
      subtotal = subtotal * 1.30
    }

    const descuento = parseFloat(formData.descuento) || 0
    const total = subtotal - descuento
    const precioPorMetro = total / metros

    setFormData({
      ...formData,
      costo_tejido: costoTejido,
      costo_postes: costoPostes,
      costo_cordon: costoCordon,
      costo_pua: costoPua,
      costo_accesorios: costoAccesorios,
      costo_mano_obra: costoManoObra,
      costo_transporte: costoTransporte,
      subtotal,
      total,
      precio_por_metro: precioPorMetro,
    })

    setCalculoRealizado(true)
    setPaso(4)
  }

  async function handleSubmit() {
    if (!userId) {
      toast({
        title: "Error",
        description: "Usuario no autenticado",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Generar número
      const { data: numeroData, error: errorNumero } = await supabase
        .rpc('generar_numero_presupuesto', { p_tipo: 'cercado' })

      if (errorNumero) throw errorNumero

      const numero = numeroData

      // Crear presupuesto
      const presupuestoData = {
        numero,
        tipo: 'cercado',
        cliente_id: formData.cliente_id,
        cliente_nombre: formData.cliente_nombre,
        cliente_email: formData.cliente_email || null,
        cliente_telefono: formData.cliente_telefono,
        cliente_direccion: formData.cliente_direccion || null,
        terreno_largo: parseFloat(formData.terreno_largo),
        terreno_ancho: parseFloat(formData.terreno_ancho),
        metros_lineales_total: parseFloat(formData.metros_lineales_total),
        subtotal: formData.subtotal,
        descuento: parseFloat(formData.descuento),
        total: formData.total,
        observaciones: formData.observaciones || null,
        condiciones_comerciales: formData.condiciones_comerciales || null,
        validez_dias: parseInt(formData.validez_dias),
        estado: 'borrador',
        usuario_id: userId,
        fecha_emision: obtenerFechaArgentina(),
      }

      const { data: presupuesto, error: errorPres } = await supabase
        .from('presupuestos')
        .insert(presupuestoData)
        .select()
        .single()

      if (errorPres) throw errorPres

      // Crear items del presupuesto
      const items = [
        {
          presupuesto_id: presupuesto.id,
          descripcion: `Tejido Romboidal Cal.${formData.tejido_calibre} - ${formData.altura_tejido}m - Rombo ${formData.tejido_rombo}"`,
          cantidad: Math.ceil(parseFloat(formData.metros_lineales_total) / 10),
          unidad: 'rollo',
          precio_unitario: 0,
          precio_total: formData.costo_tejido,
          orden: 1,
        },
        {
          presupuesto_id: presupuesto.id,
          descripcion: `Postes ${formData.tipo_poste}`,
          cantidad: 1,
          unidad: 'conjunto',
          precio_unitario: formData.costo_postes,
          precio_total: formData.costo_postes,
          orden: 2,
        },
      ]

      if (formData.tipo_cordon !== 'Sin cordón') {
        items.push({
          presupuesto_id: presupuesto.id,
          descripcion: `Cordón de hormigón ${formData.tipo_cordon}`,
          cantidad: parseFloat(formData.metros_lineales_total),
          unidad: 'metro',
          precio_unitario: formData.costo_cordon / parseFloat(formData.metros_lineales_total),
          precio_total: formData.costo_cordon,
          orden: 3,
        })
      }

      if (parseInt(formData.hilos_pua) > 0) {
        items.push({
          presupuesto_id: presupuesto.id,
          descripcion: `Alambre de púa (${formData.hilos_pua} hilos)`,
          cantidad: parseFloat(formData.metros_lineales_total) * parseInt(formData.hilos_pua),
          unidad: 'metro',
          precio_unitario: 1168.02,
          precio_total: formData.costo_pua,
          orden: 4,
        })
      }

      items.push(
        {
          presupuesto_id: presupuesto.id,
          descripcion: 'Accesorios (ganchos, planchuelas, torniquetes, etc.)',
          cantidad: 1,
          unidad: 'conjunto',
          precio_unitario: formData.costo_accesorios,
          precio_total: formData.costo_accesorios,
          orden: 5,
        },
        {
          presupuesto_id: presupuesto.id,
          descripcion: 'Mano de Obra',
          cantidad: parseFloat(formData.metros_lineales_total),
          unidad: 'metro',
          precio_unitario: 11438,
          precio_total: formData.costo_mano_obra,
          orden: 6,
        },
        {
          presupuesto_id: presupuesto.id,
          descripcion: 'Transporte',
          cantidad: parseFloat(formData.metros_lineales_total),
          unidad: 'metro',
          precio_unitario: 3580.50,
          precio_total: formData.costo_transporte,
          orden: 7,
        }
      )

      const { error: errorItems } = await supabase
        .from('presupuestos_items')
        .insert(items)

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

  const pasos = [
    { numero: 1, titulo: 'Cliente', descripcion: 'Buscar o registrar cliente' },
    { numero: 2, titulo: 'Terreno', descripcion: 'Dimensiones del terreno' },
    { numero: 3, titulo: 'Configuración', descripcion: 'Tipo de cerco' },
    { numero: 4, titulo: 'Resumen', descripcion: 'Cálculo y revisión' },
    { numero: 5, titulo: 'Finalizar', descripcion: 'Observaciones y guardar' },
  ]

  const puedeAvanzar = () => {
    switch (paso) {
      case 1: return clienteSeleccionado !== null
      case 2: return formData.metros_lineales_total !== ''
      case 3: return true
      case 4: return calculoRealizado
      case 5: return true
      default: return false
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
          <h1 className="text-3xl font-bold">Presupuesto de Cercado Perimetral</h1>
          <p className="text-muted-foreground">Servicio completo de instalación</p>
        </div>
      </div>

      {/* Indicador de Pasos */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {pasos.map((p, index) => (
              <div key={p.numero} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    paso === p.numero ? 'bg-primary text-white' :
                    paso > p.numero ? 'bg-green-600 text-white' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {paso > p.numero ? <CheckCircle className="h-6 w-6" /> : p.numero}
                  </div>
                  <p className={`text-xs mt-2 font-medium ${paso === p.numero ? 'text-primary' : 'text-muted-foreground'}`}>
                    {p.titulo}
                  </p>
                  <p className="text-xs text-muted-foreground hidden md:block">{p.descripcion}</p>
                </div>
                {index < pasos.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-2 ${paso > p.numero ? 'bg-green-600' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contenido de cada paso */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* PASO 1: Cliente */}
          {paso === 1 && (
            <div className="space-y-6">
              {!clienteSeleccionado ? (
                <BuscarCliente onClienteSeleccionado={handleClienteSeleccionado} />
              ) : (
                <Card className="border-2 border-green-300 bg-green-50/50">
                  <CardHeader>
                    <CardTitle>Cliente Seleccionado</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="font-bold text-lg">{formData.cliente_nombre}</p>
                    <p className="text-sm">Tel: {formData.cliente_telefono}</p>
                    {formData.cliente_email && <p className="text-sm">Email: {formData.cliente_email}</p>}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setClienteSeleccionado(null)}
                      className="mt-4"
                    >
                      Cambiar Cliente
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* PASO 2: Dimensiones del Terreno */}
          {paso === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Dimensiones del Terreno</CardTitle>
                <CardDescription>Ingresa las medidas del terreno a cercar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="largo">Largo del Terreno (metros) *</Label>
                    <Input
                      id="largo"
                      type="number"
                      step="0.01"
                      value={formData.terreno_largo}
                      onChange={(e) => setFormData({ ...formData, terreno_largo: e.target.value })}
                      placeholder="60"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ancho">Ancho del Terreno (metros) *</Label>
                    <Input
                      id="ancho"
                      type="number"
                      step="0.01"
                      value={formData.terreno_ancho}
                      onChange={(e) => setFormData({ ...formData, terreno_ancho: e.target.value })}
                      placeholder="30"
                      required
                    />
                  </div>
                </div>

                {formData.metros_lineales_total && (
                  <div className="p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
                    <p className="text-sm text-blue-700 mb-1">Perímetro calculado:</p>
                    <p className="text-3xl font-bold text-blue-900">
                      {formData.metros_lineales_total} metros lineales
                    </p>
                    <p className="text-xs text-blue-600 mt-2">
                      Fórmula: 2 × (Largo + Ancho) = 2 × ({formData.terreno_largo} + {formData.terreno_ancho})
                    </p>
                  </div>
                )}

                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-2">O ingresa directamente:</p>
                  <Label htmlFor="metros_directos">Metros Lineales Totales</Label>
                  <Input
                    id="metros_directos"
                    type="number"
                    step="0.01"
                    value={formData.metros_lineales_total}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      metros_lineales_total: e.target.value,
                      terreno_largo: '',
                      terreno_ancho: ''
                    })}
                    placeholder="180"
                    className="mt-1"
                  />
                </div>

                {formData.metros_lineales_total && parseFloat(formData.metros_lineales_total) < 50 && (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-sm text-amber-800">
                    <p className="font-semibold">⚠️ Terreno pequeño</p>
                    <p className="text-xs mt-1">
                      Terrenos menores a 50 metros lineales tienen un recargo del 30% por costos fijos.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* PASO 3: Configuración del Cerco */}
          {paso === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Configuración del Cerco</CardTitle>
                <CardDescription>Selecciona las características del cercado</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Altura del Tejido *</Label>
                  <Select
                    value={formData.altura_tejido}
                    onValueChange={(value) => setFormData({ ...formData, altura_tejido: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1.0">1.0 metros (altura final ~1.3m)</SelectItem>
                      <SelectItem value="1.2">1.2 metros (altura final ~1.5m)</SelectItem>
                      <SelectItem value="1.5">1.5 metros (altura final ~1.8m)</SelectItem>
                      <SelectItem value="1.8">1.8 metros (altura final ~2.3m)</SelectItem>
                      <SelectItem value="2.0">2.0 metros (altura final ~2.5m)</SelectItem>
                      <SelectItem value="2.5">2.5 metros (altura final ~3.0m)</SelectItem>
                      <SelectItem value="3.0">3.0 metros (altura final ~3.5m)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Calibre del Tejido *</Label>
                    <Select
                      value={formData.tejido_calibre}
                      onValueChange={(value) => setFormData({ ...formData, tejido_calibre: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12">Calibre 12 (Reforzado)</SelectItem>
                        <SelectItem value="14">Calibre 14 (Estándar)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Tamaño de Rombo *</Label>
                    <Select
                      value={formData.tejido_rombo}
                      onValueChange={(value) => setFormData({ ...formData, tejido_rombo: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3.5">3.5" (Económico)</SelectItem>
                        <SelectItem value="3.0">3.0" (Standard)</SelectItem>
                        <SelectItem value="2.5">2.5" (Reforzado)</SelectItem>
                        <SelectItem value="2.0">2.0" (Máxima seguridad)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Postes *</Label>
                  <Select
                    value={formData.tipo_poste}
                    onValueChange={(value) => setFormData({ ...formData, tipo_poste: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Eucalipto">Eucalipto (Económico)</SelectItem>
                      <SelectItem value="Punta Diamante">Punta Diamante (Standard)</SelectItem>
                      <SelectItem value="Olimp">Olimp (Premium)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Cordón de Hormigón *</Label>
                  <Select
                    value={formData.tipo_cordon}
                    onValueChange={(value) => setFormData({ ...formData, tipo_cordon: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sin cordón">Sin cordón</SelectItem>
                      <SelectItem value="10cm">10 cm</SelectItem>
                      <SelectItem value="15cm">15 cm</SelectItem>
                      <SelectItem value="20cm">20 cm (Máxima resistencia)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Hilos de Alambre de Púa *</Label>
                  <Select
                    value={formData.hilos_pua}
                    onValueChange={(value) => setFormData({ ...formData, hilos_pua: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Sin alambre de púa</SelectItem>
                      <SelectItem value="1">1 hilo</SelectItem>
                      <SelectItem value="2">2 hilos</SelectItem>
                      <SelectItem value="3">3 hilos</SelectItem>
                      <SelectItem value="4">4 hilos (Máxima seguridad)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-4">
                  <Button onClick={calcularPresupuesto} className="w-full" size="lg">
                    <Calculator className="h-5 w-5 mr-2" />
                    Calcular Presupuesto
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* PASO 4: Resumen y Cálculo */}
          {paso === 4 && calculoRealizado && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Resumen de Configuración</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Terreno</p>
                      <p className="font-semibold">
                        {formData.terreno_largo && formData.terreno_ancho 
                          ? `${formData.terreno_largo} × ${formData.terreno_ancho} metros`
                          : `${formData.metros_lineales_total} metros lineales`}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Perímetro Total</p>
                      <p className="font-bold text-lg text-primary">{formData.metros_lineales_total} metros</p>
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 pt-3 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Tejido</p>
                      <p className="font-semibold">Cal.{formData.tejido_calibre} - {formData.altura_tejido}m - Rombo {formData.tejido_rombo}"</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Postes</p>
                      <p className="font-semibold">{formData.tipo_poste}</p>
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Cordón</p>
                      <p className="font-semibold">{formData.tipo_cordon}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Alambre de Púa</p>
                      <p className="font-semibold">{formData.hilos_pua} hilos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Desglose de Costos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between p-3 bg-muted/50 rounded">
                      <span className="text-sm">Tejido romboidal ({Math.ceil(parseFloat(formData.metros_lineales_total) / 10)} rollos)</span>
                      <span className="font-bold">${formData.costo_tejido.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-muted/50 rounded">
                      <span className="text-sm">Postes {formData.tipo_poste}</span>
                      <span className="font-bold">${formData.costo_postes.toLocaleString()}</span>
                    </div>
                    {formData.costo_cordon > 0 && (
                      <div className="flex justify-between p-3 bg-muted/50 rounded">
                        <span className="text-sm">Cordón de hormigón {formData.tipo_cordon}</span>
                        <span className="font-bold">${formData.costo_cordon.toLocaleString()}</span>
                      </div>
                    )}
                    {formData.costo_pua > 0 && (
                      <div className="flex justify-between p-3 bg-muted/50 rounded">
                        <span className="text-sm">Alambre de púa ({formData.hilos_pua} hilos)</span>
                        <span className="font-bold">${formData.costo_pua.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between p-3 bg-muted/50 rounded">
                      <span className="text-sm">Accesorios completos</span>
                      <span className="font-bold">${formData.costo_accesorios.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-muted/50 rounded">
                      <span className="text-sm">Mano de Obra</span>
                      <span className="font-bold">${formData.costo_mano_obra.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-muted/50 rounded">
                      <span className="text-sm">Transporte</span>
                      <span className="font-bold">${formData.costo_transporte.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between p-4 bg-green-50 border-2 border-green-300 rounded-lg mt-4">
                      <span className="font-bold text-lg">TOTAL:</span>
                      <span className="text-3xl font-bold text-green-600">
                        ${formData.total.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between p-3 bg-blue-50 border border-blue-200 rounded">
                      <span className="font-medium">Precio por Metro Lineal:</span>
                      <span className="text-xl font-bold text-blue-600">
                        ${formData.precio_por_metro.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* PASO 5: Observaciones y Finalizar */}
          {paso === 5 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Observaciones y Condiciones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="validez">Validez del Presupuesto (días)</Label>
                    <Input
                      id="validez"
                      type="number"
                      value={formData.validez_dias}
                      onChange={(e) => setFormData({ ...formData, validez_dias: e.target.value })}
                      className="max-w-xs"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="observaciones">Observaciones</Label>
                    <Textarea
                      id="observaciones"
                      value={formData.observaciones}
                      onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="condiciones">Condiciones Comerciales</Label>
                    <Textarea
                      id="condiciones"
                      value={formData.condiciones_comerciales}
                      onChange={(e) => setFormData({ ...formData, condiciones_comerciales: e.target.value })}
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descuento">Descuento ($)</Label>
                    <Input
                      id="descuento"
                      type="number"
                      step="0.01"
                      value={formData.descuento}
                      onChange={(e) => {
                        const desc = parseFloat(e.target.value) || 0
                        setFormData({ 
                          ...formData, 
                          descuento: e.target.value,
                          total: formData.subtotal - desc
                        })
                      }}
                      className="max-w-xs"
                    />
                  </div>
                </CardContent>
              </Card>

              <Button onClick={handleSubmit} disabled={loading} size="lg" className="w-full">
                <Save className="h-5 w-5 mr-2" />
                {loading ? 'Guardando...' : 'Guardar Presupuesto'}
              </Button>
            </div>
          )}
        </div>

        {/* Sidebar - Preview */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-base">Progreso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Paso actual:</span>
                  <Badge>{paso}/5</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Cliente:</span>
                  <span className={clienteSeleccionado ? 'text-green-600 font-semibold' : ''}>
                    {clienteSeleccionado ? '✓' : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Terreno:</span>
                  <span className={formData.metros_lineales_total ? 'text-green-600 font-semibold' : ''}>
                    {formData.metros_lineales_total ? `${formData.metros_lineales_total}m` : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total:</span>
                  <span className={formData.total > 0 ? 'font-bold text-green-600' : ''}>
                    {formData.total > 0 ? `$${formData.total.toLocaleString()}` : '—'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navegación entre pasos */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setPaso(paso - 1)}
              disabled={paso === 1}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>
            {paso < 5 && (
              <Button
                onClick={() => setPaso(paso + 1)}
                disabled={!puedeAvanzar()}
              >
                Siguiente
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

