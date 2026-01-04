'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, ArrowRight, Save, Calculator, CheckCircle, DollarSign, FileText, CreditCard, Receipt, AlertCircle, User, Mail, Phone, MapPin, Info, Grid, Columns, Circle, Zap, Filter, X, Search, ArrowUpDown, Gauge, Diamond } from 'lucide-react'
import Link from 'next/link'
import { Textarea } from '@/components/ui/textarea'
import { BuscarCliente } from '@/components/BuscarCliente'
import { Badge } from '@/components/ui/badge'

// Tipos
type FormaPago = 'efectivo' | 'lista' | 'tarjeta' | 'echeq45' | 'echeq60' | 'echeq90'

interface Cliente {
  id?: string
  nombre_completo: string
  email?: string
  telefono?: string
  direccion?: string
}

interface ConfiguracionCercado {
  id: string
  nombre: string
  descripcion?: string
  altura: number
  altura_final_cerco?: number
  precio_por_metro_lineal: number
  tipo_poste: string
  cordon_tipo: string
  hilos_pua: number
  tejido_codigo: string
  calibre?: number
  tamano_rombo?: number
  poste_esquinero_id?: string
  poste_refuerzo_id?: string
  poste_intermedio_id?: string
  poste_puntal_id?: string
}

interface Articulo {
  id: string
  nombre: string
  descripcion?: string
}

// Helpers fuera del componente para evitar recreaciones
const formatearPrecio = (valor: number | undefined | null): string => {
  if (valor === undefined || valor === null || isNaN(valor)) return '0.00'
  return valor.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

const obtenerFechaArgentina = (): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())

// Helper para obtener altura (prioriza altura_final_cerco sobre altura)
const obtenerAltura = (config: ConfiguracionCercado): string => {
  return config.altura_final_cerco 
    ? config.altura_final_cerco.toString() 
    : config.altura?.toString() || ''
}

export default function NuevoPresupuestoCercadoPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [paso, setPaso] = useState(1)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null)
  const [configuraciones, setConfiguraciones] = useState<ConfiguracionCercado[]>([])
  const [configuracionSeleccionada, setConfiguracionSeleccionada] = useState<ConfiguracionCercado | null>(null)
  const [descripcionesPostes, setDescripcionesPostes] = useState<Record<string, Articulo>>({})
  const [calculoRealizado, setCalculoRealizado] = useState(false)
  const [formaPago, setFormaPago] = useState<FormaPago>('lista')
  
  // Estados de filtros para esquemas
  const [filtroAltura, setFiltroAltura] = useState<string>('todas')
  const [filtroCalibre, setFiltroCalibre] = useState<string>('todos')
  const [filtroRombo, setFiltroRombo] = useState<string>('todos')
  const [filtroTipoPoste, setFiltroTipoPoste] = useState<string>('todos')
  const [filtroCordon, setFiltroCordon] = useState<string>('todos')
  const [filtroHilosPua, setFiltroHilosPua] = useState<string>('todos')
  const [busquedaTexto, setBusquedaTexto] = useState<string>('')
  const [selectorAbierto, setSelectorAbierto] = useState(false)

  const factorFormaPago = useCallback((fp: FormaPago): number => {
    switch (fp) {
      case 'efectivo': return 1.0 // precio_base × 1.0 (sin IVA)
      case 'lista': return 1.21 // precio_base × 1.21 (incluye IVA 21%)
      case 'tarjeta': return 1.3 // precio_base × 1.3 (incluye IVA 21%)
      case 'echeq45': return 1.21 // igual que Factura/Lista (incluye IVA 21%)
      case 'echeq60': return 1.3 // igual que Tarjeta (incluye IVA 21%)
      case 'echeq90': return 1.4 // precio_base × 1.4 (incluye IVA 21%)
      default: return 1.21
    }
  }, [])

  const getFormaPagoInfo = useCallback((fp: FormaPago) => {
    const info: Record<FormaPago, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bgColor: string; borderColor: string }> = {
      efectivo: { label: 'Efectivo', icon: DollarSign, color: 'text-green-700', bgColor: 'bg-green-50', borderColor: 'border-green-300' },
      lista: { label: 'Factura / Lista', icon: FileText, color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-300' },
      tarjeta: { label: 'Tarjeta', icon: CreditCard, color: 'text-purple-700', bgColor: 'bg-purple-50', borderColor: 'border-purple-300' },
      echeq45: { label: 'E-cheq 45 días', icon: Receipt, color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-300' },
      echeq60: { label: 'E-cheq 60 días', icon: Receipt, color: 'text-purple-700', bgColor: 'bg-purple-50', borderColor: 'border-purple-300' },
      echeq90: { label: 'E-cheq 90 días', icon: Receipt, color: 'text-purple-800', bgColor: 'bg-purple-50', borderColor: 'border-purple-300' },
    }
    return info[fp] || info.lista
  }, [])


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

  // Memoizar funciones de carga
  const cargarUsuario = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setUserId(user.id)
  }, [])

  const cargarConfiguraciones = useCallback(async () => {
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
  }, [toast])

  useEffect(() => {
    cargarUsuario()
    cargarConfiguraciones()
  }, [cargarUsuario, cargarConfiguraciones])

  // Calcular perímetro cuando cambian largo y ancho
  useEffect(() => {
    if (formData.terreno_largo && formData.terreno_ancho) {
      const largo = parseFloat(formData.terreno_largo)
      const ancho = parseFloat(formData.terreno_ancho)
      if (!isNaN(largo) && !isNaN(ancho) && largo > 0 && ancho > 0) {
        const perimetro = 2 * (largo + ancho)
        setFormData(prev => ({ ...prev, metros_lineales_total: perimetro.toFixed(2) }))
      }
    }
  }, [formData.terreno_largo, formData.terreno_ancho])


  // Calcular valores únicos para los filtros
  const valoresUnicos = useMemo(() => {
    const alturas = new Set<string>()
    const calibres = new Set<string>()
    const rombos = new Set<string>()
    const tiposPoste = new Set<string>()
    const cordones = new Set<string>()
    const hilosPua = new Set<number>()

    configuraciones.forEach((config) => {
      const altura = obtenerAltura(config)
      if (altura) alturas.add(altura)
      if (config.calibre) calibres.add(config.calibre.toString())
      if (config.tamano_rombo) rombos.add(config.tamano_rombo.toString())
      if (config.tipo_poste) tiposPoste.add(config.tipo_poste)
      if (config.cordon_tipo) cordones.add(config.cordon_tipo)
      hilosPua.add(config.hilos_pua || 0)
    })

    return {
      alturas: Array.from(alturas).sort((a, b) => parseFloat(a) - parseFloat(b)),
      calibres: Array.from(calibres).sort((a, b) => parseFloat(a) - parseFloat(b)),
      rombos: Array.from(rombos).sort((a, b) => parseFloat(a) - parseFloat(b)),
      tiposPoste: Array.from(tiposPoste).sort(),
      cordones: Array.from(cordones).sort(),
      hilosPua: Array.from(hilosPua).sort((a, b) => a - b),
    }
  }, [configuraciones])

  // Filtrar configuraciones según los filtros activos y búsqueda de texto
  const configuracionesFiltradas = useMemo(() => {
    return configuraciones.filter((config) => {
      // Búsqueda por texto (nombre, código de tejido, etc.)
      if (busquedaTexto.trim()) {
        const busqueda = busquedaTexto.toLowerCase()
        const nombreMatch = config.nombre?.toLowerCase().includes(busqueda)
        const codigoMatch = config.tejido_codigo?.toLowerCase().includes(busqueda)
        const tipoPosteMatch = config.tipo_poste?.toLowerCase().includes(busqueda)
        
        if (!nombreMatch && !codigoMatch && !tipoPosteMatch) return false
      }

      // Filtro por altura
      if (filtroAltura !== 'todas') {
        const altura = obtenerAltura(config)
        if (altura !== filtroAltura) return false
      }

      // Filtro por calibre
      if (filtroCalibre !== 'todos') {
        if (config.calibre?.toString() !== filtroCalibre) return false
      }

      // Filtro por rombo
      if (filtroRombo !== 'todos') {
        if (config.tamano_rombo?.toString() !== filtroRombo) return false
      }

      // Filtro por tipo de poste
      if (filtroTipoPoste !== 'todos') {
        if (config.tipo_poste !== filtroTipoPoste) return false
      }

      // Filtro por cordón
      if (filtroCordon !== 'todos') {
        if (config.cordon_tipo !== filtroCordon) return false
      }

      // Filtro por hilos de púa
      if (filtroHilosPua !== 'todos') {
        const hilos = (config.hilos_pua || 0).toString()
        if (hilos !== filtroHilosPua) return false
      }

      return true
    })
  }, [configuraciones, filtroAltura, filtroCalibre, filtroRombo, filtroTipoPoste, filtroCordon, filtroHilosPua, busquedaTexto])

  // Función para limpiar filtros
  const limpiarFiltros = useCallback(() => {
    setFiltroAltura('todas')
    setFiltroCalibre('todos')
    setFiltroRombo('todos')
    setFiltroTipoPoste('todos')
    setFiltroCordon('todos')
    setFiltroHilosPua('todos')
    setBusquedaTexto('')
  }, [])

  // Obtener etiquetas de filtros activos para mostrar en chips
  const filtrosActivosLabels = useMemo(() => {
    const labels: string[] = []
    if (filtroAltura !== 'todas') labels.push(`${filtroAltura}m`)
    if (filtroCalibre !== 'todos') labels.push(`Cal.${filtroCalibre}`)
    if (filtroRombo !== 'todos') labels.push(`Rombo ${filtroRombo}"`)
    if (filtroTipoPoste !== 'todos') labels.push(filtroTipoPoste)
    if (filtroCordon !== 'todos') labels.push(filtroCordon)
    if (filtroHilosPua !== 'todos') {
      labels.push(filtroHilosPua === '0' ? 'Sin púa' : `${filtroHilosPua} hilos`)
    }
    return labels
  }, [filtroAltura, filtroCalibre, filtroRombo, filtroTipoPoste, filtroCordon, filtroHilosPua])

  const filtrosActivos = filtroAltura !== 'todas' || filtroCalibre !== 'todos' || filtroRombo !== 'todos' || 
                          filtroTipoPoste !== 'todos' || filtroCordon !== 'todos' || filtroHilosPua !== 'todos' || 
                          busquedaTexto.trim() !== ''

  const handleClienteSeleccionado = useCallback((cliente: Cliente) => {
    if (!cliente.id) {
      toast({
        title: "Error",
        description: "El cliente seleccionado no tiene ID válido",
        variant: "destructive",
      })
      return
    }
    setClienteSeleccionado(cliente)
    setFormData(prev => ({
      ...prev,
      cliente_id: cliente.id || null,
      cliente_nombre: cliente.nombre_completo,
      cliente_email: cliente.email || '',
      cliente_telefono: cliente.telefono || '',
      cliente_direccion: cliente.direccion || '',
    }))
  }, [toast])

  const handleConfiguracionSeleccionada = useCallback(async (configId: string) => {
    const config = configuraciones.find(c => c.id === configId)
    if (!config) return

    setConfiguracionSeleccionada(config)
    
    // Cargar descripciones de los postes
    const idsPostes = [
      config.poste_esquinero_id,
      config.poste_refuerzo_id,
      config.poste_intermedio_id,
      config.poste_puntal_id,
    ].filter(Boolean) as string[]

    if (idsPostes.length > 0) {
      const { data: articulosPostes, error } = await supabase
        .from('articulos')
        .select('id, nombre, descripcion')
        .in('id', idsPostes)

      if (!error && articulosPostes) {
        const descripciones: Record<string, Articulo> = {}
        const posteMap: Record<string, keyof typeof descripciones> = {
          [config.poste_esquinero_id!]: 'esquinero',
          [config.poste_refuerzo_id!]: 'refuerzo',
          [config.poste_intermedio_id!]: 'intermedio',
          [config.poste_puntal_id!]: 'puntal',
        }
        
        articulosPostes.forEach((art) => {
          const tipo = posteMap[art.id]
          if (tipo) descripciones[tipo] = art
        })
        setDescripcionesPostes(descripciones)
      }
    } else {
      setDescripcionesPostes({})
    }
    
    // Actualizar formData con los datos de la configuración
    setFormData(prev => ({
      ...prev,
      cercado_config_id: config.id,
      altura_tejido: config.altura.toString(),
      tejido_calibre: config.calibre?.toString() || '',
      tejido_rombo: config.tamano_rombo?.toString() || '',
      tipo_poste: config.tipo_poste || '',
      tipo_cordon: config.cordon_tipo || '',
      hilos_pua: config.hilos_pua?.toString() || '0',
    }))
  }, [configuraciones])

  // Calcular automáticamente cuando cambia esquema, metros, forma de pago o descuento
  useEffect(() => {
    if (!configuracionSeleccionada || !formData.metros_lineales_total) {
      setCalculoRealizado(false)
      return
    }

    const metros = parseFloat(formData.metros_lineales_total) || 0
    if (metros === 0 || isNaN(metros)) {
      setCalculoRealizado(false)
      return
    }

    const precioPorMetroLineal = configuracionSeleccionada.precio_por_metro_lineal || 0
    if (precioPorMetroLineal === 0) {
      setCalculoRealizado(false)
      return
    }

    // Calcular precio base: precio por metro × metros (sin ajuste de forma de pago)
    const precioBase = precioPorMetroLineal * metros

    // Aplicar factor según forma de pago
    const factor = factorFormaPago(formaPago)
    const subtotal = precioBase * factor

    // Aplicar descuento
    const descuento = parseFloat(formData.descuento) || 0
    const total = Math.max(0, subtotal - descuento)

    setFormData(prev => ({
      ...prev,
      precio_base: precioBase,
      subtotal,
      total,
    }))
    setCalculoRealizado(true)
  }, [formaPago, configuracionSeleccionada, formData.metros_lineales_total, formData.descuento, factorFormaPago])

  const handleSubmit = useCallback(async () => {
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
      const metros = parseFloat(formData.metros_lineales_total)
      const config = configuracionSeleccionada || configuraciones.find(c => c.id === formData.cercado_config_id)

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
        metros_lineales_total: metros,
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
      const precioPorMetro = config?.precio_por_metro_lineal || 0

      const items = [
        {
          presupuesto_id: presupuesto.id,
          descripcion: config?.nombre || `Cercado perimetral - ${config?.nombre || 'Esquema seleccionado'}`,
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
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error al crear presupuesto",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive",
      })
      setLoading(false)
    }
  }, [userId, formData, formaPago, configuracionSeleccionada, configuraciones, toast, router])

  const pasos = [
    { numero: 1, titulo: 'Datos Básicos', descripcion: 'Cliente y dimensiones' },
    { numero: 2, titulo: 'Configuración y Precios', descripcion: 'Esquema, forma de pago y cálculo' },
    { numero: 3, titulo: 'Revisión y Finalizar', descripcion: 'Verificar y guardar' },
  ]

  const puedeAvanzar = useMemo(() => {
    switch (paso) {
      case 1: return clienteSeleccionado !== null && formData.metros_lineales_total !== ''
      case 2: return configuracionSeleccionada !== null
      case 3: return true
      default: return false
    }
  }, [paso, clienteSeleccionado, formData.metros_lineales_total, configuracionSeleccionada])

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
          {/* PASO 1: Datos Básicos - Cliente y Dimensiones del Terreno */}
          {paso === 1 && (
            <div className="space-y-6">
              {/* Cliente */}
              <Card>
                <CardHeader>
                  <CardTitle>Cliente</CardTitle>
                  <CardDescription>Selecciona el cliente para el presupuesto</CardDescription>
                </CardHeader>
                <CardContent>
                  {!clienteSeleccionado ? (
                    <BuscarCliente onClienteSeleccionado={handleClienteSeleccionado} />
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                        <p className="font-bold text-lg">{formData.cliente_nombre}</p>
                        <p className="text-sm text-muted-foreground">Tel: {formData.cliente_telefono}</p>
                        {formData.cliente_email && <p className="text-sm text-muted-foreground">Email: {formData.cliente_email}</p>}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setClienteSeleccionado(null)}
                      >
                        Cambiar Cliente
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Dimensiones del Terreno */}
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
            </div>
          )}

          {/* PASO 2: Configuración y Precios - Esquema, Forma de Pago y Cálculo */}
          {paso === 2 && (
            <div className="space-y-6">
              {/* Selección de Esquema de Cercado */}
            <Card>
              <CardHeader>
                <CardTitle>Esquema de Cercado</CardTitle>
                <CardDescription>Selecciona un esquema de cercado predefinido</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="esquema" className="text-base font-semibold">Seleccionar Esquema *</Label>
                    {filtrosActivos && (
                      <Button variant="ghost" size="sm" onClick={limpiarFiltros} className="h-7 text-xs">
                        <X className="h-3 w-3 mr-1" />
                        Limpiar Filtros
                      </Button>
                    )}
                  </div>
                  
                  <Popover open={selectorAbierto} onOpenChange={setSelectorAbierto}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full min-h-[4rem] py-3 h-auto justify-between text-left font-normal"
                        id="esquema"
                      >
                        <div className="flex items-center justify-between w-full pr-2">
                          {configuracionSeleccionada ? (
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="font-semibold truncate">{configuracionSeleccionada.nombre}</span>
                              {configuracionSeleccionada.precio_por_metro_lineal && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 shrink-0">
                                  ${configuracionSeleccionada.precio_por_metro_lineal.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}/m
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Selecciona un esquema de cercado...</span>
                          )}
                          <div className="flex items-center gap-2 shrink-0">
                            {filtrosActivos && filtrosActivosLabels.length > 0 && (
                              <div className="flex items-center gap-1 flex-wrap">
                                {filtrosActivosLabels.slice(0, 2).map((label, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {label}
                                  </Badge>
                                ))}
                                {filtrosActivosLabels.length > 2 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{filtrosActivosLabels.length - 2}
                                  </Badge>
                                )}
                              </div>
                            )}
                            <Search className="h-4 w-4 shrink-0 opacity-50" />
                          </div>
                        </div>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[95vw] max-w-[900px] p-0" align="start" sideOffset={8}>
                      <div className="flex flex-col max-h-[70vh]">
                        {/* Header compacto con búsqueda y filtros en una sola línea */}
                        <div className="p-3 border-b bg-gradient-to-r from-muted/40 to-muted/20 sticky top-0 z-10">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Búsqueda compacta */}
                            <div className="relative flex-1 min-w-[200px]">
                              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                placeholder="Buscar..."
                                value={busquedaTexto}
                                onChange={(e) => setBusquedaTexto(e.target.value)}
                                className="pl-8 h-8 text-xs"
                              />
                            </div>
                            
                            {/* Filtros principales compactos con iconos */}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Select value={filtroAltura} onValueChange={setFiltroAltura}>
                                    <SelectTrigger className="h-8 w-[100px] text-xs px-2">
                                      <div className="flex items-center gap-1.5">
                                        <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                                        <SelectValue>
                                          {filtroAltura === 'todas' ? 'Altura' : `${filtroAltura}m`}
                                        </SelectValue>
                                      </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="todas">Todas</SelectItem>
                                      {valoresUnicos.alturas.map((altura) => (
                                        <SelectItem key={altura} value={altura}>
                                          {altura}m
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Filtrar por altura del cerco</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Select value={filtroTipoPoste} onValueChange={setFiltroTipoPoste}>
                                    <SelectTrigger className="h-8 w-[120px] text-xs px-2">
                                      <div className="flex items-center gap-1.5">
                                        <Columns className="h-3 w-3 text-muted-foreground" />
                                        <SelectValue>
                                          {filtroTipoPoste === 'todos' ? 'Poste' : filtroTipoPoste.length > 8 ? `${filtroTipoPoste.substring(0, 8)}...` : filtroTipoPoste}
                                        </SelectValue>
                                      </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="todos">Todos</SelectItem>
                                      {valoresUnicos.tiposPoste.map((tipo) => (
                                        <SelectItem key={tipo} value={tipo}>
                                          {tipo}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Filtrar por tipo de poste</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Select value={filtroCordon} onValueChange={setFiltroCordon}>
                                    <SelectTrigger className="h-8 w-[100px] text-xs px-2">
                                      <div className="flex items-center gap-1.5">
                                        <Circle className="h-3 w-3 text-muted-foreground" />
                                        <SelectValue>
                                          {filtroCordon === 'todos' ? 'Cordón' : filtroCordon.length > 6 ? `${filtroCordon.substring(0, 6)}...` : filtroCordon}
                                        </SelectValue>
                                      </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="todos">Todos</SelectItem>
                                      {valoresUnicos.cordones.map((cordon) => (
                                        <SelectItem key={cordon} value={cordon}>
                                          {cordon}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Filtrar por tipo de cordón</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            {/* Filtros secundarios compactos */}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Select value={filtroCalibre} onValueChange={setFiltroCalibre}>
                                    <SelectTrigger className="h-8 w-[85px] text-xs px-2">
                                      <div className="flex items-center gap-1">
                                        <Gauge className="h-3 w-3 text-muted-foreground" />
                                        <SelectValue>
                                          {filtroCalibre === 'todos' ? 'Cal.' : `Cal.${filtroCalibre}`}
                                        </SelectValue>
                                      </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="todos">Todos</SelectItem>
                                      {valoresUnicos.calibres.map((calibre) => (
                                        <SelectItem key={calibre} value={calibre}>
                                          Cal.{calibre}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Filtrar por calibre del tejido</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Select value={filtroRombo} onValueChange={setFiltroRombo}>
                                    <SelectTrigger className="h-8 w-[80px] text-xs px-2">
                                      <div className="flex items-center gap-1">
                                        <Diamond className="h-3 w-3 text-muted-foreground" />
                                        <SelectValue>
                                          {filtroRombo === 'todos' ? 'Rombo' : `${filtroRombo}"`}
                                        </SelectValue>
                                      </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="todos">Todos</SelectItem>
                                      {valoresUnicos.rombos.map((rombo) => (
                                        <SelectItem key={rombo} value={rombo}>
                                          {rombo}"
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Filtrar por tamaño de rombo</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Select value={filtroHilosPua} onValueChange={setFiltroHilosPua}>
                                    <SelectTrigger className="h-8 w-[75px] text-xs px-2">
                                      <div className="flex items-center gap-1">
                                        <Zap className="h-3 w-3 text-muted-foreground" />
                                        <SelectValue>
                                          {filtroHilosPua === 'todos' 
                                            ? 'Púa' 
                                            : filtroHilosPua === '0' ? 'Sin' : filtroHilosPua}
                                        </SelectValue>
                                      </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="todos">Todos</SelectItem>
                                      {valoresUnicos.hilosPua.map((hilos) => (
                                        <SelectItem key={hilos} value={hilos.toString()}>
                                          {hilos === 0 ? 'Sin púa' : `${hilos} hilos`}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Filtrar por cantidad de hilos de púa</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            {/* Botón limpiar y contador compacto */}
                            <div className="flex items-center gap-1.5 ml-auto">
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {configuracionesFiltradas.length}/{configuraciones.length}
                              </span>
                              {filtrosActivos && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={limpiarFiltros} 
                                        className="h-7 w-7 p-0"
                                      >
                                        <X className="h-3.5 w-3.5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs">Limpiar todos los filtros</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Lista de esquemas compacta */}
                        <div className="overflow-y-auto max-h-[calc(70vh-120px)]">
                          {configuracionesFiltradas.length === 0 ? (
                            <div className="p-6 text-center text-sm text-muted-foreground">
                              {filtrosActivos || busquedaTexto ? (
                                <>
                                  <p className="font-medium mb-1">No se encontraron esquemas</p>
                                  <p className="text-xs">Ajusta los filtros o la búsqueda</p>
                                </>
                              ) : (
                                'No hay esquemas disponibles'
                              )}
                            </div>
                          ) : (
                            <div className="p-1.5">
                              {configuracionesFiltradas.map((config) => (
                                <div
                                  key={config.id}
                                  onClick={() => {
                                    handleConfiguracionSeleccionada(config.id)
                                    setSelectorAbierto(false)
                                  }}
                                  className={`relative flex cursor-pointer select-none items-center rounded-md px-2.5 py-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground ${
                                    formData.cercado_config_id === config.id ? 'bg-accent border border-primary/20' : ''
                                  }`}
                                >
                                  <div className="flex items-center justify-between w-full gap-2">
                                    <div className="flex flex-col flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold text-sm truncate">{config.nombre}</span>
                                        <Badge variant="outline" className="h-4 px-1.5 text-[10px] shrink-0">
                                          {obtenerAltura(config)}m
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                        <span className="text-[11px] text-muted-foreground">{config.tejido_codigo}</span>
                                        <span className="text-[10px] text-muted-foreground">•</span>
                                        <span className="text-[11px] text-muted-foreground">{config.tipo_poste}</span>
                                        {config.cordon_tipo !== 'Sin cordón' && (
                                          <>
                                            <span className="text-[10px] text-muted-foreground">•</span>
                                            <span className="text-[11px] text-muted-foreground">{config.cordon_tipo}</span>
                                          </>
                                        )}
                                        {config.hilos_pua > 0 && (
                                          <>
                                            <span className="text-[10px] text-muted-foreground">•</span>
                                            <span className="text-[11px] text-muted-foreground">{config.hilos_pua} púa</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    {config.precio_por_metro_lineal && (
                                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 shrink-0 text-xs font-semibold px-2 py-0.5">
                                        ${formatearPrecio(config.precio_por_metro_lineal)}/m
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {configuracionSeleccionada && (
                  <div className="p-4 bg-muted/30 border-2 border-muted rounded-lg space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-foreground">{configuracionSeleccionada.nombre}</h3>
                  </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="outline" className="bg-background">
                          {obtenerAltura(configuracionSeleccionada)}m
                        </Badge>
                        {configuracionSeleccionada.precio_por_metro_lineal && (
                          <div className="text-right">
                            <p className="text-xs text-green-600 uppercase tracking-wide mb-1 font-bold">Precio por Metro</p>
                            <p className="text-lg font-bold text-green-700">
                              ${formatearPrecio(configuracionSeleccionada.precio_por_metro_lineal)}
                            </p>
                </div>
                        )}
                      </div>
                </div>

                    <div className="grid gap-3 md:grid-cols-2 pt-3 border-t border-muted-foreground/20">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1 font-bold flex items-center gap-1.5">
                          <Grid className="h-3.5 w-3.5" />
                          Tejido
                        </p>
                        <p className="font-bold text-foreground">
                          {configuracionSeleccionada.tejido_codigo}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Cal.{configuracionSeleccionada.calibre} - {configuracionSeleccionada.altura}m - Rombo {configuracionSeleccionada.tamano_rombo}"
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1 font-bold flex items-center gap-1.5">
                          <Columns className="h-3.5 w-3.5" />
                          Postes
                        </p>
                        <p className="font-bold text-foreground mb-1">{configuracionSeleccionada.tipo_poste}</p>
                        {(descripcionesPostes.esquinero || descripcionesPostes.intermedio) && (
                          <div className="text-xs text-muted-foreground space-y-1 mt-2">
                            {descripcionesPostes.esquinero && (
                              <p>
                                <span className="font-bold">Esquineros:</span>{' '}
                                {descripcionesPostes.esquinero.descripcion || descripcionesPostes.esquinero.nombre}
                              </p>
                            )}
                            {descripcionesPostes.intermedio && (
                              <p>
                                <span className="font-bold">Intermedios:</span>{' '}
                                {descripcionesPostes.intermedio.descripcion || descripcionesPostes.intermedio.nombre}
                              </p>
                            )}
                            {descripcionesPostes.refuerzo && (
                              <p>
                                <span className="font-bold">Refuerzos:</span>{' '}
                                {descripcionesPostes.refuerzo.descripcion || descripcionesPostes.refuerzo.nombre}
                              </p>
                            )}
                            {descripcionesPostes.puntal && (
                              <p>
                                <span className="font-bold">Puntales:</span>{' '}
                                {descripcionesPostes.puntal.descripcion || descripcionesPostes.puntal.nombre}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1 font-bold flex items-center gap-1.5">
                          <Circle className="h-3.5 w-3.5" />
                          Cordón
                        </p>
                        <p className="font-bold text-foreground">{configuracionSeleccionada.cordon_tipo}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1 font-bold flex items-center gap-1.5">
                          <Zap className="h-3.5 w-3.5" />
                          Alambre de Púa
                        </p>
                        <p className="font-bold text-foreground">
                          {configuracionSeleccionada.hilos_pua > 0 
                            ? `${configuracionSeleccionada.hilos_pua} hilos` 
                            : 'Sin púa'}
                        </p>
                      </div>
                </div>

                </div>
                )}
              </CardContent>
            </Card>

              {/* Forma de Pago y Resumen de Precios */}
              {configuracionSeleccionada && calculoRealizado && (() => {
                const formaPagoInfo = getFormaPagoInfo(formaPago)
                const IconoFormaPago = formaPagoInfo.icon
                return (
                  <>
                    {/* Forma de Pago */}
                    <Card>
                      <CardHeader>
                        <CardTitle className={`flex items-center gap-2 ${formaPagoInfo.color}`}>
                          <IconoFormaPago className="h-5 w-5" />
                          Forma de Pago
                        </CardTitle>
                        <CardDescription className={formaPagoInfo.color}>
                          Selecciona el método de pago para este presupuesto
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className={`text-sm font-semibold ${formaPagoInfo.color}`}>
                            Forma de Pago
                          </Label>
                          <Select value={formaPago} onValueChange={(v: FormaPago) => setFormaPago(v)}>
                            <SelectTrigger className={`w-full h-12 text-base font-semibold border-2 ${formaPagoInfo.borderColor} ${formaPagoInfo.bgColor} transition-colors mt-2`}>
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
                      </CardContent>
                    </Card>

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
                              {formData.metros_lineales_total} metros × ${formatearPrecio(configuracionSeleccionada?.precio_por_metro_lineal)}/metro
                            </p>
                            <p className="text-2xl font-bold text-foreground">
                              ${formData.precio_base.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </p>
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
                                })} × {factorFormaPago(formaPago).toFixed(2)} = ${formatearPrecio(formData.subtotal)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Descuento */}
                        <div className="space-y-2">
                          <Label htmlFor="descuento-paso2">Descuento ($)</Label>
                          <Input
                            id="descuento-paso2"
                            type="number"
                            step="0.01"
                            value={formData.descuento}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                descuento: e.target.value,
                              }))
                            }}
                            className="max-w-xs"
                          />
                        </div>

                        {formData.descuento && parseFloat(formData.descuento) > 0 && (
                          <div className="flex justify-between items-center p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                            <span className="text-sm font-semibold text-red-700">Descuento:</span>
                            <span className="text-xl font-bold text-red-700">                            -${formatearPrecio(parseFloat(formData.descuento))}</span>
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
                            ${formatearPrecio(formData.total)}
                          </span>
                        </div>

                        {/* Información adicional */}
                        <div className="pt-4 border-t space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-2 bg-muted/20 rounded">
                              <p className="text-xs text-muted-foreground mb-1">Precio/Metro (base)</p>
                              <p className="text-sm font-semibold">
                                ${formatearPrecio(configuracionSeleccionada?.precio_por_metro_lineal)}
                              </p>
                            </div>
                            <div className="p-2 bg-muted/20 rounded">
                              <p className="text-xs text-muted-foreground mb-1">Precio/Metro (final)</p>
                              <p className="text-sm font-semibold">
                                ${formatearPrecio(formData.total / parseFloat(formData.metros_lineales_total || '1'))}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )
              })()}
            </div>
          )}

          {/* PASO 3: Revisión y Finalizar */}
          {paso === 3 && (
            <div className="space-y-6">
              {/* Resumen Final de Precios (solo lectura) */}
              <Card className="border-2 border-green-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <DollarSign className="h-5 w-5" />
                    Resumen Final de Precios
                  </CardTitle>
                  <CardDescription>
                    Revisa los precios calculados antes de guardar el presupuesto
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(() => {
                    const formaPagoInfo = getFormaPagoInfo(formaPago)
                    return (
                      <>
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
                            ${formatearPrecio(formData.precio_base)}
                          </p>
                        </div>

                        {/* Forma de Pago Seleccionada */}
                        <div className={`p-4 rounded-lg border-2 ${formaPagoInfo.borderColor} ${formaPagoInfo.bgColor} transition-colors`}>
                          <p className={`text-xs uppercase tracking-wide mb-2 ${formaPagoInfo.color}`}>
                            Forma de Pago
                          </p>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex-1">
                              <p className={`text-sm font-medium ${formaPagoInfo.color}`}>
                                {formaPago === 'efectivo' ? 'Efectivo' : 
                                 formaPago === 'lista' ? 'Factura / Lista' :
                                 formaPago === 'tarjeta' ? 'Tarjeta' :
                                 formaPago === 'echeq45' ? 'E-cheq 45 días' :
                                 formaPago === 'echeq60' ? 'E-cheq 60 días' : 'E-cheq 90 días'}
                              </p>
                              <p className={`text-xs opacity-80 mt-1 ${formaPagoInfo.color}`}>
                                Precio Base × {factorFormaPago(formaPago).toFixed(2)} {formaPago === 'efectivo' ? '(sin IVA)' : '(incluye IVA 21%)'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={`text-2xl font-bold ${formaPagoInfo.color}`}>
                                ${formatearPrecio(formData.subtotal)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Descuento */}
                        {formData.descuento && parseFloat(formData.descuento) > 0 && (
                          <div className="flex justify-between items-center p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                            <span className="text-sm font-semibold text-red-700">Descuento:</span>
                            <span className="text-xl font-bold text-red-700">                            -${formatearPrecio(parseFloat(formData.descuento))}</span>
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
                            ${formatearPrecio(formData.total)}
                          </span>
                        </div>
                      </>
                    )
                  })()}
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
                          {obtenerAltura(configuracionSeleccionada)}m
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
                          ${formatearPrecio(configuracionSeleccionada.precio_por_metro_lineal)}
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
                        setFormData(prev => ({ 
                          ...prev, 
                          descuento: e.target.value,
                        }))
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
            {paso < 3 && (
              <Button
                onClick={() => setPaso(paso + 1)}
                disabled={!puedeAvanzar}
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

