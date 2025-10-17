import { supabase } from '@/lib/supabaseClient'
import ArticuloCard from '@/components/ArticuloCard'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import WhatsAppButton from '@/components/WhatsAppButton'
import Link from 'next/link'

async function getArticulosConPrecios() {
  const { data: articulos, error } = await supabase
    .from('articulos')
    .select(`
      *,
      precios_venta(precio_venta, vigente)
    `)
    .eq('publicado', true)  // Solo artículos publicados
    .order('nombre')

  if (error) {
    console.error('Error al cargar artículos:', error)
    return []
  }

  return articulos?.map((articulo: any) => {
    // Buscar el precio vigente
    const precioVigente = articulo.precios_venta?.find((p: any) => p.vigente === true)
    
    return {
      ...articulo,
      // Solo mostrar precio si mostrar_precio_publico es true Y hay precio vigente
      precio: articulo.mostrar_precio_publico && precioVigente ? precioVigente.precio_venta : null,
    }
  }) || []
}

export default async function HomePage() {
  const articulos = await getArticulosConPrecios()

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-brand-red to-brand-darkred text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Alambres del Norte SRL
            </h1>
            <p className="text-xl md:text-2xl mb-8">
              Fabricamos, instalamos y suministramos cercos de calidad
            </p>
            <p className="text-lg mb-8 max-w-3xl mx-auto">
              Con más de 6 años de experiencia en el mercado, ofrecemos soluciones 
              completas para cercado perimetral, rural y urbano. Calidad garantizada 
              y servicio profesional.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="#productos" 
                className="bg-white text-brand-red px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
              >
                Ver Productos
              </a>
              <a 
                href="/contacto" 
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-brand-red transition-colors"
              >
                Contactanos
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Características */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-brand-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Calidad Garantizada</h3>
              <p className="text-gray-600">Productos certificados y materiales de primera calidad</p>
            </div>
            
            <div className="text-center">
              <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-brand-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Entrega Rápida</h3>
              <p className="text-gray-600">Stock permanente y envíos a todo el país</p>
            </div>
            
            <div className="text-center">
              <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-brand-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Asesoramiento</h3>
              <p className="text-gray-600">Equipo profesional para ayudarte en tu proyecto</p>
            </div>
          </div>
        </div>
      </section>

      {/* Productos Section */}
      <section id="productos" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Nuestros Productos
            </h2>
            <p className="text-xl text-gray-600">
              Amplio catálogo de productos para todo tipo de cercado
            </p>
          </div>

          {articulos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articulos.map((articulo) => (
                <ArticuloCard 
                  key={articulo.id} 
                  articulo={articulo} 
                  showPrice={true}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">
                Estamos actualizando nuestro catálogo. Pronto tendremos más productos disponibles.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Contacto */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            ¿Listo para empezar tu proyecto?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Contactanos y obtené asesoramiento personalizado sin compromiso
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contacto"
              className="bg-brand-red text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-darkred transition-colors text-lg shadow-lg"
            >
              Solicitar Presupuesto
            </a>
            <a
              href="https://wa.me/5493874773393?text=🌐Hola%20quisiera%20quisiera%20comunicarme%20con%20un%20vendedor%20😃"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 text-white px-8 py-4 rounded-lg font-semibold hover:bg-green-600 transition-colors text-lg shadow-lg flex items-center justify-center gap-2"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              WhatsApp Directo
            </a>
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  )
}

