import { supabase } from '@/lib/supabaseClient'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import WhatsAppButton from '@/components/WhatsAppButton'
import { Badge } from '@/components/ui/badge'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Package } from 'lucide-react'

async function getArticulo(id: string) {
  const { data: articulo, error } = await supabase
    .from('articulos')
    .select(`
      *,
      proveedores(nombre),
      precios_venta(precio_venta, precio_costo, margen, vigente)
    `)
    .eq('id', id)
    .eq('publicado', true)  // Solo artículos publicados
    .single()

  if (error || !articulo) {
    return null
  }

  return articulo
}

export default async function ArticuloDetailPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const articulo = await getArticulo(params.id)

  if (!articulo) {
    notFound()
  }

  // Buscar el precio vigente
  const precioVigente = articulo.precios_venta?.find((p: any) => p.vigente === true)
  const precio = precioVigente?.precio_venta || 0
  const mostrarPrecio = articulo.mostrar_precio_publico && precio > 0

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-primary">
                  Inicio
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link href="/#productos" className="hover:text-primary">
                  Productos
                </Link>
              </li>
              <li>/</li>
              <li className="text-foreground font-medium">{articulo.nombre}</li>
            </ol>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Imagen - Formato Instagram */}
            <div className="space-y-4">
              {articulo.imagen_url ? (
                <div className="relative w-full max-w-md mx-auto">
                  <div className="relative w-full aspect-[4/5] bg-muted rounded-lg overflow-hidden">
                    <Image
                      src={articulo.imagen_url}
                      alt={articulo.nombre}
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Formato optimizado para redes sociales
                  </p>
                </div>
              ) : (
                <div className="relative w-full max-w-md mx-auto">
                  <div className="relative w-full aspect-[4/5] bg-muted rounded-lg flex items-center justify-center">
                    <Package className="h-24 w-24 text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>

            {/* Detalles */}
            <div className="space-y-6">
              {/* Header */}
              <div>
                <h1 className="text-4xl font-bold mb-4">
                  {articulo.nombre}
                </h1>
                
                {articulo.categoria && (
                  <Badge variant="secondary" className="text-base px-3 py-1">
                    {articulo.categoria}
                  </Badge>
                )}
              </div>

              {/* Price */}
              {mostrarPrecio ? (
                <div className="p-6 bg-primary/10 border border-primary/20 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-2">Precio</div>
                  <div className="text-4xl font-bold text-primary">
                    ${precio.toLocaleString('es-AR')}
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    por {articulo.unidad}
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-muted rounded-lg text-center">
                  <p className="text-lg font-medium mb-2">Precio disponible por consulta</p>
                  <p className="text-sm text-muted-foreground">
                    Contactanos para conocer el precio de este producto
                  </p>
                </div>
              )}

              {/* Description */}
              {articulo.descripcion && (
                <div>
                  <h2 className="text-2xl font-semibold mb-4">
                    Descripción
                  </h2>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    {articulo.descripcion}
                  </p>
                </div>
              )}

              {/* Details */}
              <div>
                <h2 className="text-2xl font-semibold mb-4">
                  Detalles del Producto
                </h2>
                <dl className="space-y-3">
                  <div className="flex justify-between border-b pb-2">
                    <dt className="text-sm font-medium text-muted-foreground">Unidad de medida</dt>
                    <dd className="text-sm font-semibold">{articulo.unidad}</dd>
                  </div>
                  
                  {articulo.proveedores && (
                    <div className="flex justify-between border-b pb-2">
                      <dt className="text-sm font-medium text-muted-foreground">Proveedor</dt>
                      <dd className="text-sm font-semibold">{articulo.proveedores.nombre}</dd>
                    </div>
                  )}
                  
                  <div className="flex justify-between border-b pb-2">
                    <dt className="text-sm font-medium text-muted-foreground">Disponibilidad</dt>
                    <dd className="text-sm font-semibold text-green-600">En stock</dd>
                  </div>
                </dl>
              </div>

              {/* CTA */}
              <div className="bg-muted p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">
                  ¿Interesado en este producto?
                </h3>
                <p className="text-muted-foreground mb-4">
                  Contactanos para más información, presupuestos o realizar tu pedido.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href="/contacto"
                    className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors text-center"
                  >
                    Solicitar Presupuesto
                  </a>
                  <a
                    href={`https://wa.me/5493874773393?text=Hola, quisiera consultar sobre: ${encodeURIComponent(articulo.nombre)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border-2 border-green-500 text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors text-center flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  )
}
