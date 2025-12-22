'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Save, Calculator, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { parseSafe } from '@/lib/utils'

export default function EditarConfiguracionCercadoPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [loadingInicial, setLoadingInicial] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [tejidos, setTejidos] = useState<any[]>([])
  const [postes, setPostes] = useState<any[]>([])
  const [accesorios, setAccesorios] = useState<any[]>([])
  const [materialesConstruccion, setMaterialesConstruccion] = useState<any[]>([])
  const [servicios, setServicios] = useState<any[]>([])
  const [formularioModificado, setFormularioModificado] = useState(false)
  const [mostrarConfirmacionSalir, setMostrarConfirmacionSalir] = useState(false)
  const [rutaPendiente, setRutaPendiente] = useState<string | null>(null)
  const [desglosePostesExpandido, setDesglosePostesExpandido] = useState(false)
  const [desgloseAccesoriosExpandido, setDesgloseAccesoriosExpandido] = useState(false)
  const [descripcionEditadaManualmente, setDescripcionEditadaManualmente] = useState(false)
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
    
    activo: true,
  })

  useEffect(() => {
    async function cargarDatosIniciales() {
      setLoadingInicial(true)
      try {
        await Promise.all([
          cargarTejidos(),
          cargarPostes(),
          cargarAccesorios(),
          cargarMaterialesConstruccion(),
          cargarServicios() // Primera carga sin IDs guardados
        ])
        if (params?.id) {
          await cargarConfiguracion()
        }
      } catch (error) {
        console.error('Error al cargar datos iniciales:', error)
        toast({
          title: "Error",
          description: "No se pudieron cargar algunos datos. Por favor, recarga la página.",
          variant: "destructive",
        })
      } finally {
        setLoadingInicial(false)
        setLoading(false)
      }
    }
    cargarDatosIniciales()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.id])

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

      const postesConPrecio = (data || []).map((poste: any) => {
        const precioVigente = poste.precios_venta?.find((p: any) => p.vigente === true)
        return {
          ...poste,
          precio_venta: precioVigente?.precio_venta || 0
        }
      }).filter((p: any) => p.precio_venta > 0)

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

      const accesoriosConPrecio = (data || []).map((accesorio: any) => {
        const precioVigente = accesorio.precios_venta?.find((p: any) => p.vigente === true)
        return {
          ...accesorio,
          precio_venta: precioVigente?.precio_venta || 0
        }
      }).filter((a: any) => a.precio_venta > 0)

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

      const materialesConPrecio = (data || []).map((material: any) => {
        const precioVigente = material.precios_venta?.find((p: any) => p.vigente === true)
        return {
          ...material,
          precio_venta: precioVigente?.precio_venta || 0
        }
      }).filter((m: any) => m.precio_venta > 0)

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

  async function cargarServicios(idsGuardados: string[] = []) {
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
        .eq('categoria', 'Servicios')
        .eq('unidad', 'metro')
        .order('nombre')

      if (error) throw error

      const serviciosConPrecio = (data || []).map((art: any) => {
        const precioVigente = art.precios_venta?.find((p: any) => p.vigente === true)
        return {
          ...art,
          precio_venta: precioVigente?.precio_venta || 0
        }
      })

      // Filtrar servicios: incluir los que tienen precio vigente O los que están guardados en la configuración
      const serviciosFiltrados = serviciosConPrecio.filter((a: any) => 
        a.precio_venta > 0 || idsGuardados.includes(String(a.id))
      )

      // Debug: verificar que los servicios guardados estén incluidos
      if (idsGuardados.length > 0) {
        const serviciosEncontrados = serviciosFiltrados.filter(s => idsGuardados.includes(String(s.id)))
        console.log('📋 Servicios cargados:', {
          idsGuardados,
          totalServiciosConPrecio: serviciosConPrecio.length,
          totalServiciosFiltrados: serviciosFiltrados.length,
          serviciosEncontrados: serviciosEncontrados.map(s => ({ 
            id: s.id, 
            idString: String(s.id),
            nombre: s.nombre,
            precio_venta: s.precio_venta 
          })),
          todosServicios: serviciosConPrecio.map(s => ({ 
            id: s.id, 
            idString: String(s.id),
            nombre: s.nombre,
            precio_venta: s.precio_venta,
            incluido: idsGuardados.includes(String(s.id))
          }))
        })
        if (serviciosEncontrados.length !== idsGuardados.length) {
          console.warn('⚠️ Algunos servicios guardados no se encontraron:', {
            idsGuardados,
            serviciosEncontrados: serviciosEncontrados.map(s => s.id),
            faltantes: idsGuardados.filter(id => !serviciosEncontrados.find(s => String(s.id) === id))
          })
        }
      }

      setServicios(serviciosFiltrados)
    } catch (error: any) {
      console.error('Error al cargar servicios:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los servicios (mano de obra, transporte).",
        variant: "destructive",
      })
    }
  }

  async function cargarConfiguracion() {
    try {
      const { data, error } = await supabase
        .from('configuraciones_cercado')
        .select('*')
        .eq('id', params?.id)
        .single()

      if (error) throw error

      if (data) {
        // Recargar servicios con los IDs guardados para incluir servicios sin precio vigente
        const idsGuardados: string[] = []
        if (data.mano_obra_id) {
          const idManoObra = String(data.mano_obra_id)
          idsGuardados.push(idManoObra)
        }
        if (data.transporte_id) {
          const idTransporte = String(data.transporte_id)
          idsGuardados.push(idTransporte)
        }
        
        // Siempre recargar servicios, pero con los IDs guardados si existen
        // IMPORTANTE: Cargar servicios ANTES de establecer formData para que estén disponibles
        await cargarServicios(idsGuardados)
        
        // Esperar un tick para que el estado de servicios se actualice
        // (setState es asíncrono, pero await cargarServicios debería garantizar que se ejecutó)
        
        // Debug: verificar que los datos de servicios se cargaron correctamente
        console.log('🔍 Cargando configuración:', {
          mano_obra_id_original: data.mano_obra_id,
          mano_obra_id_string: data.mano_obra_id ? String(data.mano_obra_id) : null,
          transporte_id_original: data.transporte_id,
          transporte_id_string: data.transporte_id ? String(data.transporte_id) : null,
          precio_mano_obra_por_metro: data.precio_mano_obra_por_metro,
          precio_transporte_por_metro: data.precio_transporte_por_metro,
          idsGuardados
        })
        
        setFormData({
          nombre: data.nombre,
          descripcion: data.descripcion || '',
          altura: data.altura.toString(),
          altura_final_cerco: data.altura_final_cerco ? data.altura_final_cerco.toString() : '',
          tejido_config_id: data.tejido_config_id ? String(data.tejido_config_id) : '',
          tipo_poste: data.tipo_poste || 'Eucalipto',
          
          cantidad_postes_esquineros: data.cantidad_postes_esquineros.toString(),
          cantidad_postes_refuerzos: data.cantidad_postes_refuerzos.toString(),
          cantidad_postes_intermedios: data.cantidad_postes_intermedios.toString(),
          cantidad_puntales: data.cantidad_puntales.toString(),
          
          // IDs de postes (si existen, sino usar valores por defecto) - convertir a string
          poste_esquinero_id: data.poste_esquinero_id ? String(data.poste_esquinero_id) : '',
          poste_refuerzo_id: data.poste_refuerzo_id ? String(data.poste_refuerzo_id) : '',
          poste_intermedio_id: data.poste_intermedio_id ? String(data.poste_intermedio_id) : '',
          poste_puntal_id: data.poste_puntal_id ? String(data.poste_puntal_id) : '',
          
          precio_poste_esquinero: data.precio_poste_esquinero.toString(),
          precio_poste_refuerzo: data.precio_poste_refuerzo.toString(),
          precio_poste_intermedio: data.precio_poste_intermedio.toString(),
          precio_puntal: data.precio_puntal.toString(),
          
          cordon_tipo: data.cordon_tipo || '10cm',
          cordon_arena_id: data.cordon_arena_id ? String(data.cordon_arena_id) : '',
          cordon_arena_m3: data.cordon_arena_m3 ? data.cordon_arena_m3.toString() : '0',
          cordon_ripio_id: data.cordon_ripio_id ? String(data.cordon_ripio_id) : '',
          cordon_ripio_m3: data.cordon_ripio_m3 ? data.cordon_ripio_m3.toString() : '0',
          cordon_cemento_id: data.cordon_cemento_id ? String(data.cordon_cemento_id) : '',
          cordon_cemento_bolsas: data.cordon_cemento_bolsas ? data.cordon_cemento_bolsas.toString() : '0',
          cordon_precio_total: data.cordon_precio_total ? data.cordon_precio_total.toString() : '0',
          
          hilos_pua: data.hilos_pua.toString(),
          pua_id: data.pua_id ? String(data.pua_id) : '',
          precio_pua_por_metro: data.precio_pua_por_metro.toString(),
          
          // IDs de accesorios (si existen) - convertir a string
          gancho_id: data.ganchos_id ? String(data.ganchos_id) : '',
          planchuela_id: data.planchuelas_id ? String(data.planchuelas_id) : '',
          torniquete_id: data.torniquetes_id ? String(data.torniquetes_id) : '',
          esparrago_id: data.esparragos_id ? String(data.esparragos_id) : '',
          alambre_ar_id: data.alambre_ar_id ? String(data.alambre_ar_id) : '',
          clavo_id: data.clavos_id ? String(data.clavos_id) : '',
          alambre_negro_id: data.alambre_negro_id ? String(data.alambre_negro_id) : '',
          
          cantidad_ganchos: data.cantidad_ganchos.toString(),
          precio_unitario_ganchos: data.precio_unitario_ganchos.toString(),
          cantidad_planchuelas: data.cantidad_planchuelas.toString(),
          precio_unitario_planchuelas: data.precio_unitario_planchuelas.toString(),
          // Calcular torniquetes automáticamente basado en altura y hilos de púa
          cantidad_torniquetes: (() => {
            const alturaNum = parseFloat(data.altura.toString())
            const hilosPuaNum = parseInt(data.hilos_pua.toString())
            // Calcular hileras AR
            let hilerasAR = 2
            if (alturaNum <= 1.5) {
              hilerasAR = 2
            } else if (alturaNum === 1.8) {
              hilerasAR = 3
            } else {
              hilerasAR = 4
            }
            // Torniquetes AR + Torniquetes Púa
            const torniquetesAR = hilerasAR * 6
            const torniquetesPua = hilosPuaNum * 6
            return (torniquetesAR + torniquetesPua).toString()
          })(),
          precio_unitario_torniquetes: data.precio_unitario_torniquetes.toString(),
          cantidad_esparragos: data.cantidad_esparragos.toString(),
          precio_unitario_esparragos: data.precio_unitario_esparragos.toString(),
          metros_alambre_ar: data.metros_alambre_ar.toString(),
          precio_metro_alambre_ar: data.precio_metro_alambre_ar.toString(),
          kg_clavos: data.kg_clavos.toString(),
          precio_kg_clavos: data.precio_kg_clavos.toString(),
          kg_alambre_negro: data.kg_alambre_negro.toString(),
          precio_kg_alambre_negro: data.precio_kg_alambre_negro.toString(),
          
          precio_mano_obra_por_metro: data.precio_mano_obra_por_metro ? data.precio_mano_obra_por_metro.toString() : '0',
          precio_transporte_por_metro: data.precio_transporte_por_metro ? data.precio_transporte_por_metro.toString() : '0',
          mano_obra_id: data.mano_obra_id ? String(data.mano_obra_id) : '',
          transporte_id: data.transporte_id ? String(data.transporte_id) : '',
          
          activo: data.activo,
        })
      }
    } catch (error: any) {
      console.error('Error:', error)
      toast({
        title: "Error al cargar configuración",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Optimizar cálculo de precios con useMemo
  const precioCalculadoMemo = useMemo(() => {

    // Calcular total de accesorios
    const totalAccesorios = 
      (parseSafe(formData.cantidad_ganchos) * parseSafe(formData.precio_unitario_ganchos)) +
      (parseSafe(formData.cantidad_planchuelas) * parseSafe(formData.precio_unitario_planchuelas)) +
      (parseSafe(formData.cantidad_torniquetes) * parseSafe(formData.precio_unitario_torniquetes)) +
      (parseSafe(formData.cantidad_esparragos) * parseSafe(formData.precio_unitario_esparragos)) +
      (parseSafe(formData.metros_alambre_ar) * parseSafe(formData.precio_metro_alambre_ar)) +
      (parseSafe(formData.kg_clavos) * parseSafe(formData.precio_kg_clavos)) +
      (parseSafe(formData.kg_alambre_negro) * parseSafe(formData.precio_kg_alambre_negro))

    // Obtener precio del tejido
    const tejidoSeleccionado = tejidos.find(t => String(t.id) === formData.tejido_config_id)
    const precioTejido = parseSafe(tejidoSeleccionado?.precio_venta, 0)
    // Usar la longitud real del rollo del tejido (campo 'largo', por defecto 10.00m)
    const largoRollo = parseSafe(tejidoSeleccionado?.largo, 10.00)
    const rollosNecesarios = largoRollo > 0 ? Math.ceil(180 / largoRollo) : 0
    const costoTejido = rollosNecesarios * precioTejido

    // Calcular total de postes
    const totalPostes =
      (parseSafe(formData.cantidad_postes_esquineros) * parseSafe(formData.precio_poste_esquinero)) +
      (parseSafe(formData.cantidad_postes_refuerzos) * parseSafe(formData.precio_poste_refuerzo)) +
      (parseSafe(formData.cantidad_postes_intermedios) * parseSafe(formData.precio_poste_intermedio)) +
      (parseSafe(formData.cantidad_puntales) * parseSafe(formData.precio_puntal))

    // Costo de púa (180m)
    const hilosPua = parseSafe(formData.hilos_pua, 0)
    const precioPuaPorMetro = parseSafe(formData.precio_pua_por_metro, 0)
    const costoPua = 180 * hilosPua * precioPuaPorMetro

    // Mano de obra y transporte (180m)
    const precioManoObraPorMetro = parseSafe(formData.precio_mano_obra_por_metro, 0)
    const precioTransportePorMetro = parseSafe(formData.precio_transporte_por_metro, 0)
    const costoManoObra = 180 * precioManoObraPorMetro
    const costoTransporte = 180 * precioTransportePorMetro

    // Cordón
    const cordonPrecioTotal = parseSafe(formData.cordon_precio_total, 0)

    // Total para 180m - Sumar todos los componentes
    // Usar sumas incrementales para mejor precisión
    const componentes = [
      costoTejido,
      totalPostes,
      cordonPrecioTotal,
      costoPua,
      totalAccesorios,
      costoManoObra,
      costoTransporte
    ]
    
    // Sumar todos los componentes
    const total180m = componentes.reduce((sum, val) => {
      const valor = parseSafe(val, 0)
      return sum + valor
    }, 0)

    // Debug: Log de componentes para verificación (solo en desarrollo)
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('💰 Cálculo Total 180m:', {
        costoTejido: parseSafe(costoTejido),
        totalPostes: parseSafe(totalPostes),
        cordonPrecioTotal: parseSafe(cordonPrecioTotal),
        costoPua: parseSafe(costoPua),
        totalAccesorios: parseSafe(totalAccesorios),
        costoManoObra: parseSafe(costoManoObra),
        costoTransporte: parseSafe(costoTransporte),
        sumaTotal: parseSafe(total180m)
      })
    }

    // Validar que el total sea un número válido
    const total180mValidado = isNaN(total180m) || !isFinite(total180m) ? 0 : Math.max(0, total180m)
    const precioMetro = total180mValidado > 0 ? total180mValidado / 180 : 0
    const precioMetroMenor50 = precioMetro * 1.50

    // Validar que todos los valores sean números válidos
    const accesoriosValidado = isNaN(totalAccesorios) || !isFinite(totalAccesorios) ? 0 : Math.max(0, totalAccesorios)
    const precioMetroValidado = isNaN(precioMetro) || !isFinite(precioMetro) ? 0 : Math.max(0, precioMetro)
    const precioMetroMenor50Validado = isNaN(precioMetroMenor50) || !isFinite(precioMetroMenor50) ? 0 : Math.max(0, precioMetroMenor50)

    return {
      accesorios: accesoriosValidado,
      total_180m: total180mValidado,
      precio_metro: precioMetroValidado,
      precio_metro_menor_50: precioMetroMenor50Validado,
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

  // Calcular automáticamente la cantidad de torniquetes cuando cambie la altura o hilos de púa
  useEffect(() => {
    if (formData.altura) {
      const cantidadTorniquetes = calcularTorniquetes(formData.altura, formData.hilos_pua)
      setFormData(prev => ({
        ...prev,
        cantidad_torniquetes: cantidadTorniquetes.toString()
      }))
    }
  }, [formData.altura, formData.hilos_pua])

  // Validar y corregir IDs cuando se carguen los artículos
  useEffect(() => {
    if (loadingInicial) {
      return
    }

    // Solo validar si hay datos cargados y hay IDs en formData
    const tieneDatos = formData.nombre.trim() !== '' || formData.tejido_config_id !== ''
    if (!tieneDatos) {
      return
    }

    // Validar y corregir IDs de postes
    if (formData.poste_esquinero_id && postes.length > 0) {
      const existe = postes.find(p => String(p.id) === formData.poste_esquinero_id)
      if (!existe) {
        setFormData(prev => ({ ...prev, poste_esquinero_id: '' }))
      }
    }
    if (formData.poste_refuerzo_id && postes.length > 0) {
      const existe = postes.find(p => String(p.id) === formData.poste_refuerzo_id)
      if (!existe) {
        setFormData(prev => ({ ...prev, poste_refuerzo_id: '' }))
      }
    }
    if (formData.poste_intermedio_id && postes.length > 0) {
      const existe = postes.find(p => String(p.id) === formData.poste_intermedio_id)
      if (!existe) {
        setFormData(prev => ({ ...prev, poste_intermedio_id: '' }))
      }
    }
    if (formData.poste_puntal_id && postes.length > 0) {
      const existe = postes.find(p => String(p.id) === formData.poste_puntal_id)
      if (!existe) {
        setFormData(prev => ({ ...prev, poste_puntal_id: '' }))
      }
    }

    // Validar IDs de accesorios
    if (formData.gancho_id && accesorios.length > 0) {
      const existe = accesorios.find(a => String(a.id) === formData.gancho_id)
      if (!existe) {
        setFormData(prev => ({ ...prev, gancho_id: '' }))
      }
    }
    if (formData.planchuela_id && accesorios.length > 0) {
      const existe = accesorios.find(a => String(a.id) === formData.planchuela_id)
      if (!existe) {
        setFormData(prev => ({ ...prev, planchuela_id: '' }))
      }
    }
    if (formData.torniquete_id && accesorios.length > 0) {
      const existe = accesorios.find(a => String(a.id) === formData.torniquete_id)
      if (!existe) {
        setFormData(prev => ({ ...prev, torniquete_id: '' }))
      }
    }
    if (formData.esparrago_id && accesorios.length > 0) {
      const existe = accesorios.find(a => String(a.id) === formData.esparrago_id)
      if (!existe) {
        setFormData(prev => ({ ...prev, esparrago_id: '' }))
      }
    }
    if (formData.alambre_ar_id && accesorios.length > 0) {
      const existe = accesorios.find(a => String(a.id) === formData.alambre_ar_id)
      if (!existe) {
        setFormData(prev => ({ ...prev, alambre_ar_id: '' }))
      }
    }
    if (formData.clavo_id && accesorios.length > 0) {
      const existe = accesorios.find(a => String(a.id) === formData.clavo_id)
      if (!existe) {
        setFormData(prev => ({ ...prev, clavo_id: '' }))
      }
    }
    if (formData.alambre_negro_id && accesorios.length > 0) {
      const existe = accesorios.find(a => String(a.id) === formData.alambre_negro_id)
      if (!existe) {
        setFormData(prev => ({ ...prev, alambre_negro_id: '' }))
      }
    }
    if (formData.pua_id && accesorios.length > 0) {
      const existe = accesorios.find(a => String(a.id) === formData.pua_id)
      if (!existe) {
        setFormData(prev => ({ ...prev, pua_id: '' }))
      }
    }

    // Validar IDs de materiales
    if (formData.cordon_arena_id && materialesConstruccion.length > 0) {
      const existe = materialesConstruccion.find(m => String(m.id) === formData.cordon_arena_id)
      if (!existe) {
        setFormData(prev => ({ ...prev, cordon_arena_id: '' }))
      }
    }
    if (formData.cordon_ripio_id && materialesConstruccion.length > 0) {
      const existe = materialesConstruccion.find(m => String(m.id) === formData.cordon_ripio_id)
      if (!existe) {
        setFormData(prev => ({ ...prev, cordon_ripio_id: '' }))
      }
    }
    if (formData.cordon_cemento_id && materialesConstruccion.length > 0) {
      const existe = materialesConstruccion.find(m => String(m.id) === formData.cordon_cemento_id)
      if (!existe) {
        setFormData(prev => ({ ...prev, cordon_cemento_id: '' }))
      }
    }

    // Validar IDs de servicios
    if (formData.mano_obra_id && servicios.length > 0) {
      const existe = servicios.find(s => String(s.id) === formData.mano_obra_id)
      if (!existe) {
        setFormData(prev => ({ ...prev, mano_obra_id: '' }))
      }
    }
    if (formData.transporte_id && servicios.length > 0) {
      const existe = servicios.find(s => String(s.id) === formData.transporte_id)
      if (!existe) {
        setFormData(prev => ({ ...prev, transporte_id: '' }))
      }
    }

    // Validar tejido
    if (formData.tejido_config_id && tejidos.length > 0) {
      const existe = tejidos.find(t => String(t.id) === formData.tejido_config_id)
      if (!existe) {
        setFormData(prev => ({ ...prev, tejido_config_id: '' }))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingInicial, postes, accesorios, materialesConstruccion, servicios, tejidos])

  // Actualizar precios cuando se carguen los artículos y haya IDs guardados
  useEffect(() => {
    if (loadingInicial) {
      return
    }
    
    // Solo actualizar precios si hay servicios cargados (pueden estar vacíos si no hay servicios con precio vigente)
    // pero aún así debemos intentar actualizar los precios si hay IDs guardados

    // Actualizar precios de postes si hay IDs guardados
    if (formData.poste_esquinero_id) {
      const poste = postes.find(p => String(p.id) === formData.poste_esquinero_id)
      if (poste && poste.precio_venta) {
        setFormData(prev => ({ ...prev, precio_poste_esquinero: poste.precio_venta.toString() }))
      }
    }
    if (formData.poste_refuerzo_id) {
      const poste = postes.find(p => String(p.id) === formData.poste_refuerzo_id)
      if (poste && poste.precio_venta) {
        setFormData(prev => ({ ...prev, precio_poste_refuerzo: poste.precio_venta.toString() }))
      }
    }
    if (formData.poste_intermedio_id) {
      const poste = postes.find(p => String(p.id) === formData.poste_intermedio_id)
      if (poste && poste.precio_venta) {
        setFormData(prev => ({ ...prev, precio_poste_intermedio: poste.precio_venta.toString() }))
      }
    }
    if (formData.poste_puntal_id) {
      const poste = postes.find(p => String(p.id) === formData.poste_puntal_id)
      if (poste && poste.precio_venta) {
        setFormData(prev => ({ ...prev, precio_puntal: poste.precio_venta.toString() }))
      }
    }

    // Actualizar precios de accesorios si hay IDs guardados
    if (formData.gancho_id) {
      const accesorio = accesorios.find(a => String(a.id) === formData.gancho_id)
      if (accesorio && accesorio.precio_venta) {
        setFormData(prev => ({ ...prev, precio_unitario_ganchos: accesorio.precio_venta.toString() }))
      }
    }
    if (formData.planchuela_id) {
      const accesorio = accesorios.find(a => String(a.id) === formData.planchuela_id)
      if (accesorio && accesorio.precio_venta) {
        setFormData(prev => ({ ...prev, precio_unitario_planchuelas: accesorio.precio_venta.toString() }))
      }
    }
    if (formData.torniquete_id) {
      const accesorio = accesorios.find(a => String(a.id) === formData.torniquete_id)
      if (accesorio && accesorio.precio_venta) {
        setFormData(prev => ({ ...prev, precio_unitario_torniquetes: accesorio.precio_venta.toString() }))
      }
    }
    if (formData.esparrago_id) {
      const accesorio = accesorios.find(a => String(a.id) === formData.esparrago_id)
      if (accesorio && accesorio.precio_venta) {
        setFormData(prev => ({ ...prev, precio_unitario_esparragos: accesorio.precio_venta.toString() }))
      }
    }
    if (formData.alambre_ar_id) {
      const accesorio = accesorios.find(a => String(a.id) === formData.alambre_ar_id)
      if (accesorio && accesorio.precio_venta) {
        const precioUnitario = accesorio.precio_venta
        const unidad = accesorio.unidad?.toLowerCase() || ''
        const nombre = accesorio.nombre?.toLowerCase() || ''
        
        // Calcular precio por metro según la unidad (igual que en onValueChange)
        let precioPorMetro = 0
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
            precioPorMetro = precioUnitario / 500 // Rollos estándar de 500m
          }
        } else {
          // Para otras unidades, asumir que el precio ya es por metro
          precioPorMetro = precioUnitario
        }
        
        setFormData(prev => ({ ...prev, precio_metro_alambre_ar: precioPorMetro.toString() }))
      }
    }
    if (formData.clavo_id) {
      const accesorio = accesorios.find(a => String(a.id) === formData.clavo_id)
      if (accesorio && accesorio.precio_venta) {
        setFormData(prev => ({ ...prev, precio_kg_clavos: accesorio.precio_venta.toString() }))
      }
    }
    if (formData.alambre_negro_id) {
      const accesorio = accesorios.find(a => String(a.id) === formData.alambre_negro_id)
      if (accesorio && accesorio.precio_venta) {
        setFormData(prev => ({ ...prev, precio_kg_alambre_negro: accesorio.precio_venta.toString() }))
      }
    }
    if (formData.pua_id) {
      const accesorio = accesorios.find(a => String(a.id) === formData.pua_id)
      if (accesorio && accesorio.precio_venta) {
        const precioUnitario = accesorio.precio_venta
        const unidad = accesorio.unidad?.toLowerCase() || ''
        
        // Calcular precio por metro según la unidad (igual que en la página de "nuevo")
        let precioPorMetro = 0
        if (unidad.includes('metro') || unidad === 'm') {
          // Si la unidad es metro, usar directamente
          precioPorMetro = precioUnitario
        } else {
          // Para rollos, intentar extraer metros del nombre o usar 500m por defecto
          const nombre = accesorio.nombre?.toLowerCase() || ''
          const matchMetros = nombre.match(/(\d+)\s*m/i) || nombre.match(/(\d+)\s*metros/i)
          const metrosRollo = matchMetros ? parseInt(matchMetros[1]) : 500
          precioPorMetro = metrosRollo > 0 ? precioUnitario / metrosRollo : precioUnitario / 500
        }
        
        setFormData(prev => ({ ...prev, precio_pua_por_metro: precioPorMetro.toString() }))
      }
    }

    // Actualizar precios de servicios si hay IDs guardados
    // Solo actualizar si el servicio tiene precio vigente (el precio guardado en formData ya está establecido desde la BD)
    if (formData.mano_obra_id && servicios.length > 0) {
      const servicio = servicios.find(s => String(s.id) === formData.mano_obra_id)
      // Solo actualizar si el servicio tiene precio vigente mayor a 0
      // Si no tiene precio vigente, mantener el precio guardado en formData (desde la BD)
      if (servicio && servicio.precio_venta > 0) {
        setFormData(prev => ({ ...prev, precio_mano_obra_por_metro: servicio.precio_venta.toString() }))
      }
    }
    if (formData.transporte_id && servicios.length > 0) {
      const servicio = servicios.find(s => String(s.id) === formData.transporte_id)
      // Solo actualizar si el servicio tiene precio vigente mayor a 0
      // Si no tiene precio vigente, mantener el precio guardado en formData (desde la BD)
      if (servicio && servicio.precio_venta > 0) {
        setFormData(prev => ({ ...prev, precio_transporte_por_metro: servicio.precio_venta.toString() }))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingInicial, postes, accesorios, materialesConstruccion, servicios, formData.poste_esquinero_id, formData.poste_refuerzo_id, formData.poste_intermedio_id, formData.poste_puntal_id, formData.gancho_id, formData.planchuela_id, formData.torniquete_id, formData.esparrago_id, formData.alambre_ar_id, formData.clavo_id, formData.alambre_negro_id, formData.pua_id, formData.mano_obra_id, formData.transporte_id])

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
      const tejidoSeleccionado = tejidos.find(t => String(t.id) === formData.tejido_config_id)
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
    const serviciosFiltrados = servicios.filter((s) => {
      const nombre = (s.nombre || '').toLowerCase()
      const categoria = (s.categoria || '').toLowerCase()
      const coincideKeyword = keywords.some(k => nombre.includes(k))
      const esServicio = categoria.includes('servicio')
      return (coincideKeyword || esServicio)
    })
    
    // Si no hay servicios filtrados pero hay servicios disponibles, retornar todos
    // Esto asegura que siempre haya opciones disponibles
    if (serviciosFiltrados.length === 0 && servicios.length > 0) {
      return servicios
    }
    
    return serviciosFiltrados
  }

  // Función para calcular cantidad de hileras de alambre alta resistencia según altura
  function calcularHilerasAlambreAR(altura: string | number): number {
    const alturaNum = typeof altura === 'string' ? parseFloat(altura) : altura
    if (alturaNum <= 1.5) {
      return 2 // 1.0m, 1.2m, 1.5m → 2 hileras
    } else if (alturaNum === 1.8) {
      return 3 // 1.8m → 3 hileras
    } else {
      return 4 // 2.0m, 2.5m, 3.0m → 4 hileras
    }
  }

  // Función para calcular cantidad de torniquetes por alambre alta resistencia
  // Cada hilera lleva 6 torniquetes (1 cada 30m para 180m)
  function calcularTorniquetesAlambreAR(altura: string | number): number {
    const hileras = calcularHilerasAlambreAR(altura)
    return 6 * hileras // 6 torniquetes por hilera
  }

  // Función para calcular cantidad de torniquetes por hilos de púa
  // Cada hilo de púa lleva 6 torniquetes (1 cada 30m para 180m)
  function calcularTorniquetesPua(hilosPua: string | number): number {
    const hilos = typeof hilosPua === 'string' ? parseInt(hilosPua) : hilosPua
    return 6 * hilos // 6 torniquetes por hilo de púa
  }

  // Función para calcular cantidad total de torniquetes
  function calcularTorniquetes(altura: string | number, hilosPua: string | number): number {
    const torniquetesAR = calcularTorniquetesAlambreAR(altura)
    const torniquetesPua = calcularTorniquetesPua(hilosPua)
    return torniquetesAR + torniquetesPua
  }

  // Calcular cantidades de materiales según tipo de cordón
  function calcularCantidadesCordon(tipo: string): { arena: string, ripio: string, cemento: string } {
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

  // Función helper para filtrar accesorios por nombre
  function filtrarAccesoriosPorTipo(tipo: string): any[] {
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
      
      return true
    })
    
    return accesoriosFiltrados.length > 0 ? accesoriosFiltrados : accesorios
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

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
        // Mantener compatibilidad con campos antiguos
        cordon_bolsas_ripio: parseFloat(formData.cordon_ripio_m3) || 0,
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
        
        activo: formData.activo,
      }

      const { error } = await supabase
        .from('configuraciones_cercado')
        .update(configData)
        .eq('id', params?.id)

      if (error) throw error

      toast({
        title: "¡Éxito!",
        description: "Configuración actualizada correctamente",
      })

      setTimeout(() => {
        router.push('/dashboard/cercado')
      }, 1000)
    } catch (error: any) {
      console.error('Error:', error)
      toast({
        title: "Error al actualizar configuración",
        description: error.message,
        variant: "destructive",
      })
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('¿Estás seguro de que deseas eliminar esta configuración? Esta acción no se puede deshacer.')) {
      return
    }

    setDeleting(true)
    try {
      const { error } = await supabase
        .from('configuraciones_cercado')
        .delete()
        .eq('id', params?.id)

      if (error) throw error

      toast({
        title: "Eliminado",
        description: "Configuración eliminada correctamente",
      })

      setTimeout(() => {
        router.push('/dashboard/cercado')
      }, 1000)
    } catch (error: any) {
      console.error('Error:', error)
      toast({
        title: "Error al eliminar",
        description: error.message,
        variant: "destructive",
      })
      setDeleting(false)
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
      {/* Dialog de confirmación antes de salir */}
      <Dialog open={mostrarConfirmacionSalir} onOpenChange={setMostrarConfirmacionSalir}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Salir sin guardar?</DialogTitle>
            <DialogDescription>
              Tienes cambios sin guardar. Si sales ahora, perderás todos los cambios realizados.
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

      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => manejarNavegacion('/dashboard/cercado')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Editar Configuración de Cercado</h1>
          <p className="text-muted-foreground">Modificar componentes y costos base</p>
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
                      {(() => {
                        // Si hay un tejido seleccionado, incluirlo aunque no coincida con la altura
                        const tejidoSeleccionado = formData.tejido_config_id 
                          ? tejidos.find(t => String(t.id) === formData.tejido_config_id)
                          : null
                        
                        // Filtrar tejidos por altura
                        const alturaFloat = parseFloat(formData.altura) || 0
                        const tejidosFiltrados = tejidos.filter((t) => {
                          const tejidoAltura = typeof t.altura === 'number' ? t.altura : parseFloat(t.altura)
                          return Math.abs(tejidoAltura - alturaFloat) < 0.01
                        })
                        
                        // Si hay un tejido seleccionado que no está en los filtrados, agregarlo
                        const tejidosParaMostrar = tejidoSeleccionado && !tejidosFiltrados.find(t => String(t.id) === formData.tejido_config_id)
                          ? [...tejidosFiltrados, tejidoSeleccionado]
                          : tejidosFiltrados
                        
                        return tejidosParaMostrar.length > 0 ? (
                          tejidosParaMostrar.map((tejido) => (
                            <SelectItem key={tejido.id} value={String(tejido.id)}>
                              {tejido.codigo} - ${formatearPrecio(tejido.precio_venta, false)}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                            No hay tejidos disponibles para esta altura
                          </div>
                        )
                      })()}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {(() => {
                      const tejidoSel = tejidos.find(t => String(t.id) === formData.tejido_config_id)
                      const largoRollo = tejidoSel?.largo || 10.00
                      const rollosNecesarios = Math.ceil(180 / largoRollo)
                      return `Filtra tejidos según altura seleccionada. Se necesitan ${rollosNecesarios} rollos de ${largoRollo}m para 180m.`
                    })()}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Estado</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      checked={formData.activo}
                      onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                    />
                    <Label>{formData.activo ? 'Activa' : 'Inactiva'}</Label>
                  </div>
                </div>
              </div>

              {/* Info Box - Totales del Tejido */}
              {formData.tejido_config_id && (() => {
                const tejidoSel = tejidos.find(t => String(t.id) === formData.tejido_config_id)
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

          {/* Postes - Igual que en nuevo */}
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
                <p className="text-xs text-muted-foreground">
                  El tipo de poste se usa como referencia. Los precios se actualizan al seleccionar artículos específicos.
                </p>
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
                            No hay postes disponibles.
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
                            No hay postes disponibles.
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
                            No hay postes disponibles.
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

              {/* Info Box - Totales de Postes */}
              {(() => {
                const totalPostes = 
                  (parseFloat(formData.cantidad_postes_esquineros) * parseFloat(formData.precio_poste_esquinero)) +
                  (parseFloat(formData.cantidad_postes_refuerzos) * parseFloat(formData.precio_poste_refuerzo)) +
                  (parseFloat(formData.cantidad_postes_intermedios) * parseFloat(formData.precio_poste_intermedio)) +
                  (parseFloat(formData.cantidad_puntales) * parseFloat(formData.precio_puntal))
                
                const totalCantidad = 
                  parseInt(formData.cantidad_postes_esquineros) +
                  parseInt(formData.cantidad_postes_refuerzos) +
                  parseInt(formData.cantidad_postes_intermedios) +
                  parseInt(formData.cantidad_puntales)
                
                return (
                  <div className="p-3 bg-muted rounded">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold">Total Postes:</span>
                      <span className="text-2xl font-bold text-primary">
                        ${formatearPrecio(totalPostes, false)}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      <div className="flex justify-between">
                        <span>Cantidad total de postes:</span>
                        <span className="font-medium text-foreground">{totalCantidad} unidades</span>
                      </div>
                    </div>
                  </div>
                )
              })()}
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
                      const unidad = accesorioSeleccionado?.unidad?.toLowerCase() || ''
                      
                      // Calcular precio por metro según la unidad (igual que en la página de "nuevo")
                      let precioPorMetro = 0
                      if (unidad.includes('metro') || unidad === 'm') {
                        // Si la unidad es metro, usar directamente
                        precioPorMetro = precioUnitario
                      } else {
                        // Para rollos, intentar extraer metros del nombre o usar 500m por defecto
                        const nombre = accesorioSeleccionado?.nombre?.toLowerCase() || ''
                        const matchMetros = nombre.match(/(\d+)\s*m/i) || nombre.match(/(\d+)\s*metros/i)
                        const metrosRollo = matchMetros ? parseInt(matchMetros[1]) : 500
                        precioPorMetro = metrosRollo > 0 ? precioUnitario / metrosRollo : precioUnitario / 500
                      }
                      
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
                            {accesorio.nombre} - ${formatearPrecio(accesorio.precio_venta, false)}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                          No hay alambre de púa disponible.
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Precio: ${formatearPrecio(formData.precio_pua_por_metro, false)}/metro
                  </p>
                </div>
              </div>

              <div className="p-3 bg-muted rounded">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold">Precio Total Alambre de Púa:</span>
                  <span className="text-2xl font-bold text-primary">
                    ${formatearPrecio(180 * parseSafe(formData.hilos_pua, 0) * parseSafe(formData.precio_pua_por_metro, 0))}
                  </span>
                </div>
                {parseSafe(formData.hilos_pua, 0) > 0 && (
                  <div className="mt-2 pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      Torniquetes para púa: {formData.hilos_pua} hilo{parseSafe(formData.hilos_pua, 0) !== 1 ? 's' : ''} × 6 = {calcularTorniquetesPua(formData.hilos_pua)} torniquetes
                    </p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Calculado automáticamente según materiales y cantidades seleccionadas
                </p>
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
                  { label: 'Ganchos', cant: 'cantidad_ganchos', precio: 'precio_unitario_ganchos', id: 'gancho_id', default: '48', tipo: 'gancho', calculado: false },
                  { label: 'Planchuelas', cant: 'cantidad_planchuelas', precio: 'precio_unitario_planchuelas', id: 'planchuela_id', default: '12', tipo: 'planchuela', calculado: false },
                  { label: 'Torniquetes', cant: 'cantidad_torniquetes', precio: 'precio_unitario_torniquetes', id: 'torniquete_id', default: '6', tipo: 'torniquete', calculado: true },
                  { label: 'Esparragos', cant: 'cantidad_esparragos', precio: 'precio_unitario_esparragos', id: 'esparrago_id', default: '6', tipo: 'esparrago', calculado: false },
                ].map((item) => (
                  <div key={item.label} className="space-y-1">
                    <div className="grid grid-cols-3 gap-2 items-center">
                      <Label className="text-sm">
                        {item.label}
                        {item.calculado && (
                          <span className="ml-1 text-xs text-muted-foreground">(calculado)</span>
                        )}
                      </Label>
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
                        className={`text-sm ${item.calculado ? 'bg-muted' : ''}`}
                        readOnly={item.calculado}
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
                    {item.calculado && item.label === 'Torniquetes' && (
                      <div className="text-xs text-muted-foreground ml-1 space-y-1">
                        <p className="font-medium">Calculado automáticamente:</p>
                        <p>
                          • Alambre AR: {calcularHilerasAlambreAR(formData.altura)} hileras × 6 = {calcularTorniquetesAlambreAR(formData.altura)} torniquetes
                        </p>
                        {parseSafe(formData.hilos_pua) > 0 && (
                          <p>
                            • Púa: {formData.hilos_pua} hilo{parseSafe(formData.hilos_pua) !== 1 ? 's' : ''} × 6 = {calcularTorniquetesPua(formData.hilos_pua)} torniquetes
                          </p>
                        )}
                        <p className="font-semibold">
                          Total: {formData.cantidad_torniquetes} torniquetes
                        </p>
                      </div>
                    )}
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
                        precioPorMetro = precioUnitario
                      } else if (unidad.includes('rollo') || unidad.includes('roll')) {
                        // Intentar extraer metros del nombre (ej: "rollo de 500m", "rollo 1000m")
                        const metrosMatch = nombre.match(/(\d+)\s*m/i) || nombre.match(/(\d+)\s*metros/i)
                        if (metrosMatch) {
                          const metrosPorRollo = parseInt(metrosMatch[1])
                          precioPorMetro = metrosPorRollo > 0 ? precioUnitario / metrosPorRollo : precioUnitario / 500
                        } else {
                          precioPorMetro = precioUnitario / 500 // Rollos estándar de 500m
                        }
                      } else {
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
                      // Si la unidad es kg, usar directamente, sino dividir por 1 (asumir que el precio ya es por kg)
                      const precioPorKg = accesorioSeleccionado?.unidad?.toLowerCase().includes('kg') 
                        ? precioUnitario 
                        : precioUnitario
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
                      // Si la unidad es kg, usar directamente, sino dividir por 1 (asumir que el precio ya es por kg)
                      const precioPorKg = accesorioSeleccionado?.unidad?.toLowerCase().includes('kg') 
                        ? precioUnitario 
                        : precioUnitario
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
                    value={formData.mano_obra_id || undefined}
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
                      {(() => {
                        // Debug: verificar estado actual
                        console.log('🔧 Renderizando Select de mano de obra:', {
                          mano_obra_id: formData.mano_obra_id,
                          totalServicios: servicios.length,
                          serviciosIds: servicios.map(s => String(s.id))
                        })
                        
                        // Si hay un servicio seleccionado, incluirlo aunque no coincida con el filtro
                        const servicioSeleccionado = formData.mano_obra_id 
                          ? servicios.find(s => String(s.id) === String(formData.mano_obra_id))
                          : null
                        
                        if (formData.mano_obra_id && !servicioSeleccionado) {
                          console.warn('⚠️ Servicio seleccionado no encontrado:', {
                            buscando: formData.mano_obra_id,
                            disponibles: servicios.map(s => ({ id: s.id, idString: String(s.id), nombre: s.nombre }))
                          })
                        }
                        
                        // Filtrar servicios por tipo
                        const serviciosFiltrados = filtrarServiciosPorTipo('mano_obra')
                        
                        // Si hay un servicio seleccionado que no está en los filtrados, agregarlo al inicio
                        const serviciosParaMostrar = servicioSeleccionado && !serviciosFiltrados.find(s => String(s.id) === String(formData.mano_obra_id))
                          ? [servicioSeleccionado, ...serviciosFiltrados]
                          : serviciosFiltrados
                        
                        return serviciosParaMostrar.length > 0 ? (
                          serviciosParaMostrar.map((s) => (
                            <SelectItem key={s.id} value={String(s.id)}>
                              {s.nombre} - ${formatearPrecio(s.precio_venta, false)} {s.unidad ? `(${s.unidad})` : ''}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                            No hay servicios disponibles. Crea artículos de tipo servicio.
                          </div>
                        )
                      })()}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    180m × ${formatearPrecio(formData.precio_mano_obra_por_metro)} = ${formatearPrecio(180 * parseFloat(formData.precio_mano_obra_por_metro), false)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Transporte ($/metro)</Label>
                  <Select
                    value={formData.transporte_id || undefined}
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
                      {(() => {
                        // Debug: verificar estado actual
                        console.log('🔧 Renderizando Select de transporte:', {
                          transporte_id: formData.transporte_id,
                          totalServicios: servicios.length,
                          serviciosIds: servicios.map(s => String(s.id))
                        })
                        
                        // Si hay un servicio seleccionado, incluirlo aunque no coincida con el filtro
                        const servicioSeleccionado = formData.transporte_id 
                          ? servicios.find(s => String(s.id) === String(formData.transporte_id))
                          : null
                        
                        if (formData.transporte_id && !servicioSeleccionado) {
                          console.warn('⚠️ Servicio seleccionado no encontrado:', {
                            buscando: formData.transporte_id,
                            disponibles: servicios.map(s => ({ id: s.id, idString: String(s.id), nombre: s.nombre }))
                          })
                        }
                        
                        // Filtrar servicios por tipo
                        const serviciosFiltrados = filtrarServiciosPorTipo('transporte')
                        
                        // Si hay un servicio seleccionado que no está en los filtrados, agregarlo al inicio
                        const serviciosParaMostrar = servicioSeleccionado && !serviciosFiltrados.find(s => String(s.id) === String(formData.transporte_id))
                          ? [servicioSeleccionado, ...serviciosFiltrados]
                          : serviciosFiltrados
                        
                        return serviciosParaMostrar.length > 0 ? (
                          serviciosParaMostrar.map((s) => (
                            <SelectItem key={s.id} value={String(s.id)}>
                              {s.nombre} - ${formatearPrecio(s.precio_venta, false)} {s.unidad ? `(${s.unidad})` : ''}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                            No hay servicios disponibles. Crea artículos de tipo servicio.
                          </div>
                        )
                      })()}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    180m × ${formatearPrecio(formData.precio_transporte_por_metro)} = ${formatearPrecio(180 * parseFloat(formData.precio_transporte_por_metro), false)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="submit" disabled={saving} size="lg">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
            
            <Button 
              type="button" 
              variant="destructive" 
              disabled={deleting}
              onClick={handleDelete}
              size="lg"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
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
                      const tejidoSel = tejidos.find(t => String(t.id) === formData.tejido_config_id)
                      const largoRollo = tejidoSel?.largo || 10.00
                      const rollosNecesarios = Math.ceil(180 / largoRollo)
                      return `Tejido (${rollosNecesarios} rollos de ${largoRollo}m):`
                    })()}
                  </span>
                  <span className="font-semibold">
                    ${(() => {
                      const tejidoSel = tejidos.find(t => String(t.id) === formData.tejido_config_id)
                      const precioTejido = parseSafe(tejidoSel?.precio_venta, 0)
                      const largoRollo = parseSafe(tejidoSel?.largo, 10.00)
                      const rollosNecesarios = largoRollo > 0 ? Math.ceil(180 / largoRollo) : 0
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
                          (parseSafe(formData.cantidad_postes_esquineros) * parseSafe(formData.precio_poste_esquinero)) +
                          (parseSafe(formData.cantidad_postes_refuerzos) * parseSafe(formData.precio_poste_refuerzo)) +
                          (parseSafe(formData.cantidad_postes_intermedios) * parseSafe(formData.precio_poste_intermedio)) +
                          (parseSafe(formData.cantidad_puntales) * parseSafe(formData.precio_puntal)),
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
                        ${formatearPrecio(parseSafe(formData.cantidad_postes_esquineros) * parseSafe(formData.precio_poste_esquinero), false)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        {formData.cantidad_postes_refuerzos} refuerzos × ${formatearPrecio(formData.precio_poste_refuerzo, false)}
                      </span>
                      <span className="font-medium">
                        ${formatearPrecio(parseSafe(formData.cantidad_postes_refuerzos) * parseSafe(formData.precio_poste_refuerzo), false)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        {formData.cantidad_postes_intermedios} intermedios × ${formatearPrecio(formData.precio_poste_intermedio, false)}
                      </span>
                      <span className="font-medium">
                        ${formatearPrecio(parseSafe(formData.cantidad_postes_intermedios) * parseSafe(formData.precio_poste_intermedio), false)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        {formData.cantidad_puntales} puntales × ${formatearPrecio(formData.precio_puntal, false)}
                      </span>
                      <span className="font-medium">
                        ${formatearPrecio(parseSafe(formData.cantidad_puntales) * parseSafe(formData.precio_puntal), false)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs pt-2 mt-2 border-t border-muted">
                      <span className="font-semibold">Subtotal Postes:</span>
                      <span className="font-bold">
                        ${formatearPrecio(
                          (parseSafe(formData.cantidad_postes_esquineros) * parseSafe(formData.precio_poste_esquinero)) +
                          (parseSafe(formData.cantidad_postes_refuerzos) * parseSafe(formData.precio_poste_refuerzo)) +
                          (parseSafe(formData.cantidad_postes_intermedios) * parseSafe(formData.precio_poste_intermedio)) +
                          (parseSafe(formData.cantidad_puntales) * parseSafe(formData.precio_puntal)),
                          false
                        )}
                      </span>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cordón:</span>
                  <span className="font-semibold">${formatearPrecio(parseSafe(formData.cordon_precio_total, 0), false)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Púa:</span>
                  <span className="font-semibold">
                    ${formatearPrecio(180 * parseSafe(formData.hilos_pua, 0) * parseSafe(formData.precio_pua_por_metro, 0), false)}
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
                          ${formatearPrecio(parseSafe(formData.cantidad_ganchos) * parseSafe(formData.precio_unitario_ganchos), false)}
                        </span>
                      </div>
                    )}
                    {parseSafe(formData.cantidad_planchuelas) > 0 && parseSafe(formData.precio_unitario_planchuelas) > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          {formData.cantidad_planchuelas} planchuelas × ${formatearPrecio(formData.precio_unitario_planchuelas, false)}
                        </span>
                        <span className="font-medium">
                          ${formatearPrecio(parseSafe(formData.cantidad_planchuelas) * parseSafe(formData.precio_unitario_planchuelas), false)}
                        </span>
                      </div>
                    )}
                    {parseSafe(formData.cantidad_torniquetes) > 0 && parseSafe(formData.precio_unitario_torniquetes) > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          {formData.cantidad_torniquetes} torniquetes × ${formatearPrecio(formData.precio_unitario_torniquetes, false)}
                        </span>
                        <span className="font-medium">
                          ${formatearPrecio(parseSafe(formData.cantidad_torniquetes) * parseSafe(formData.precio_unitario_torniquetes), false)}
                        </span>
                      </div>
                    )}
                    {parseSafe(formData.cantidad_esparragos) > 0 && parseSafe(formData.precio_unitario_esparragos) > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          {formData.cantidad_esparragos} esparragos × ${formatearPrecio(formData.precio_unitario_esparragos, false)}
                        </span>
                        <span className="font-medium">
                          ${formatearPrecio(parseSafe(formData.cantidad_esparragos) * parseSafe(formData.precio_unitario_esparragos), false)}
                        </span>
                      </div>
                    )}
                    {parseSafe(formData.metros_alambre_ar) > 0 && parseSafe(formData.precio_metro_alambre_ar) > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          {formData.metros_alambre_ar}m alambre A/R × ${formatearPrecio(formData.precio_metro_alambre_ar, false)}
                        </span>
                        <span className="font-medium">
                          ${formatearPrecio(parseSafe(formData.metros_alambre_ar) * parseSafe(formData.precio_metro_alambre_ar), false)}
                        </span>
                      </div>
                    )}
                    {parseSafe(formData.kg_clavos) > 0 && parseSafe(formData.precio_kg_clavos) > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          {formData.kg_clavos}kg clavos × ${formatearPrecio(formData.precio_kg_clavos, false)}
                        </span>
                        <span className="font-medium">
                          ${formatearPrecio(parseSafe(formData.kg_clavos) * parseSafe(formData.precio_kg_clavos), false)}
                        </span>
                      </div>
                    )}
                    {parseSafe(formData.kg_alambre_negro) > 0 && parseSafe(formData.precio_kg_alambre_negro) > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          {formData.kg_alambre_negro}kg alambre negro × ${formatearPrecio(formData.precio_kg_alambre_negro, false)}
                        </span>
                        <span className="font-medium">
                          ${formatearPrecio(parseSafe(formData.kg_alambre_negro) * parseSafe(formData.precio_kg_alambre_negro), false)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs pt-2 mt-2 border-t border-muted">
                      <span className="font-semibold">Total Accesorios:</span>
                      <span className="font-bold">
                        ${formatearPrecio(precioCalculado.accesorios, false)}
                      </span>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mano de Obra:</span>
                  <span className="font-semibold">
                    ${formatearPrecio(180 * parseSafe(formData.precio_mano_obra_por_metro, 0), false)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transporte:</span>
                  <span className="font-semibold">
                    ${formatearPrecio(180 * parseSafe(formData.precio_transporte_por_metro, 0), false)}
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
                    ${formatearPrecio(precioCalculado.precio_metro, false)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t">
                  <span className="text-xs text-muted-foreground">Precio/metro (&lt;50m):</span>
                  <span className="text-sm font-bold text-orange-600">
                    ${formatearPrecio(precioCalculado.precio_metro_menor_50, false)}
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
    </div>
  )
}

