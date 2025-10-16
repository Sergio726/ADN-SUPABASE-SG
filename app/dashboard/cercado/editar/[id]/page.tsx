'use client'

import { useState, useEffect } from 'react'
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

export default function EditarConfiguracionCercadoPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [tejidos, setTejidos] = useState<any[]>([])
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
    tejido_config_id: '',
    tipo_poste: 'Eucalipto',
    
    // Cantidades de postes (para 180m)
    cantidad_postes_esquineros: '4',
    cantidad_postes_refuerzos: '2',
    cantidad_postes_intermedios: '34',
    cantidad_puntales: '12',
    
    // Precios de postes
    precio_poste_esquinero: '22500',
    precio_poste_refuerzo: '22500',
    precio_poste_intermedio: '22500',
    precio_puntal: '17500',
    
    // Cordón
    cordon_tipo: '10cm',
    cordon_bolsas_ripio: '4',
    cordon_bolsas_cemento: '25',
    cordon_precio_total: '997920',
    
    // Púa
    hilos_pua: '0',
    precio_pua_por_metro: '1168.02',
    
    // Accesorios
    cantidad_ganchos: '48',
    precio_unitario_ganchos: '12337.50',
    cantidad_planchuelas: '12',
    precio_unitario_planchuelas: '5456.45',
    cantidad_torniquetes: '6',
    precio_unitario_torniquetes: '12337.50',
    cantidad_esparragos: '6',
    precio_unitario_esparragos: '1330.00',
    metros_alambre_ar: '720',
    precio_metro_alambre_ar: '3105.48',
    kg_clavos: '2',
    precio_kg_clavos: '1330.00',
    kg_alambre_negro: '8',
    precio_kg_alambre_negro: '844.20',
    
    // Mano de obra y transporte
    precio_mano_obra_por_metro: '11438.00',
    precio_transporte_por_metro: '3580.50',
    
    activo: true,
  })

  useEffect(() => {
    cargarTejidos()
    if (params?.id) {
      cargarConfiguracion()
    }
  }, [params?.id])

  useEffect(() => {
    calcularPrecios()
  }, [formData, tejidos])

  async function cargarTejidos() {
    const { data } = await supabase
      .from('v_tejidos_con_precios')
      .select('*')
      .eq('activo', true)
      .order('codigo')

    setTejidos(data || [])
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
        setFormData({
          nombre: data.nombre,
          descripcion: data.descripcion || '',
          altura: data.altura.toString(),
          tejido_config_id: data.tejido_config_id,
          tipo_poste: data.tipo_poste,
          
          cantidad_postes_esquineros: data.cantidad_postes_esquineros.toString(),
          cantidad_postes_refuerzos: data.cantidad_postes_refuerzos.toString(),
          cantidad_postes_intermedios: data.cantidad_postes_intermedios.toString(),
          cantidad_puntales: data.cantidad_puntales.toString(),
          
          precio_poste_esquinero: data.precio_poste_esquinero.toString(),
          precio_poste_refuerzo: data.precio_poste_refuerzo.toString(),
          precio_poste_intermedio: data.precio_poste_intermedio.toString(),
          precio_puntal: data.precio_puntal.toString(),
          
          cordon_tipo: data.cordon_tipo,
          cordon_bolsas_ripio: data.cordon_bolsas_ripio.toString(),
          cordon_bolsas_cemento: data.cordon_bolsas_cemento.toString(),
          cordon_precio_total: data.cordon_precio_total.toString(),
          
          hilos_pua: data.hilos_pua.toString(),
          precio_pua_por_metro: data.precio_pua_por_metro.toString(),
          
          cantidad_ganchos: data.cantidad_ganchos.toString(),
          precio_unitario_ganchos: data.precio_unitario_ganchos.toString(),
          cantidad_planchuelas: data.cantidad_planchuelas.toString(),
          precio_unitario_planchuelas: data.precio_unitario_planchuelas.toString(),
          cantidad_torniquetes: data.cantidad_torniquetes.toString(),
          precio_unitario_torniquetes: data.precio_unitario_torniquetes.toString(),
          cantidad_esparragos: data.cantidad_esparragos.toString(),
          precio_unitario_esparragos: data.precio_unitario_esparragos.toString(),
          metros_alambre_ar: data.metros_alambre_ar.toString(),
          precio_metro_alambre_ar: data.precio_metro_alambre_ar.toString(),
          kg_clavos: data.kg_clavos.toString(),
          precio_kg_clavos: data.precio_kg_clavos.toString(),
          kg_alambre_negro: data.kg_alambre_negro.toString(),
          precio_kg_alambre_negro: data.precio_kg_alambre_negro.toString(),
          
          precio_mano_obra_por_metro: data.precio_mano_obra_por_metro.toString(),
          precio_transporte_por_metro: data.precio_transporte_por_metro.toString(),
          
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

  function calcularPrecios() {
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
    const rollosNecesarios = Math.ceil(180 / 10) // 18 rollos para 180m
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
    const precioMetroMenor50 = precioMetro * 1.30

    setPrecioCalculado({
      accesorios: totalAccesorios,
      total_180m: total180m,
      precio_metro: precioMetro,
      precio_metro_menor_50: precioMetroMenor50,
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const configData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || null,
        altura: parseFloat(formData.altura),
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
        
        cordon_tipo: formData.cordon_tipo,
        cordon_bolsas_ripio: parseInt(formData.cordon_bolsas_ripio),
        cordon_bolsas_cemento: parseFloat(formData.cordon_bolsas_cemento),
        cordon_precio_total: parseFloat(formData.cordon_precio_total),
        
        hilos_pua: parseInt(formData.hilos_pua),
        precio_pua_por_metro: parseFloat(formData.precio_pua_por_metro),
        
        cantidad_ganchos: parseInt(formData.cantidad_ganchos),
        precio_unitario_ganchos: parseFloat(formData.precio_unitario_ganchos),
        cantidad_planchuelas: parseInt(formData.cantidad_planchuelas),
        precio_unitario_planchuelas: parseFloat(formData.precio_unitario_planchuelas),
        cantidad_torniquetes: parseInt(formData.cantidad_torniquetes),
        precio_unitario_torniquetes: parseFloat(formData.precio_unitario_torniquetes),
        cantidad_esparragos: parseInt(formData.cantidad_esparragos),
        precio_unitario_esparragos: parseFloat(formData.precio_unitario_esparragos),
        metros_alambre_ar: parseInt(formData.metros_alambre_ar),
        precio_metro_alambre_ar: parseFloat(formData.precio_metro_alambre_ar),
        kg_clavos: parseInt(formData.kg_clavos),
        precio_kg_clavos: parseFloat(formData.precio_kg_clavos),
        kg_alambre_negro: parseInt(formData.kg_alambre_negro),
        precio_kg_alambre_negro: parseFloat(formData.precio_kg_alambre_negro),
        
        precio_total_accesorios: precioCalculado.accesorios,
        precio_mano_obra_por_metro: parseFloat(formData.precio_mano_obra_por_metro),
        precio_transporte_por_metro: parseFloat(formData.precio_transporte_por_metro),
        
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" asChild>
          <Link href="/dashboard/cercado">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Link>
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
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Altura del Cerco *</Label>
                  <Select
                    value={formData.altura}
                    onValueChange={(value) => setFormData({ ...formData, altura: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1.20">1.2 metros</SelectItem>
                      <SelectItem value="1.50">1.5 metros</SelectItem>
                      <SelectItem value="1.80">1.8 metros</SelectItem>
                      <SelectItem value="2.00">2.0 metros</SelectItem>
                    </SelectContent>
                  </Select>
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
                        .filter((t) => t.altura.toString() === formData.altura)
                        .map((tejido) => (
                          <SelectItem key={tejido.id} value={tejido.id}>
                            {tejido.codigo} - ${tejido.precio_venta?.toLocaleString()}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
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
                    
                    setFormData({
                      ...formData,
                      tipo_poste: value,
                      precio_poste_esquinero: precios.esquinero,
                      precio_poste_refuerzo: precios.refuerzo,
                      precio_poste_intermedio: precios.intermedio,
                      precio_puntal: precios.puntal,
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
                      value={formData.cantidad_postes_esquineros}
                      onChange={(e) => setFormData({ ...formData, cantidad_postes_esquineros: e.target.value })}
                      placeholder="4"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.precio_poste_esquinero}
                      onChange={(e) => setFormData({ ...formData, precio_poste_esquinero: e.target.value })}
                      placeholder="$"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Postes Refuerzos</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      value={formData.cantidad_postes_refuerzos}
                      onChange={(e) => setFormData({ ...formData, cantidad_postes_refuerzos: e.target.value })}
                      placeholder="2"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.precio_poste_refuerzo}
                      onChange={(e) => setFormData({ ...formData, precio_poste_refuerzo: e.target.value })}
                      placeholder="$"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Postes Intermedios</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      value={formData.cantidad_postes_intermedios}
                      onChange={(e) => setFormData({ ...formData, cantidad_postes_intermedios: e.target.value })}
                      placeholder="34"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.precio_poste_intermedio}
                      onChange={(e) => setFormData({ ...formData, precio_poste_intermedio: e.target.value })}
                      placeholder="$"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Puntales</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      value={formData.cantidad_puntales}
                      onChange={(e) => setFormData({ ...formData, cantidad_puntales: e.target.value })}
                      placeholder="12"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.precio_puntal}
                      onChange={(e) => setFormData({ ...formData, precio_puntal: e.target.value })}
                      placeholder="$"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cordón y Púa */}
          <Card>
            <CardHeader>
              <CardTitle>Cordón de Hormigón y Alambre de Púa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tipo de Cordón *</Label>
                  <Select
                    value={formData.cordon_tipo}
                    onValueChange={(value) => {
                      let precio = '0'
                      if (value === '10cm') precio = '997920'
                      else if (value === '15cm') precio = '791805'
                      else if (value === '20cm') precio = '1164380'
                      
                      setFormData({
                        ...formData,
                        cordon_tipo: value,
                        cordon_precio_total: precio
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
                </div>

                <div className="space-y-2">
                  <Label>Precio Total Cordón</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.cordon_precio_total}
                    onChange={(e) => setFormData({ ...formData, cordon_precio_total: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

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
                  <Label>Precio Púa por Metro</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.precio_pua_por_metro}
                    onChange={(e) => setFormData({ ...formData, precio_pua_por_metro: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Accesorios - Igual que en nuevo */}
          <Card>
            <CardHeader>
              <CardTitle>Accesorios (para 180m)</CardTitle>
              <CardDescription>Materiales complementarios necesarios</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: 'Ganchos', cant: 'cantidad_ganchos', precio: 'precio_unitario_ganchos' },
                  { label: 'Planchuelas', cant: 'cantidad_planchuelas', precio: 'precio_unitario_planchuelas' },
                  { label: 'Torniquetes', cant: 'cantidad_torniquetes', precio: 'precio_unitario_torniquetes' },
                  { label: 'Esparragos', cant: 'cantidad_esparragos', precio: 'precio_unitario_esparragos' },
                ].map((item) => (
                  <div key={item.label} className="grid grid-cols-3 gap-2 items-center">
                    <Label className="text-sm">{item.label}</Label>
                    <Input
                      type="number"
                      value={formData[item.cant as keyof typeof formData] as string}
                      onChange={(e) => setFormData({ ...formData, [item.cant]: e.target.value })}
                      className="text-sm"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      value={formData[item.precio as keyof typeof formData] as string}
                      onChange={(e) => setFormData({ ...formData, [item.precio]: e.target.value })}
                      placeholder="$"
                      className="text-sm"
                    />
                  </div>
                ))}

                <div className="grid grid-cols-3 gap-2 items-center">
                  <Label className="text-sm">Alambre A/R (metros)</Label>
                  <Input
                    type="number"
                    value={formData.metros_alambre_ar}
                    onChange={(e) => setFormData({ ...formData, metros_alambre_ar: e.target.value })}
                    className="text-sm"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.precio_metro_alambre_ar}
                    onChange={(e) => setFormData({ ...formData, precio_metro_alambre_ar: e.target.value })}
                    placeholder="$/m"
                    className="text-sm"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 items-center">
                  <Label className="text-sm">Clavos (kg)</Label>
                  <Input
                    type="number"
                    value={formData.kg_clavos}
                    onChange={(e) => setFormData({ ...formData, kg_clavos: e.target.value })}
                    className="text-sm"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.precio_kg_clavos}
                    onChange={(e) => setFormData({ ...formData, precio_kg_clavos: e.target.value })}
                    placeholder="$/kg"
                    className="text-sm"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 items-center">
                  <Label className="text-sm">Alambre negro (kg)</Label>
                  <Input
                    type="number"
                    value={formData.kg_alambre_negro}
                    onChange={(e) => setFormData({ ...formData, kg_alambre_negro: e.target.value })}
                    className="text-sm"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.precio_kg_alambre_negro}
                    onChange={(e) => setFormData({ ...formData, precio_kg_alambre_negro: e.target.value })}
                    placeholder="$/kg"
                    className="text-sm"
                  />
                </div>

                <div className="p-3 bg-muted rounded mt-2">
                  <p className="text-sm font-semibold">Total Accesorios:</p>
                  <p className="text-2xl font-bold text-primary">
                    ${precioCalculado.accesorios.toLocaleString()}
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
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.precio_mano_obra_por_metro}
                    onChange={(e) => setFormData({ ...formData, precio_mano_obra_por_metro: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Transporte ($/metro)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.precio_transporte_por_metro}
                    onChange={(e) => setFormData({ ...formData, precio_transporte_por_metro: e.target.value })}
                  />
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

        {/* Preview - Igual que en nuevo */}
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
                  <span className="text-muted-foreground">Tejido (18 rollos):</span>
                  <span className="font-semibold">
                    ${((tejidos.find(t => t.id === formData.tejido_config_id)?.precio_venta || 0) * 18).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Postes:</span>
                  <span className="font-semibold">
                    ${(
                      (parseFloat(formData.cantidad_postes_esquineros) * parseFloat(formData.precio_poste_esquinero)) +
                      (parseFloat(formData.cantidad_postes_refuerzos) * parseFloat(formData.precio_poste_refuerzo)) +
                      (parseFloat(formData.cantidad_postes_intermedios) * parseFloat(formData.precio_poste_intermedio)) +
                      (parseFloat(formData.cantidad_puntales) * parseFloat(formData.precio_puntal))
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cordón:</span>
                  <span className="font-semibold">${parseFloat(formData.cordon_precio_total).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Púa:</span>
                  <span className="font-semibold">
                    ${(180 * parseFloat(formData.hilos_pua) * parseFloat(formData.precio_pua_por_metro)).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Accesorios:</span>
                  <span className="font-semibold">${precioCalculado.accesorios.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mano de Obra:</span>
                  <span className="font-semibold">
                    ${(180 * parseFloat(formData.precio_mano_obra_por_metro)).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transporte:</span>
                  <span className="font-semibold">
                    ${(180 * parseFloat(formData.precio_transporte_por_metro)).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="border-t-2 pt-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold">Total 180m:</span>
                  <span className="text-2xl font-bold text-green-600">
                    ${precioCalculado.total_180m.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm">Precio/metro:</span>
                  <span className="text-lg font-bold text-primary">
                    ${precioCalculado.precio_metro.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t">
                  <span className="text-xs text-muted-foreground">Precio/metro (&lt;50m):</span>
                  <span className="text-sm font-bold text-orange-600">
                    ${precioCalculado.precio_metro_menor_50.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}

