'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { ArrowLeft, Edit, CheckCircle, XCircle, Package, Ruler, Hash, Weight, DollarSign, TrendingUp, Calendar, FileText, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

export default function VerTejidoPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [tejido, setTejido] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarTejido()
  }, [params.id])

  async function cargarTejido() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('v_tejidos_con_precios')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) {
        console.error('Error al cargar tejido:', error)
        toast({
          title: "Error al cargar tejido",
          description: error.message,
          variant: "destructive",
        })
        router.push('/dashboard/tejidos')
        return
      }

      setTejido(data)
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error inesperado",
        description: "No se pudo cargar el tejido",
        variant: "destructive",
      })
      router.push('/dashboard/tejidos')
    } finally {
      setLoading(false)
    }
  }

  async function toggleActivo() {
    try {
      const { error } = await supabase
        .from('tejidos_configuraciones')
        .update({ activo: !tejido.activo })
        .eq('id', params.id)

      if (error) throw error

      toast({
        title: "¡Actualizado!",
        description: `Tejido ${!tejido.activo ? 'activado' : 'desactivado'} correctamente`,
      })

      cargarTejido()
    } catch (error: any) {
      console.error('Error:', error)
      toast({
        title: "Error al actualizar",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!tejido) {
    return null
  }

  const calidadVariant = 
    tejido.categoria_calidad === 'Económica' ? 'secondary' :
    tejido.categoria_calidad === 'Standard' ? 'default' :
    'destructive'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link href="/dashboard/tejidos">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{tejido.nombre}</h1>
            <p className="text-muted-foreground mt-1">
              Código: <span className="font-mono font-semibold">{tejido.codigo}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={tejido.activo ? "outline" : "default"}
            onClick={toggleActivo}
          >
            {tejido.activo ? (
              <><XCircle className="h-4 w-4 mr-2" /> Desactivar</>
            ) : (
              <><CheckCircle className="h-4 w-4 mr-2" /> Activar</>
            )}
          </Button>
          <Button asChild>
            <Link href={`/dashboard/tejidos/editar/${params.id}`}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Especificaciones Técnicas */}
        <Card>
          <CardHeader>
            <CardTitle>Especificaciones Técnicas</CardTitle>
            <CardDescription>Características del tejido romboidal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <Hash className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Calibre</p>
                  <p className="text-lg font-bold">Cal. {tejido.calibre}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <Ruler className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Altura</p>
                  <p className="text-lg font-bold">{tejido.altura} metros</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <Package className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tamaño Rombo</p>
                  <p className="text-lg font-bold">{tejido.tamano_rombo} pulgadas</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <Weight className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Peso</p>
                  <p className="text-lg font-bold">{tejido.cantidad_alambre || tejido.peso_kg} kg</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Largo del rollo</span>
                <span className="font-semibold">{tejido.largo} metros</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-muted-foreground">Categoría de Calidad</span>
                <Badge variant={calidadVariant}>{tejido.categoria_calidad}</Badge>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-muted-foreground">Estado</span>
                <Badge variant={tejido.activo ? 'default' : 'outline'}>
                  {tejido.activo ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
            </div>

            {tejido.descripcion && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-1">Descripción:</p>
                <p className="text-sm">{tejido.descripcion}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Costos y Precios */}
        <Card>
          <CardHeader>
            <CardTitle>Costos y Precios</CardTitle>
            <CardDescription>Cálculo automático basado en materia prima</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Información de Materia Prima */}
            <div className="p-4 bg-muted rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Alambre Galvanizado:</span>
                <span className="font-medium text-sm">{tejido.alambre_nombre}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Precio alambre/kg:</span>
                <span className="font-semibold">${tejido.alambre_precio_kg?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Alambre necesario:</span>
                <span className="font-semibold">{tejido.cantidad_alambre || tejido.peso_kg} kg</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm text-muted-foreground">Costo de alambre:</span>
                <span className="font-semibold text-orange-600">
                  ${((tejido.cantidad_alambre || tejido.peso_kg || 0) * (tejido.alambre_precio_kg || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Mano de obra:</span>
                <span className="font-semibold">${(tejido.costo_mano_obra || tejido.mano_obra)?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Precio de Costo */}
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-orange-600" />
                  <span className="font-medium">Precio de Costo:</span>
                </div>
                <span className="text-2xl font-bold text-orange-600">
                  ${tejido.precio_costo?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 'N/A'}
                </span>
              </div>
              <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-orange-300">
                <p className="flex justify-between">
                  <span>Alambre ({tejido.cantidad_alambre || tejido.peso_kg} kg × ${tejido.alambre_precio_kg?.toLocaleString()}):</span>
                  <span className="font-medium">${((tejido.cantidad_alambre || tejido.peso_kg || 0) * (tejido.alambre_precio_kg || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </p>
                <p className="flex justify-between">
                  <span>Mano de obra:</span>
                  <span className="font-medium">${(tejido.costo_mano_obra || tejido.mano_obra)?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </p>
              </div>
            </div>

            {/* Precios de Venta */}
            <div className="border-t pt-4 space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                {/* Precio Efectivo */}
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-xs font-medium text-green-800">Efectivo</span>
                  </div>
                  <div className="text-xl font-bold text-green-700">
                    ${tejido.precio_venta?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 'N/A'}
                  </div>
                  {tejido.margen_efectivo && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Margen: {tejido.margen_efectivo}%
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    ${((tejido.precio_venta || 0) / (tejido.largo || 10)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/m
                  </div>
                </div>

                {/* Precio Lista/Factura */}
                {tejido.precio_lista && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="text-xs font-medium text-blue-800">Factura/Lista</span>
                    </div>
                    <div className="text-xl font-bold text-blue-700">
                      ${tejido.precio_lista.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Precio base × 1.21 (incluye IVA)
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ${((tejido.precio_lista || 0) / (tejido.largo || 10)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/m
                    </div>
                  </div>
                )}

                {/* Precio Tarjeta - Calculado desde precio base */}
                {tejido.precio_venta && (
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard className="h-4 w-4 text-purple-600" />
                      <span className="text-xs font-medium text-purple-800">Tarjeta</span>
                    </div>
                    <div className="text-xl font-bold text-purple-700">
                      ${((tejido.precio_venta || 0) * 1.3).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Precio base × 1.3 (incluye IVA 21%)
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ${(((tejido.precio_venta || 0) * 1.3) / (tejido.largo || 10)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/m
                    </div>
                  </div>
                )}
              </div>

              {/* Margen de ganancia general */}
              {tejido.margen_efectivo && (
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Margen de ganancia (efectivo):</span>
                  <Badge variant="outline" className="text-base">
                    {tejido.margen_efectivo}%
                  </Badge>
                </div>
              )}
            </div>

            {/* Fórmulas de Cálculo */}
            <div className="bg-muted p-4 rounded-lg text-xs space-y-2">
              <p className="font-semibold mb-2">Fórmulas de Cálculo:</p>
              <div className="space-y-1">
                <p className="text-muted-foreground">
                  <span className="font-medium">Costo:</span> ({tejido.cantidad_alambre || tejido.peso_kg || 0} kg × ${tejido.alambre_precio_kg?.toLocaleString()}) + ${(tejido.costo_mano_obra || tejido.mano_obra)?.toLocaleString()} = ${tejido.precio_costo?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 'N/A'}
                </p>
                {tejido.precio_venta && (
                  <p className="text-muted-foreground">
                    <span className="font-medium">Venta Efectivo:</span> ${tejido.precio_costo?.toLocaleString()} × (1 + {tejido.margen_efectivo || 45}/100) = ${tejido.precio_venta?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                )}
                {tejido.precio_lista && (
                  <p className="text-muted-foreground">
                    <span className="font-medium">Venta Lista:</span> ${tejido.precio_venta?.toLocaleString()} × 1.21 = ${tejido.precio_lista.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                )}
              </div>
            </div>

            {tejido.horas_fabricacion && (
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm text-muted-foreground">Horas de fabricación:</span>
                <span className="font-medium">{tejido.horas_fabricacion} hs</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Información Adicional */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Creado</p>
                <p className="font-medium">
                  {new Date(tejido.creado_en).toLocaleDateString('es-AR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Última actualización</p>
                <p className="font-medium">
                  {new Date(tejido.actualizado_en).toLocaleDateString('es-AR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>

            {tejido.articulo_nombre && (
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Artículo vinculado</p>
                  <p className="font-medium">{tejido.articulo_nombre}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

