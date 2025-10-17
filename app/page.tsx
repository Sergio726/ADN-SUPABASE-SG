'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import ArticuloCard from '@/components/ArticuloCard'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import WhatsAppButton from '@/components/WhatsAppButton'
import Link from 'next/link'

export default function HomePage() {
  const [articulos, setArticulos] = useState<any[]>([])
  const [mostrarTodos, setMostrarTodos] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargarArticulos() {
      const { data: articulosData, error } = await supabase
        .from('articulos')
        .select(`
          *,
          precios_venta(precio_venta, vigente)
        `)
        .eq('publicado', true)
        .order('nombre')

      if (error) {
        console.error('Error al cargar artículos:', error)
        setLoading(false)
        return
      }

      const articulosConPrecios = articulosData?.map((articulo: any) => {
        const precioVigente = articulo.precios_venta?.find((p: any) => p.vigente === true)
        
        return {
          ...articulo,
          precio: articulo.mostrar_precio_publico && precioVigente ? precioVigente.precio_venta : null,
        }
      }) || []

      console.log('Artículos cargados en home:', articulosConPrecios.length)
      setArticulos(articulosConPrecios)
      setLoading(false)
    }

    cargarArticulos()
  }, [])

  const articulosMostrar = mostrarTodos ? articulos : articulos.slice(0, 6)

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Premium */}
      <section className="relative bg-gradient-to-br from-brand-red via-brand-darkred to-red-900 text-white py-24 overflow-hidden">
        {/* Patrón de fondo sutil */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.1) 35px, rgba(255,255,255,.1) 70px)'
          }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Badge de USP */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-6 py-2 rounded-full mb-6 border border-white/20">
              <svg className="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-white font-semibold">Sabemos que no somos los únicos, por eso decidimos ser los mejores</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Cercado Perimetral<br />
              <span className="text-yellow-300">Llave en Mano</span>
            </h1>
            
            <p className="text-xl md:text-2xl mb-4 max-w-3xl mx-auto font-light">
              Fabricación propia • Instalación profesional • Garantía 90 días
            </p>
            
            <p className="text-lg mb-8 max-w-2xl mx-auto text-white/90">
              <strong>6 años de experiencia</strong> en Salta y Jujuy. Servicio completo para <strong>empresas</strong> (Factura A, cheques diferidos) y <strong>particulares</strong>.
            </p>

            {/* CTAs principales */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <a 
                href="https://wa.me/5493874773393?text=Hola! Quiero solicitar una cotización para cerco perimetral"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-500 text-white px-10 py-4 rounded-lg font-bold hover:bg-green-600 transition-all shadow-2xl text-lg flex items-center justify-center gap-3 hover:scale-105 transform"
              >
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                Cotizar por WhatsApp
              </a>
              
              <a 
                href="tel:+5493874773393"
                className="border-2 border-white text-white px-10 py-4 rounded-lg font-bold hover:bg-white hover:text-brand-red transition-all text-lg flex items-center justify-center gap-3"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Llamar Ahora
              </a>
            </div>

            {/* Badges de confianza */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-white/80">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Factura A
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Cheques Diferidos
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Envío Gratis Salta
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Garantía 90 días
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Productos Destacados */}
      <section id="productos" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Nuestros Productos Destacados
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tejido romboidal de fabricación propia y materiales de primera calidad para tu proyecto
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">Cargando productos...</p>
            </div>
          ) : articulos.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {articulosMostrar.map((articulo) => (
                  <ArticuloCard 
                    key={articulo.id} 
                    articulo={articulo} 
                    showPrice={true}
                  />
                ))}
              </div>
              
              {articulos.length > 6 && (
                <div className="text-center">
                  <button 
                    onClick={() => setMostrarTodos(!mostrarTodos)}
                    className="inline-block bg-brand-red text-white px-8 py-3 rounded-lg font-semibold hover:bg-brand-darkred transition-colors"
                  >
                    {mostrarTodos 
                      ? 'Ver Menos' 
                      : `Ver Todo el Catálogo (${articulos.length} productos)`
                    }
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">
                Estamos actualizando nuestro catálogo...
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Por Qué Elegirnos */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Por Qué Elegirnos
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Sabemos que no somos los únicos, <strong className="text-brand-red">por eso decidimos ser los mejores</strong>
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Garantía 90 días */}
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all border-t-4 border-brand-red">
              <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-brand-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-center mb-3">Garantía 90 Días</h3>
              <p className="text-gray-600 text-center">
                Respaldamos nuestro trabajo con garantía extendida en servicio e instalación
              </p>
            </div>

            {/* Fabricación Propia */}
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all border-t-4 border-brand-red">
              <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-brand-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-center mb-3">Fabricación Propia</h3>
              <p className="text-gray-600 text-center">
                Producimos nuestro propio tejido romboidal - Calidad y precio directo de fábrica
              </p>
            </div>

            {/* Entrega Rápida */}
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all border-t-4 border-brand-red">
              <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-brand-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-center mb-3">Entrega Rápida</h3>
              <p className="text-gray-600 text-center">
                Stock permanente y envío gratis en Salta - Recibí tu pedido en tiempo récord
              </p>
            </div>

            {/* Experiencia Local */}
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all border-t-4 border-brand-red">
              <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-brand-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-center mb-3">Experiencia Local</h3>
              <p className="text-gray-600 text-center">
                Amplia trayectoria en Salta y Jujuy - Conocemos el clima y las necesidades de la zona
              </p>
            </div>

            {/* Servicio Llave en Mano */}
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all border-t-4 border-brand-red">
              <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-brand-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-center mb-3">Llave en Mano</h3>
              <p className="text-gray-600 text-center">
                Despreocupate de todo - Nos encargamos desde la medición hasta la instalación final
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Segmentación Empresas vs Particulares */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            ¿Qué tipo de proyecto tenés?
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Para Empresas */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 p-8 rounded-2xl border-2 border-red-200 hover:border-brand-red transition-all hover:shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-brand-red p-4 rounded-xl">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Para Empresas</h3>
                  <p className="text-gray-700">Grandes proyectos y volumen</p>
                </div>
              </div>
              
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-brand-red flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <strong>Factura A</strong> - Inscriptos y habilitados
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-brand-red flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <strong>Cheques diferidos</strong> - 45, 60 y 90 días
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-brand-red flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <strong>Cercos Olímpicos</strong> - Máxima seguridad
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-brand-red flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <strong>Precios por volumen</strong> - Descuentos especiales
                  </div>
                </li>
              </ul>
              
              <a 
                href="/contacto?tipo=empresa"
                className="block w-full bg-brand-red text-white text-center px-6 py-3 rounded-lg font-semibold hover:bg-brand-darkred transition-colors"
              >
                Solicitar Cotización Empresarial
              </a>
            </div>

            {/* Para Particulares */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 p-8 rounded-2xl border-2 border-red-200 hover:border-brand-red transition-all hover:shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-brand-darkred p-4 rounded-xl">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Para Particulares</h3>
                  <p className="text-gray-700">Tu casa, tu tranquilidad</p>
                </div>
              </div>
              
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-brand-red flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <strong>Tejido Romboidal</strong> - Fabricación propia
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-brand-red flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <strong>Envío gratis</strong> - En toda la ciudad de Salta
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-brand-red flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <strong>Asesoramiento técnico</strong> - Te ayudamos a elegir
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-brand-red flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <strong>Instalación disponible</strong> - Servicio completo
                  </div>
                </li>
              </ul>
              
              <a 
                href="https://wa.me/5493874773393?text=Hola! Quiero comprar tejido romboidal"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-brand-darkred text-white text-center px-6 py-3 rounded-lg font-semibold hover:bg-red-900 transition-colors"
              >
                Consultar por WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Nuestros Servicios */}
      <section className="py-20 bg-gradient-to-br from-brand-red to-brand-darkred text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Nuestros Servicios
            </h2>
            <p className="text-xl text-gray-300">
              Soluciones completas para tu proyecto de cercado
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Servicio 1 */}
            <div className="bg-white/10 backdrop-blur-sm p-8 rounded-xl hover:bg-white/20 transition-all border border-white/20">
              <div className="text-5xl mb-4">🏭</div>
              <h3 className="text-2xl font-bold mb-4">Fabricación de Tejido</h3>
              <p className="text-white/90 mb-4">
                Producimos rollos de tejido romboidal en diferentes alturas y calibres. Calidad superior a precio de fábrica.
              </p>
              <ul className="space-y-2 text-white/80 text-sm">
                <li>✓ Calibre 12 y 14</li>
                <li>✓ Alturas de 1m a 2m</li>
                <li>✓ Rombos de 2&quot; a 3.5&quot;</li>
                <li>✓ Rollos de 10 metros</li>
              </ul>
            </div>

            {/* Servicio 2 */}
            <div className="bg-white/10 backdrop-blur-sm p-8 rounded-xl hover:bg-white/20 transition-all border border-white/20">
              <div className="text-5xl mb-4">🔨</div>
              <h3 className="text-2xl font-bold mb-4">Instalación Completa</h3>
              <p className="text-white/90 mb-4">
                Servicio &quot;llave en mano&quot; con todo incluido. Vos solo indicás dónde y nosotros hacemos todo el resto.
              </p>
              <ul className="space-y-2 text-white/80 text-sm">
                <li>✓ Medición del terreno</li>
                <li>✓ Todos los materiales</li>
                <li>✓ Mano de obra especializada</li>
                <li>✓ Garantía de 90 días</li>
              </ul>
            </div>

            {/* Servicio 3 */}
            <div className="bg-white/10 backdrop-blur-sm p-8 rounded-xl hover:bg-white/20 transition-all border border-white/20">
              <div className="text-5xl mb-4">💬</div>
              <h3 className="text-2xl font-bold mb-4">Asesoramiento Técnico</h3>
              <p className="text-white/90 mb-4">
                Te ayudamos a elegir el cerco ideal según tu necesidad, presupuesto y tipo de terreno.
              </p>
              <ul className="space-y-2 text-white/80 text-sm">
                <li>✓ Atención personalizada</li>
                <li>✓ Visita al terreno</li>
                <li>✓ Presupuesto sin cargo</li>
                <li>✓ Expertos en la zona</li>
              </ul>
            </div>
          </div>

          {/* CTA Asesoramiento */}
          <div className="text-center mt-12">
            <p className="text-xl text-gray-300 mb-6">
              ¿No estás seguro de qué necesitás? <strong>¡Llamanos!</strong>
            </p>
            <a 
              href="tel:+5493874773393"
              className="inline-flex items-center gap-3 bg-white text-gray-900 px-10 py-4 rounded-lg font-bold hover:bg-gray-100 transition-colors text-lg shadow-xl"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              (387) 477-3393 - Asesoramiento Gratuito
            </a>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-brand-red">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                📬 Recibí Promociones y Novedades
              </h2>
              <p className="text-lg text-gray-600">
                Suscribite y enterate de ofertas exclusivas, nuevos productos y consejos técnicos
              </p>
            </div>
            
            <form className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
              <input
                type="email"
                placeholder="tu@email.com"
                className="flex-1 px-6 py-4 rounded-lg border-2 border-gray-300 focus:border-brand-red focus:outline-none text-lg"
                required
              />
              <button
                type="submit"
                className="bg-brand-red text-white px-8 py-4 rounded-lg font-bold hover:bg-brand-darkred transition-colors text-lg shadow-lg whitespace-nowrap"
              >
                Suscribirme Gratis
              </button>
            </form>
            
            <p className="text-sm text-gray-500 text-center mt-4">
              🔒 No spam. Cancelá cuando quieras.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Final Múltiple */}
      <section className="py-20 bg-gradient-to-r from-brand-red to-brand-darkred text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              ¿Listo para empezar?
            </h2>
            <p className="text-2xl text-white/90 mb-2">
              Despreocupate de todo, nosotros nos encargamos
            </p>
            <p className="text-lg text-white/80">
              Envío gratis en Salta • Garantía 90 días • Atención personalizada
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* WhatsApp */}
            <a
              href="https://wa.me/5493874773393?text=Hola! Quiero solicitar una cotización"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 hover:bg-green-600 p-8 rounded-xl shadow-xl transition-all hover:scale-105 transform text-center group"
            >
              <svg className="w-16 h-16 mx-auto mb-4 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              <div className="text-2xl font-bold mb-2">WhatsApp</div>
              <div className="text-white/90">Cotización Inmediata</div>
            </a>

            {/* Teléfono */}
            <a
              href="tel:+5493874773393"
              className="bg-white hover:bg-gray-100 text-gray-900 p-8 rounded-xl shadow-xl transition-all hover:scale-105 transform text-center group"
            >
              <svg className="w-16 h-16 mx-auto mb-4 text-brand-red group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <div className="text-2xl font-bold mb-2 text-brand-red">(387) 477-3393</div>
              <div className="text-gray-600">Asesoramiento Técnico</div>
            </a>

            {/* Formulario */}
            <a
              href="/contacto"
              className="bg-brand-darkred hover:bg-red-900 text-white p-8 rounded-xl shadow-xl transition-all hover:scale-105 transform text-center group"
            >
              <svg className="w-16 h-16 mx-auto mb-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div className="text-2xl font-bold mb-2">Formulario</div>
              <div className="text-white/90">Presupuesto Detallado</div>
            </a>
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  )
}

