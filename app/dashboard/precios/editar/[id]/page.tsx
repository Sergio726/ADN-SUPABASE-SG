'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Card, { CardBody, CardHeader } from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function EditarPrecioPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)
  const [precio, setPrecio] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    precio_costo: '',
    precio_venta: '',
    vigente: true,
    fecha_inicio: '',
    fecha_fin: '',
  })

  useEffect(() => {
    const fetchData = async () => {
      // Cargar precio con información del artículo
      const { data: precioData } = await supabase
        .from('precios_venta')
        .select(`
          *,
          articulos(id, nombre, categoria)
        `)
        .eq('id', params.id)
        .single()

      if (precioData) {
        setPrecio(precioData)
        setFormData({
          precio_costo: precioData.precio_costo.toString(),
          precio_venta: precioData.precio_venta.toString(),
          vigente: precioData.vigente,
          fecha_inicio: precioData.fecha_inicio || '',
          fecha_fin: precioData.fecha_fin || '',
        })
      }
    }
    
    fetchData()
  }, [params.id, supabase])

  const calcularMargen = () => {
    const costo = parseFloat(formData.precio_costo)
    const venta = parseFloat(formData.precio_venta)
    if (costo > 0 && venta > 0) {
      return (((venta - costo) / costo) * 100).toFixed(2)
    }
    return '0.00'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('precios_venta')
        .update({
          precio_costo: parseFloat(formData.precio_costo),
          precio_venta: parseFloat(formData.precio_venta),
          vigente: formData.vigente,
          fecha_inicio: formData.fecha_inicio || null,
          fecha_fin: formData.fecha_fin || null,
        })
        .eq('id', params.id)

      if (error) throw error

      alert('Precio actualizado exitosamente')
      router.push('/dashboard/precios')
    } catch (error: any) {
      console.error('Error:', error)
      alert('Error al actualizar el precio: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar este precio? Esta acción no se puede deshacer.')) {
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('precios_venta')
        .delete()
        .eq('id', params.id)

      if (error) throw error

      alert('Precio eliminado exitosamente')
      router.push('/dashboard/precios')
    } catch (error: any) {
      console.error('Error:', error)
      alert('Error al eliminar el precio: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!precio) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red"></div>
      </div>
    )
  }

  const margen = calcularMargen()

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Editar Precio</h2>
        <p className="text-gray-600 mt-1">
          Artículo: <span className="font-semibold text-brand-red">{precio.articulos?.nombre}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Información del Artículo */}
        <Card className="mb-6">
          <CardHeader>
            <h3 className="text-lg font-semibold">Información del Artículo</h3>
          </CardHeader>
          <CardBody>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Artículo:</span>
                  <p className="font-semibold text-gray-900">{precio.articulos?.nombre}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Categoría:</span>
                  <p className="font-semibold text-gray-900">{precio.articulos?.categoria || 'Sin categoría'}</p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Precios */}
        <Card className="mb-6">
          <CardHeader>
            <h3 className="text-lg font-semibold">Precios</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Input
                  label="Precio de Costo *"
                  type="number"
                  step="0.01"
                  value={formData.precio_costo}
                  onChange={(e) => setFormData({ ...formData, precio_costo: e.target.value })}
                  required
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500 mt-1">Costo del producto sin IVA</p>
              </div>

              <div>
                <Input
                  label="Precio de Venta *"
                  type="number"
                  step="0.01"
                  value={formData.precio_venta}
                  onChange={(e) => setFormData({ ...formData, precio_venta: e.target.value })}
                  required
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500 mt-1">Precio al que se vende al cliente</p>
              </div>
            </div>

            {/* Margen Calculado */}
            {formData.precio_costo && formData.precio_venta && (
              <div className="mt-6 p-6 bg-gradient-to-r from-brand-red/10 to-red-50 rounded-lg border-l-4 border-brand-red">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Margen de Ganancia</p>
                    <p className="text-3xl font-bold text-brand-red">{margen}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 mb-1">Ganancia por Unidad</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      ${(parseFloat(formData.precio_venta) - parseFloat(formData.precio_costo)).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  {parseFloat(margen) >= 30 ? (
                    <>
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-green-700 font-medium">Margen excelente</span>
                    </>
                  ) : parseFloat(margen) >= 15 ? (
                    <>
                      <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-yellow-700 font-medium">Margen aceptable</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-red-700 font-medium">Margen bajo - Revisar</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Vigencia */}
        <Card className="mb-6">
          <CardHeader>
            <h3 className="text-lg font-semibold">Vigencia del Precio</h3>
          </CardHeader>
          <CardBody>
            <div className="mb-6">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.vigente}
                  onChange={(e) => setFormData({ ...formData, vigente: e.target.checked })}
                  className="w-5 h-5 text-brand-red border-gray-300 rounded focus:ring-brand-red focus:ring-2"
                />
                <div>
                  <span className="text-sm font-semibold text-gray-900">Precio Vigente</span>
                  <p className="text-xs text-gray-600">Si está desactivado, este precio no se mostrará al público</p>
                </div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Input
                  label="Fecha de Inicio"
                  type="date"
                  value={formData.fecha_inicio}
                  onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">Fecha desde la cual es válido este precio</p>
              </div>

              <div>
                <Input
                  label="Fecha de Fin (opcional)"
                  type="date"
                  value={formData.fecha_fin}
                  onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">Dejar vacío si no tiene fecha de vencimiento</p>
              </div>
            </div>

            {formData.fecha_fin && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Precio con fecha de vencimiento</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Este precio dejará de ser vigente el {new Date(formData.fecha_fin).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Botones de acción */}
        <div className="flex justify-between">
          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : '💾 Guardar Cambios'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancelar
            </Button>
          </div>
          
          <Button
            type="button"
            variant="danger"
            onClick={handleDelete}
            disabled={loading}
          >
            🗑️ Eliminar Precio
          </Button>
        </div>
      </form>
    </div>
  )
}

