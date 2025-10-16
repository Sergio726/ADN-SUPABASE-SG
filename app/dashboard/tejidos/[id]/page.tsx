'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { ArrowLeft, Edit, CheckCircle, XCircle, Package, Ruler, Hash, Weight, DollarSign, TrendingUp, Calendar } from 'lucide-react'
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
            <div className="p-4 bg-muted rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Alambre Galvanizado:</span>
                <span className="font-medium text-sm">{tejido.alambre_nombre}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Precio alambre/kg:</span>
                <span className="font-semibold">${tejido.alambre_precio_kg?.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Alambre necesario:</span>
                <span className="font-semibold">{tejido.cantidad_alambre || tejido.peso_kg} kg</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Mano de obra:</span>
                <span className="font-semibold">${(tejido.costo_mano_obra || tejido.mano_obra)?.toLocaleString()}</span>
              </div>
            </div>

            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-orange-600" />
                  <span className="font-medium">Precio de Costo:</span>
                </div>
                <span className="text-2xl font-bold text-orange-600">
                  ${tejido.precio_costo?.toLocaleString() || 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Precio de Venta:</span>
                </div>
                <span className="text-3xl font-bold text-green-600">
                  ${tejido.precio_venta?.toLocaleString() || 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm text-muted-foreground">Margen de ganancia:</span>
                <Badge variant="outline" className="text-base">
                  {tejido.margen_porcentaje || 30}%
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Precio por metro:</span>
                <span className="font-semibold">
                  ${((tejido.precio_venta || 0) / (tejido.largo || 10)).toLocaleString()}/m
                </span>
              </div>
            </div>

            <div className="bg-muted p-3 rounded-lg text-xs space-y-1">
              <p className="font-semibold mb-2">Fórmula de Cálculo:</p>
              <p className="text-muted-foreground">
                Costo = (Peso × Precio Alambre) + Mano de Obra
              </p>
              <p className="text-muted-foreground">
                Venta = Costo × (1 + Margen/100)
              </p>
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

      {/* Cálculo Detallado */}
      <Card>
        <CardHeader>
          <CardTitle>Desglose de Cálculo</CardTitle>
          <CardDescription>
            Cómo se calcula el precio de este tejido
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm">
                {tejido.peso_kg} kg × ${tejido.alambre_precio_kg?.toLocaleString()} (alambre)
              </span>
              <span className="font-bold">
                ${(tejido.peso_kg * (tejido.alambre_precio_kg || 0)).toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-center text-muted-foreground">
              <span className="text-xl">+</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm">Mano de obra</span>
              <span className="font-bold">${tejido.mano_obra?.toLocaleString()}</span>
            </div>

            <div className="border-t-2 border-dashed pt-3">
              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                <span className="font-semibold text-orange-900">Precio de Costo</span>
                <span className="text-2xl font-bold text-orange-600">
                  ${tejido.precio_costo?.toLocaleString() || 'N/A'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center text-muted-foreground">
              <span className="text-xl">× {(1 + (tejido.margen_porcentaje || 30) / 100).toFixed(2)}</span>
              <span className="text-sm ml-2">(+{tejido.margen_porcentaje || 30}% margen)</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border-2 border-green-300">
              <span className="text-lg font-semibold text-green-900">Precio de Venta</span>
              <span className="text-3xl font-bold text-green-600">
                ${tejido.precio_venta?.toLocaleString() || 'N/A'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="font-medium text-blue-900">Precio por Metro Lineal</span>
              <span className="text-xl font-bold text-blue-600">
                ${tejido.precio_por_metro?.toLocaleString() || 'N/A'}/m
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

