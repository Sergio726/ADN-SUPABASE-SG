'use client'

import { useState, useEffect, useRef } from 'react'
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
  const [newsletterLoading, setNewsletterLoading] = useState(false)
  const [newsletterMessage, setNewsletterMessage] = useState('')
  const [portadaUrl, setPortadaUrl] = useState<string | null>(null)
  const newsletterFormRef = useRef<HTMLFormElement>(null)

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

    async function cargarPortada() {
      try {
        const { data } = await supabase
          .from('configuraciones')
          .select('valor')
          .eq('tipo', 'portada_imagen')
          .eq('clave', 'hero_background')
          .single()

        if (data?.valor) {
          setPortadaUrl(data.valor)
        }
      } catch (error) {
        console.error('Error al cargar imagen de portada:', error)
      }
    }

    cargarArticulos()
    cargarPortada()
  }, [])

  const articulosMostrar = mostrarTodos ? articulos : articulos.slice(0, 6)

  const handleNewsletterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setNewsletterLoading(true)
    setNewsletterMessage('')
    console.log('Iniciando envío de formulario...')

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const telefono = formData.get('telefono') as string
    console.log('Datos del formulario:', { email, telefono })

    try {
      const response = await fetch('/api/suscribirse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          telefono: telefono || null,
        }),
      })

      const result = await response.json()
      console.log('Respuesta del servidor:', { response: response.ok, result })

      if (response.ok && result.success) {
        console.log('Éxito - mostrando mensaje:', result.data.mensaje)
        setNewsletterMessage(result.data.mensaje)
        // Reset del formulario usando ref
        if (newsletterFormRef.current) {
          newsletterFormRef.current.reset()
        }
      } else {
        console.log('Error - mostrando mensaje de error')
        setNewsletterMessage(result.error || 'Error al suscribirse')
      }
    } catch (error) {
      console.error('Error en catch:', error)
      console.error('Tipo de error:', typeof error)
      console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
      setNewsletterMessage('Error al suscribirse. Intenta nuevamente.')
    } finally {
      setNewsletterLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Premium */}
      <section className="relative bg-gradient-to-br from-brand-red via-brand-darkred to-red-900 text-white py-24 overflow-hidden">
        {/* Imagen de fondo o patrón predeterminado */}
        {portadaUrl ? (
          <>
            {/* Imagen de fondo */}
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${portadaUrl})`,
                backgroundPosition: 'center center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'cover'
              }}
            ></div>
            {/* Overlay oscuro para mejorar legibilidad del texto */}
            <div className="absolute inset-0 bg-gradient-to-br from-brand-red/60 via-brand-darkred/60 to-red-900/60"></div>
          </>
        ) : (
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.1) 35px, rgba(255,255,255,.1) 70px)'
            }}></div>
          </div>
        )}

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Badge de USP */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-6 py-2 rounded-full mb-6 border border-white/20">
              <svg className="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-white font-semibold">Como no somos los únicos, decidimos ser los mejores</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="text-transparent" style={{ textShadow: '1px 1px 0 #ffffff, -1px -1px 0 #ffffff, 1px -1px 0 #ffffff, -1px 1px 0 #ffffff' }}>CERCADO PERIMETRAL</span><br />
              <span className="text-transparent" style={{ textShadow: '1px 1px 0 #ffffff, -1px -1px 0 #ffffff, 1px -1px 0 #ffffff, -1px 1px 0 #ffffff' }}>LLAVE EN MANO</span>
            </h1>
            
            <div className="flex flex-wrap justify-center items-center gap-6 md:gap-8 mb-4 max-w-4xl mx-auto">
              <div className="flex items-center gap-2 text-lg md:text-xl text-white/95">
                <svg className="w-6 h-6 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Fabricación propia</span>
              </div>
              <div className="flex items-center gap-2 text-lg md:text-xl text-white/95">
                <svg className="w-6 h-6 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Instalación profesional</span>
              </div>
              <div className="flex items-center gap-2 text-lg md:text-xl text-white/95">
                <svg className="w-6 h-6 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Garantía 90 días</span>
              </div>
            </div>
            

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
          </div>
        </div>
      </section>

      {/* Productos Destacados */}
      <section id="productos" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Productos Destacados
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
              <div className="bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
              </div>
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
              <div className="bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
                </svg>
              </div>
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
              <div className="bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                </svg>
              </div>
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
              <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-brand-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Recibí Promociones y Novedades
              </h2>
              <p className="text-lg text-gray-600 mb-2">
                Suscribite y enterate de ofertas exclusivas, nuevos productos y consejos técnicos
              </p>
              <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6 mb-6 shadow-lg animate-pulse">
                <div className="flex items-center justify-center gap-3 text-green-800 mb-3">
                  <div className="bg-green-100 p-2 rounded-full">
                    <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <span className="text-xl font-bold">¡BONUS ESPECIAL!</span>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-green-700 mb-2">
                    💰 Recibí <span className="text-2xl text-green-600">10% DE DESCUENTO</span> en tu primera compra
                  </p>
                  <p className="text-sm text-green-600 font-medium">
                    Solo por suscribirte con tu teléfono
                  </p>
                </div>
              </div>
            </div>
            
            <form ref={newsletterFormRef} onSubmit={handleNewsletterSubmit} className="max-w-lg mx-auto">
              <div className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-3">
                    Email *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="tu@email.com"
                    className="w-full px-6 py-4 rounded-lg border-2 border-gray-300 focus:border-brand-red focus:outline-none text-lg"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-3">
                    Teléfono (opcional)
                  </label>
                  <input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    placeholder="+54 9 387 123-4567"
                    className="w-full px-6 py-4 rounded-lg border-2 border-gray-300 focus:border-brand-red focus:outline-none text-lg"
                  />
                  <p className="text-sm text-green-600 font-medium mt-2 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Agregá tu teléfono para recibir el 10% de descuento
                  </p>
                </div>
              </div>
              
              {newsletterMessage && (
                <div className={`mt-4 p-4 rounded-lg ${
                  newsletterMessage.includes('descuento') 
                    ? 'bg-green-50 border border-green-200 text-green-800' 
                    : newsletterMessage.includes('Error') || newsletterMessage.includes('error')
                    ? 'bg-red-50 border border-red-200 text-red-800'
                    : 'bg-blue-50 border border-blue-200 text-blue-800'
                }`}>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">{newsletterMessage}</span>
                  </div>
                </div>
              )}
              
              <button
                type="submit"
                disabled={newsletterLoading}
                className="w-full bg-brand-red text-white px-8 py-4 rounded-lg font-bold hover:bg-brand-darkred transition-colors text-lg shadow-lg mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {newsletterLoading ? 'Suscribiendo...' : 'Suscribirme Gratis'}
              </button>
            </form>
            
            <div className="text-center mt-6">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>No spam. Cancelá cuando quieras.</span>
              </div>
            </div>
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

