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
import { ArrowLeft, ArrowRight, Save, Calculator, CheckCircle, DollarSign, FileText, CreditCard, Receipt, AlertCircle, User, Mail, Phone, MapPin, Info } from 'lucide-react'
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
  const [configuraciones, setConfiguraciones] = useState<any[]>([])
  const [configuracionSeleccionada, setConfiguracionSeleccionada] = useState<any>(null)
  const [descripcionesPostes, setDescripcionesPostes] = useState<any>({})
  const [calculoRealizado, setCalculoRealizado] = useState(false)
  const [formaPago, setFormaPago] = useState<'efectivo'|'lista'|'tarjeta'|'echeq45'|'echeq60'|'echeq90'>('lista')

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
    
    // Configuración (se llena al seleccionar esquema)
    altura_tejido: '',
    tejido_calibre: '',
    tejido_rombo: '',
    tipo_poste: '',
    tipo_cordon: '',
    hilos_pua: '0',
    cercado_config_id: null as string | null,
    
    // Costos calculados
    precio_base: 0, // Precio base antes de aplicar factor de forma de pago
    subtotal: 0,
    descuento: '0',
    total: 0,
    
    // Otros
    validez_dias: '15',
    observaciones: '',
    condiciones_comerciales: 'Pago: Contado o transferencia\nIncluye materiales y mano de obra',
  })

  useEffect(() => {
    cargarUsuario()
    cargarConfiguraciones()
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

  async function cargarConfiguraciones() {
    const { data, error } = await supabase
      .from('v_configuraciones_cercado_completas')
      .select('*')
      .eq('activo', true)
      .order('nombre')

    if (error) {
      console.error('Error al cargar configuraciones:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las configuraciones de cercado",
        variant: "destructive",
      })
      return
    }

    setConfiguraciones(data || [])
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

  async function handleConfiguracionSeleccionada(configId: string) {
    const config = configuraciones.find(c => c.id === configId)
    if (!config) return

    setConfiguracionSeleccionada(config)
    
    // Cargar descripciones de los postes
    const idsPostes = [
      config.poste_esquinero_id,
      config.poste_refuerzo_id,
      config.poste_intermedio_id,
      config.poste_puntal_id,
    ].filter(Boolean)

    if (idsPostes.length > 0) {
      const { data: articulosPostes, error } = await supabase
        .from('articulos')
        .select('id, nombre, descripcion')
        .in('id', idsPostes)

      if (!error && articulosPostes) {
        const descripciones: any = {}
        articulosPostes.forEach((art) => {
          if (config.poste_esquinero_id === art.id) {
            descripciones.esquinero = art
          }
          if (config.poste_refuerzo_id === art.id) {
            descripciones.refuerzo = art
          }
          if (config.poste_intermedio_id === art.id) {
            descripciones.intermedio = art
          }
          if (config.poste_puntal_id === art.id) {
            descripciones.puntal = art
          }
        })
        setDescripcionesPostes(descripciones)
      }
    } else {
      setDescripcionesPostes({})
    }
    
    // Actualizar formData con los datos de la configuración
    setFormData({
      ...formData,
      cercado_config_id: config.id,
      altura_tejido: config.altura.toString(),
      tejido_calibre: config.calibre?.toString() || '',
      tejido_rombo: config.tamano_rombo?.toString() || '',
      tipo_poste: config.tipo_poste || '',
      tipo_cordon: config.cordon_tipo || '',
      hilos_pua: config.hilos_pua?.toString() || '0',
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

    if (!configuracionSeleccionada) {
      toast({
        title: "Error",
        description: "Debes seleccionar un esquema de cercado",
        variant: "destructive",
      })
      return
    }

    const config = configuracionSeleccionada
    const precioPorMetroLineal = config.precio_por_metro_lineal || 0

    if (precioPorMetroLineal === 0) {
      toast({
        title: "Error",
        description: "El esquema seleccionado no tiene precio por metro lineal configurado",
        variant: "destructive",
      })
      return
    }

    // Calcular precio base: precio por metro × metros (sin ajuste de forma de pago)
    const precioBase = precioPorMetroLineal * metros

    // Aplicar factor según forma de pago
    const factor = factorFormaPago(formaPago)
    const subtotal = precioBase * factor

    // Aplicar descuento
    const descuento = parseFloat(formData.descuento) || 0
    const total = subtotal - descuento

    setFormData({
      ...formData,
      precio_base: precioBase,
      subtotal,
      total,
    })

    setCalculoRealizado(true)
    setPaso(4)
  }

  // Recalcular cuando cambia la forma de pago
  useEffect(() => {
    if (!calculoRealizado || !configuracionSeleccionada) return

    const metros = parseFloat(formData.metros_lineales_total) || 0
    const precioPorMetroLineal = configuracionSeleccionada.precio_por_metro_lineal || 0
    const precioBase = precioPorMetroLineal * metros
    const factor = factorFormaPago(formaPago)
    const subtotal = precioBase * factor
    const descuento = parseFloat(formData.descuento) || 0
    const total = subtotal - descuento

    setFormData(prev => ({
      ...prev,
      precio_base: precioBase,
      subtotal,
      total,
    }))
  }, [formaPago, calculoRealizado, configuracionSeleccionada, formData.metros_lineales_total, formData.descuento])

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
        terreno_largo: formData.terreno_largo ? parseFloat(formData.terreno_largo) : null,
        terreno_ancho: formData.terreno_ancho ? parseFloat(formData.terreno_ancho) : null,
        metros_lineales_total: parseFloat(formData.metros_lineales_total),
        cercado_config_id: formData.cercado_config_id,
        forma_pago: formaPago,
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

      // Crear item único del presupuesto
      const config = configuraciones.find(c => c.id === formData.cercado_config_id)
      const precioPorMetro = config?.precio_por_metro_lineal || 0
      const metros = parseFloat(formData.metros_lineales_total)

      const items = [
        {
          presupuesto_id: presupuesto.id,
          descripcion: config?.nombre || `Cercado perimetral - ${configuracionSeleccionada?.nombre || 'Esquema seleccionado'}`,
          cantidad: metros,
          unidad: 'metro',
          precio_unitario: precioPorMetro,
          precio_total: formData.subtotal,
          orden: 1,
        },
      ]

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
      <div className="grid gap-6">
        <div>
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
                      Terrenos menores a 50 metros lineales tienen un recargo del 50% por costos fijos.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* PASO 3: Selección de Esquema de Cercado */}
          {paso === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Esquema de Cercado</CardTitle>
                <CardDescription>Selecciona un esquema de cercado predefinido</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="esquema">Seleccionar Esquema *</Label>
                  <Select
                    value={formData.cercado_config_id || ''}
                    onValueChange={handleConfiguracionSeleccionada}
                  >
                    <SelectTrigger id="esquema" className="min-h-[4rem] py-3 h-auto">
                      <div className="flex items-center justify-between w-full pr-2">
                        {configuracionSeleccionada ? (
                          <>
                            <span className="font-semibold">{configuracionSeleccionada.nombre}</span>
                            {configuracionSeleccionada.precio_por_metro_lineal && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 ml-2">
                                ${configuracionSeleccionada.precio_por_metro_lineal.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}/m
                              </Badge>
                            )}
                          </>
                        ) : (
                          <>
                            <SelectValue placeholder="Selecciona un esquema de cercado..." />
                            <Badge variant="outline" className="bg-muted text-muted-foreground border-muted ml-2">
                              Seleccionar
                            </Badge>
                          </>
                        )}
                      </div>
                    </SelectTrigger>
                      <SelectContent>
                      {configuraciones.length === 0 ? (
                        <div className="px-2 py-2 text-sm text-muted-foreground">
                          No hay esquemas disponibles
                        </div>
                      ) : (
                        configuraciones.map((config) => (
                          <SelectItem key={config.id} value={config.id}>
                            <div className="flex flex-col">
                              <span className="font-semibold">{config.nombre}</span>
                              {config.descripcion && (
                                <span className="text-xs text-muted-foreground">{config.descripcion}</span>
                              )}
                              <span className="text-xs text-muted-foreground mt-1">
                                {config.altura_final_cerco ? `${config.altura_final_cerco}m` : `${config.altura}m`} • 
                                {config.tejido_codigo} • 
                                Postes: {config.tipo_poste} • 
                                {config.cordon_tipo !== 'Sin cordón' ? `Cordón ${config.cordon_tipo} • ` : ''}
                                {config.hilos_pua > 0 ? `${config.hilos_pua} hilos púa` : 'Sin púa'}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                      </SelectContent>
                    </Select>
                  </div>

                {configuracionSeleccionada && (
                  <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-green-900">{configuracionSeleccionada.nombre}</h3>
                  </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="outline" className="bg-white">
                          {configuracionSeleccionada.altura_final_cerco 
                            ? `${configuracionSeleccionada.altura_final_cerco}m` 
                            : `${configuracionSeleccionada.altura}m`}
                        </Badge>
                        {configuracionSeleccionada.precio_por_metro_lineal && (
                          <div className="text-right">
                            <p className="text-xs text-green-600 uppercase tracking-wide mb-1">Precio por Metro</p>
                            <p className="text-lg font-bold text-green-900">
                              ${configuracionSeleccionada.precio_por_metro_lineal.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </p>
                </div>
                        )}
                      </div>
                </div>

                    <div className="grid gap-3 md:grid-cols-2 pt-3 border-t border-green-200">
                      <div>
                        <p className="text-xs text-green-600 uppercase tracking-wide mb-1">Tejido</p>
                        <p className="font-semibold text-green-900">
                          {configuracionSeleccionada.tejido_codigo}
                        </p>
                        <p className="text-xs text-green-700">
                          Cal.{configuracionSeleccionada.calibre} - {configuracionSeleccionada.altura}m - Rombo {configuracionSeleccionada.tamano_rombo}"
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-green-600 uppercase tracking-wide mb-1">Postes</p>
                        <p className="font-semibold text-green-900 mb-1">{configuracionSeleccionada.tipo_poste}</p>
                        {(descripcionesPostes.esquinero || descripcionesPostes.intermedio) && (
                          <div className="text-xs text-green-700 space-y-1 mt-2">
                            {descripcionesPostes.esquinero && (
                              <p>
                                <span className="font-medium">Esquineros:</span>{' '}
                                {descripcionesPostes.esquinero.descripcion || descripcionesPostes.esquinero.nombre}
                              </p>
                            )}
                            {descripcionesPostes.intermedio && (
                              <p>
                                <span className="font-medium">Intermedios:</span>{' '}
                                {descripcionesPostes.intermedio.descripcion || descripcionesPostes.intermedio.nombre}
                              </p>
                            )}
                            {descripcionesPostes.refuerzo && (
                              <p>
                                <span className="font-medium">Refuerzos:</span>{' '}
                                {descripcionesPostes.refuerzo.descripcion || descripcionesPostes.refuerzo.nombre}
                              </p>
                            )}
                            {descripcionesPostes.puntal && (
                              <p>
                                <span className="font-medium">Puntales:</span>{' '}
                                {descripcionesPostes.puntal.descripcion || descripcionesPostes.puntal.nombre}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-green-600 uppercase tracking-wide mb-1">Cordón</p>
                        <p className="font-semibold text-green-900">{configuracionSeleccionada.cordon_tipo}</p>
                      </div>
                      <div>
                        <p className="text-xs text-green-600 uppercase tracking-wide mb-1">Alambre de Púa</p>
                        <p className="font-semibold text-green-900">
                          {configuracionSeleccionada.hilos_pua > 0 
                            ? `${configuracionSeleccionada.hilos_pua} hilos` 
                            : 'Sin púa'}
                        </p>
                      </div>
                </div>

                </div>
                )}

                <div className="pt-4">
                  <Button 
                    onClick={calcularPresupuesto} 
                    className="w-full" 
                    size="lg"
                    disabled={!configuracionSeleccionada}
                  >
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
                  <CardTitle>Resumen de Precios</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Precio Base</p>
                        <p className="text-sm font-semibold mb-1">
                          {formData.metros_lineales_total} metros × ${configuracionSeleccionada?.precio_por_metro_lineal?.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}/metro
                        </p>
                        <p className="text-lg font-bold">
                          ${formData.precio_base.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>

                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs text-blue-700 mb-1">Ajuste según forma de pago</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Precio Base × {factorFormaPago(formaPago).toFixed(2)}
                            {formaPago === 'efectivo' ? ' (sin IVA)' : ' (incluye IVA 21%)'}
                          </span>
                          <span className="text-lg font-bold text-blue-700">
                            ${formData.subtotal.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {formData.descuento && parseFloat(formData.descuento) > 0 && (
                      <div className="flex justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                        <span className="text-sm font-medium text-red-700">Descuento:</span>
                        <span className="text-sm font-bold text-red-700">-${parseFloat(formData.descuento).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}</span>
                      </div>
                    )}

                    <div className="flex justify-between p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                      <span className="font-bold text-lg">TOTAL:</span>
                      <span className="text-3xl font-bold text-green-600">
                        ${formData.total.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>

                    <div className="flex justify-between p-3 bg-blue-50 border border-blue-200 rounded">
                      <span className="font-medium text-sm">Precio por Metro Lineal:</span>
                      <span className="text-lg font-bold text-blue-600">
                        ${configuracionSeleccionada?.precio_por_metro_lineal?.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
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
              {/* Resumen de Precios */}
              <Card className="border-2 border-green-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <DollarSign className="h-5 w-5" />
                    Resumen de Precios
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    {/* Precio Base */}
                    <div className="p-4 bg-gradient-to-br from-muted/40 to-muted/20 rounded-lg border border-muted-foreground/20">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Precio Base</p>
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        {formData.metros_lineales_total} metros × ${configuracionSeleccionada?.precio_por_metro_lineal?.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}/metro
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        ${formData.precio_base.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>

                    {/* Forma de Pago */}
                    {(() => {
                      const formaPagoInfo = getFormaPagoInfo(formaPago)
                      const IconoFormaPago = formaPagoInfo.icon
                      return (
                        <div className="space-y-3 pt-2 border-t">
                          <div>
                            <Label className="text-sm font-semibold text-muted-foreground mb-2 block">
                              Forma de Pago
                            </Label>
                            <Select value={formaPago} onValueChange={(v: any) => setFormaPago(v)}>
                              <SelectTrigger className={`w-full h-12 text-base font-semibold border-2 ${formaPagoInfo.borderColor} ${formaPagoInfo.bgColor} transition-colors`}>
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

                          {/* Ajuste según forma de pago */}
                          <div className={`p-4 rounded-lg border-2 ${formaPagoInfo.borderColor} ${formaPagoInfo.bgColor} transition-colors`}>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex-1">
                                <p className={`text-xs uppercase tracking-wide mb-1 ${formaPagoInfo.color}`}>
                                  Cálculo
                                </p>
                                <p className={`text-sm font-medium ${formaPagoInfo.color}`}>
                                  Precio Base × {factorFormaPago(formaPago).toFixed(2)}
                                </p>
                                <p className={`text-xs opacity-80 mt-1 ${formaPagoInfo.color}`}>
                                  {formaPago === 'efectivo' ? 'Sin IVA' : 'Incluye IVA 21%'}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className={`text-2xl font-bold ${formaPagoInfo.color}`}>
                                  ${formData.subtotal.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className={`pt-3 border-t opacity-50 ${formaPagoInfo.borderColor}`}>
                              <p className={`text-xs ${formaPagoInfo.color} opacity-80`}>
                                ${formData.precio_base.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })} × {factorFormaPago(formaPago).toFixed(2)} = ${formData.subtotal.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                  </div>

                  {/* Descuento */}
                  {formData.descuento && parseFloat(formData.descuento) > 0 && (
                    <div className="flex justify-between items-center p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                      <span className="text-sm font-semibold text-red-700">Descuento:</span>
                      <span className="text-xl font-bold text-red-700">-${parseFloat(formData.descuento).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}</span>
                    </div>
                  )}

                  {/* Separador visual */}
                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-muted-foreground/20"></div>
                    </div>
                  </div>

                  {/* Total Final */}
                  <div className="flex justify-between items-center p-6 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-400 rounded-lg shadow-sm">
                    <div>
                      <p className="text-sm text-green-700 uppercase tracking-wide mb-1">Total Final</p>
                      <p className="font-bold text-lg text-green-900">TOTAL A PAGAR</p>
                    </div>
                    <span className="text-4xl font-bold text-green-600">
                      ${formData.total.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  {/* Información adicional */}
                  <div className="pt-4 border-t space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-2 bg-muted/20 rounded">
                        <p className="text-xs text-muted-foreground mb-1">Precio/Metro (base)</p>
                        <p className="text-sm font-semibold">
                          ${configuracionSeleccionada?.precio_por_metro_lineal?.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                      <div className="p-2 bg-muted/20 rounded">
                        <p className="text-xs text-muted-foreground mb-1">Precio/Metro (final)</p>
                        <p className="text-sm font-semibold">
                          ${(formData.total / parseFloat(formData.metros_lineales_total || '1')).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Detalle del Esquema de Cercado */}
              {configuracionSeleccionada && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Info className="h-5 w-5" />
                      Detalle del Esquema de Cercado
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-green-900">{configuracionSeleccionada.nombre}</h3>
                        </div>
                        <Badge variant="outline" className="bg-white">
                          {configuracionSeleccionada.altura_final_cerco 
                            ? `${configuracionSeleccionada.altura_final_cerco}m` 
                            : `${configuracionSeleccionada.altura}m`}
                        </Badge>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2 pt-3 border-t border-green-200">
                        <div>
                          <p className="text-xs text-green-600 uppercase tracking-wide mb-1">Tejido</p>
                          <p className="font-semibold text-green-900">
                            {configuracionSeleccionada.tejido_codigo}
                          </p>
                          <p className="text-xs text-green-700">
                            Cal.{configuracionSeleccionada.calibre} - {configuracionSeleccionada.altura}m - Rombo {configuracionSeleccionada.tamano_rombo}"
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-green-600 uppercase tracking-wide mb-1">Postes</p>
                          <p className="font-semibold text-green-900 mb-1">{configuracionSeleccionada.tipo_poste}</p>
                          {(descripcionesPostes.esquinero || descripcionesPostes.intermedio) && (
                            <div className="text-xs text-green-700 space-y-1 mt-2">
                              {descripcionesPostes.esquinero && (
                                <p>
                                  <span className="font-medium">Esquineros:</span>{' '}
                                  {descripcionesPostes.esquinero.descripcion || descripcionesPostes.esquinero.nombre}
                                </p>
                              )}
                              {descripcionesPostes.intermedio && (
                                <p>
                                  <span className="font-medium">Intermedios:</span>{' '}
                                  {descripcionesPostes.intermedio.descripcion || descripcionesPostes.intermedio.nombre}
                                </p>
                              )}
                              {descripcionesPostes.refuerzo && (
                                <p>
                                  <span className="font-medium">Refuerzos:</span>{' '}
                                  {descripcionesPostes.refuerzo.descripcion || descripcionesPostes.refuerzo.nombre}
                                </p>
                              )}
                              {descripcionesPostes.puntal && (
                                <p>
                                  <span className="font-medium">Puntales:</span>{' '}
                                  {descripcionesPostes.puntal.descripcion || descripcionesPostes.puntal.nombre}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-green-600 uppercase tracking-wide mb-1">Cordón</p>
                          <p className="font-semibold text-green-900">{configuracionSeleccionada.cordon_tipo}</p>
                        </div>
                        <div>
                          <p className="text-xs text-green-600 uppercase tracking-wide mb-1">Alambre de Púa</p>
                          <p className="font-semibold text-green-900">
                            {configuracionSeleccionada.hilos_pua > 0 
                              ? `${configuracionSeleccionada.hilos_pua} hilos` 
                              : 'Sin púa'}
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-green-200">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-green-600 uppercase tracking-wide mb-2">Precio por Metro Lineal</p>
                        </div>
                        <p className="text-2xl font-bold text-green-900 mb-2">
                          ${configuracionSeleccionada.precio_por_metro_lineal?.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 pt-3 border-t">
                      <div>
                        <p className="text-xs text-muted-foreground">Dimensiones del Terreno</p>
                        <p className="font-semibold">
                          {formData.terreno_largo}m × {formData.terreno_ancho}m
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Perímetro: {formData.metros_lineales_total} metros lineales
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Datos del Cliente */}
              {clienteSeleccionado && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Datos del Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Nombre</p>
                      <p className="font-semibold text-lg">{formData.cliente_nombre}</p>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {formData.cliente_telefono && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            Teléfono
                          </p>
                          <p className="font-semibold">{formData.cliente_telefono}</p>
                        </div>
                      )}
                      {formData.cliente_email && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            Email
                          </p>
                          <p className="font-semibold">{formData.cliente_email}</p>
                        </div>
                      )}
                      {formData.cliente_direccion && (
                        <div className="md:col-span-2">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Dirección
                          </p>
                          <p className="font-semibold">{formData.cliente_direccion}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}


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

