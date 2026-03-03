'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  ArrowLeft, Edit, Package, Hammer, Ruler, RefreshCw, AlertCircle,
  CheckCircle2, Calendar, Clock, Grid, Columns, Circle, Zap, DollarSign,
  Info, Tag
} from 'lucide-react'
import Link from 'next/link'
import { recalcularPreciosCercado, esPrecioDesactualizado, diasDesdeActualizacion } from '@/lib/cercado-service'

interface DescripcionPoste {
  id: string
  nombre: string
  descripcion: string | null
}

interface DescripcionesPostes {
  esquinero: DescripcionPoste | null
  refuerzo: DescripcionPoste | null
  intermedio: DescripcionPoste | null
  puntal: DescripcionPoste | null
}

export default function VerConfiguracionCercadoPage() {
  const params = useParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [configuracion, setConfiguracion] = useState<any>(null)
  const [recalculando, setRecalculando] = useState(false)
  const [descripcionesPostes, setDescripcionesPostes] = useState<DescripcionesPostes>({
    esquinero: null, refuerzo: null, intermedio: null, puntal: null,
  })

  useEffect(() => {
    if (params?.id) {
      cargarConfiguracion()
    }
  }, [params?.id])

  useEffect(() => {
    if (!configuracion) return

    const idsPostes = [
      configuracion.poste_esquinero_id,
      configuracion.poste_refuerzo_id,
      configuracion.poste_intermedio_id,
      configuracion.poste_puntal_id,
    ].filter(Boolean) as string[]

    if (idsPostes.length === 0) return

    supabase
      .from('articulos')
      .select('id, nombre, descripcion')
      .in('id', idsPostes)
      .then(({ data }) => {
        if (!data) return
        const find = (id: string | undefined): DescripcionPoste | null =>
          id ? (data.find(a => a.id === id) ?? null) : null

        setDescripcionesPostes({
          esquinero: find(configuracion.poste_esquinero_id),
          refuerzo: find(configuracion.poste_refuerzo_id),
          intermedio: find(configuracion.poste_intermedio_id),
          puntal: find(configuracion.poste_puntal_id),
        })
      })
  }, [configuracion])

  async function cargarConfiguracion() {
    try {
      const { data, error } = await supabase
        .from('v_configuraciones_cercado_completas')
        .select('*')
        .eq('id', params?.id)
        .single()

      if (error) throw error

      setConfiguracion(data)
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

  async function recalcularPrecios() {
    if (!params?.id) return

    try {
      setRecalculando(true)

      await recalcularPreciosCercado(params.id as string)

      toast({
        title: 'Recalculado',
        description: 'Se actualizaron los precios con valores vigentes.',
      })
      await cargarConfiguracion()
    } catch (error: any) {
      console.error('Error al recalcular:', error)
      toast({
        title: 'Error al recalcular',
        description: error.message || 'No fue posible actualizar precios.',
        variant: 'destructive',
      })
    } finally {
      setRecalculando(false)
    }
  }

  const formatPrecio = (valor: number | null | undefined) =>
    valor != null ? valor.toLocaleString('es-AR') : '—'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!configuracion) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Configuración no encontrada</h2>
        <Button asChild className="mt-4">
          <Link href="/dashboard/cercado">Volver al listado</Link>
        </Button>
      </div>
    )
  }

  const desactualizado = esPrecioDesactualizado(configuracion.actualizado_en)
  const dias = diasDesdeActualizacion(configuracion.actualizado_en)
  const fechaCreacion = configuracion.creado_en
    ? new Date(configuracion.creado_en).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'N/A'
  const fechaActualizacion = configuracion.actualizado_en
    ? new Date(configuracion.actualizado_en).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'N/A'

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link href="/dashboard/cercado">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{configuracion.nombre}</h1>
            {configuracion.descripcion && (
              <p className="text-muted-foreground mt-1">{configuracion.descripcion}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={recalcularPrecios} disabled={recalculando} variant="secondary">
            <RefreshCw className={`h-4 w-4 mr-2 ${recalculando ? 'animate-spin' : ''}`} />
            {recalculando ? 'Recalculando...' : 'Recalcular precios'}
          </Button>
          <Button asChild>
            <Link href={`/dashboard/cercado/editar/${configuracion.id}`}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Link>
          </Button>
        </div>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Altura Final del Cerco</CardDescription>
            <CardTitle className="text-3xl">
              {configuracion?.altura_final_cerco != null && configuracion?.altura_final_cerco !== undefined && configuracion?.altura_final_cerco !== ''
                ? `${Number(configuracion.altura_final_cerco).toFixed(1)}m`
                : `${configuracion?.altura || 0}m`}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Precio por Metro</CardDescription>
            <CardTitle className="text-3xl text-primary">
              ${formatPrecio(configuracion.precio_por_metro_lineal)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total para 180m</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              ${formatPrecio(configuracion.precio_base_180m)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Precio/m (&lt;50m)</CardDescription>
            <CardTitle className="text-3xl text-orange-600">
              ${formatPrecio(configuracion.precio_por_metro_menor_50m)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Información de Actualización */}
      <Card className={desactualizado ? 'border-destructive/50 bg-destructive/5' : 'border-green-200 bg-green-50/50'}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {desactualizado ? (
                <>
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <span>Precios Desactualizados</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span>Precios Actualizados</span>
                </>
              )}
            </CardTitle>
            {desactualizado && (
              <Button variant="outline" size="sm" onClick={recalcularPrecios} disabled={recalculando}>
                <RefreshCw className={`h-4 w-4 mr-2 ${recalculando ? 'animate-spin' : ''}`} />
                Recalcular Precios
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Fecha de creación:</span>
                <span className="font-medium">{fechaCreacion}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Última actualización:</span>
                <span className="font-medium">{fechaActualizacion}</span>
              </div>
            </div>
            <div className="space-y-2">
              {desactualizado ? (
                <div className="flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <span className="text-destructive font-medium">
                    {dias !== null ? `Precios desactualizados hace ${dias} ${dias === 1 ? 'día' : 'días'}` : 'Precios sin actualizar'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-green-700 font-medium">
                    {dias !== null ? `Precios actualizados hace ${dias} ${dias === 1 ? 'día' : 'días'}` : 'Precios al día'}
                  </span>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {desactualizado
                  ? 'Los precios de esta configuración tienen más de 30 días. Se recomienda recalcular para usar valores vigentes.'
                  : 'Los precios están actualizados con los valores vigentes de los artículos.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Especificaciones Técnicas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5" />
            Especificaciones Técnicas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-8 md:grid-cols-2">

            {/* Tejido */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Grid className="h-4 w-4 text-muted-foreground" />
                Tejido Romboidal
              </h3>
              <dl className="space-y-2 text-sm">
                {configuracion.tejido_nombre && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Nombre:</dt>
                    <dd className="font-semibold text-right">{configuracion.tejido_nombre}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Código:</dt>
                  <dd className="font-mono font-semibold">{configuracion.tejido_codigo}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Altura:</dt>
                  <dd className="font-semibold">{configuracion.altura}m</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Calibre:</dt>
                  <dd>{configuracion.calibre}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Rombo:</dt>
                  <dd>{configuracion.tamano_rombo}"</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Rollos (180m):</dt>
                  <dd className="font-semibold">18 rollos</dd>
                </div>
                <div className="border-t border-border" />
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Precio por rollo:</dt>
                  <dd className="font-semibold">${formatPrecio(configuracion.precio_tejido_unitario)}</dd>
                </div>
                <div className="flex justify-between text-primary">
                  <dt className="font-medium">Subtotal tejido:</dt>
                  <dd className="font-bold">${formatPrecio(configuracion.costo_tejido_total)}</dd>
                </div>
              </dl>
            </div>

            {/* Postes */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Columns className="h-4 w-4 text-muted-foreground" />
                Postes — <span className="font-bold text-foreground">{configuracion.tipo_poste}</span>
              </h3>
              <dl className="space-y-3 text-sm">
                {/* Esquineros */}
                <div className="space-y-0.5">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Esquineros:</dt>
                    <dd className="font-semibold">{configuracion.cantidad_postes_esquineros} un. × ${formatPrecio(configuracion.precio_poste_esquinero)}</dd>
                  </div>
                  {descripcionesPostes.esquinero && (
                    <p className="text-xs text-muted-foreground pl-1 flex items-start gap-1">
                      <Tag className="h-3 w-3 mt-0.5 shrink-0" />
                      {descripcionesPostes.esquinero.descripcion || descripcionesPostes.esquinero.nombre}
                    </p>
                  )}
                </div>

                {/* Refuerzos */}
                <div className="space-y-0.5">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Refuerzos:</dt>
                    <dd className="font-semibold">{configuracion.cantidad_postes_refuerzos} un. × ${formatPrecio(configuracion.precio_poste_refuerzo)}</dd>
                  </div>
                  {descripcionesPostes.refuerzo && (
                    <p className="text-xs text-muted-foreground pl-1 flex items-start gap-1">
                      <Tag className="h-3 w-3 mt-0.5 shrink-0" />
                      {descripcionesPostes.refuerzo.descripcion || descripcionesPostes.refuerzo.nombre}
                    </p>
                  )}
                </div>

                {/* Intermedios */}
                <div className="space-y-0.5">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Intermedios:</dt>
                    <dd className="font-semibold">{configuracion.cantidad_postes_intermedios} un. × ${formatPrecio(configuracion.precio_poste_intermedio)}</dd>
                  </div>
                  {descripcionesPostes.intermedio && (
                    <p className="text-xs text-muted-foreground pl-1 flex items-start gap-1">
                      <Tag className="h-3 w-3 mt-0.5 shrink-0" />
                      {descripcionesPostes.intermedio.descripcion || descripcionesPostes.intermedio.nombre}
                    </p>
                  )}
                </div>

                {/* Puntales */}
                {configuracion.cantidad_puntales > 0 && (
                  <div className="space-y-0.5">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Puntales:</dt>
                      <dd className="font-semibold">{configuracion.cantidad_puntales} un. × ${formatPrecio(configuracion.precio_puntal)}</dd>
                    </div>
                    {descripcionesPostes.puntal && (
                      <p className="text-xs text-muted-foreground pl-1 flex items-start gap-1">
                        <Tag className="h-3 w-3 mt-0.5 shrink-0" />
                        {descripcionesPostes.puntal.descripcion || descripcionesPostes.puntal.nombre}
                      </p>
                    )}
                  </div>
                )}

                <div className="border-t border-border" />
                <div className="flex justify-between text-primary">
                  <dt className="font-medium">Subtotal postes:</dt>
                  <dd className="font-bold">
                    ${formatPrecio(
                      (configuracion.cantidad_postes_esquineros * configuracion.precio_poste_esquinero) +
                      (configuracion.cantidad_postes_refuerzos * configuracion.precio_poste_refuerzo) +
                      (configuracion.cantidad_postes_intermedios * configuracion.precio_poste_intermedio) +
                      (configuracion.cantidad_puntales * configuracion.precio_puntal)
                    )}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Cordón y Púa */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Circle className="h-4 w-4 text-muted-foreground" />
                Cordón y Púa
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Tipo de cordón:</dt>
                  <dd className="font-semibold">{configuracion.cordon_tipo}</dd>
                </div>
                {configuracion.cordon_tipo !== 'Sin cordón' && (
                  <>
                    {configuracion.cordon_bolsas_ripio > 0 && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Ripio:</dt>
                        <dd>{configuracion.cordon_bolsas_ripio} bolsas</dd>
                      </div>
                    )}
                    {configuracion.cordon_bolsas_cemento > 0 && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Cemento:</dt>
                        <dd>{configuracion.cordon_bolsas_cemento} bolsas</dd>
                      </div>
                    )}
                    <div className="border-t border-border" />
                    <div className="flex justify-between text-primary">
                      <dt className="font-medium">Subtotal cordón:</dt>
                      <dd className="font-bold">${formatPrecio(configuracion.cordon_precio_total)}</dd>
                    </div>
                  </>
                )}
                <div className="flex justify-between pt-1">
                  <dt className="text-muted-foreground flex items-center gap-1">
                    <Zap className="h-3.5 w-3.5" /> Alambre de Púa:
                  </dt>
                  <dd>
                    <Badge variant={configuracion.hilos_pua > 0 ? 'default' : 'outline'}>
                      {configuracion.hilos_pua > 0 ? `${configuracion.hilos_pua} hilos` : 'Sin púa'}
                    </Badge>
                  </dd>
                </div>
                {configuracion.hilos_pua > 0 && (
                  <>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <dt>180m × {configuracion.hilos_pua} hilos × ${formatPrecio(configuracion.precio_pua_por_metro)}/m</dt>
                      <dd className="font-semibold text-foreground">${formatPrecio(configuracion.costo_pua_total)}</dd>
                    </div>
                  </>
                )}
              </dl>
            </div>

            {/* Mano de Obra y Transporte */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Hammer className="h-4 w-4 text-muted-foreground" />
                Mano de Obra y Transporte
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Mano de obra:</dt>
                  <dd className="font-semibold">${formatPrecio(configuracion.precio_mano_obra_por_metro)}/m</dd>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <dt>180m × ${formatPrecio(configuracion.precio_mano_obra_por_metro)}</dt>
                  <dd className="font-semibold text-foreground">${formatPrecio(180 * configuracion.precio_mano_obra_por_metro)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Transporte:</dt>
                  <dd className="font-semibold">${formatPrecio(configuracion.precio_transporte_por_metro)}/m</dd>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <dt>180m × ${formatPrecio(configuracion.precio_transporte_por_metro)}</dt>
                  <dd className="font-semibold text-foreground">${formatPrecio(180 * configuracion.precio_transporte_por_metro)}</dd>
                </div>
                <div className="border-t border-border" />
                <div className="flex justify-between text-primary">
                  <dt className="font-medium">Subtotal:</dt>
                  <dd className="font-bold">
                    ${formatPrecio((180 * configuracion.precio_mano_obra_por_metro) + (180 * configuracion.precio_transporte_por_metro))}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Estado */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                Estado
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Estado:</dt>
                  <dd>
                    <Badge variant={configuracion.activo ? 'default' : 'outline'}>
                      {configuracion.activo ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </dd>
                </div>
                {configuracion.descripcion && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Descripción:</dt>
                    <dd className="text-right max-w-[60%]">{configuracion.descripcion}</dd>
                  </div>
                )}
              </dl>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Desglose de Costos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Desglose de Costos (Base 180m)
          </CardTitle>
          <CardDescription>
            Cálculo detallado de todos los componentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">

            {/* Tejido */}
            <div>
              <h3 className="font-semibold mb-3">1. Tejido Romboidal</h3>
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">18 rollos × ${formatPrecio(configuracion.precio_tejido_unitario)}</span>
                  <span className="font-bold text-lg">${formatPrecio(configuracion.costo_tejido_total)}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {configuracion.tejido_nombre && <>{configuracion.tejido_nombre} — </>}
                  Código: {configuracion.tejido_codigo} (Cal.{configuracion.calibre}, Rombo {configuracion.tamano_rombo}")
                </p>
              </div>
            </div>

            {/* Postes */}
            <div>
              <h3 className="font-semibold mb-3">2. Postes — {configuracion.tipo_poste}</h3>
              <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {configuracion.cantidad_postes_esquineros} esquineros × ${formatPrecio(configuracion.precio_poste_esquinero)}
                  </span>
                  <span className="font-semibold">
                    ${formatPrecio(configuracion.cantidad_postes_esquineros * configuracion.precio_poste_esquinero)}
                  </span>
                </div>
                {descripcionesPostes.esquinero && (
                  <div className="text-xs text-muted-foreground pl-3 -mt-1">
                    {descripcionesPostes.esquinero.descripcion || descripcionesPostes.esquinero.nombre}
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {configuracion.cantidad_postes_refuerzos} refuerzos × ${formatPrecio(configuracion.precio_poste_refuerzo)}
                  </span>
                  <span className="font-semibold">
                    ${formatPrecio(configuracion.cantidad_postes_refuerzos * configuracion.precio_poste_refuerzo)}
                  </span>
                </div>
                {descripcionesPostes.refuerzo && (
                  <div className="text-xs text-muted-foreground pl-3 -mt-1">
                    {descripcionesPostes.refuerzo.descripcion || descripcionesPostes.refuerzo.nombre}
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {configuracion.cantidad_postes_intermedios} intermedios × ${formatPrecio(configuracion.precio_poste_intermedio)}
                  </span>
                  <span className="font-semibold">
                    ${formatPrecio(configuracion.cantidad_postes_intermedios * configuracion.precio_poste_intermedio)}
                  </span>
                </div>
                {descripcionesPostes.intermedio && (
                  <div className="text-xs text-muted-foreground pl-3 -mt-1">
                    {descripcionesPostes.intermedio.descripcion || descripcionesPostes.intermedio.nombre}
                  </div>
                )}
                {configuracion.cantidad_puntales > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {configuracion.cantidad_puntales} puntales × ${formatPrecio(configuracion.precio_puntal)}
                      </span>
                      <span className="font-semibold">
                        ${formatPrecio(configuracion.cantidad_puntales * configuracion.precio_puntal)}
                      </span>
                    </div>
                    {descripcionesPostes.puntal && (
                      <div className="text-xs text-muted-foreground pl-3 -mt-1">
                        {descripcionesPostes.puntal.descripcion || descripcionesPostes.puntal.nombre}
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-semibold">Subtotal Postes:</span>
                  <span className="font-bold text-lg">
                    ${formatPrecio(
                      (configuracion.cantidad_postes_esquineros * configuracion.precio_poste_esquinero) +
                      (configuracion.cantidad_postes_refuerzos * configuracion.precio_poste_refuerzo) +
                      (configuracion.cantidad_postes_intermedios * configuracion.precio_poste_intermedio) +
                      (configuracion.cantidad_puntales * configuracion.precio_puntal)
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Cordón */}
            <div>
              <h3 className="font-semibold mb-3">3. Cordón de Hormigón</h3>
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">
                    {configuracion.cordon_tipo}
                    {configuracion.cordon_bolsas_ripio > 0 && ` (${configuracion.cordon_bolsas_ripio} ripio`}
                    {configuracion.cordon_bolsas_cemento > 0 && `, ${configuracion.cordon_bolsas_cemento} cemento)`}
                  </span>
                  <span className="font-bold text-lg">${formatPrecio(configuracion.cordon_precio_total)}</span>
                </div>
              </div>
            </div>

            {/* Púa */}
            {configuracion.hilos_pua > 0 && (
              <div>
                <h3 className="font-semibold mb-3">4. Alambre de Púa</h3>
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">
                      180m × {configuracion.hilos_pua} hilos × ${formatPrecio(configuracion.precio_pua_por_metro)}/m
                    </span>
                    <span className="font-bold text-lg">${formatPrecio(configuracion.costo_pua_total)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Accesorios */}
            <div>
              <h3 className="font-semibold mb-3">5. Accesorios</h3>
              <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                {configuracion.cantidad_ganchos > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {configuracion.cantidad_ganchos} ganchos × ${formatPrecio(configuracion.precio_unitario_ganchos)}
                    </span>
                    <span className="font-semibold">
                      ${formatPrecio(configuracion.cantidad_ganchos * configuracion.precio_unitario_ganchos)}
                    </span>
                  </div>
                )}
                {configuracion.cantidad_planchuelas > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {configuracion.cantidad_planchuelas} planchuelas × ${formatPrecio(configuracion.precio_unitario_planchuelas)}
                    </span>
                    <span className="font-semibold">
                      ${formatPrecio(configuracion.cantidad_planchuelas * configuracion.precio_unitario_planchuelas)}
                    </span>
                  </div>
                )}
                {configuracion.cantidad_torniquetes > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {configuracion.cantidad_torniquetes} torniquetes × ${formatPrecio(configuracion.precio_unitario_torniquetes)}
                    </span>
                    <span className="font-semibold">
                      ${formatPrecio(configuracion.cantidad_torniquetes * configuracion.precio_unitario_torniquetes)}
                    </span>
                  </div>
                )}
                {configuracion.cantidad_esparragos > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {configuracion.cantidad_esparragos} espárragos × ${formatPrecio(configuracion.precio_unitario_esparragos)}
                    </span>
                    <span className="font-semibold">
                      ${formatPrecio(configuracion.cantidad_esparragos * configuracion.precio_unitario_esparragos)}
                    </span>
                  </div>
                )}
                {configuracion.metros_alambre_ar > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {configuracion.metros_alambre_ar}m alambre A/R × ${formatPrecio(configuracion.precio_metro_alambre_ar)}/m
                    </span>
                    <span className="font-semibold">
                      ${formatPrecio(configuracion.metros_alambre_ar * configuracion.precio_metro_alambre_ar)}
                    </span>
                  </div>
                )}
                {configuracion.kg_clavos > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {configuracion.kg_clavos}kg clavos × ${formatPrecio(configuracion.precio_kg_clavos)}/kg
                    </span>
                    <span className="font-semibold">
                      ${formatPrecio(configuracion.kg_clavos * configuracion.precio_kg_clavos)}
                    </span>
                  </div>
                )}
                {configuracion.kg_alambre_negro > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {configuracion.kg_alambre_negro}kg alambre negro × ${formatPrecio(configuracion.precio_kg_alambre_negro)}/kg
                    </span>
                    <span className="font-semibold">
                      ${formatPrecio(configuracion.kg_alambre_negro * configuracion.precio_kg_alambre_negro)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-semibold">Subtotal Accesorios:</span>
                  <span className="font-bold text-lg">
                    ${formatPrecio(configuracion.precio_total_accesorios ??
                      (
                        (configuracion.cantidad_ganchos * configuracion.precio_unitario_ganchos) +
                        (configuracion.cantidad_planchuelas * configuracion.precio_unitario_planchuelas) +
                        (configuracion.cantidad_torniquetes * configuracion.precio_unitario_torniquetes) +
                        (configuracion.cantidad_esparragos * configuracion.precio_unitario_esparragos) +
                        (configuracion.metros_alambre_ar * configuracion.precio_metro_alambre_ar) +
                        (configuracion.kg_clavos * configuracion.precio_kg_clavos) +
                        (configuracion.kg_alambre_negro * configuracion.precio_kg_alambre_negro)
                      )
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Mano de Obra y Transporte */}
            <div>
              <h3 className="font-semibold mb-3">6. Mano de Obra y Transporte</h3>
              <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    180m × ${formatPrecio(configuracion.precio_mano_obra_por_metro)} (mano de obra)
                  </span>
                  <span className="font-semibold">
                    ${formatPrecio(180 * configuracion.precio_mano_obra_por_metro)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    180m × ${formatPrecio(configuracion.precio_transporte_por_metro)} (transporte)
                  </span>
                  <span className="font-semibold">
                    ${formatPrecio(180 * configuracion.precio_transporte_por_metro)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-semibold">Subtotal:</span>
                  <span className="font-bold text-lg">
                    ${formatPrecio((180 * configuracion.precio_mano_obra_por_metro) + (180 * configuracion.precio_transporte_por_metro))}
                  </span>
                </div>
              </div>
            </div>

            {/* Total Final */}
            <div className="bg-primary/10 p-6 rounded-lg border-2 border-primary">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">TOTAL 180 METROS:</span>
                  <span className="text-3xl font-bold text-green-600">
                    ${formatPrecio(configuracion.precio_base_180m)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-primary/30">
                  <span className="font-semibold">Precio por metro lineal:</span>
                  <span className="text-2xl font-bold text-primary">
                    ${formatPrecio(configuracion.precio_por_metro_lineal)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Precio/m (terrenos &lt;50m) +50%:</span>
                  <span className="text-lg font-bold text-orange-600">
                    ${formatPrecio(configuracion.precio_por_metro_menor_50m)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Uso en Presupuestos
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-900">
          <p className="mb-2">
            Esta configuración se utiliza como base de cálculo al crear presupuestos de cercado perimetral.
          </p>
          <ul className="space-y-1 ml-4">
            <li>• El sistema calcula de forma proporcional según los metros lineales del terreno</li>
            <li>• Para terrenos menores a 50 metros lineales, se aplica automáticamente un recargo del 50%</li>
            <li>• Todos los componentes se ajustan proporcionalmente (postes, accesorios, mano de obra, etc.)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
