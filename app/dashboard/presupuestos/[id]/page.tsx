'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { ArrowLeft, Download, Copy, Calendar, User, Phone, Mail, MapPin, FileText, Package, MessageSquareText, Trash, Trash2, ChevronDown, Edit, Save, X, Plus, Grid, Columns, Circle, Zap, CheckCircle2, Clock, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { generarPDFPresupuesto, generarPDFRemito } from '@/lib/pdf-generator'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Label } from '@/components/ui/label'
import { ProductoCombobox } from '@/components/ProductoCombobox'
import { Textarea } from '@/components/ui/textarea'

export default function VerPresupuestoPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [presupuesto, setPresupuesto] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [itemsEditables, setItemsEditables] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [vendedorNombre, setVendedorNombre] = useState<string>('')
  const [eliminando, setEliminando] = useState(false)
  const [confirmacionAbierta, setConfirmacionAbierta] = useState(false)
  const [textoConfirmacion, setTextoConfirmacion] = useState('')
  const [itemsAbiertos, setItemsAbiertos] = useState(true)
  const [modoEdicion, setModoEdicion] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [articulos, setArticulos] = useState<any[]>([])
  const [tejidos, setTejidos] = useState<any[]>([])
  const [configuracionCercado, setConfiguracionCercado] = useState<any>(null)
  const [descripcionesPostes, setDescripcionesPostes] = useState<Record<string, any>>({})
  
  // Estados para entregas
  const [estadoEntrega, setEstadoEntrega] = useState<any>(null)
  const [itemsEntregas, setItemsEntregas] = useState<any[]>([])
  const [entregas, setEntregas] = useState<any[]>([])
  const [dialogRegistrarEntrega, setDialogRegistrarEntrega] = useState(false)
  const [registrandoEntrega, setRegistrandoEntrega] = useState(false)
  const [itemsParaEntregar, setItemsParaEntregar] = useState<Record<string, number>>({})
  const [fechaEntrega, setFechaEntrega] = useState<string>(new Date().toISOString().split('T')[0])
  const [observacionesEntrega, setObservacionesEntrega] = useState<string>('')
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    cargarPresupuesto()
    cargarArticulos()
    cargarTejidos()
    cargarUsuario()
  }, [params.id])

  async function cargarUsuario() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserId(user.id)
    }
  }

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

      let clienteInfo: any = null
      if (presData?.cliente_id) {
        const { data: clienteData } = await supabase
          .from('clientes')
          .select('nombre_completo, telefono, email, direccion, tipo_documento, numero_documento')
          .eq('id', presData.cliente_id)
          .single()
        clienteInfo = clienteData
      }

      setPresupuesto({
        ...presData,
        cliente_nombre:
          presData?.cliente_nombre ||
          clienteInfo?.nombre_completo ||
          '',
        cliente_telefono:
          presData?.cliente_telefono ||
          clienteInfo?.telefono ||
          '',
        cliente_email:
          presData?.cliente_email ||
          clienteInfo?.email ||
          '',
        cliente_direccion:
          presData?.cliente_direccion ||
          clienteInfo?.direccion ||
          '',
        tipo_documento:
          presData?.tipo_documento ||
          clienteInfo?.tipo_documento ||
          '',
        numero_documento:
          presData?.numero_documento ||
          clienteInfo?.numero_documento ||
          '',
      })
      // Procesar items según tipo de presupuesto
      const itemsProcesados = (itemsData || []).map(item => {
        const itemBase = {
          ...item,
          cantidad: item.cantidad?.toString() || '1',
          precio_unitario: item.precio_unitario?.toString() || '0',
        }
        
        // Para presupuestos de artículos, agregar tipo
        if (presData?.tipo === 'articulos') {
          return {
            ...itemBase,
            tipo: item.tejido_config_id ? 'tejido' as const : 'articulo' as const,
          }
        }
        
        // Para presupuestos generales, calcular precio_base desde precio_unitario
        if (presData?.tipo === 'general') {
          const factor = presData.forma_pago === 'efectivo' ? 1.0 : 
                         presData.forma_pago === 'tarjeta' ? 1.3 :
                         presData.forma_pago === 'echeq90' ? 1.4 : 1.21
          const precioUnitario = parseFloat(item.precio_unitario) || 0
          const precioBase = precioUnitario / factor
          return {
            ...itemBase,
            precio_base: precioBase.toString(),
          }
        }
        
        // Para cercados, agregar tipo
        return {
          ...itemBase,
          tipo: 'articulo' as const,
        }
      })
      setItems(itemsProcesados)
      setItemsEditables(itemsProcesados)

      // Si es presupuesto de cercado, cargar configuración del cerco
      if (presData?.tipo === 'cercado' && presData?.cercado_config_id) {
        await cargarConfiguracionCercado(presData.cercado_config_id)
      }

      // Cargar estado de entregas si está aprobado
      if (presData?.estado === 'aprobado') {
        await cargarEstadoEntregas()
      }
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

  async function cargarConfiguracionCercado(configId: string) {
    try {
      // Cargar configuración desde la vista completa
      const { data: config, error } = await supabase
        .from('v_configuraciones_cercado_completas')
        .select('*')
        .eq('id', configId)
        .single()

      if (error) throw error

      setConfiguracionCercado(config)

      // Cargar descripciones de los postes
      const idsPostes = [
        config.poste_esquinero_id,
        config.poste_refuerzo_id,
        config.poste_intermedio_id,
        config.poste_puntal_id,
      ].filter(Boolean)

      if (idsPostes.length > 0) {
        const { data: articulosPostes } = await supabase
          .from('articulos')
          .select('id, nombre, descripcion')
          .in('id', idsPostes)

        if (articulosPostes) {
          const descripciones: Record<string, any> = {}
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
      }
    } catch (error: any) {
      console.error('Error al cargar configuración de cercado:', error)
    }
  }

  async function cargarArticulos() {
    const { data } = await supabase
      .from('articulos')
      .select('id, nombre, unidad, publicado')
      .order('nombre')
    setArticulos(data || [])
  }

  async function cargarTejidos() {
    const { data } = await supabase
      .from('v_tejidos_con_precios')
      .select('id, codigo, nombre, precio_venta, precio_lista, altura, tamano_rombo, calibre')
      .eq('activo', true)
      .order('codigo')
    setTejidos(data || [])
  }

  // Cargar estado de entregas
  async function cargarEstadoEntregas() {
    if (!presupuesto || presupuesto.estado !== 'aprobado') {
      setEstadoEntrega(null)
      setItemsEntregas([])
      setEntregas([])
      return
    }

    try {
      // Cargar estado general desde la vista
      const { data: estadoData, error: estadoError } = await supabase
        .from('v_presupuestos_estado_entrega')
        .select('*')
        .eq('id', params.id)
        .single()

      // Si la vista no devuelve datos, crear estado por defecto
      if (estadoError || !estadoData) {
        // Crear estado inicial "pendiente" si no hay datos
        const { data: itemsCount } = await supabase
          .from('presupuestos_items')
          .select('id', { count: 'exact', head: true })
          .eq('presupuesto_id', params.id)

        setEstadoEntrega({
          id: params.id,
          numero: presupuesto.numero,
          estado: 'aprobado',
          cliente_nombre: presupuesto.cliente_nombre,
          total: presupuesto.total,
          fecha_emision: presupuesto.fecha_emision,
          total_items: itemsCount?.length || 0,
          items_completos: 0,
          estado_entrega: 'pendiente',
          fecha_ultima_entrega: null,
          total_entregas: 0,
        })
      } else {
        setEstadoEntrega(estadoData)
      }

      // Cargar resumen de items con entregas
      const { data: itemsData, error: itemsError } = await supabase
        .from('v_presupuestos_entregas_resumen')
        .select('*')
        .eq('presupuesto_id', params.id)
        .order('orden')

      // Si no hay datos en la vista, cargar items desde presupuestos_items
      if (itemsError || !itemsData || itemsData.length === 0) {
        const { data: itemsPresupuesto, error: itemsPresError } = await supabase
          .from('presupuestos_items')
          .select('*')
          .eq('presupuesto_id', params.id)
          .order('orden')

        if (!itemsPresError && itemsPresupuesto) {
          // Mapear items a formato de entregas (todos pendientes)
          const itemsMapeados = itemsPresupuesto.map((item: any) => ({
            presupuesto_id: params.id,
            presupuesto_item_id: item.id,
            descripcion: item.descripcion,
            cantidad_total: parseFloat(item.cantidad) || 0,
            unidad: item.unidad,
            cantidad_entregada: 0,
            cantidad_pendiente: parseFloat(item.cantidad) || 0,
            orden: item.orden || 0,
            estado_item: 'pendiente',
          }))
          setItemsEntregas(itemsMapeados)
        }
      } else {
        setItemsEntregas(itemsData)
      }

      // Cargar historial de entregas
      const { data: entregasData, error: entregasError } = await supabase
        .from('entregas')
        .select(`
          *,
          entregas_items (
            cantidad_entregada,
            presupuesto_item_id,
            presupuestos_items (
              descripcion,
              unidad
            )
          )
        `)
        .eq('presupuesto_id', params.id)
        .order('fecha_entrega', { ascending: false })
        .order('creado_en', { ascending: false })

      if (!entregasError && entregasData) {
        setEntregas(entregasData)
      } else {
        setEntregas([])
      }
    } catch (error: any) {
      console.error('Error al cargar estado de entregas:', error)
      // En caso de error, establecer valores por defecto
      setEstadoEntrega({
        id: params.id,
        estado_entrega: 'pendiente',
        total_items: items.length,
        items_completos: 0,
        total_entregas: 0,
      })
      setItemsEntregas([])
      setEntregas([])
    }
  }

  // Abrir modal de registrar entrega
  function abrirRegistrarEntrega() {
    // Si no hay itemsEntregas cargados, usar items del presupuesto
    let itemsDisponibles = itemsEntregas
    
    if (!itemsDisponibles || itemsDisponibles.length === 0) {
      // Si no hay items de entregas, crear desde items del presupuesto
      itemsDisponibles = items.map((item: any) => ({
        presupuesto_item_id: item.id,
        descripcion: item.descripcion,
        cantidad_total: parseFloat(item.cantidad) || 0,
        unidad: item.unidad,
        cantidad_entregada: 0,
        cantidad_pendiente: parseFloat(item.cantidad) || 0,
        orden: item.orden || 0,
        estado_item: 'pendiente',
      }))
    }

    // Filtrar items con cantidad pendiente > 0
    const itemsConPendiente = itemsDisponibles.filter((item: any) => {
      const pendiente = item.cantidad_pendiente || (item.cantidad_total - (item.cantidad_entregada || 0))
      return pendiente > 0
    })

    if (itemsConPendiente.length === 0) {
      toast({
        title: "No hay items pendientes",
        description: "Todos los items ya fueron entregados completamente",
        variant: "destructive",
      })
      return
    }

    // Inicializar items con cantidades pendientes (autocompletar con lo pendiente)
    const itemsInicial: Record<string, number> = {}
    itemsConPendiente.forEach((item: any) => {
      const cantidadPendiente = parseFloat(item.cantidad_pendiente || item.cantidad_total) || 0
      itemsInicial[item.presupuesto_item_id] = cantidadPendiente
    })

    setItemsParaEntregar(itemsInicial)
    setFechaEntrega(new Date().toISOString().split('T')[0])
    setObservacionesEntrega('')
    setDialogRegistrarEntrega(true)
  }

  // Autocompletar todas las cantidades con lo pendiente
  function autocompletarCantidades() {
    // Si no hay itemsEntregas cargados, usar items del presupuesto
    let itemsDisponibles = itemsEntregas
    
    if (!itemsDisponibles || itemsDisponibles.length === 0) {
      itemsDisponibles = items.map((item: any) => ({
        presupuesto_item_id: item.id,
        cantidad_total: parseFloat(item.cantidad) || 0,
        cantidad_entregada: 0,
        cantidad_pendiente: parseFloat(item.cantidad) || 0,
      }))
    }

    const nuevosItems: Record<string, number> = {}
    itemsDisponibles.forEach((item: any) => {
      const cantidadPendiente = parseFloat(item.cantidad_pendiente || item.cantidad_total) || 0
      if (cantidadPendiente > 0) {
        nuevosItems[item.presupuesto_item_id] = cantidadPendiente
      }
    })

    setItemsParaEntregar(nuevosItems)
    
    toast({
      title: "Cantidades autocompletadas",
      description: "Se completaron todos los campos con las cantidades pendientes",
    })
  }

  // Limpiar todas las cantidades
  function limpiarCantidades() {
    const itemsVacios: Record<string, number> = {}
    const itemsDisponibles = itemsEntregas.length > 0 ? itemsEntregas : items.map((item: any) => ({
      presupuesto_item_id: item.id,
    }))
    
    itemsDisponibles.forEach((item: any) => {
      itemsVacios[item.presupuesto_item_id || item.id] = 0
    })

    setItemsParaEntregar(itemsVacios)
  }

  // Actualizar cantidad a entregar de un item
  function actualizarCantidadEntregar(itemId: string, cantidad: number) {
    // Buscar en itemsEntregas primero, si no existe buscar en items del presupuesto
    let item = itemsEntregas.find((i: any) => i.presupuesto_item_id === itemId)
    
    if (!item) {
      item = items.find((i: any) => i.id === itemId)
      if (!item) return
      
      // Si viene de items del presupuesto, calcular pendiente
      const cantidadTotal = parseFloat(item.cantidad) || 0
      const cantidadMax = cantidadTotal
      const cantidadValida = Math.max(0, Math.min(cantidad, cantidadMax))
      
      setItemsParaEntregar((prev) => ({
        ...prev,
        [itemId]: cantidadValida,
      }))
      return
    }

    const cantidadMax = parseFloat(item.cantidad_pendiente) || parseFloat(item.cantidad_total) || 0
    const cantidadValida = Math.max(0, Math.min(cantidad, cantidadMax))

    setItemsParaEntregar((prev) => ({
      ...prev,
      [itemId]: cantidadValida,
    }))
  }

  // Registrar entrega
  async function registrarEntrega() {
    if (!userId) {
      toast({
        title: "Error",
        description: "No se pudo identificar al usuario",
        variant: "destructive",
      })
      return
    }

    // Validar que hay al menos un item con cantidad > 0
    const itemsConCantidad = Object.entries(itemsParaEntregar).filter(
      ([_, cantidad]) => cantidad > 0
    )

    if (itemsConCantidad.length === 0) {
      toast({
        title: "Error",
        description: "Debe seleccionar al menos un item para entregar",
        variant: "destructive",
      })
      return
    }

    try {
      setRegistrandoEntrega(true)

      // 1. Crear entrega
      const { data: entregaData, error: entregaError } = await supabase
        .from('entregas')
        .insert({
          presupuesto_id: params.id,
          fecha_entrega: fechaEntrega,
          observaciones: observacionesEntrega || null,
          usuario_id: userId,
        })
        .select()
        .single()

      if (entregaError) throw entregaError

      // 2. Crear items de la entrega
      const itemsAInsertar = itemsConCantidad.map(([presupuestoItemId, cantidad]) => ({
        entrega_id: entregaData.id,
        presupuesto_item_id: presupuestoItemId,
        cantidad_entregada: cantidad,
      }))

      const { error: itemsError } = await supabase
        .from('entregas_items')
        .insert(itemsAInsertar)

      if (itemsError) throw itemsError

      toast({
        title: "¡Entrega registrada!",
        description: `Se registraron ${itemsConCantidad.length} item(s) entregados`,
      })

      // Recargar datos
      await Promise.all([
        cargarEstadoEntregas(),
        cargarPresupuesto() // Recargar también el presupuesto para actualizar datos generales
      ])
      setDialogRegistrarEntrega(false)
    } catch (error: any) {
      console.error('Error al registrar entrega:', error)
      toast({
        title: "Error al registrar entrega",
        description: error.message || "No se pudo registrar la entrega",
        variant: "destructive",
      })
    } finally {
      setRegistrandoEntrega(false)
    }
  }

  async function cambiarEstado(nuevoEstado: string) {
    // Validación: No permitir cambiar estado si está en "baja"
    if (presupuesto?.estado === 'baja') {
      toast({
        title: "No se puede cambiar el estado",
        description: "Los presupuestos dados de baja no pueden cambiar de estado.",
        variant: "destructive",
      })
      return
    }

    // Validación: Confirmar cambio desde "aprobado" a otro estado
    if (presupuesto?.estado === 'aprobado' && nuevoEstado !== 'aprobado') {
      const confirmar = window.confirm(
        `¿Está seguro que desea cambiar el estado de "Aprobado" a "${nuevoEstado}"?`
      )
      if (!confirmar) {
        return
      }
    }

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

      // Si el nuevo estado es "aprobado", cargar estado de entregas
      if (nuevoEstado === 'aprobado') {
        await cargarPresupuesto()
        await cargarEstadoEntregas()
      } else {
        await cargarPresupuesto()
      }
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
      const presupuestoPDF = { 
        ...presupuesto, 
        vendedor_nombre: vendedorNombre,
        ...(presupuesto.tipo === 'cercado' && configuracionCercado && {
          configuracion_cercado: {
            nombre: configuracionCercado.nombre,
            descripcion: configuracionCercado.descripcion,
            altura: configuracionCercado.altura,
            altura_final_cerco: configuracionCercado.altura_final_cerco,
            precio_por_metro_lineal: configuracionCercado.precio_por_metro_lineal,
            tejido_codigo: configuracionCercado.tejido_codigo,
            calibre: configuracionCercado.calibre,
            tamano_rombo: configuracionCercado.tamano_rombo,
            tipo_poste: configuracionCercado.tipo_poste,
            cordon_tipo: configuracionCercado.cordon_tipo,
            hilos_pua: configuracionCercado.hilos_pua,
            cantidad_ganchos: configuracionCercado.cantidad_ganchos,
            cantidad_planchuelas: configuracionCercado.cantidad_planchuelas,
            cantidad_torniquetes: configuracionCercado.cantidad_torniquetes,
            cantidad_esparragos: configuracionCercado.cantidad_esparragos,
            metros_alambre_ar: configuracionCercado.metros_alambre_ar,
            kg_clavos: configuracionCercado.kg_clavos,
            kg_alambre_negro: configuracionCercado.kg_alambre_negro,
            descripciones_postes: descripcionesPostes,
          }
        })
      }
      
      generarPDFPresupuesto(presupuestoPDF, items)
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

  function descargarRemito() {
    try {
      generarPDFRemito({ ...presupuesto, vendedor_nombre: vendedorNombre }, items)
      toast({
        title: "¡Remito Generado!",
        description: "El remito se ha descargado correctamente",
      })
    } catch (error: any) {
      console.error('Error:', error)
      toast({
        title: "Error al generar remito",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  function abrirDialogoBaja() {
    if (!presupuesto || presupuesto.estado === 'baja') {
      if (presupuesto?.estado === 'baja') {
        toast({
          title: 'El presupuesto ya está dado de baja',
          description: 'No es necesario realizar ninguna acción adicional.',
        })
      }
      return
    }
    setTextoConfirmacion('')
    setConfirmacionAbierta(true)
  }

  async function confirmarBaja() {
    if (!presupuesto || presupuesto.estado === 'baja') {
      if (presupuesto?.estado === 'baja') {
        toast({
          title: 'El presupuesto ya está dado de baja',
          description: 'No es necesario realizar ninguna acción adicional.',
        })
      }
      return
    }
    if (textoConfirmacion.trim().toUpperCase() !== 'BAJA') {
      toast({
        title: 'Acción cancelada',
        description: 'Debes escribir la palabra BAJA para confirmar la operación.',
      })
      return
    }
    await darDeBajaPresupuesto()
  }

  async function darDeBajaPresupuesto() {
    if (!presupuesto || presupuesto.estado === 'baja') {
      return
    }
    try {
      setEliminando(true)
      const { error } = await supabase
        .from('presupuestos')
        .update({ estado: 'baja' })
        .eq('id', presupuesto.id)

      if (error) throw error

      toast({
        title: 'Presupuesto dado de baja',
        description: `El presupuesto ${presupuesto.numero} fue marcado como baja.`,
      })

      setConfirmacionAbierta(false)
      setTextoConfirmacion('')
      router.push('/dashboard/presupuestos')
    } catch (error: any) {
      console.error('Error al dar de baja:', error)
      toast({
        title: 'Error al dar de baja',
        description: error.message,
        variant: 'destructive',
      })
      setEliminando(false)
    }
  }

  function iniciarEdicion() {
    setItemsEditables([...items])
    setModoEdicion(true)
  }

  function cancelarEdicion() {
    setItemsEditables([...items])
    setModoEdicion(false)
  }

  async function actualizarItemEditable(id: string, campo: string, valor: any) {
    setItemsEditables((prevItems) => {
      return prevItems.map((item) => {
        if (item.id !== id) return item
        const itemActualizado: any = { ...item, [campo]: valor }
        
        // Si es presupuesto general, manejar precio_base
        if (presupuesto.tipo === 'general') {
          // Si cambia precio_base, recalcular precio_unitario según forma de pago
          if (campo === 'precio_base') {
            const precioBase = parseFloat(valor) || 0
            const factor = factorFormaPago(presupuesto.forma_pago || 'lista')
            itemActualizado.precio_unitario = (precioBase * factor).toString()
          }
          
          // Recalcular precio_total
          if (campo === 'cantidad' || campo === 'precio_base') {
            const cantidad = parseFloat(campo === 'cantidad' ? valor : item.cantidad) || 0
            const precioBase = parseFloat(campo === 'precio_base' ? valor : (item.precio_base || item.precio_unitario ? (parseFloat(item.precio_unitario) / factorFormaPago(presupuesto.forma_pago || 'lista')).toString() : '0')) || 0
            const factor = factorFormaPago(presupuesto.forma_pago || 'lista')
            const precioUnitario = precioBase * factor
            itemActualizado.precio_total = cantidad * precioUnitario
            itemActualizado.precio_unitario = precioUnitario.toString()
          }
        } else {
          // Para presupuestos de artículos
          // Si cambia el tipo, limpiar referencias al otro tipo
          if (campo === 'tipo') {
            if (valor === 'articulo') {
              itemActualizado.tejido_config_id = null
              itemActualizado.articulo_id = null
            } else {
              itemActualizado.articulo_id = null
              itemActualizado.tejido_config_id = null
            }
          }
          
          // Recalcular precio_total si cambia cantidad o precio_unitario
          if (campo === 'cantidad' || campo === 'precio_unitario') {
            const cantidad = parseFloat(campo === 'cantidad' ? valor : item.cantidad) || 0
            const precio = parseFloat(campo === 'precio_unitario' ? valor : item.precio_unitario) || 0
            itemActualizado.precio_total = cantidad * precio
          }
        }
        
        return itemActualizado
      })
    })

    // Si se selecciona un artículo o tejido, obtener precio automáticamente (solo para artículos)
    if (presupuesto.tipo === 'articulos') {
      if (campo === 'articulo_id' && valor) {
        await seleccionarArticulo(id, valor)
      } else if (campo === 'tejido_config_id' && valor) {
        await seleccionarTejido(id, valor)
      }
    }
  }

  function eliminarItemEditable(id: string) {
    setItemsEditables(itemsEditables.filter(item => item.id !== id))
  }

  const unidadesComunes = ['unidad', 'metro', 'kg', 'rollo', 'hora', 'día', 'm2', 'm3', 'servicio']

  function factorFormaPago(fp: string): number {
    switch (fp) {
      case 'efectivo': return 1.0
      case 'lista': return 1.21
      case 'tarjeta': return 1.3
      case 'echeq45': return 1.21
      case 'echeq60': return 1.3
      case 'echeq90': return 1.4
      default: return 1.21
    }
  }

  function agregarItemEditable() {
    if (presupuesto.tipo === 'general') {
      // Item para presupuesto general
      const nuevoItem = {
        id: `temp-${Date.now()}`,
        presupuesto_id: presupuesto.id,
        descripcion: '',
        cantidad: '1',
        unidad: 'unidad',
        precio_base: '0',
        precio_unitario: '0',
        precio_total: 0,
        orden: itemsEditables.length + 1,
        articulo_id: null,
        tejido_config_id: null,
      }
      setItemsEditables([...itemsEditables, nuevoItem])
    } else {
      // Item para presupuesto de artículos
      const nuevoItem = {
        id: `temp-${Date.now()}`,
        presupuesto_id: presupuesto.id,
        tipo: 'articulo' as 'articulo' | 'tejido',
        descripcion: '',
        cantidad: '1',
        unidad: 'unidad',
        precio_unitario: '0',
        precio_total: 0,
        orden: itemsEditables.length + 1,
        articulo_id: null,
        tejido_config_id: null,
      }
      setItemsEditables([...itemsEditables, nuevoItem])
    }
  }

  const unidadesDisponibles = useMemo(() => {
    const unidades = new Set<string>()
    articulos.forEach((articulo) => {
      if (articulo?.unidad) unidades.add(articulo.unidad)
    })
    itemsEditables.forEach((item) => {
      if (item.unidad) unidades.add(item.unidad)
    })
    return Array.from(unidades).sort((a, b) => a.localeCompare(b))
  }, [articulos, itemsEditables])

  const filtrosTejidos = useMemo(() => {
    const alturas = new Set<string>()
    const rombos = new Set<string>()
    const calibres = new Set<string>()

    tejidos.forEach((tejido) => {
      if (tejido?.altura !== undefined && tejido?.altura !== null) {
        alturas.add(tejido.altura.toString())
      }
      if (tejido?.tamano_rombo !== undefined && tejido?.tamano_rombo !== null) {
        rombos.add(tejido.tamano_rombo.toString())
      }
      if (tejido?.calibre !== undefined && tejido?.calibre !== null) {
        calibres.add(tejido.calibre.toString())
      }
    })

    const formatOptions = (values: Set<string>, suffix?: string) => {
      const arr = Array.from(values).filter(Boolean).sort((a, b) => a.localeCompare(b, 'es', { numeric: true }))
      return [
        { value: 'todos', label: 'Todos' },
        ...arr.map((value) => ({
          value,
          label: suffix ? `${value}${suffix}` : value,
        })),
      ]
    }

    return [
      {
        key: 'altura',
        label: 'Altura',
        options: formatOptions(alturas, 'm'),
      },
      {
        key: 'tamano_rombo',
        label: 'Rombo',
        options: formatOptions(rombos),
      },
      {
        key: 'calibre',
        label: 'Calibre',
        options: formatOptions(calibres),
      },
    ]
  }, [tejidos])

  async function guardarCambios() {
    if (!presupuesto) return

    if (itemsEditables.length === 0) {
      toast({
        title: "Error",
        description: "Debes tener al menos un item en el presupuesto",
        variant: "destructive",
      })
      return
    }

    setGuardando(true)
    try {
      // Identificar items a eliminar (existen en BD pero no en editables)
      const itemsExistentesIds = items.map(item => item.id)
      const itemsEditablesIds = itemsEditables.map(item => item.id).filter(id => !id.toString().startsWith('temp-'))
      const itemsAEliminar = itemsExistentesIds.filter(id => !itemsEditablesIds.includes(id))

      // Eliminar items
      if (itemsAEliminar.length > 0) {
        const { error: deleteError } = await supabase
          .from('presupuestos_items')
          .delete()
          .in('id', itemsAEliminar)

        if (deleteError) throw deleteError
      }

      // Actualizar o insertar items
      for (let i = 0; i < itemsEditables.length; i++) {
        const item = itemsEditables[i]
        if (item.id.toString().startsWith('temp-')) {
          // Nuevo item - insertar
          const { error: insertError } = await supabase
            .from('presupuestos_items')
            .insert({
              presupuesto_id: presupuesto.id,
              descripcion: item.descripcion,
              cantidad: parseFloat(item.cantidad) || 0,
              unidad: item.unidad,
              precio_unitario: parseFloat(item.precio_unitario) || 0,
              precio_total: parseFloat(item.precio_total) || 0,
              orden: i + 1,
              articulo_id: item.articulo_id || null,
              tejido_config_id: item.tejido_config_id || null,
            })

          if (insertError) throw insertError
        } else {
          // Item existente - actualizar
          const { error: updateError } = await supabase
            .from('presupuestos_items')
            .update({
              descripcion: item.descripcion,
              cantidad: parseFloat(item.cantidad) || 0,
              unidad: item.unidad,
              precio_unitario: parseFloat(item.precio_unitario) || 0,
              precio_total: parseFloat(item.precio_total) || 0,
              orden: i + 1,
            })
            .eq('id', item.id)

          if (updateError) throw updateError
        }
      }

      // El trigger de la BD recalcula los totales automáticamente
      // Recargar presupuesto para obtener los nuevos totales
      await cargarPresupuesto()

      toast({
        title: "¡Cambios guardados!",
        description: "El presupuesto se ha actualizado correctamente",
      })

      setModoEdicion(false)
    } catch (error: any) {
      console.error('Error al guardar:', error)
      toast({
        title: "Error al guardar cambios",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setGuardando(false)
    }
  }

  async function seleccionarArticulo(itemId: string, articuloId: string) {
    const articulo = articulos.find(a => a.id === parseInt(articuloId))
    if (!articulo) return

    // Obtener precio vigente
    const { data: precioData } = await supabase
      .from('precios_venta')
      .select('precio_venta')
      .eq('articulo_id', articuloId)
      .eq('vigente', true)
      .single()

    const precioBase = precioData?.precio_venta || 0
    const factor = presupuesto.forma_pago === 'efectivo' ? 1.0 : 
                   presupuesto.forma_pago === 'tarjeta' ? 1.3 :
                   presupuesto.forma_pago === 'echeq90' ? 1.4 : 1.21
    const precioUnitario = precioBase * factor

    setItemsEditables((prevItems) => {
      return prevItems.map((item) => {
        if (item.id !== itemId) return item
        const cantidad = parseFloat(item.cantidad) || 0
        return {
          ...item,
          descripcion: articulo.nombre,
          unidad: articulo.unidad,
          precio_unitario: precioUnitario.toString(),
          precio_total: cantidad * precioUnitario,
          articulo_id: parseInt(articuloId),
          tipo: 'articulo' as const,
        }
      })
    })
  }

  async function seleccionarTejido(itemId: string, tejidoId: string) {
    const tejido = tejidos.find(t => t.id === tejidoId)
    if (!tejido) return

    const precioBase = tejido.precio_venta || 0
    const factor = presupuesto.forma_pago === 'efectivo' ? 1.0 : 
                   presupuesto.forma_pago === 'tarjeta' ? 1.3 :
                   presupuesto.forma_pago === 'echeq90' ? 1.4 : 1.21
    const precioUnitario = precioBase * factor

    setItemsEditables((prevItems) => {
      return prevItems.map((item) => {
        if (item.id !== itemId) return item
        const cantidad = parseFloat(item.cantidad) || 0
        return {
          ...item,
          descripcion: `${tejido.codigo} - ${tejido.nombre}`,
          unidad: 'rollo',
          precio_unitario: precioUnitario.toString(),
          precio_total: cantidad * precioUnitario,
          tejido_config_id: tejidoId,
          tipo: 'tejido' as const,
        }
      })
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!presupuesto) return null

  const formatearMoneda = (valor?: number | null) =>
    (valor ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const generarResumenWhatsapp = () => {
    const lineas: string[] = []
    lineas.push(`💼 *Presupuesto ${presupuesto.numero}*`)
    lineas.push(`📅 ${new Date(presupuesto.fecha_emision).toLocaleDateString('es-AR')} | Validez: ${presupuesto.validez_dias} días`)
    lineas.push(`👤 Cliente: ${presupuesto.cliente_nombre}`)
    if (presupuesto.cliente_telefono) {
      lineas.push(`📞 Tel: ${presupuesto.cliente_telefono}`)
    }
    if (vendedorNombre) {
      lineas.push(`🧑‍💼 Vendedor: ${vendedorNombre}`)
    }
    if (presupuesto.forma_pago) {
      const etiquetasFormaPago: Record<string, string> = {
        efectivo: 'Efectivo',
        lista: 'Factura / Lista',
        tarjeta: 'Tarjeta',
        echeq45: 'E-cheq 45 días',
        echeq60: 'E-cheq 60 días',
        echeq90: 'E-cheq 90 días',
      }
      lineas.push(`💳 Forma de pago: ${etiquetasFormaPago[presupuesto.forma_pago] || presupuesto.forma_pago}`)
    }
    lineas.push('')
    lineas.push('📝 *Detalle:*')
    if (items.length === 0) {
      lineas.push('• (sin ítems cargados)')
    } else {
      items.forEach((item, index) => {
        const descripcion = item.descripcion || `Item ${index + 1}`
        const cantidad = item.cantidad ? `${item.cantidad} ${item.unidad || ''}`.trim() : ''
        const precioUnitario = item.precio_unitario ? `u$ ${formatearMoneda(item.precio_unitario)}` : ''
        const total = item.precio_total ? `Total $${formatearMoneda(item.precio_total)}` : ''
        const partes = [descripcion]
        if (cantidad) partes.push(cantidad)
        if (precioUnitario) partes.push(precioUnitario)
        if (total) partes.push(total)
        lineas.push(`• ${partes.join(' | ')}`)
      })
    }
    lineas.push('')
    lineas.push(`💵 Subtotal: $${formatearMoneda(presupuesto.subtotal)}`)
    if (presupuesto.descuento > 0) {
      lineas.push(`🎯 Descuento: -$${formatearMoneda(presupuesto.descuento)}`)
    }
    if (presupuesto.forma_pago !== 'efectivo' && presupuesto.total > 0) {
      const baseSinIva = presupuesto.total / 1.21
      const iva = baseSinIva * 0.21
      lineas.push(`🧾 Base imponible: $${formatearMoneda(baseSinIva)}`)
      lineas.push(`📈 IVA 21%: $${formatearMoneda(iva)}`)
    }
    lineas.push(`✅ *TOTAL: $${formatearMoneda(presupuesto.total)}*`)

    if (presupuesto.condiciones_comerciales) {
      lineas.push('')
      lineas.push('📌 Condiciones:')
      lineas.push(presupuesto.condiciones_comerciales)
    }

    return lineas.join('\n')
  }

  const copiarResumen = async () => {
    try {
      const texto = generarResumenWhatsapp()
      await navigator.clipboard.writeText(texto)
      toast({
        title: 'Copiado al portapapeles',
        description: 'Resumen listo para compartir por WhatsApp.',
      })
    } catch (error: any) {
      console.error('Error al copiar:', error)
      toast({
        title: 'Error al copiar',
        description: 'No se pudo copiar el resumen. Intenta nuevamente.',
        variant: 'destructive',
      })
    }
  }

  const estadoBadgeVariant = (estado: string) => {
    switch (estado) {
      case 'aprobado':
        return 'default'
      case 'enviado':
        return 'secondary'
      case 'borrador':
        return 'outline'
      case 'rechazado':
      case 'vencido':
      case 'baja':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const tipoBadge = presupuesto.tipo === 'cercado' 
    ? 'default' 
    : presupuesto.tipo === 'general'
    ? 'outline'
    : 'secondary'
  const fechaEmision = new Date(presupuesto.fecha_emision).toLocaleDateString('es-AR')
  const fechaVencimiento = presupuesto.fecha_vencimiento
    ? new Date(presupuesto.fecha_vencimiento).toLocaleDateString('es-AR')
    : null
  const etiquetasFormaPago: Record<string, string> = {
    efectivo: 'Efectivo',
    lista: 'Factura / Lista',
    tarjeta: 'Tarjeta',
    echeq45: 'E-cheq 45 días',
    echeq60: 'E-cheq 60 días',
    echeq90: 'E-cheq 90 días',
  }
  const formaPagoLabel = presupuesto.forma_pago
    ? etiquetasFormaPago[presupuesto.forma_pago] || presupuesto.forma_pago
    : '—'
  const resumenRapidoMobile = [
    {
      label: 'Total',
      value: `$${formatearMoneda(presupuesto.total)}`,
      tone: 'text-green-600',
      helper: presupuesto.forma_pago === 'efectivo' ? 'Sin IVA' : 'IVA incluido',
    },
    {
      label: 'Validez',
      value: `${presupuesto.validez_dias} día${presupuesto.validez_dias === 1 ? '' : 's'}`,
      helper: fechaVencimiento ? `Vence ${fechaVencimiento}` : undefined,
    },
    {
      label: 'Forma de pago',
      value: formaPagoLabel,
      helper: presupuesto.estado ? `Estado: ${presupuesto.estado}` : undefined,
    },
    {
      label: 'Emitido',
      value: fechaEmision,
      helper: vendedorNombre ? `Vendedor: ${vendedorNombre}` : undefined,
    },
  ]

  const detallesCliente = [
    presupuesto.tipo_documento && presupuesto.numero_documento
      ? {
          icon: FileText,
          label: presupuesto.tipo_documento,
          value: presupuesto.numero_documento,
        }
      : null,
    presupuesto.cliente_telefono
      ? {
          icon: Phone,
          label: 'Teléfono',
          value: presupuesto.cliente_telefono,
        }
      : null,
    presupuesto.cliente_email
      ? {
          icon: Mail,
          label: 'Email',
          value: presupuesto.cliente_email,
        }
      : null,
    presupuesto.cliente_direccion
      ? {
          icon: MapPin,
          label: 'Dirección',
          value: presupuesto.cliente_direccion,
        }
      : null,
  ].filter(Boolean) as Array<{ icon: typeof Phone; label: string; value: string }>

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="w-full space-y-3">
            <Button
              variant="outline"
              asChild
              className="w-full justify-center gap-2 sm:w-auto sm:justify-start"
            >
            <Link href="/dashboard/presupuestos">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Volver</span>
                <span className="sm:hidden">Atrás</span>
            </Link>
          </Button>
            <div className="space-y-2 rounded-lg border border-border/60 bg-card px-4 py-4 sm:border-none sm:bg-transparent sm:px-0 sm:py-0">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="text-2xl font-bold sm:text-3xl">{presupuesto.numero}</h1>
              <Badge variant={tipoBadge}>
                  {presupuesto.tipo === 'articulos' 
                    ? 'Artículos' 
                    : presupuesto.tipo === 'cercado'
                    ? 'Cercado'
                    : 'General'}
              </Badge>
              <Badge variant={estadoBadgeVariant(presupuesto.estado)}>
                {presupuesto.estado?.charAt(0).toUpperCase() + presupuesto.estado?.slice(1)}
              </Badge>
            </div>
              <p className="text-sm text-muted-foreground sm:text-base">
              Presupuesto para {presupuesto.cliente_nombre}
            </p>
          </div>
        </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:hidden">
          {resumenRapidoMobile.map((chip) => (
            <div
              key={chip.label}
              className="rounded-lg border border-border/60 bg-card p-3 text-xs"
            >
              <p className="font-semibold uppercase tracking-wide text-muted-foreground">
                {chip.label}
              </p>
              <p className={`text-base font-bold ${chip.tone ?? ''}`}>{chip.value}</p>
              {chip.helper && (
                <p className="mt-1 text-[11px] text-muted-foreground/80">{chip.helper}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Sección Superior Compacta */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Datos del Cliente - Compacto */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <User className="h-4 w-4" />
              Cliente
              </CardTitle>
            </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Nombre</p>
              <p className="text-sm font-semibold">{presupuesto.cliente_nombre}</p>
              </div>
            {detallesCliente.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                {detallesCliente.slice(0, 2).map((detalle) => (
                  <div key={detalle.label} className="text-xs">
                    <p className="text-muted-foreground uppercase tracking-wide">{detalle.label}</p>
                    <p className="font-medium break-words">{detalle.value}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Información del Presupuesto - Compacto */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Calendar className="h-4 w-4" />
              Información
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Fecha Emisión</p>
              <p className="text-sm font-medium">
                {new Date(presupuesto.fecha_emision).toLocaleDateString('es-AR')}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Vencimiento</p>
              <p className="text-sm font-medium">
                {new Date(presupuesto.fecha_vencimiento).toLocaleDateString('es-AR')}
                          </p>
                  </div>
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Estado</p>
              {presupuesto.estado === 'baja' ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="h-8 text-sm">
                      Baja
                    </Badge>
                </div>
                  <p className="text-xs text-muted-foreground italic">
                    Los presupuestos dados de baja no pueden cambiar de estado
                  </p>
                </div>
              ) : (
                <Select value={presupuesto.estado} onValueChange={cambiarEstado}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="borrador">Borrador</SelectItem>
                    <SelectItem value="enviado">Enviado</SelectItem>
                    <SelectItem value="aprobado">Aprobado</SelectItem>
                    <SelectItem value="rechazado">Rechazado</SelectItem>
                    {presupuesto.estado === 'vencido' && (
                      <SelectItem value="vencido">Vencido</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
                </div>
            </CardContent>
          </Card>

        {/* Resumen Financiero - Compacto */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <FileText className="h-4 w-4" />
              Resumen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Items:</span>
              <span className="font-semibold">{items.length}</span>
                </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-semibold">${presupuesto.subtotal?.toLocaleString()}</span>
            </div>
            {presupuesto.descuento > 0 && (
              <div className="flex justify-between text-xs text-red-600">
                <span>Descuento:</span>
                <span className="font-semibold">-${presupuesto.descuento?.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t">
              <span className="text-sm font-bold">TOTAL:</span>
              <span className="text-lg font-bold text-green-600">
                ${presupuesto.total?.toLocaleString()}
              </span>
            </div>
            </CardContent>
          </Card>
      </div>

      {/* Sección de Estado de Entregas - Solo para presupuestos aprobados */}
      {presupuesto?.estado === 'aprobado' && (
        <Card className="border-2 border-amber-200 bg-amber-50/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-amber-600" />
                  Estado de Entrega
                </CardTitle>
                <CardDescription>
                  Seguimiento de entregas del presupuesto aprobado
                </CardDescription>
              </div>
              {estadoEntrega && (
                <Badge 
                  variant={estadoEntrega.estado_entrega === 'completo' ? 'default' : 'secondary'}
                  className={
                    estadoEntrega.estado_entrega === 'pendiente' 
                      ? 'bg-amber-100 text-amber-800'
                      : estadoEntrega.estado_entrega === 'parcial'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-green-100 text-green-800'
                  }
                >
                  {estadoEntrega.estado_entrega === 'pendiente' && (
                    <>
                      <Clock className="h-3 w-3 mr-1" />
                      Pendiente
                    </>
                  )}
                  {estadoEntrega.estado_entrega === 'parcial' && (
                    <>
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Parcial
                    </>
                  )}
                  {estadoEntrega.estado_entrega === 'completo' && (
                    <>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Completo
                    </>
                  )}
                </Badge>
              )}
              {!estadoEntrega && (
                <Badge variant="outline" className="bg-amber-50">
                  <Clock className="h-3 w-3 mr-1" />
                  Pendiente
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Resumen */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-white rounded-lg border">
                <p className="text-xs text-muted-foreground mb-1">Items Total</p>
                <p className="text-2xl font-bold">{estadoEntrega?.total_items ?? items.length}</p>
              </div>
              <div className="p-3 bg-white rounded-lg border">
                <p className="text-xs text-muted-foreground mb-1">Items Completos</p>
                <p className="text-2xl font-bold text-green-600">{estadoEntrega?.items_completos ?? 0}</p>
              </div>
              <div className="p-3 bg-white rounded-lg border">
                <p className="text-xs text-muted-foreground mb-1">Total Entregas</p>
                <p className="text-2xl font-bold">{estadoEntrega?.total_entregas ?? entregas.length}</p>
              </div>
              <div className="p-3 bg-white rounded-lg border">
                <p className="text-xs text-muted-foreground mb-1">Última Entrega</p>
                <p className="text-sm font-semibold">
                  {estadoEntrega?.fecha_ultima_entrega 
                    ? new Date(estadoEntrega.fecha_ultima_entrega).toLocaleDateString('es-AR')
                    : entregas.length > 0 && entregas[0]?.fecha_entrega
                    ? new Date(entregas[0].fecha_entrega).toLocaleDateString('es-AR')
                    : 'Sin entregas'}
                </p>
              </div>
            </div>

            {/* Tabla de Items con Estado */}
            {itemsEntregas && itemsEntregas.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Estado por Item:</h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-2">Item</th>
                        <th className="text-right p-2">Total</th>
                        <th className="text-right p-2">Entregado</th>
                        <th className="text-right p-2">Pendiente</th>
                        <th className="text-center p-2">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemsEntregas.map((item: any) => (
                        <tr key={item.presupuesto_item_id} className="border-t">
                          <td className="p-2">{item.descripcion}</td>
                          <td className="p-2 text-right">{item.cantidad_total} {item.unidad}</td>
                          <td className="p-2 text-right text-green-600 font-semibold">
                            {parseFloat(item.cantidad_entregada).toFixed(2)} {item.unidad}
                          </td>
                          <td className="p-2 text-right text-amber-600 font-semibold">
                            {parseFloat(item.cantidad_pendiente).toFixed(2)} {item.unidad}
                          </td>
                          <td className="p-2 text-center">
                            {item.estado_item === 'completo' && (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Completo
                              </Badge>
                            )}
                            {item.estado_item === 'parcial' && (
                              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Parcial
                              </Badge>
                            )}
                            {item.estado_item === 'pendiente' && (
                              <Badge variant="outline" className="bg-amber-50">
                                <Clock className="h-3 w-3 mr-1" />
                                Pendiente
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Botón para Registrar Entrega */}
            {(!estadoEntrega || estadoEntrega.estado_entrega !== 'completo') && (
              <div className="flex justify-end pt-2 border-t">
                <Button onClick={abrirRegistrarEntrega} className="bg-amber-600 hover:bg-amber-700">
                  <Package className="h-4 w-4 mr-2" />
                  Registrar Entrega
                </Button>
              </div>
            )}

            {/* Historial de Entregas */}
            {entregas && entregas.length > 0 && (
              <div className="space-y-2 pt-4 border-t">
                <h4 className="font-semibold text-sm">Historial de Entregas:</h4>
                <div className="space-y-2">
                  {entregas.map((entrega: any, index: number) => (
                    <div key={entrega.id} className="p-3 bg-white rounded-lg border">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold">
                            Entrega #{entregas.length - index} - {new Date(entrega.fecha_entrega).toLocaleDateString('es-AR')}
                          </p>
                          {entrega.observaciones && (
                            <p className="text-xs text-muted-foreground mt-1">{entrega.observaciones}</p>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        {entrega.entregas_items && entrega.entregas_items.map((ei: any) => (
                          <div key={ei.id} className="text-xs flex items-center gap-2">
                            <span className="text-muted-foreground">•</span>
                            <span>
                              {ei.cantidad_entregada} {ei.presupuestos_items?.unidad || ''} de {ei.presupuestos_items?.descripcion || 'Item'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Items del Presupuesto - Ocupa todo el ancho */}
          <Collapsible open={itemsAbiertos} onOpenChange={setItemsAbiertos}>
          <Card>
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Package className="h-5 w-5" />
                Items del Presupuesto
              </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {modoEdicion ? itemsEditables.length : items.length} ítem{(modoEdicion ? itemsEditables.length : items.length) === 1 ? '' : 's'} en total
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {!modoEdicion ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={iniciarEdicion}
                      disabled={presupuesto.estado === 'baja'}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={cancelarEdicion}
                        disabled={guardando}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={guardarCambios}
                        disabled={guardando}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {guardando ? 'Guardando...' : 'Guardar'}
                      </Button>
                    </>
                  )}
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                      className="inline-flex data-[state=open]:rotate-180"
                  >
                    <ChevronDown className="h-5 w-5" />
                  </Button>
                </CollapsibleTrigger>
                </div>
            </CardHeader>
              <CollapsibleContent>
            <CardContent>
                  {!modoEdicion ? (
                    <>
                  <div className="rounded-lg border">
                    <div className="hidden overflow-x-auto sm:block">
                      <table className="w-full text-sm">
                  <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="p-3 text-left font-semibold">#</th>
                            <th className="p-3 text-left font-semibold">Descripción</th>
                            <th className="p-3 text-right font-semibold">Cant.</th>
                            <th className="p-3 text-left font-semibold">Unidad</th>
                            <th className="p-3 text-right font-semibold">P. Unit.</th>
                            <th className="p-3 text-right font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={item.id} className="border-b">
                        <td className="p-3 text-muted-foreground">{index + 1}</td>
                                  <td className="p-3">{item.descripcion || 'Sin descripción'}</td>
                        <td className="p-3 text-right font-medium">{item.cantidad}</td>
                        <td className="p-3">{item.unidad}</td>
                                  <td className="p-3 text-right">${formatearMoneda(item.precio_unitario)}</td>
                        <td className="p-3 text-right font-bold text-green-600">
                                ${formatearMoneda(item.precio_total)}
                        </td>
                      </tr>
                    ))}
                        </tbody>
                      </table>
                    </div>
                      </div>
                    </>
                  ) : itemsEditables.length === 0 ? (
                    <div className="rounded-lg border-2 border-dashed py-10 text-center">
                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="mb-4 text-sm text-muted-foreground">
                        No hay items en el presupuesto
                      </p>
                      <Button type="button" onClick={agregarItemEditable} variant="outline" className="w-full sm:w-auto">
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Primer Item
                      </Button>
                    </div>
                  ) : presupuesto.tipo === 'general' ? (
                    <>
                      <div className="hidden overflow-x-auto sm:block">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b-2">
                              <th className="p-2 text-left text-xs font-semibold sm:text-sm w-10 sm:w-12">#</th>
                              <th className="p-2 text-left text-xs font-semibold sm:text-sm min-w-[250px] sm:min-w-[300px]">Descripción</th>
                              <th className="p-2 text-left text-xs font-semibold sm:text-sm min-w-[90px] sm:min-w-[100px]">Cant.</th>
                              <th className="p-2 text-left text-xs font-semibold sm:text-sm w-24 sm:w-28">Unidad</th>
                              <th className="p-2 text-left text-xs font-semibold sm:text-sm w-28 sm:w-32">P. Base</th>
                              <th className="p-2 text-left text-xs font-semibold sm:text-sm w-28 sm:w-32">P. Unit.</th>
                              <th className="p-2 text-left text-xs font-semibold sm:text-sm w-28 sm:w-32">Total</th>
                              <th className="p-2 text-center text-xs font-semibold sm:text-sm w-10 sm:w-12"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {itemsEditables.map((item, index) => (
                              <tr 
                                key={item.id} 
                                className="border-b"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && e.ctrlKey) {
                                    e.preventDefault()
                                    agregarItemEditable()
                                  }
                                }}
                              >
                                <td className="p-2 text-center text-muted-foreground font-medium">
                                  {index + 1}
                                </td>
                                <td className="p-2">
                                  <Textarea
                                    value={item.descripcion || ''}
                                    onChange={(e) => actualizarItemEditable(item.id, 'descripcion', e.target.value)}
                                    placeholder="Descripción del producto/servicio..."
                                    className="min-h-[80px] w-full resize-y text-sm"
                                    rows={3}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && e.ctrlKey) {
                                        e.preventDefault()
                                        agregarItemEditable()
                                      }
                                    }}
                                  />
                                </td>
                                <td className="p-2 min-w-[90px] sm:min-w-[100px]">
                                  <Input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={item.cantidad || ''}
                                    onChange={(e) => actualizarItemEditable(item.id, 'cantidad', e.target.value)}
                                    placeholder="1"
                                    className="h-9 w-full text-right"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault()
                                        agregarItemEditable()
                                      }
                                    }}
                                  />
                                </td>
                                <td className="p-2">
                                  <Select
                                    value={item.unidad || 'unidad'}
                                    onValueChange={(value) => actualizarItemEditable(item.id, 'unidad', value)}
                                  >
                                    <SelectTrigger className="h-9 w-full">
                                      <SelectValue placeholder="Seleccionar unidad" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {unidadesComunes.map((unidad) => (
                                        <SelectItem key={unidad} value={unidad}>
                                          {unidad}
                                        </SelectItem>
                                      ))}
                                      {item.unidad && !unidadesComunes.includes(item.unidad) && (
                                        <SelectItem value={item.unidad}>
                                          {item.unidad}
                                        </SelectItem>
                                      )}
                                    </SelectContent>
                                  </Select>
                                </td>
                                <td className="p-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={item.precio_base || ''}
                                    onChange={(e) => actualizarItemEditable(item.id, 'precio_base', e.target.value)}
                                    placeholder="0.00"
                                    className="h-9 w-full text-right"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault()
                                        agregarItemEditable()
                                      }
                                    }}
                                  />
                                </td>
                                <td className="p-2">
                                  <span className="block h-9 w-full leading-9 text-right text-sm font-semibold text-muted-foreground">
                                    ${Number(item.precio_unitario || 0).toLocaleString(undefined, {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                  </span>
                                </td>
                                <td className="p-2">
                                  <div className="font-bold text-green-600 text-right">
                                    ${Number(item.precio_total || 0).toLocaleString(undefined, {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                  </div>
                                </td>
                                <td className="p-2 text-center">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => eliminarItemEditable(item.id)}
                                    className="h-8 w-8 p-0 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                            {/* Fila de totales */}
                            <tr className="border-t-2 bg-muted/30">
                              <td colSpan={6} className="p-3 text-right font-semibold">
                                Subtotal:
                              </td>
                              <td className="p-3 font-bold text-lg text-green-600">
                                ${itemsEditables.reduce((sum, item) => sum + (parseFloat(item.precio_total?.toString()) || 0), 0).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </td>
                              <td></td>
                            </tr>
                          </tbody>
                        </table>

                        <div className="mt-4 flex justify-end">
                          <Button 
                            type="button" 
                            onClick={agregarItemEditable} 
                            variant="outline"
                            size="sm"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Nueva Fila (Ctrl+Enter)
                          </Button>
                        </div>

                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
                          <p className="font-semibold mb-1">💡 Atajos de teclado:</p>
                          <ul className="space-y-1">
                            <li>• <kbd className="px-1.5 py-0.5 bg-white border rounded">Tab</kbd> - Navegar entre columnas</li>
                            <li>• <kbd className="px-1.5 py-0.5 bg-white border rounded">Ctrl+Enter</kbd> - Agregar nueva fila</li>
                            <li>• <kbd className="px-1.5 py-0.5 bg-white border rounded">Clic en ❌</kbd> - Eliminar fila</li>
                          </ul>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="hidden overflow-x-auto sm:block">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b-2">
                              <th className="p-2 text-left text-xs font-semibold sm:text-sm w-10 sm:w-12">#</th>
                              <th className="p-2 text-left text-xs font-semibold sm:text-sm w-24 sm:w-32">Tipo</th>
                              <th className="p-2 text-left text-xs font-semibold sm:text-sm min-w-[180px] sm:min-w-[200px]">Producto</th>
                              <th className="p-2 text-left text-xs font-semibold sm:text-sm min-w-[200px] sm:min-w-[250px]">Descripción</th>
                              <th className="p-2 text-left text-xs font-semibold sm:text-sm min-w-[90px] sm:min-w-[100px]">Cant.</th>
                              <th className="p-2 text-left text-xs font-semibold sm:text-sm w-20">Unidad</th>
                              <th className="p-2 text-left text-xs font-semibold sm:text-sm w-28 sm:w-32">P. Unit.</th>
                              <th className="p-2 text-left text-xs font-semibold sm:text-sm w-28 sm:w-32">Total</th>
                              <th className="p-2 text-center text-xs font-semibold sm:text-sm w-10 sm:w-12"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {itemsEditables.map((item, index) => (
                              <tr 
                                key={item.id} 
                                className="border-b"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    agregarItemEditable()
                                  }
                                }}
                              >
                                <td className="p-2 text-center text-muted-foreground font-medium">
                                  {index + 1}
                                </td>
                                <td className="p-2">
                                  <Select
                                    value={item.tipo || 'articulo'}
                                    onValueChange={(value: any) => actualizarItemEditable(item.id, 'tipo', value)}
                                  >
                                    <SelectTrigger className="h-9 w-full">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="articulo">Artículo</SelectItem>
                                      <SelectItem value="tejido">Tejido</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </td>
                                <td className="p-2">
                                  {item.tipo === 'articulo' ? (
                                    <ProductoCombobox
                                      value={item.articulo_id?.toString()}
                                      onChange={(value) => actualizarItemEditable(item.id, 'articulo_id', value)}
                                      productos={articulos.map((art) => ({
                                        id: art.id,
                                        label: art.nombre,
                                        sublabel: art.unidad
                                      }))}
                                      placeholder="Buscar artículo..."
                                      searchPlaceholder="Buscar artículo..."
                                      emptyMessage="No se encontraron artículos"
                                    />
                                  ) : (
                                    <ProductoCombobox
                                      value={item.tejido_config_id}
                                      onChange={(value) => actualizarItemEditable(item.id, 'tejido_config_id', value)}
                                      productos={tejidos.map((tej) => ({
                                        id: tej.id,
                                        label: tej.codigo,
                                        sublabel: [
                                          tej.nombre,
                                          tej.altura ? `${tej.altura}m` : null,
                                          tej.tamano_rombo ? `Rombo ${tej.tamano_rombo}` : null,
                                          tej.calibre ? `Calibre ${tej.calibre}` : null,
                                        ]
                                          .filter(Boolean)
                                          .join(' • '),
                                        meta: {
                                          altura: tej.altura !== undefined && tej.altura !== null ? tej.altura.toString() : '',
                                          tamano_rombo: tej.tamano_rombo !== undefined && tej.tamano_rombo !== null ? tej.tamano_rombo.toString() : '',
                                          calibre: tej.calibre !== undefined && tej.calibre !== null ? tej.calibre.toString() : '',
                                        },
                                      }))}
                                      placeholder="Buscar tejido..."
                                      searchPlaceholder="Buscar tejido..."
                                      emptyMessage="No se encontraron tejidos"
                                      filters={filtrosTejidos}
                                    />
                                  )}
                                </td>
                                <td className="p-2">
                                  <Input
                                    value={item.descripcion || ''}
                                    onChange={(e) => actualizarItemEditable(item.id, 'descripcion', e.target.value)}
                                    placeholder="Descripción..."
                                    className="h-9 w-full"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault()
                                        agregarItemEditable()
                                      }
                                    }}
                                  />
                                </td>
                                <td className="p-2 min-w-[90px] sm:min-w-[100px]">
                                  <Input
                                    type="number"
                                    min={item.tipo === 'tejido' ? '0.01' : '1'}
                                    step={item.tipo === 'tejido' ? '0.01' : '1'}
                                    value={item.cantidad || ''}
                                    onChange={(e) => actualizarItemEditable(item.id, 'cantidad', e.target.value)}
                                    placeholder={item.tipo === 'tejido' ? '1.5' : '1'}
                                    className="h-9 w-full text-right"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault()
                                        agregarItemEditable()
                                      }
                                    }}
                                  />
                                </td>
                                <td className="p-2">
                                  <Select
                                    value={item.unidad || 'unidad'}
                                    onValueChange={(value) => actualizarItemEditable(item.id, 'unidad', value)}
                                  >
                                    <SelectTrigger className="h-9 w-full">
                                      <SelectValue placeholder="Seleccionar unidad" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {unidadesDisponibles.length === 0 && (
                                        <div className="px-2 py-2 text-xs text-muted-foreground">
                                          No hay unidades disponibles
                                        </div>
                                      )}
                                      {unidadesDisponibles.map((unidad) => (
                                        <SelectItem key={unidad} value={unidad}>
                                          {unidad}
                                        </SelectItem>
                                      ))}
                                      {item.unidad &&
                                        !unidadesDisponibles.includes(item.unidad) && (
                                          <SelectItem value={item.unidad}>
                                            {item.unidad}
                                          </SelectItem>
                                        )}
                                    </SelectContent>
                                  </Select>
                                </td>
                                <td className="p-2">
                                  <span className="block h-9 w-full leading-9 text-right text-sm font-semibold text-muted-foreground">
                                    ${Number(item.precio_unitario || 0).toLocaleString(undefined, {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                            </span>
                                </td>
                                <td className="p-2">
                                  <div className="font-bold text-green-600 text-right">
                                    ${Number(item.precio_total || 0).toLocaleString(undefined, {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                          </div>
                                </td>
                                <td className="p-2 text-center">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => eliminarItemEditable(item.id)}
                                    className="h-8 w-8 p-0 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                            {/* Fila de totales */}
                            <tr className="border-t-2 bg-muted/30">
                              <td colSpan={7} className="p-3 text-right font-semibold">
                                Subtotal:
                              </td>
                              <td className="p-3 font-bold text-lg text-green-600">
                                ${itemsEditables.reduce((sum, item) => sum + (parseFloat(item.precio_total?.toString()) || 0), 0).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </td>
                              <td></td>
                            </tr>
                          </tbody>
                        </table>

                        <div className="mt-4 flex justify-end">
                          <Button 
                            type="button" 
                            onClick={agregarItemEditable} 
                            variant="outline"
                            size="sm"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Nueva Fila (Enter)
                          </Button>
                        </div>

                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
                          <p className="font-semibold mb-1">💡 Atajos de teclado:</p>
                          <ul className="space-y-1">
                            <li>• <kbd className="px-1.5 py-0.5 bg-white border rounded">Tab</kbd> - Navegar entre columnas</li>
                            <li>• <kbd className="px-1.5 py-0.5 bg-white border rounded">Enter</kbd> - Agregar nueva fila</li>
                            <li>• <kbd className="px-1.5 py-0.5 bg-white border rounded">Clic en ❌</kbd> - Eliminar fila</li>
                          </ul>
                        </div>
                      </div>

                      <div className="space-y-4 sm:hidden">
                        {(modoEdicion ? itemsEditables : items).map((item, index) => (
                          <div key={item.id} className="rounded-lg border p-4 shadow-sm">
                            <div className="mb-3 flex items-center justify-between text-sm text-muted-foreground">
                              <span className="font-medium text-foreground">Ítem #{index + 1}</span>
                              {modoEdicion && (
                                <button
                                  type="button"
                                  onClick={() => eliminarItemEditable(item.id)}
                                  className="text-destructive underline-offset-2 hover:underline"
                                >
                                  Eliminar
                                </button>
                              )}
                            </div>

                            {modoEdicion ? presupuesto.tipo === 'general' ? (
                              <div className="space-y-3">
                                <div className="space-y-1">
                                  <Label className="text-xs uppercase text-muted-foreground">Descripción</Label>
                                  <Textarea
                                    value={item.descripcion || ''}
                                    onChange={(e) => actualizarItemEditable(item.id, 'descripcion', e.target.value)}
                                    placeholder="Descripción del producto/servicio..."
                                    className="min-h-[80px] w-full resize-y"
                                    rows={3}
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <Label className="text-xs uppercase text-muted-foreground">Cantidad</Label>
                                    <Input
                                      type="number"
                                      min="0.01"
                                      step="0.01"
                                      value={item.cantidad || ''}
                                      onChange={(e) => actualizarItemEditable(item.id, 'cantidad', e.target.value)}
                                      placeholder="1"
                                      className="h-10 text-right"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs uppercase text-muted-foreground">Unidad</Label>
                                    <Select
                                      value={item.unidad || 'unidad'}
                                      onValueChange={(value) => actualizarItemEditable(item.id, 'unidad', value)}
                                    >
                                      <SelectTrigger className="h-10">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {unidadesComunes.map((unidad) => (
                                          <SelectItem key={unidad} value={unidad}>
                                            {unidad}
                                          </SelectItem>
                                        ))}
                                        {item.unidad && !unidadesComunes.includes(item.unidad) && (
                                          <SelectItem value={item.unidad}>
                                            {item.unidad}
                                          </SelectItem>
                                        )}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <Label className="text-xs uppercase text-muted-foreground">Precio Base</Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={item.precio_base || ''}
                                      onChange={(e) => actualizarItemEditable(item.id, 'precio_base', e.target.value)}
                                      placeholder="0.00"
                                      className="h-10 text-right"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs uppercase text-muted-foreground">Precio Unitario</Label>
                                    <div className="h-10 rounded-md border border-input bg-muted/50 px-3 text-right font-semibold leading-[2.5rem] text-muted-foreground">
                                      ${Number(item.precio_unitario || 0).toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-1 pt-2 border-t">
                                  <Label className="text-xs uppercase text-muted-foreground">Total</Label>
                                  <div className="h-10 rounded-md border border-input bg-green-50 px-3 text-right font-bold leading-[2.5rem] text-green-600">
                                    ${Number(item.precio_total || 0).toLocaleString(undefined, {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div className="space-y-1">
                                  <Label className="text-xs uppercase text-muted-foreground">Tipo</Label>
                                  <Select
                                    value={item.tipo || 'articulo'}
                                    onValueChange={(value: any) => actualizarItemEditable(item.id, 'tipo', value)}
                                  >
                                    <SelectTrigger className="h-10">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="articulo">Artículo</SelectItem>
                                      <SelectItem value="tejido">Tejido</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-1">
                                  <Label className="text-xs uppercase text-muted-foreground">Producto</Label>
                                  {item.tipo === 'articulo' ? (
                                    <ProductoCombobox
                                      value={item.articulo_id?.toString()}
                                      onChange={(value) => actualizarItemEditable(item.id, 'articulo_id', value)}
                                      productos={articulos.map((art) => ({
                                        id: art.id,
                                        label: art.nombre,
                                        sublabel: art.unidad,
                                      }))}
                                      placeholder="Buscar artículo..."
                                      searchPlaceholder="Buscar artículo..."
                                      emptyMessage="No se encontraron artículos"
                                      className="h-10"
                                    />
                                  ) : (
                                    <ProductoCombobox
                                      value={item.tejido_config_id}
                                      onChange={(value) => actualizarItemEditable(item.id, 'tejido_config_id', value)}
                                      productos={tejidos.map((tej) => ({
                                        id: tej.id,
                                        label: tej.codigo,
                                        sublabel: [
                                          tej.nombre,
                                          tej.altura ? `${tej.altura}m` : null,
                                          tej.tamano_rombo ? `Rombo ${tej.tamano_rombo}` : null,
                                          tej.calibre ? `Calibre ${tej.calibre}` : null,
                                        ]
                                          .filter(Boolean)
                                          .join(' • '),
                                        meta: {
                                          altura: tej.altura !== undefined && tej.altura !== null ? tej.altura.toString() : '',
                                          tamano_rombo: tej.tamano_rombo !== undefined && tej.tamano_rombo !== null ? tej.tamano_rombo.toString() : '',
                                          calibre: tej.calibre !== undefined && tej.calibre !== null ? tej.calibre.toString() : '',
                                        },
                                      }))}
                                      placeholder="Buscar tejido..."
                                      searchPlaceholder="Buscar tejido..."
                                      emptyMessage="No se encontraron tejidos"
                                      filters={filtrosTejidos}
                                      className="h-10"
                                    />
                                  )}
                                </div>

                                <div className="space-y-1">
                                  <Label className="text-xs uppercase text-muted-foreground">Descripción</Label>
                                  <Input
                                    value={item.descripcion || ''}
                                    onChange={(e) => actualizarItemEditable(item.id, 'descripcion', e.target.value)}
                                    placeholder="Descripción..."
                                    className="h-10"
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <Label className="text-xs uppercase text-muted-foreground">Cantidad</Label>
                                    <Input
                                      type="number"
                                      min={item.tipo === 'tejido' ? '0.01' : '1'}
                                      step={item.tipo === 'tejido' ? '0.01' : '1'}
                                      value={item.cantidad || ''}
                                      onChange={(e) => actualizarItemEditable(item.id, 'cantidad', e.target.value)}
                                      placeholder={item.tipo === 'tejido' ? '1.5' : '1'}
                                      className="h-10 text-right"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs uppercase text-muted-foreground">Unidad</Label>
                                    <Select
                                      value={item.unidad || 'unidad'}
                                      onValueChange={(value) => actualizarItemEditable(item.id, 'unidad', value)}
                                    >
                                      <SelectTrigger className="h-10">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {unidadesDisponibles.map((unidad) => (
                                          <SelectItem key={unidad} value={unidad}>
                                            {unidad}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <Label className="text-xs uppercase text-muted-foreground">Precio unitario</Label>
                                    <div className="h-10 rounded-md border border-input bg-muted/50 px-3 text-right font-semibold leading-[2.5rem] text-muted-foreground">
                                      ${Number(item.precio_unitario || 0).toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs uppercase text-muted-foreground">Total</Label>
                                    <div className="h-10 rounded-md border border-input bg-muted/50 px-3 text-right font-semibold leading-[2.5rem] text-green-600">
                                      ${Number(item.precio_total || 0).toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <>
                          <p className="font-medium leading-snug">
                            {item.descripcion || 'Sin descripción'}
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <div>
                              <p className="font-semibold uppercase">Cant.</p>
                              <p>{item.cantidad}</p>
                            </div>
                            <div>
                              <p className="font-semibold uppercase">Unidad</p>
                              <p>{item.unidad}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="font-semibold uppercase">P. Unit.</p>
                              <p>${formatearMoneda(item.precio_unitario)}</p>
                            </div>
                          </div>
                              </>
                            )}
                        </div>
                      ))}
                    </div>
                      {modoEdicion && (
                        <div className="mt-4 sm:hidden">
                          <Button type="button" onClick={agregarItemEditable} className="w-full">
                            <Plus className="h-4 w-4 mr-2" />
                            Agregar Fila
                          </Button>
                  </div>
                      )}
                    </>
                  )}

                  <div className="mt-4 space-y-2 rounded-lg bg-muted/40 p-3 text-sm sm:text-base">
                    {modoEdicion && (
                      <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                        <strong>Modo edición:</strong> Los totales se actualizarán al guardar los cambios.
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-muted-foreground">Subtotal:</span>
                      <span className="font-bold">
                        ${formatearMoneda(
                          modoEdicion 
                            ? itemsEditables.reduce((sum, item) => sum + (parseFloat(item.precio_total?.toString()) || 0), 0)
                            : presupuesto.subtotal
                        )}
                      </span>
                    </div>
                    {presupuesto.descuento > 0 && (
                      <div className="flex items-center justify-between text-red-600">
                        <span className="font-semibold">Descuento:</span>
                        <span className="font-bold">-${formatearMoneda(presupuesto.descuento)}</span>
                      </div>
                    )}
                    {presupuesto.forma_pago && presupuesto.forma_pago !== 'efectivo' && presupuesto.total > 0 && (
                      <>
                        <div className="flex items-center justify-between text-xs text-muted-foreground sm:text-sm">
                          <span>Base imponible (sin IVA)</span>
                          <span className="font-semibold">
                            ${(presupuesto.total / 1.21).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground sm:text-sm">
                          <span>IVA 21%</span>
                          <span className="font-semibold">
                            ${((presupuesto.total / 1.21) * 0.21).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </>
                    )}
                    <div className="flex items-center justify-between border-t border-muted pt-2 text-base font-bold text-green-600 sm:text-xl">
                      <span>Total:</span>
                      <span>
                        ${formatearMoneda(
                          modoEdicion
                            ? itemsEditables.reduce((sum, item) => sum + (parseFloat(item.precio_total?.toString()) || 0), 0) - (presupuesto.descuento || 0)
                            : presupuesto.total
                        )}
                      </span>
                    </div>
              </div>
            </CardContent>
              </CollapsibleContent>
          </Card>
          </Collapsible>

      {/* Detalle del Cerco - Solo para presupuestos de cercado */}
      {presupuesto.tipo === 'cercado' && configuracionCercado && (
        <Card className="border-2">
                  <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <FileText className="h-5 w-5" />
              Detalle del Cerco Perimetral
            </CardTitle>
            <CardDescription>
              Especificaciones técnicas y componentes incluidos en el presupuesto
            </CardDescription>
                  </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-muted/30 border-2 border-muted rounded-lg space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-foreground">{configuracionCercado.nombre}</h3>
                  {configuracionCercado.descripcion && (
                    <p className="text-sm text-muted-foreground mt-1">{configuracionCercado.descripcion}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="outline" className="bg-background">
                    {configuracionCercado.altura_final_cerco
                      ? `${configuracionCercado.altura_final_cerco}m`
                      : `${configuracionCercado.altura}m`}
                  </Badge>
                  {configuracionCercado.precio_por_metro_lineal && (
                    <div className="text-right">
                      <p className="text-xs text-green-600 uppercase tracking-wide mb-1 font-bold">Precio por Metro</p>
                      <p className="text-lg font-bold text-green-700">
                        ${configuracionCercado.precio_por_metro_lineal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
            </div>
          )}
                </div>
        </div>

              <div className="grid gap-4 md:grid-cols-2 pt-3 border-t border-muted-foreground/20">
                {/* Tejido */}
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1 font-bold flex items-center gap-1.5">
                    <Grid className="h-3.5 w-3.5" />
                    Tejido Romboidal
                  </p>
                  <p className="font-bold text-foreground">
                    {configuracionCercado.tejido_codigo || 'N/A'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {configuracionCercado.calibre && `Cal.${configuracionCercado.calibre}`}
                    {configuracionCercado.altura && ` - ${configuracionCercado.altura}m`}
                    {configuracionCercado.tamano_rombo && ` - Rombo ${configuracionCercado.tamano_rombo}"`}
                  </p>
              </div>

                {/* Postes */}
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1 font-bold flex items-center gap-1.5">
                    <Columns className="h-3.5 w-3.5" />
                    Postes
                  </p>
                  <p className="font-bold text-foreground mb-1">{configuracionCercado.tipo_poste}</p>
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

                {/* Cordón */}
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1 font-bold flex items-center gap-1.5">
                    <Circle className="h-3.5 w-3.5" />
                    Cordón de Hormigón
                  </p>
                  <p className="font-bold text-foreground">{configuracionCercado.cordon_tipo || 'Sin cordón'}</p>
              </div>

                {/* Alambre de Púa */}
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1 font-bold flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5" />
                    Alambre de Púa
                  </p>
                  <p className="font-bold text-foreground">
                    {configuracionCercado.hilos_pua > 0
                      ? `${configuracionCercado.hilos_pua} hilos`
                      : 'Sin púa'}
                  </p>
              </div>
              </div>
            </div>

            {/* Accesorios Incluidos */}
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3 font-bold">
                ✓ Accesorios Incluidos para la Instalación
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {configuracionCercado.cantidad_ganchos > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-green-600">✓</span>
                    <span>Ganchos tensores</span>
              </div>
                )}
                {configuracionCercado.cantidad_planchuelas > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-green-600">✓</span>
                    <span>Planchuelas</span>
                </div>
              )}
                {configuracionCercado.cantidad_torniquetes > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-green-600">✓</span>
                    <span>Torniquetes</span>
              </div>
                )}
                {configuracionCercado.cantidad_esparragos > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-green-600">✓</span>
                    <span>Espárragos</span>
                </div>
              )}
                {configuracionCercado.metros_alambre_ar > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-green-600">✓</span>
                    <span>Alambre alta resistencia</span>
                  </div>
                )}
                {configuracionCercado.kg_clavos > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-green-600">✓</span>
                    <span>Clavos</span>
                  </div>
                )}
                {configuracionCercado.kg_alambre_negro > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-green-600">✓</span>
                    <span>Alambre negro</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-4 italic">
                * Todos los accesorios necesarios para la correcta instalación del cerco perimetral están incluidos en el presupuesto.
              </p>
              </div>
            </CardContent>
          </Card>
      )}

      {/* Observaciones y Condiciones + Acciones */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Observaciones y Condiciones */}
        {(presupuesto.observaciones || presupuesto.condiciones_comerciales) && (
          <div className="md:col-span-2 space-y-4">
            {presupuesto.observaciones && (
          <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg">Observaciones</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-line">{presupuesto.observaciones}</p>
                </CardContent>
              </Card>
            )}
            {presupuesto.condiciones_comerciales && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg">Condiciones Comerciales</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-line">{presupuesto.condiciones_comerciales}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Acciones */}
        <Card className={presupuesto.observaciones || presupuesto.condiciones_comerciales ? 'md:col-span-1' : 'md:col-span-3'}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
            <Button className="w-full" variant="outline" size="sm" onClick={descargarPDF}>
                <Download className="h-4 w-4 mr-2" />
                Descargar PDF
              </Button>
            <Button className="w-full" variant="outline" size="sm" onClick={descargarRemito}>
                <FileText className="h-4 w-4 mr-2" />
                Generar Remito
              </Button>
            <Button className="w-full" variant="outline" size="sm" onClick={copiarResumen}>
                <MessageSquareText className="h-4 w-4 mr-2" />
                Resumen WhatsApp
              </Button>
            <Button 
              className="w-full" 
              variant="destructive" 
              size="sm"
              onClick={abrirDialogoBaja} 
              disabled={eliminando || presupuesto.estado === 'baja'}
            >
                <Trash className="h-4 w-4 mr-2" />
                {presupuesto.estado === 'baja'
                  ? 'Presupuesto dado de baja'
                  : eliminando
                    ? 'Marcando como baja...'
                    : 'Dar de baja'}
              </Button>
            </CardContent>
          </Card>
      </div>

      <Dialog
        open={confirmacionAbierta}
        onOpenChange={(abierta) => {
          setConfirmacionAbierta(abierta)
          if (!abierta) {
            setTextoConfirmacion('')
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar baja del presupuesto</DialogTitle>
            <DialogDescription>
              Esta acción marcará el presupuesto como no vigente. Escribe la palabra "BAJA" para confirmar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              autoFocus
              placeholder="Escribe BAJA para confirmar"
              value={textoConfirmacion}
              onChange={(event) => setTextoConfirmacion(event.target.value)}
              className="uppercase tracking-[0.2em]"
            />
            <p className="text-xs text-muted-foreground">
              Esta operación es irreversible. El presupuesto seguirá disponible en modo lectura, pero no podrá utilizarse.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConfirmacionAbierta(false)
                setTextoConfirmacion('')
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmarBaja}
              disabled={eliminando}
            >
              {eliminando ? 'Marcando...' : 'Confirmar baja'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Registrar Entrega */}
      <Dialog open={dialogRegistrarEntrega} onOpenChange={setDialogRegistrarEntrega}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-amber-600" />
                  Registrar Entrega
                </DialogTitle>
                <DialogDescription>
                  Seleccione los items y cantidades a entregar
                </DialogDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={autocompletarCantidades}
                  className="text-xs"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Autocompletar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={limpiarCantidades}
                  className="text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Limpiar
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {/* Fecha de Entrega */}
            <div className="space-y-2">
              <Label htmlFor="fecha-entrega">Fecha de Entrega</Label>
              <Input
                id="fecha-entrega"
                type="date"
                value={fechaEntrega}
                onChange={(e) => setFechaEntrega(e.target.value)}
              />
            </div>

            {/* Items Disponibles */}
            <div className="space-y-3">
              <Label>Items a Entregar</Label>
              {(() => {
                // Usar itemsEntregas si está disponible, sino usar items del presupuesto
                let itemsDisponibles = itemsEntregas
                
                if (!itemsDisponibles || itemsDisponibles.length === 0) {
                  itemsDisponibles = items.map((item: any) => ({
                    presupuesto_item_id: item.id,
                    descripcion: item.descripcion,
                    cantidad_total: parseFloat(item.cantidad) || 0,
                    unidad: item.unidad,
                    cantidad_entregada: 0,
                    cantidad_pendiente: parseFloat(item.cantidad) || 0,
                    orden: item.orden || 0,
                    estado_item: 'pendiente',
                  }))
                }

                const itemsConPendiente = itemsDisponibles.filter((item: any) => {
                  const pendiente = item.cantidad_pendiente || (item.cantidad_total - (item.cantidad_entregada || 0))
                  return pendiente > 0
                })

                if (itemsConPendiente.length === 0) {
                  return (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No hay items pendientes de entrega
                    </p>
                  )
                }

                return (
                  <div className="space-y-3 border rounded-lg p-4">
                    {itemsConPendiente.map((item: any) => {
                      const cantidadPendiente = parseFloat(item.cantidad_pendiente || item.cantidad_total) || 0
                      const cantidadEntregada = parseFloat(item.cantidad_entregada || 0)
                      const cantidadTotal = parseFloat(item.cantidad_total) || 0
                      const cantidadActual = itemsParaEntregar[item.presupuesto_item_id] || 0
                      
                      return (
                        <div key={item.presupuesto_item_id} className="space-y-2 p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{item.descripcion}</p>
                              <p className="text-xs text-muted-foreground">
                                Pendiente: {cantidadPendiente.toFixed(2)} {item.unidad} | 
                                Entregado: {cantidadEntregada.toFixed(2)} {item.unidad} | 
                                Total: {cantidadTotal.toFixed(2)} {item.unidad}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`cantidad-${item.presupuesto_item_id}`} className="text-xs whitespace-nowrap">
                              Cantidad:
                            </Label>
                            <Input
                              id={`cantidad-${item.presupuesto_item_id}`}
                              type="number"
                              min="0"
                              max={cantidadPendiente}
                              step="0.01"
                              value={cantidadActual}
                              onChange={(e) => {
                                const valor = parseFloat(e.target.value) || 0
                                actualizarCantidadEntregar(item.presupuesto_item_id, valor)
                              }}
                              className="w-32"
                            />
                            <span className="text-xs text-muted-foreground">{item.unidad}</span>
                            {cantidadActual > 0 && (
                              <Badge variant="secondary" className="ml-auto">
                                {cantidadActual.toFixed(2)} {item.unidad}
                              </Badge>
                            )}
                          </div>
                          {cantidadActual > cantidadPendiente && (
                            <p className="text-xs text-red-600">
                              La cantidad no puede exceder {cantidadPendiente.toFixed(2)} {item.unidad}
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>

            {/* Observaciones */}
            <div className="space-y-2">
              <Label htmlFor="obs-entrega">Observaciones (Opcional)</Label>
              <Textarea
                id="obs-entrega"
                placeholder="Notas adicionales sobre la entrega..."
                value={observacionesEntrega}
                onChange={(e) => setObservacionesEntrega(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogRegistrarEntrega(false)}
              disabled={registrandoEntrega}
            >
              Cancelar
            </Button>
            <Button
              onClick={registrarEntrega}
              disabled={registrandoEntrega || Object.values(itemsParaEntregar).every((v) => v === 0)}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {registrandoEntrega ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <Package className="h-4 w-4 mr-2" />
                  Registrar Entrega
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

