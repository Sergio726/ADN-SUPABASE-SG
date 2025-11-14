'use client'

import { useState, useEffect, useMemo } from 'react'
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronUp } from 'lucide-react'

export default function NuevaConfiguracionCercadoPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [loadingInicial, setLoadingInicial] = useState(true)
  const [tejidos, setTejidos] = useState<any[]>([])
  const [postes, setPostes] = useState<any[]>([])
  const [accesorios, setAccesorios] = useState<any[]>([])
  const [materialesConstruccion, setMaterialesConstruccion] = useState<any[]>([])
  const [servicios, setServicios] = useState<any[]>([])
  const [descripcionEditadaManualmente, setDescripcionEditadaManualmente] = useState(false)
  const [formularioModificado, setFormularioModificado] = useState(false)
  const [mostrarConfirmacionSalir, setMostrarConfirmacionSalir] = useState(false)
  const [rutaPendiente, setRutaPendiente] = useState<string | null>(null)
  const [desglosePostesExpandido, setDesglosePostesExpandido] = useState(false)
  const [desgloseAccesoriosExpandido, setDesgloseAccesoriosExpandido] = useState(false)
  const [precioCalculado, setPrecioCalculado] = useState({
    accesorios: 0,
    total_180m: 0,
    precio_metro: 0,
    precio_metro_menor_50: 0,
  })

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    altura: '2.00',
    altura_final_cerco: '',
    tejido_config_id: '',
    tipo_poste: 'Eucalipto',
    
    // Cantidades de postes (para 180m)
    cantidad_postes_esquineros: '4',
    cantidad_postes_refuerzos: '2',
    cantidad_postes_intermedios: '34',
    cantidad_puntales: '12',
    
    // IDs de postes seleccionados
    poste_esquinero_id: '',
    poste_refuerzo_id: '',
    poste_intermedio_id: '',
    poste_puntal_id: '',
    
    // Precios de postes (se actualizan automáticamente al seleccionar)
    precio_poste_esquinero: '22500',
    precio_poste_refuerzo: '22500',
    precio_poste_intermedio: '22500',
    precio_puntal: '17500',
    
    // Cordón
    cordon_tipo: '10cm',
    cordon_arena_id: '',
    cordon_arena_m3: '0',
    cordon_ripio_id: '',
    cordon_ripio_m3: '0',
    cordon_cemento_id: '',
    cordon_cemento_bolsas: '0',
    cordon_precio_total: '0',
    
    // Púa
    hilos_pua: '0',
    pua_id: '',
    precio_pua_por_metro: '1168.02',
    
    // Accesorios - IDs seleccionados
    gancho_id: '',
    planchuela_id: '',
    torniquete_id: '',
    esparrago_id: '',
    alambre_ar_id: '',
    clavo_id: '',
    alambre_negro_id: '',
    
    // Accesorios - Cantidades
    cantidad_ganchos: '48',
    cantidad_planchuelas: '12',
    cantidad_torniquetes: '6',
    cantidad_esparragos: '6',
    metros_alambre_ar: '720',
    kg_clavos: '2',
    kg_alambre_negro: '8',
    
    // Accesorios - Precios (se actualizan automáticamente al seleccionar)
    precio_unitario_ganchos: '12337.50',
    precio_unitario_planchuelas: '5456.45',
    precio_unitario_torniquetes: '12337.50',
    precio_unitario_esparragos: '1330.00',
    precio_metro_alambre_ar: '3105.48',
    precio_kg_clavos: '1330.00',
    precio_kg_alambre_negro: '844.20',
    
    // Mano de obra y transporte
    precio_mano_obra_por_metro: '11438.00',
    precio_transporte_por_metro: '3580.50',
    // Servicios seleccionados (IDs de artículos)
    mano_obra_id: '',
    transporte_id: '',
  })

  // Definir funciones de carga primero
  async function cargarTejidos() {
    try {
      const { data, error } = await supabase
      .from('v_tejidos_con_precios')
      .select('*')
      .eq('activo', true)
      .order('codigo')

      if (error) throw error
    setTejidos(data || [])
    } catch (error: any) {
      console.error('Error al cargar tejidos:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los tejidos. Por favor, intenta nuevamente.",
        variant: "destructive",
      })
    }
  }

  async function cargarPostes() {
    try {
      const { data, error } = await supabase
        .from('articulos')
        .select(`
          id,
          nombre,
          categoria,
          unidad,
          precios_venta(id, precio_venta, vigente)
        `)
        .eq('categoria', 'Postes')
        .order('nombre')

      if (error) throw error

      // Mapear postes con precio vigente
      const postesConPrecio = (data || []).map((poste: any) => {
        const precioVigente = poste.precios_venta?.find((p: any) => p.vigente === true)
        return {
          ...poste,
          precio_venta: precioVigente?.precio_venta || 0
        }
      }).filter((p: any) => p.precio_venta > 0) // Solo postes con precio vigente

      setPostes(postesConPrecio)
    } catch (error: any) {
      console.error('Error al cargar postes:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los postes. Por favor, intenta nuevamente.",
        variant: "destructive",
      })
    }
  }

  async function cargarAccesorios() {
    try {
      const { data, error } = await supabase
        .from('articulos')
        .select(`
          id,
          nombre,
          categoria,
          unidad,
          precios_venta(id, precio_venta, vigente)
        `)
        .neq('categoria', 'Postes')
        .neq('categoria', 'Construcción')
        .order('nombre')

      if (error) throw error

      // Mapear accesorios con precio vigente
      const accesoriosConPrecio = (data || []).map((accesorio: any) => {
        const precioVigente = accesorio.precios_venta?.find((p: any) => p.vigente === true)
        return {
          ...accesorio,
          precio_venta: precioVigente?.precio_venta || 0
        }
      }).filter((a: any) => a.precio_venta > 0) // Solo accesorios con precio vigente

      setAccesorios(accesoriosConPrecio)
    } catch (error: any) {
      console.error('Error al cargar accesorios:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los accesorios. Por favor, intenta nuevamente.",
        variant: "destructive",
      })
    }
  }

  async function cargarMaterialesConstruccion() {
    try {
      const { data, error } = await supabase
        .from('articulos')
        .select(`
          id,
          nombre,
          categoria,
          unidad,
          precios_venta(id, precio_venta, vigente)
        `)
        .eq('categoria', 'Construcción')
        .order('nombre')

      if (error) throw error

      // Mapear materiales con precio vigente
      const materialesConPrecio = (data || []).map((material: any) => {
        const precioVigente = material.precios_venta?.find((p: any) => p.vigente === true)
        return {
          ...material,
          precio_venta: precioVigente?.precio_venta || 0
        }
      }).filter((m: any) => m.precio_venta > 0) // Solo materiales con precio vigente

      setMaterialesConstruccion(materialesConPrecio)
    } catch (error: any) {
      console.error('Error al cargar materiales de construcción:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los materiales de construcción. Por favor, intenta nuevamente.",
        variant: "destructive",
      })
    }
  }

  async function cargarServicios() {
    try {
      const { data, error } = await supabase
        .from('articulos')
        .select(`
          id,
          nombre,
          categoria,
          unidad,
          precios_venta(id, precio_venta, vigente)
        `)
        .order('nombre')

      if (error) throw error

      const serviciosConPrecio = (data || []).map((art: any) => {
        const precioVigente = art.precios_venta?.find((p: any) => p.vigente === true)
        return {
          ...art,
          precio_venta: precioVigente?.precio_venta || 0
        }
      }).filter((a: any) => a.precio_venta > 0)

      setServicios(serviciosConPrecio)
    } catch (error: any) {
      console.error('Error al cargar servicios:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los servicios (mano de obra, transporte).",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    async function cargarDatosIniciales() {
      setLoadingInicial(true)
      try {
        await Promise.all([
          cargarTejidos(),
          cargarPostes(),
          cargarAccesorios(),
          cargarMaterialesConstruccion(),
          cargarServicios()
        ])
      } catch (error) {
        console.error('Error al cargar datos iniciales:', error)
        toast({
          title: "Error",
          description: "No se pudieron cargar algunos datos. Por favor, recarga la página.",
          variant: "destructive",
        })
      } finally {
        setLoadingInicial(false)
      }
    }
    cargarDatosIniciales()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Detectar cambios en el formulario
  useEffect(() => {
    const tieneDatos = formData.nombre.trim() !== '' || 
                       formData.tejido_config_id !== '' ||
                       formData.poste_esquinero_id !== ''
    setFormularioModificado(tieneDatos)
  }, [formData])

  // Prevenir salida sin guardar (beforeunload)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (formularioModificado && !loading) {
        e.preventDefault()
        e.returnValue = '¿Estás seguro de que quieres salir? Los cambios no guardados se perderán.'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [formularioModificado, loading])

  // Función para manejar navegación con confirmación
  const manejarNavegacion = (ruta: string) => {
    if (formularioModificado && !loading) {
      setRutaPendiente(ruta)
      setMostrarConfirmacionSalir(true)
    } else {
      router.push(ruta)
    }
  }

  const confirmarSalir = () => {
    setMostrarConfirmacionSalir(false)
    setFormularioModificado(false)
    if (rutaPendiente) {
      router.push(rutaPendiente)
      setRutaPendiente(null)
    }
  }

  const cancelarSalir = () => {
    setMostrarConfirmacionSalir(false)
    setRutaPendiente(null)
  }


  // Optimizar cálculo de precios con useMemo
  const precioCalculadoMemo = useMemo(() => {
    // Calcular total de accesorios
    const totalAccesorios = 
      (parseFloat(formData.cantidad_ganchos) * parseFloat(formData.precio_unitario_ganchos)) +
      (parseFloat(formData.cantidad_planchuelas) * parseFloat(formData.precio_unitario_planchuelas)) +
      (parseFloat(formData.cantidad_torniquetes) * parseFloat(formData.precio_unitario_torniquetes)) +
      (parseFloat(formData.cantidad_esparragos) * parseFloat(formData.precio_unitario_esparragos)) +
      (parseFloat(formData.metros_alambre_ar) * parseFloat(formData.precio_metro_alambre_ar)) +
      (parseFloat(formData.kg_clavos) * parseFloat(formData.precio_kg_clavos)) +
      (parseFloat(formData.kg_alambre_negro) * parseFloat(formData.precio_kg_alambre_negro))

    // Obtener precio del tejido
    const tejidoSeleccionado = tejidos.find(t => t.id === formData.tejido_config_id)
    const precioTejido = tejidoSeleccionado?.precio_venta || 0
    // Usar la longitud real del rollo del tejido (campo 'largo', por defecto 10.00m)
    const largoRollo = tejidoSeleccionado?.largo || 10.00
    const rollosNecesarios = Math.ceil(180 / largoRollo)
    const costoTejido = rollosNecesarios * precioTejido

    // Calcular total de postes
    const totalPostes =
      (parseFloat(formData.cantidad_postes_esquineros) * parseFloat(formData.precio_poste_esquinero)) +
      (parseFloat(formData.cantidad_postes_refuerzos) * parseFloat(formData.precio_poste_refuerzo)) +
      (parseFloat(formData.cantidad_postes_intermedios) * parseFloat(formData.precio_poste_intermedio)) +
      (parseFloat(formData.cantidad_puntales) * parseFloat(formData.precio_puntal))

    // Costo de púa (180m)
    const costoPua = 180 * parseFloat(formData.hilos_pua) * parseFloat(formData.precio_pua_por_metro)

    // Mano de obra y transporte (180m)
    const costoManoObra = 180 * parseFloat(formData.precio_mano_obra_por_metro)
    const costoTransporte = 180 * parseFloat(formData.precio_transporte_por_metro)

    // Total para 180m
    const total180m = costoTejido + totalPostes + parseFloat(formData.cordon_precio_total) +
                      costoPua + totalAccesorios + costoManoObra + costoTransporte

    const precioMetro = total180m / 180
    const precioMetroMenor50 = precioMetro * 1.50

    return {
      accesorios: totalAccesorios,
      total_180m: total180m,
      precio_metro: precioMetro,
      precio_metro_menor_50: precioMetroMenor50,
    }
  }, [
    formData.cantidad_ganchos, formData.precio_unitario_ganchos,
    formData.cantidad_planchuelas, formData.precio_unitario_planchuelas,
    formData.cantidad_torniquetes, formData.precio_unitario_torniquetes,
    formData.cantidad_esparragos, formData.precio_unitario_esparragos,
    formData.metros_alambre_ar, formData.precio_metro_alambre_ar,
    formData.kg_clavos, formData.precio_kg_clavos,
    formData.kg_alambre_negro, formData.precio_kg_alambre_negro,
    formData.tejido_config_id, tejidos,
    formData.cantidad_postes_esquineros, formData.precio_poste_esquinero,
    formData.cantidad_postes_refuerzos, formData.precio_poste_refuerzo,
    formData.cantidad_postes_intermedios, formData.precio_poste_intermedio,
    formData.cantidad_puntales, formData.precio_puntal,
    formData.cordon_precio_total,
    formData.hilos_pua, formData.precio_pua_por_metro,
    formData.precio_mano_obra_por_metro, formData.precio_transporte_por_metro,
  ])

  useEffect(() => {
    setPrecioCalculado(precioCalculadoMemo)
  }, [precioCalculadoMemo])

  // Actualizar precio del cordón cuando cambien los materiales o cantidades
  useEffect(() => {
    if (materialesConstruccion.length > 0) {
      const precioTotal = calcularPrecioCordon()
      setFormData(prev => ({ ...prev, cordon_precio_total: precioTotal.toString() }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.cordon_arena_id, formData.cordon_arena_m3, formData.cordon_ripio_id, formData.cordon_ripio_m3, formData.cordon_cemento_id, formData.cordon_cemento_bolsas, materialesConstruccion])

  // Actualizar cantidades cuando cambie el tipo de cordón
  useEffect(() => {
    if (formData.cordon_tipo && formData.cordon_tipo !== 'Sin cordón') {
      const cantidades = calcularCantidadesCordon(formData.cordon_tipo)
      setFormData(prev => ({
        ...prev,
        cordon_arena_m3: cantidades.arena,
        cordon_ripio_m3: cantidades.ripio,
        cordon_cemento_bolsas: cantidades.cemento
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        cordon_arena_m3: '0',
        cordon_ripio_m3: '0',
        cordon_cemento_bolsas: '0',
        cordon_precio_total: '0'
      }))
    }
  }, [formData.cordon_tipo])

  // Autocompletar descripción cuando cambien los campos relevantes
  useEffect(() => {
    // Si el usuario editó manualmente la descripción, no autocompletar
    if (descripcionEditadaManualmente) {
      return
    }
    
    const partes = []
    
    // Altura de cerco
    if (formData.altura) {
      partes.push(`${formData.altura}m`)
    }
    
    // Tipo de poste
    if (formData.tipo_poste) {
      partes.push(formData.tipo_poste)
    }
    
    // Tamaño de cordón
    if (formData.cordon_tipo && formData.cordon_tipo !== 'Sin cordón') {
      partes.push(`Cordón ${formData.cordon_tipo}`)
    }
    
    // Tejido Romboidal
    if (formData.tejido_config_id) {
      const tejidoSeleccionado = tejidos.find(t => t.id === formData.tejido_config_id)
      if (tejidoSeleccionado?.codigo) {
        partes.push(`Tejido ${tejidoSeleccionado.codigo}`)
      }
    }
    
    // Nro de púas
    if (formData.hilos_pua && formData.hilos_pua !== '0') {
      partes.push(`${formData.hilos_pua} hilo${formData.hilos_pua !== '1' ? 's' : ''} de púa`)
    }
    
    // Construir descripción
    const descripcionAuto = partes.length > 0 ? partes.join(' - ') : ''
    
    // Actualizar descripción automáticamente
    setFormData(prev => ({ ...prev, descripcion: descripcionAuto }))
  }, [formData.altura, formData.tipo_poste, formData.cordon_tipo, formData.tejido_config_id, formData.hilos_pua, tejidos, descripcionEditadaManualmente])

  // Función helper para formatear precios de manera consistente
  function formatearPrecio(precio: number | string | null | undefined, mostrarDecimales: boolean = true): string {
    const valor = typeof precio === 'string' ? parseFloat(precio) : (precio || 0)
    if (mostrarDecimales) {
      return valor.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }
    return valor.toLocaleString('es-AR')
  }

  // Función helper para obtener todos los postes (sin filtrar por tipo)
  function filtrarPostesPorTipo(tipo: 'esquinero' | 'refuerzo' | 'intermedio' | 'puntal'): any[] {
    // Retornar todos los postes disponibles sin filtrar
    return postes
  }

  // Función helper para filtrar materiales de construcción
  function filtrarMaterialesPorTipo(tipo: 'arena' | 'ripio' | 'cemento'): any[] {
    const nombreLower = tipo.toLowerCase()
    return materialesConstruccion.filter(m => {
      const nombreMaterial = m.nombre.toLowerCase()
      
      if (nombreLower === 'arena') {
        return nombreMaterial.includes('arena')
      }
      if (nombreLower === 'ripio') {
        return nombreMaterial.includes('ripio')
      }
      if (nombreLower === 'cemento') {
        return nombreMaterial.includes('cemento')
      }
      
      return false
    })
  }

  // Función helper para filtrar servicios (mano de obra, transporte)
  function filtrarServiciosPorTipo(tipo: 'mano_obra' | 'transporte'): any[] {
    const keywords = tipo === 'mano_obra'
      ? ['mano', 'obra', 'colocación', 'instalación']
      : ['transporte', 'flete', 'envío']
    return servicios.filter((s) => {
      const nombre = (s.nombre || '').toLowerCase()
      const categoria = (s.categoria || '').toLowerCase()
      // Preferir categoría Servicios si existe, pero priorizar por keywords
      const coincideKeyword = keywords.some(k => nombre.includes(k))
      const esServicio = categoria.includes('servicio')
      return (coincideKeyword || esServicio)
    })
  }

  // Calcular cantidades de materiales según tipo de cordón
  function calcularCantidadesCordon(tipo: string): { arena: string, ripio: string, cemento: string } {
    // Valores para 180m lineales
    switch (tipo) {
      case '10cm':
        return { arena: '4', ripio: '4', cemento: '25' }
      case '15cm':
        return { arena: '6', ripio: '6', cemento: '37.5' }
      case '20cm':
        return { arena: '8', ripio: '8', cemento: '50' }
      default:
        return { arena: '0', ripio: '0', cemento: '0' }
    }
  }

  // Calcular precio total del cordón
  function calcularPrecioCordon(): number {
    if (formData.cordon_tipo === 'Sin cordón') {
      return 0
    }

    let total = 0

    // Arena
    if (formData.cordon_arena_id) {
      const arena = materialesConstruccion.find(m => String(m.id) === formData.cordon_arena_id)
      const precioArena = arena?.precio_venta || 0
      const m3Arena = parseFloat(formData.cordon_arena_m3) || 0
      total += precioArena * m3Arena
    }

    // Ripio
    if (formData.cordon_ripio_id) {
      const ripio = materialesConstruccion.find(m => String(m.id) === formData.cordon_ripio_id)
      const precioRipio = ripio?.precio_venta || 0
      const m3Ripio = parseFloat(formData.cordon_ripio_m3) || 0
      total += precioRipio * m3Ripio
    }

    // Cemento
    if (formData.cordon_cemento_id) {
      const cemento = materialesConstruccion.find(m => String(m.id) === formData.cordon_cemento_id)
      const precioCemento = cemento?.precio_venta || 0
      const bolsasCemento = parseFloat(formData.cordon_cemento_bolsas) || 0
      total += precioCemento * bolsasCemento
    }

    return total
  }

  // Función helper para filtrar accesorios por nombre (opcional, puede ser mejorado)
  function filtrarAccesoriosPorTipo(tipo: string): any[] {
    // Filtrar por palabras clave en el nombre
    const nombreLower = tipo.toLowerCase()
    const accesoriosFiltrados = accesorios.filter(a => {
      const nombreAccesorio = a.nombre.toLowerCase()
      
      if (nombreLower === 'gancho') {
        return nombreAccesorio.includes('gancho') || nombreAccesorio.includes('hook')
      }
      if (nombreLower === 'planchuela') {
        return nombreAccesorio.includes('planchuela') || nombreAccesorio.includes('placa')
      }
      if (nombreLower === 'torniquete') {
        // Solo buscar artículos que contengan "torniquete" o "torniquet"
        return nombreAccesorio.includes('torniquete') || nombreAccesorio.includes('torniquet')
      }
      if (nombreLower === 'esparrago') {
        return nombreAccesorio.includes('esparrago') || nombreAccesorio.includes('espárrago')
      }
      if (nombreLower === 'alambre') {
        return nombreAccesorio.includes('alambre') && !nombreAccesorio.includes('púa')
      }
      if (nombreLower === 'clavo') {
        return nombreAccesorio.includes('clavo') || nombreAccesorio.includes('nail')
      }
      if (nombreLower === 'pua') {
        return nombreAccesorio.includes('púa') || nombreAccesorio.includes('pua') || nombreAccesorio.includes('pin')
      }
      
      // Si no hay coincidencia, retornar todos
      return true
    })
    
    // Si no hay coincidencias, retornar todos los accesorios
    return accesoriosFiltrados.length > 0 ? accesoriosFiltrados : accesorios
  }


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    // Validaciones antes de submit
    const errores: string[] = []
    
    // Validar nombre
    if (!formData.nombre.trim()) {
      errores.push('El nombre de la configuración es obligatorio')
    }
    
    // Validar altura
    if (!formData.altura) {
      errores.push('Debe seleccionar una altura de tejido')
    }
    
    // Validar tejido
    if (!formData.tejido_config_id) {
      errores.push('Debe seleccionar un tejido romboidal')
    }
    
    // Validar postes seleccionados
    if (!formData.poste_esquinero_id || parseFloat(formData.precio_poste_esquinero) <= 0) {
      errores.push('Debe seleccionar un poste esquinero con precio válido')
    }
    if (!formData.poste_refuerzo_id || parseFloat(formData.precio_poste_refuerzo) <= 0) {
      errores.push('Debe seleccionar un poste refuerzo con precio válido')
    }
    if (!formData.poste_intermedio_id || parseFloat(formData.precio_poste_intermedio) <= 0) {
      errores.push('Debe seleccionar un poste intermedio con precio válido')
    }
    if (!formData.poste_puntal_id || parseFloat(formData.precio_puntal) <= 0) {
      errores.push('Debe seleccionar un puntal con precio válido')
    }
    
    // Validar cantidades de postes > 0
    if (parseInt(formData.cantidad_postes_esquineros) <= 0) {
      errores.push('La cantidad de postes esquineros debe ser mayor a 0')
    }
    if (parseInt(formData.cantidad_postes_refuerzos) <= 0) {
      errores.push('La cantidad de postes refuerzos debe ser mayor a 0')
    }
    if (parseInt(formData.cantidad_postes_intermedios) <= 0) {
      errores.push('La cantidad de postes intermedios debe ser mayor a 0')
    }
    if (parseInt(formData.cantidad_puntales) <= 0) {
      errores.push('La cantidad de puntales debe ser mayor a 0')
    }
    
    // Validar precio de púa si hay hilos
    if (parseInt(formData.hilos_pua) > 0) {
      if (!formData.pua_id || parseFloat(formData.precio_pua_por_metro) <= 0) {
        errores.push('Debe seleccionar un alambre de púa válido')
      }
    }
    
    // Validar precios de mano de obra y transporte
    if (parseFloat(formData.precio_mano_obra_por_metro) <= 0) {
      errores.push('El precio de mano de obra por metro debe ser mayor a 0')
    }
    if (parseFloat(formData.precio_transporte_por_metro) <= 0) {
      errores.push('El precio de transporte por metro debe ser mayor a 0')
    }
    
    // Mostrar errores si hay
    if (errores.length > 0) {
      toast({
        title: "Error de validación",
        description: errores.join('. '),
        variant: "destructive",
      })
      return
    }
    
    setLoading(true)

    try {
      const configData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || null,
        altura: parseFloat(formData.altura),
        altura_final_cerco: formData.altura_final_cerco ? parseFloat(formData.altura_final_cerco) : null,
        tejido_config_id: formData.tejido_config_id,
        tipo_poste: formData.tipo_poste,
        
        cantidad_postes_esquineros: parseInt(formData.cantidad_postes_esquineros),
        cantidad_postes_refuerzos: parseInt(formData.cantidad_postes_refuerzos),
        cantidad_postes_intermedios: parseInt(formData.cantidad_postes_intermedios),
        cantidad_puntales: parseInt(formData.cantidad_puntales),
        
        precio_poste_esquinero: parseFloat(formData.precio_poste_esquinero),
        precio_poste_refuerzo: parseFloat(formData.precio_poste_refuerzo),
        precio_poste_intermedio: parseFloat(formData.precio_poste_intermedio),
        precio_puntal: parseFloat(formData.precio_puntal),
        
        // IDs de postes (para recálculo dinámico)
        poste_esquinero_id: formData.poste_esquinero_id || null,
        poste_refuerzo_id: formData.poste_refuerzo_id || null,
        poste_intermedio_id: formData.poste_intermedio_id || null,
        poste_puntal_id: formData.poste_puntal_id || null,
        
        cordon_tipo: formData.cordon_tipo,
        // Mantener compatibilidad con campos antiguos (se calcularán desde los nuevos)
        cordon_bolsas_ripio: parseFloat(formData.cordon_ripio_m3) || 0, // Usar m3 como aproximación
        cordon_bolsas_cemento: parseFloat(formData.cordon_cemento_bolsas) || 0,
        cordon_precio_total: parseFloat(formData.cordon_precio_total),
        
        // IDs y cantidades de cordón (para recálculo dinámico)
        cordon_arena_id: formData.cordon_arena_id || null,
        cordon_ripio_id: formData.cordon_ripio_id || null,
        cordon_cemento_id: formData.cordon_cemento_id || null,
        cordon_arena_m3: parseFloat(formData.cordon_arena_m3) || null,
        cordon_ripio_m3: parseFloat(formData.cordon_ripio_m3) || null,
        cordon_cemento_bolsas: parseFloat(formData.cordon_cemento_bolsas) || null,
        
        hilos_pua: parseInt(formData.hilos_pua),
        precio_pua_por_metro: parseFloat(formData.precio_pua_por_metro),
        pua_id: formData.pua_id || null,
        
        cantidad_ganchos: parseInt(formData.cantidad_ganchos),
        precio_unitario_ganchos: parseFloat(formData.precio_unitario_ganchos),
        ganchos_id: formData.gancho_id || null,
        cantidad_planchuelas: parseInt(formData.cantidad_planchuelas),
        precio_unitario_planchuelas: parseFloat(formData.precio_unitario_planchuelas),
        planchuelas_id: formData.planchuela_id || null,
        cantidad_torniquetes: parseInt(formData.cantidad_torniquetes),
        precio_unitario_torniquetes: parseFloat(formData.precio_unitario_torniquetes),
        torniquetes_id: formData.torniquete_id || null,
        cantidad_esparragos: parseInt(formData.cantidad_esparragos),
        precio_unitario_esparragos: parseFloat(formData.precio_unitario_esparragos),
        esparragos_id: formData.esparrago_id || null,
        metros_alambre_ar: parseInt(formData.metros_alambre_ar),
        precio_metro_alambre_ar: parseFloat(formData.precio_metro_alambre_ar),
        alambre_ar_id: formData.alambre_ar_id || null,
        kg_clavos: parseInt(formData.kg_clavos),
        precio_kg_clavos: parseFloat(formData.precio_kg_clavos),
        clavos_id: formData.clavo_id || null,
        kg_alambre_negro: parseInt(formData.kg_alambre_negro),
        precio_kg_alambre_negro: parseFloat(formData.precio_kg_alambre_negro),
        alambre_negro_id: formData.alambre_negro_id || null,
        
        precio_total_accesorios: precioCalculado.accesorios,
        precio_mano_obra_por_metro: parseFloat(formData.precio_mano_obra_por_metro),
        precio_transporte_por_metro: parseFloat(formData.precio_transporte_por_metro),
        mano_obra_id: formData.mano_obra_id || null,
        transporte_id: formData.transporte_id || null,
        
        precio_base_180m: precioCalculado.total_180m,
        precio_por_metro_lineal: precioCalculado.precio_metro,
        precio_por_metro_menor_50m: precioCalculado.precio_metro_menor_50,
        
        activo: true,
      }

      const { error } = await supabase
        .from('configuraciones_cercado')
        .insert(configData)

      if (error) throw error

      toast({
        title: "¡Éxito!",
        description: "Configuración creada correctamente",
      })

      setFormularioModificado(false) // Marcar como guardado
      setTimeout(() => {
        router.push('/dashboard/cercado')
      }, 1000)
    } catch (error: any) {
      console.error('Error:', error)
      toast({
        title: "Error al crear configuración",
        description: error.message,
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  if (loadingInicial) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Cargando datos iniciales...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => manejarNavegacion('/dashboard/cercado')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nueva Configuración de Cercado</h1>
          <p className="text-muted-foreground">Definir componentes y costos base para 180 metros lineales</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Datos Básicos */}
          <Card>
            <CardHeader>
              <CardTitle>Datos Básicos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre de la Configuración *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Cerco 2m Económico - Eucalipto con Cordón 10cm"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => {
                    setDescripcionEditadaManualmente(true)
                    setFormData({ ...formData, descripcion: e.target.value })
                  }}
                  onFocus={() => {
                    // Si el usuario empieza a editar, marcar como manual
                    if (!descripcionEditadaManualmente) {
                      setDescripcionEditadaManualmente(true)
                    }
                  }}
                  rows={2}
                  placeholder="Se autocompleta automáticamente según los campos seleccionados"
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    💡 La descripción se actualiza automáticamente con: Altura - Tipo Poste - Cordón - Tejido - Púas
                  </p>
                  {descripcionEditadaManualmente && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs h-6"
                      onClick={() => {
                        setDescripcionEditadaManualmente(false)
                        // El useEffect se encargará de regenerar la descripción
                      }}
                    >
                      Restaurar automático
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Altura de Tejido Romboidal *</Label>
                  <Select
                    value={formData.altura}
                    onValueChange={(value) => setFormData({ ...formData, altura: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1.0">1.0 metros</SelectItem>
                      <SelectItem value="1.2">1.2 metros</SelectItem>
                      <SelectItem value="1.5">1.5 metros</SelectItem>
                      <SelectItem value="1.8">1.8 metros</SelectItem>
                      <SelectItem value="2.0">2.0 metros</SelectItem>
                      <SelectItem value="2.5">2.5 metros</SelectItem>
                      <SelectItem value="3.0">3.0 metros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="altura_final_cerco">Altura Final del Cerco</Label>
                  <Input
                    id="altura_final_cerco"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.altura_final_cerco}
                    onChange={(e) => setFormData({ ...formData, altura_final_cerco: e.target.value })}
                    placeholder="Ej: 1.3, 1.5, 1.8, 2.3, 2.5, 3.0, 3.5"
                  />
                  <p className="text-xs text-muted-foreground">
                    Altura final del cerco instalado en metros
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Tejido Romboidal *</Label>
                  <Select
                    value={formData.tejido_config_id}
                    onValueChange={(value) => setFormData({ ...formData, tejido_config_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tejido" />
                    </SelectTrigger>
                    <SelectContent>
                      {tejidos
                        .filter((t) => {
                          const alturaFloat = parseFloat(formData.altura)
                          const tejidoAltura = typeof t.altura === 'number' ? t.altura : parseFloat(t.altura)
                          return Math.abs(tejidoAltura - alturaFloat) < 0.01
                        })
                        .length > 0 ? (
                          tejidos
                        .filter((t) => {
                          const alturaFloat = parseFloat(formData.altura)
                          const tejidoAltura = typeof t.altura === 'number' ? t.altura : parseFloat(t.altura)
                          return Math.abs(tejidoAltura - alturaFloat) < 0.01
                        })
                        .map((tejido) => (
                          <SelectItem key={tejido.id} value={tejido.id}>
                            {tejido.codigo} - ${formatearPrecio(tejido.precio_venta, false)}
                          </SelectItem>
                            ))
                        ) : (
                          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                            No hay tejidos disponibles para esta altura
                          </div>
                        )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {(() => {
                      const tejidoSel = tejidos.find(t => t.id === formData.tejido_config_id)
                      const largoRollo = tejidoSel?.largo || 10.00
                      const rollosNecesarios = Math.ceil(180 / largoRollo)
                      return `Filtra tejidos según altura seleccionada. Se necesitan ${rollosNecesarios} rollos de ${largoRollo}m para 180m.`
                    })()}
                  </p>
                </div>
              </div>

              {/* Info Box - Totales del Tejido */}
              {formData.tejido_config_id && (() => {
                const tejidoSel = tejidos.find(t => t.id === formData.tejido_config_id)
                if (!tejidoSel) return null
                
                const largoRollo = tejidoSel.largo || 10.00
                const rollosNecesarios = Math.ceil(180 / largoRollo)
                const precioTejido = tejidoSel.precio_venta || 0
                const subtotalTejido = rollosNecesarios * precioTejido
                
                return (
                  <div className="p-3 bg-muted rounded">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold">Total Tejido:</span>
                      <span className="text-2xl font-bold text-primary">
                        ${formatearPrecio(subtotalTejido, false)}
                      </span>
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground mt-2">
                      <div className="flex justify-between">
                        <span>Tejido seleccionado:</span>
                        <span className="font-medium text-foreground">{tejidoSel.codigo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Precio unitario:</span>
                        <span className="font-medium text-foreground">${formatearPrecio(precioTejido, false)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cantidad de rollos ({largoRollo}m c/u):</span>
                        <span className="font-medium text-foreground">{rollosNecesarios} rollos</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-muted-foreground/20">
                        <span className="font-semibold">Subtotal:</span>
                        <span className="font-bold text-foreground">${formatearPrecio(subtotalTejido, false)}</span>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </CardContent>
          </Card>

          {/* Postes */}
          <Card>
            <CardHeader>
              <CardTitle>Postes (para 180 metros)</CardTitle>
              <CardDescription>Cantidades y precios de postes necesarios</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de Postes *</Label>
                <Select
                  value={formData.tipo_poste}
                  onValueChange={(value) => {
                    // Solo actualizar precios si no hay postes seleccionados previamente
                    // Si el usuario ya seleccionó postes, mantener sus selecciones
                    const nuevosDatos: any = { tipo_poste: value }
                    
                    // Solo pre-cargar precios si no hay postes seleccionados
                    if (!formData.poste_esquinero_id) {
                    let precios = {
                      esquinero: '22500',
                      refuerzo: '22500',
                      intermedio: '22500',
                      puntal: '17500'
                    }
                    
                    if (value === 'Punta Diamante') {
                      precios = { esquinero: '31250', refuerzo: '27500', intermedio: '25000', puntal: '22500' }
                    } else if (value === 'Olimp') {
                      precios = { esquinero: '35000', refuerzo: '31250', intermedio: '28750', puntal: '22500' }
                      }
                      
                      nuevosDatos.precio_poste_esquinero = precios.esquinero
                      nuevosDatos.precio_poste_refuerzo = precios.refuerzo
                      nuevosDatos.precio_poste_intermedio = precios.intermedio
                      nuevosDatos.precio_puntal = precios.puntal
                    }
                    
                    setFormData({
                      ...formData,
                      ...nuevosDatos,
                    })
                  }}
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

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Postes Esquineros</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      min="1"
                      value={formData.cantidad_postes_esquineros}
                      onChange={(e) => {
                        const valor = parseInt(e.target.value) || 0
                        if (valor >= 0) {
                          setFormData({ ...formData, cantidad_postes_esquineros: e.target.value })
                        }
                      }}
                      placeholder="4"
                    />
                    <Select
                      value={formData.poste_esquinero_id}
                      onValueChange={(value) => {
                        const posteSeleccionado = postes.find(p => String(p.id) === value)
                        setFormData({
                          ...formData,
                          poste_esquinero_id: value,
                          precio_poste_esquinero: posteSeleccionado?.precio_venta?.toString() || '0'
                        })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar poste" />
                      </SelectTrigger>
                      <SelectContent>
                        {postes.length > 0 ? (
                          filtrarPostesPorTipo('esquinero').map((poste) => (
                            <SelectItem key={poste.id} value={String(poste.id)}>
                              {poste.nombre} - ${formatearPrecio(poste.precio_venta, false)}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                            No hay postes disponibles. Crea postes en el catálogo de artículos.
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Precio: ${formatearPrecio(formData.precio_poste_esquinero, false)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Postes Refuerzos</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      min="1"
                      value={formData.cantidad_postes_refuerzos}
                      onChange={(e) => {
                        const valor = parseInt(e.target.value) || 0
                        if (valor >= 0) {
                          setFormData({ ...formData, cantidad_postes_refuerzos: e.target.value })
                        }
                      }}
                      placeholder="2"
                    />
                    <Select
                      value={formData.poste_refuerzo_id}
                      onValueChange={(value) => {
                        const posteSeleccionado = postes.find(p => String(p.id) === value)
                        setFormData({
                          ...formData,
                          poste_refuerzo_id: value,
                          precio_poste_refuerzo: posteSeleccionado?.precio_venta?.toString() || '0'
                        })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar poste" />
                      </SelectTrigger>
                      <SelectContent>
                        {postes.length > 0 ? (
                          filtrarPostesPorTipo('refuerzo').map((poste) => (
                            <SelectItem key={poste.id} value={String(poste.id)}>
                              {poste.nombre} - ${formatearPrecio(poste.precio_venta, false)}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                            No hay postes disponibles. Crea postes en el catálogo de artículos.
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Precio: ${formatearPrecio(formData.precio_poste_refuerzo, false)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Postes Intermedios</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      min="1"
                      value={formData.cantidad_postes_intermedios}
                      onChange={(e) => {
                        const valor = parseInt(e.target.value) || 0
                        if (valor >= 0) {
                          setFormData({ ...formData, cantidad_postes_intermedios: e.target.value })
                        }
                      }}
                      placeholder="34"
                    />
                    <Select
                      value={formData.poste_intermedio_id}
                      onValueChange={(value) => {
                        const posteSeleccionado = postes.find(p => String(p.id) === value)
                        setFormData({
                          ...formData,
                          poste_intermedio_id: value,
                          precio_poste_intermedio: posteSeleccionado?.precio_venta?.toString() || '0'
                        })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar poste" />
                      </SelectTrigger>
                      <SelectContent>
                        {postes.length > 0 ? (
                          filtrarPostesPorTipo('intermedio').map((poste) => (
                            <SelectItem key={poste.id} value={String(poste.id)}>
                              {poste.nombre} - ${formatearPrecio(poste.precio_venta, false)}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                            No hay postes disponibles. Crea postes en el catálogo de artículos.
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Precio: ${formatearPrecio(formData.precio_poste_intermedio, false)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Puntales</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      min="1"
                      value={formData.cantidad_puntales}
                      onChange={(e) => {
                        const valor = parseInt(e.target.value) || 0
                        if (valor >= 0) {
                          setFormData({ ...formData, cantidad_puntales: e.target.value })
                        }
                      }}
                      placeholder="12"
                    />
                    <Select
                      value={formData.poste_puntal_id}
                      onValueChange={(value) => {
                        const posteSeleccionado = postes.find(p => String(p.id) === value)
                        setFormData({
                          ...formData,
                          poste_puntal_id: value,
                          precio_puntal: posteSeleccionado?.precio_venta?.toString() || '0'
                        })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar poste" />
                      </SelectTrigger>
                      <SelectContent>
                        {postes.length > 0 ? (
                          filtrarPostesPorTipo('puntal').map((poste) => (
                            <SelectItem key={poste.id} value={String(poste.id)}>
                              {poste.nombre} - ${formatearPrecio(poste.precio_venta, false)}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                            No hay postes disponibles. Crea postes en el catálogo de artículos.
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Precio: ${formatearPrecio(formData.precio_puntal, false)}
                  </p>
                </div>
              </div>

              {/* Info Box - Resumen de Postes */}
              {(formData.poste_esquinero_id || formData.poste_refuerzo_id || formData.poste_intermedio_id || formData.poste_puntal_id) && (
                <div className="p-3 bg-muted rounded">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold">Total Postes:</span>
                    <span className="text-2xl font-bold text-primary">
                      ${formatearPrecio(
                        (parseFloat(formData.cantidad_postes_esquineros) * parseFloat(formData.precio_poste_esquinero)) +
                        (parseFloat(formData.cantidad_postes_refuerzos) * parseFloat(formData.precio_poste_refuerzo)) +
                        (parseFloat(formData.cantidad_postes_intermedios) * parseFloat(formData.precio_poste_intermedio)) +
                        (parseFloat(formData.cantidad_puntales) * parseFloat(formData.precio_puntal)),
                        false
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(() => {
                      const totalPostes = parseInt(formData.cantidad_postes_esquineros) + 
                                        parseInt(formData.cantidad_postes_refuerzos) + 
                                        parseInt(formData.cantidad_postes_intermedios) + 
                                        parseInt(formData.cantidad_puntales)
                      return `${totalPostes} postes en total para 180 metros lineales`
                    })()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cordón y Púa */}
          <Card>
            <CardHeader>
              <CardTitle>Cordón de Hormigón y Alambre de Púa</CardTitle>
              <CardDescription>Selecciona los materiales y ajusta las cantidades para 180m lineales</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo de Cordón *</Label>
                  <Select
                    value={formData.cordon_tipo}
                    onValueChange={(value) => {
                      setFormData({
                        ...formData,
                      cordon_tipo: value
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sin cordón">Sin cordón</SelectItem>
                      <SelectItem value="10cm">10 cm</SelectItem>
                      <SelectItem value="15cm">15 cm</SelectItem>
                      <SelectItem value="20cm">20 cm</SelectItem>
                    </SelectContent>
                  </Select>
                <p className="text-xs text-muted-foreground">
                  Las cantidades se calculan automáticamente pero puedes editarlas
                </p>
                </div>

              {formData.cordon_tipo !== 'Sin cordón' && (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                      <Label>Arena (m³)</Label>
                      <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                          min="0"
                          step="0.1"
                          value={formData.cordon_arena_m3}
                          onChange={(e) => {
                            const valor = parseFloat(e.target.value) || 0
                            if (valor >= 0) {
                              setFormData({ ...formData, cordon_arena_m3: e.target.value })
                            }
                          }}
                    placeholder="0"
                  />
                        <Select
                          value={formData.cordon_arena_id}
                          onValueChange={(value) => {
                            setFormData({ ...formData, cordon_arena_id: value })
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar arena" />
                          </SelectTrigger>
                          <SelectContent>
                            {materialesConstruccion.length > 0 ? (
                              filtrarMaterialesPorTipo('arena').map((material) => (
                                <SelectItem key={material.id} value={String(material.id)}>
                                  {material.nombre} - ${formatearPrecio(material.precio_venta, false)} ({material.unidad})
                                </SelectItem>
                              ))
                            ) : (
                              <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                                No hay arena disponible. Crea artículos en el catálogo.
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                </div>
              </div>

                    <div className="space-y-2">
                      <Label>Ripio (m³)</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          value={formData.cordon_ripio_m3}
                          onChange={(e) => {
                            const valor = parseFloat(e.target.value) || 0
                            if (valor >= 0) {
                              setFormData({ ...formData, cordon_ripio_m3: e.target.value })
                            }
                          }}
                          placeholder="0"
                        />
                        <Select
                          value={formData.cordon_ripio_id}
                          onValueChange={(value) => {
                            setFormData({ ...formData, cordon_ripio_id: value })
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar ripio" />
                          </SelectTrigger>
                          <SelectContent>
                            {materialesConstruccion.length > 0 ? (
                              filtrarMaterialesPorTipo('ripio').map((material) => (
                                <SelectItem key={material.id} value={String(material.id)}>
                                  {material.nombre} - ${formatearPrecio(material.precio_venta, false)} ({material.unidad})
                                </SelectItem>
                              ))
                            ) : (
                              <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                                No hay ripio disponible. Crea artículos en el catálogo.
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Cemento (bolsas)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        value={formData.cordon_cemento_bolsas}
                        onChange={(e) => {
                          const valor = parseFloat(e.target.value) || 0
                          if (valor >= 0) {
                            setFormData({ ...formData, cordon_cemento_bolsas: e.target.value })
                          }
                        }}
                        placeholder="0"
                      />
                      <Select
                        value={formData.cordon_cemento_id}
                        onValueChange={(value) => {
                          setFormData({ ...formData, cordon_cemento_id: value })
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar cemento" />
                        </SelectTrigger>
                        <SelectContent>
                          {materialesConstruccion.length > 0 ? (
                            filtrarMaterialesPorTipo('cemento').map((material) => (
                              <SelectItem key={material.id} value={String(material.id)}>
                                {material.nombre} - ${formatearPrecio(material.precio_venta, false)} ({material.unidad})
                              </SelectItem>
                            ))
                          ) : (
                            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                              No hay cemento disponible. Crea artículos en el catálogo.
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="p-3 bg-muted rounded">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold">Precio Total Cordón:</span>
                      <span className="text-2xl font-bold text-primary">
                        ${formatearPrecio(formData.cordon_precio_total)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Calculado automáticamente según materiales y cantidades seleccionadas
                    </p>
                  </div>
                </>
              )}

              <div className="grid gap-4 md:grid-cols-2">
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
                      <SelectItem value="0">Sin púa</SelectItem>
                      <SelectItem value="1">1 hilo</SelectItem>
                      <SelectItem value="2">2 hilos</SelectItem>
                      <SelectItem value="3">3 hilos</SelectItem>
                      <SelectItem value="4">4 hilos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Alambre de Púa</Label>
                  <Select
                    value={formData.pua_id}
                    onValueChange={(value) => {
                      const accesorioSeleccionado = accesorios.find(a => String(a.id) === value)
                      const precioUnitario = accesorioSeleccionado?.precio_venta || 0
                      // Si la unidad es "metro" o "rollo", calcular precio por metro
                      // Asumimos que si es rollo, tiene 500m
                      const precioPorMetro = accesorioSeleccionado?.unidad?.toLowerCase().includes('metro') 
                        ? precioUnitario 
                        : precioUnitario / 500 // Asumimos rollos de 500m
                      setFormData({
                        ...formData,
                        pua_id: value,
                        precio_pua_por_metro: precioPorMetro.toString()
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar alambre de púa" />
                    </SelectTrigger>
                    <SelectContent>
                      {accesorios.length > 0 ? (
                        filtrarAccesoriosPorTipo('pua').map((accesorio) => (
                          <SelectItem key={accesorio.id} value={String(accesorio.id)}>
                            {accesorio.nombre} - ${formatearPrecio(accesorio.precio_venta, false)} ({accesorio.unidad})
                          </SelectItem>
                        ))
                        ) : (
                          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                            No hay alambre de púa disponible. Crea artículos en el catálogo.
                          </div>
                        )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Precio por metro: ${formatearPrecio(formData.precio_pua_por_metro)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Accesorios */}
          <Card>
            <CardHeader>
              <CardTitle>Accesorios (para 180m)</CardTitle>
              <CardDescription>Materiales complementarios necesarios</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {[
                  { label: 'Ganchos', cant: 'cantidad_ganchos', precio: 'precio_unitario_ganchos', id: 'gancho_id', default: '48', tipo: 'gancho' },
                  { label: 'Planchuelas', cant: 'cantidad_planchuelas', precio: 'precio_unitario_planchuelas', id: 'planchuela_id', default: '12', tipo: 'planchuela' },
                  { label: 'Torniquetes', cant: 'cantidad_torniquetes', precio: 'precio_unitario_torniquetes', id: 'torniquete_id', default: '6', tipo: 'torniquete' },
                  { label: 'Esparragos', cant: 'cantidad_esparragos', precio: 'precio_unitario_esparragos', id: 'esparrago_id', default: '6', tipo: 'esparrago' },
                ].map((item) => (
                  <div key={item.label} className="grid grid-cols-3 gap-2 items-center">
                    <Label className="text-sm">{item.label}</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData[item.cant as keyof typeof formData] as string}
                      onChange={(e) => {
                        const valor = parseInt(e.target.value) || 0
                        if (valor >= 0) {
                          setFormData({ ...formData, [item.cant]: e.target.value })
                        }
                      }}
                      placeholder={item.default}
                      className="text-sm"
                    />
                    <Select
                      value={formData[item.id as keyof typeof formData] as string}
                      onValueChange={(value) => {
                        const accesorioSeleccionado = accesorios.find(a => String(a.id) === value)
                        setFormData({
                          ...formData,
                          [item.id]: value,
                          [item.precio]: accesorioSeleccionado?.precio_venta?.toString() || '0'
                        })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar artículo" />
                      </SelectTrigger>
                      <SelectContent>
                        {accesorios.length > 0 ? (
                          filtrarAccesoriosPorTipo(item.tipo).map((accesorio) => (
                            <SelectItem key={accesorio.id} value={String(accesorio.id)}>
                              {accesorio.nombre} - ${formatearPrecio(accesorio.precio_venta, false)}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                            No hay accesorios disponibles. Crea artículos en el catálogo.
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                ))}

                <div className="grid grid-cols-3 gap-2 items-center">
                  <Label className="text-sm">Alambre A/R (metros)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.metros_alambre_ar}
                    onChange={(e) => {
                      const valor = parseInt(e.target.value) || 0
                      if (valor >= 0) {
                        setFormData({ ...formData, metros_alambre_ar: e.target.value })
                      }
                    }}
                    placeholder="720"
                    className="text-sm"
                  />
                  <Select
                    value={formData.alambre_ar_id}
                    onValueChange={(value) => {
                      const accesorioSeleccionado = accesorios.find(a => String(a.id) === value)
                      const precioUnitario = accesorioSeleccionado?.precio_venta || 0
                      
                      // Calcular precio por metro según la unidad
                      let precioPorMetro = 0
                      const unidad = accesorioSeleccionado?.unidad?.toLowerCase() || ''
                      const nombre = accesorioSeleccionado?.nombre?.toLowerCase() || ''
                      
                      if (unidad.includes('metro') || unidad === 'm') {
                        // Si la unidad es metro, usar directamente
                        precioPorMetro = precioUnitario
                      } else if (unidad.includes('rollo') || unidad.includes('roll')) {
                        // Intentar extraer metros del nombre (ej: "rollo de 500m", "rollo 1000m")
                        const metrosMatch = nombre.match(/(\d+)\s*m/i) || nombre.match(/(\d+)\s*metros/i)
                        if (metrosMatch) {
                          const metrosPorRollo = parseInt(metrosMatch[1])
                          precioPorMetro = metrosPorRollo > 0 ? precioUnitario / metrosPorRollo : precioUnitario / 500
                        } else {
                          // Valor por defecto según tipo común
                          precioPorMetro = precioUnitario / 500 // Rollos estándar de 500m
                        }
                      } else {
                        // Para otras unidades, asumir que el precio ya es por metro o usar valor por defecto
                        precioPorMetro = precioUnitario
                      }
                      
                      setFormData({
                        ...formData,
                        alambre_ar_id: value,
                        precio_metro_alambre_ar: precioPorMetro.toString()
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar artículo" />
                    </SelectTrigger>
                    <SelectContent>
                      {accesorios.length > 0 ? (
                        filtrarAccesoriosPorTipo('alambre').map((accesorio) => (
                          <SelectItem key={accesorio.id} value={String(accesorio.id)}>
                            {accesorio.nombre} - ${formatearPrecio(accesorio.precio_venta, false)} ({accesorio.unidad})
                          </SelectItem>
                        ))
                        ) : (
                          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                            No hay accesorios disponibles. Crea artículos en el catálogo.
                          </div>
                        )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-2 items-center">
                  <Label className="text-sm">Clavos (kg)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.kg_clavos}
                    onChange={(e) => {
                      const valor = parseFloat(e.target.value) || 0
                      if (valor >= 0) {
                        setFormData({ ...formData, kg_clavos: e.target.value })
                      }
                    }}
                    placeholder="2"
                    className="text-sm"
                  />
                  <Select
                    value={formData.clavo_id}
                    onValueChange={(value) => {
                      const accesorioSeleccionado = accesorios.find(a => String(a.id) === value)
                      const precioUnitario = accesorioSeleccionado?.precio_venta || 0
                      // Si la unidad es "kg", usar directamente; si es otra, ajustar
                      const precioPorKg = accesorioSeleccionado?.unidad?.toLowerCase().includes('kg') 
                        ? precioUnitario 
                        : precioUnitario // Asumimos que el precio ya es por kg
                      setFormData({
                        ...formData,
                        clavo_id: value,
                        precio_kg_clavos: precioPorKg.toString()
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar artículo" />
                    </SelectTrigger>
                    <SelectContent>
                      {accesorios.length > 0 ? (
                        filtrarAccesoriosPorTipo('clavo').map((accesorio) => (
                          <SelectItem key={accesorio.id} value={String(accesorio.id)}>
                            {accesorio.nombre} - ${formatearPrecio(accesorio.precio_venta, false)} ({accesorio.unidad})
                          </SelectItem>
                        ))
                        ) : (
                          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                            No hay accesorios disponibles. Crea artículos en el catálogo.
                          </div>
                        )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-2 items-center">
                  <Label className="text-sm">Alambre negro (kg)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.kg_alambre_negro}
                    onChange={(e) => {
                      const valor = parseFloat(e.target.value) || 0
                      if (valor >= 0) {
                        setFormData({ ...formData, kg_alambre_negro: e.target.value })
                      }
                    }}
                    placeholder="8"
                    className="text-sm"
                  />
                  <Select
                    value={formData.alambre_negro_id}
                    onValueChange={(value) => {
                      const accesorioSeleccionado = accesorios.find(a => String(a.id) === value)
                      const precioUnitario = accesorioSeleccionado?.precio_venta || 0
                      // Si la unidad es "kg", usar directamente; si es otra, ajustar
                      const precioPorKg = accesorioSeleccionado?.unidad?.toLowerCase().includes('kg') 
                        ? precioUnitario 
                        : precioUnitario // Asumimos que el precio ya es por kg
                      setFormData({
                        ...formData,
                        alambre_negro_id: value,
                        precio_kg_alambre_negro: precioPorKg.toString()
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar artículo" />
                    </SelectTrigger>
                    <SelectContent>
                      {accesorios.length > 0 ? (
                        filtrarAccesoriosPorTipo('alambre').map((accesorio) => (
                          <SelectItem key={accesorio.id} value={String(accesorio.id)}>
                            {accesorio.nombre} - ${formatearPrecio(accesorio.precio_venta, false)} ({accesorio.unidad})
                          </SelectItem>
                        ))
                        ) : (
                          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                            No hay accesorios disponibles. Crea artículos en el catálogo.
                          </div>
                        )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-3 bg-muted rounded mt-2">
                  <p className="text-sm font-semibold">Total Accesorios:</p>
                  <p className="text-2xl font-bold text-primary">
                    ${formatearPrecio(precioCalculado.accesorios, false)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mano de Obra y Transporte */}
          <Card>
            <CardHeader>
              <CardTitle>Mano de Obra y Transporte</CardTitle>
              <CardDescription>Costos por metro lineal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Mano de Obra ($/metro)</Label>
                  <Select
                    value={formData.mano_obra_id}
                    onValueChange={(value) => {
                      const servicio = servicios.find(s => String(s.id) === value)
                      setFormData({
                        ...formData,
                        mano_obra_id: value,
                        precio_mano_obra_por_metro: (servicio?.precio_venta || 0).toString(),
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar servicio de mano de obra" />
                    </SelectTrigger>
                    <SelectContent>
                      {servicios.length > 0 ? (
                        filtrarServiciosPorTipo('mano_obra').map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>
                            {s.nombre} - ${formatearPrecio(s.precio_venta, false)} {s.unidad ? `(${s.unidad})` : ''}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                          No hay servicios disponibles. Crea artículos de tipo servicio.
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    180m × ${formatearPrecio(formData.precio_mano_obra_por_metro)} = ${formatearPrecio(180 * parseFloat(formData.precio_mano_obra_por_metro), false)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Transporte ($/metro)</Label>
                  <Select
                    value={formData.transporte_id}
                    onValueChange={(value) => {
                      const servicio = servicios.find(s => String(s.id) === value)
                      setFormData({
                        ...formData,
                        transporte_id: value,
                        precio_transporte_por_metro: (servicio?.precio_venta || 0).toString(),
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar servicio de transporte" />
                    </SelectTrigger>
                    <SelectContent>
                      {servicios.length > 0 ? (
                        filtrarServiciosPorTipo('transporte').map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>
                            {s.nombre} - ${formatearPrecio(s.precio_venta, false)} {s.unidad ? `(${s.unidad})` : ''}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                          No hay servicios disponibles. Crea artículos de tipo servicio.
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    180m × ${formatearPrecio(formData.precio_transporte_por_metro)} = ${formatearPrecio(180 * parseFloat(formData.precio_transporte_por_metro), false)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={loading} size="lg">
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Guardando...' : 'Crear Configuración'}
          </Button>
        </div>

        {/* Preview */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Cálculo para 180m
              </CardTitle>
              <CardDescription>
                Precio base (terreno 60×30)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {(() => {
                      const tejidoSel = tejidos.find(t => t.id === formData.tejido_config_id)
                      const largoRollo = tejidoSel?.largo || 10.00
                      const rollosNecesarios = Math.ceil(180 / largoRollo)
                      return `Tejido (${rollosNecesarios} rollos de ${largoRollo}m):`
                    })()}
                  </span>
                  <span className="font-semibold">
                    ${(() => {
                      const tejidoSel = tejidos.find(t => t.id === formData.tejido_config_id)
                      const precioTejido = tejidoSel?.precio_venta || 0
                      const largoRollo = tejidoSel?.largo || 10.00
                      const rollosNecesarios = Math.ceil(180 / largoRollo)
                      return formatearPrecio(precioTejido * rollosNecesarios, false)
                    })()}
                  </span>
                </div>
                <Collapsible open={desglosePostesExpandido} onOpenChange={setDesglosePostesExpandido}>
                  <CollapsibleTrigger className="flex justify-between items-center w-full hover:bg-muted/50 rounded px-2 py-1 -mx-2">
                    <span className="text-muted-foreground">Postes:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        ${formatearPrecio(
                          (parseFloat(formData.cantidad_postes_esquineros) * parseFloat(formData.precio_poste_esquinero)) +
                          (parseFloat(formData.cantidad_postes_refuerzos) * parseFloat(formData.precio_poste_refuerzo)) +
                          (parseFloat(formData.cantidad_postes_intermedios) * parseFloat(formData.precio_poste_intermedio)) +
                          (parseFloat(formData.cantidad_puntales) * parseFloat(formData.precio_puntal)),
                          false
                        )}
                      </span>
                      {desglosePostesExpandido ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 mt-1 pl-4 border-l-2 border-muted">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        {formData.cantidad_postes_esquineros} esquineros × ${formatearPrecio(formData.precio_poste_esquinero, false)}
                      </span>
                      <span className="font-medium">
                        ${formatearPrecio(parseFloat(formData.cantidad_postes_esquineros) * parseFloat(formData.precio_poste_esquinero), false)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        {formData.cantidad_postes_refuerzos} refuerzos × ${formatearPrecio(formData.precio_poste_refuerzo, false)}
                      </span>
                      <span className="font-medium">
                        ${formatearPrecio(parseFloat(formData.cantidad_postes_refuerzos) * parseFloat(formData.precio_poste_refuerzo), false)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        {formData.cantidad_postes_intermedios} intermedios × ${formatearPrecio(formData.precio_poste_intermedio, false)}
                      </span>
                      <span className="font-medium">
                        ${formatearPrecio(parseFloat(formData.cantidad_postes_intermedios) * parseFloat(formData.precio_poste_intermedio), false)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        {formData.cantidad_puntales} puntales × ${formatearPrecio(formData.precio_puntal, false)}
                      </span>
                      <span className="font-medium">
                        ${formatearPrecio(parseFloat(formData.cantidad_puntales) * parseFloat(formData.precio_puntal), false)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs pt-2 mt-2 border-t border-muted">
                      <span className="font-semibold">Subtotal Postes:</span>
                      <span className="font-bold">
                        ${formatearPrecio(
                          (parseFloat(formData.cantidad_postes_esquineros) * parseFloat(formData.precio_poste_esquinero)) +
                          (parseFloat(formData.cantidad_postes_refuerzos) * parseFloat(formData.precio_poste_refuerzo)) +
                          (parseFloat(formData.cantidad_postes_intermedios) * parseFloat(formData.precio_poste_intermedio)) +
                          (parseFloat(formData.cantidad_puntales) * parseFloat(formData.precio_puntal)),
                          false
                        )}
                      </span>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cordón:</span>
                  <span className="font-semibold">${formatearPrecio(formData.cordon_precio_total, false)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Púa:</span>
                  <span className="font-semibold">
                    ${formatearPrecio(180 * parseFloat(formData.hilos_pua) * parseFloat(formData.precio_pua_por_metro), false)}
                  </span>
                </div>
                <Collapsible open={desgloseAccesoriosExpandido} onOpenChange={setDesgloseAccesoriosExpandido}>
                  <CollapsibleTrigger className="flex justify-between items-center w-full hover:bg-muted/50 rounded px-2 py-1 -mx-2">
                    <span className="text-muted-foreground">Accesorios:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">${formatearPrecio(precioCalculado.accesorios, false)}</span>
                      {desgloseAccesoriosExpandido ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 mt-1 pl-4 border-l-2 border-muted">
                    {parseFloat(formData.cantidad_ganchos) > 0 && parseFloat(formData.precio_unitario_ganchos) > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          {formData.cantidad_ganchos} ganchos × ${formatearPrecio(formData.precio_unitario_ganchos, false)}
                        </span>
                        <span className="font-medium">
                          ${formatearPrecio(parseFloat(formData.cantidad_ganchos) * parseFloat(formData.precio_unitario_ganchos), false)}
                        </span>
                      </div>
                    )}
                    {parseFloat(formData.cantidad_planchuelas) > 0 && parseFloat(formData.precio_unitario_planchuelas) > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          {formData.cantidad_planchuelas} planchuelas × ${formatearPrecio(formData.precio_unitario_planchuelas, false)}
                        </span>
                        <span className="font-medium">
                          ${formatearPrecio(parseFloat(formData.cantidad_planchuelas) * parseFloat(formData.precio_unitario_planchuelas), false)}
                        </span>
                      </div>
                    )}
                    {parseFloat(formData.cantidad_torniquetes) > 0 && parseFloat(formData.precio_unitario_torniquetes) > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          {formData.cantidad_torniquetes} torniquetes × ${formatearPrecio(formData.precio_unitario_torniquetes, false)}
                        </span>
                        <span className="font-medium">
                          ${formatearPrecio(parseFloat(formData.cantidad_torniquetes) * parseFloat(formData.precio_unitario_torniquetes), false)}
                        </span>
                      </div>
                    )}
                    {parseFloat(formData.cantidad_esparragos) > 0 && parseFloat(formData.precio_unitario_esparragos) > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          {formData.cantidad_esparragos} esparragos × ${formatearPrecio(formData.precio_unitario_esparragos, false)}
                        </span>
                        <span className="font-medium">
                          ${formatearPrecio(parseFloat(formData.cantidad_esparragos) * parseFloat(formData.precio_unitario_esparragos), false)}
                        </span>
                      </div>
                    )}
                    {parseFloat(formData.metros_alambre_ar) > 0 && parseFloat(formData.precio_metro_alambre_ar) > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          {formData.metros_alambre_ar}m alambre A/R × ${formatearPrecio(formData.precio_metro_alambre_ar)}
                        </span>
                        <span className="font-medium">
                          ${formatearPrecio(parseFloat(formData.metros_alambre_ar) * parseFloat(formData.precio_metro_alambre_ar), false)}
                        </span>
                      </div>
                    )}
                    {parseFloat(formData.kg_clavos) > 0 && parseFloat(formData.precio_kg_clavos) > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          {formData.kg_clavos}kg clavos × ${formatearPrecio(formData.precio_kg_clavos, false)}
                        </span>
                        <span className="font-medium">
                          ${formatearPrecio(parseFloat(formData.kg_clavos) * parseFloat(formData.precio_kg_clavos), false)}
                        </span>
                      </div>
                    )}
                    {parseFloat(formData.kg_alambre_negro) > 0 && parseFloat(formData.precio_kg_alambre_negro) > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          {formData.kg_alambre_negro}kg alambre negro × ${formatearPrecio(formData.precio_kg_alambre_negro, false)}
                        </span>
                        <span className="font-medium">
                          ${formatearPrecio(parseFloat(formData.kg_alambre_negro) * parseFloat(formData.precio_kg_alambre_negro), false)}
                        </span>
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mano de Obra:</span>
                  <span className="font-semibold">
                    ${formatearPrecio(180 * parseFloat(formData.precio_mano_obra_por_metro), false)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transporte:</span>
                  <span className="font-semibold">
                    ${formatearPrecio(180 * parseFloat(formData.precio_transporte_por_metro), false)}
                  </span>
                </div>
              </div>

              <div className="border-t-2 pt-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold">Total 180m:</span>
                  <span className="text-2xl font-bold text-green-600">
                    ${formatearPrecio(precioCalculado.total_180m, false)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm">Precio/metro:</span>
                  <span className="text-lg font-bold text-primary">
                    ${formatearPrecio(precioCalculado.precio_metro)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t">
                  <span className="text-xs text-muted-foreground">Precio/metro (&lt;50m):</span>
                  <span className="text-sm font-bold text-orange-600">
                    ${formatearPrecio(precioCalculado.precio_metro_menor_50)}
                  </span>
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded text-xs text-blue-800">
                <p className="font-semibold mb-1">💡 Nota:</p>
                <p>
                  Esta configuración se usa como base. Al crear presupuestos, el sistema calcula proporcional según los metros del terreno.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>

      {/* Dialog de confirmación para salir sin guardar */}
      <Dialog open={mostrarConfirmacionSalir} onOpenChange={setMostrarConfirmacionSalir}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Salir sin guardar?</DialogTitle>
            <DialogDescription>
              Tienes cambios sin guardar. Si sales ahora, perderás todos los cambios realizados.
              ¿Estás seguro de que quieres continuar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelarSalir}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmarSalir}>
              Salir sin guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

