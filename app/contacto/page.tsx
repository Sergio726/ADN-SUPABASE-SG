'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import WhatsAppButton from '@/components/WhatsAppButton'
import { useToast } from '@/hooks/use-toast'

export default function ContactoPage() {
  const { toast } = useToast()
  const [enviando, setEnviando] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    empresa: '',
    tipoCliente: 'particular',
    mensaje: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEnviando(true)

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'contacto',
          datos: formData,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: '✅ ¡Mensaje enviado!',
          description: 'Nos comunicaremos contigo en menos de 24hs. ¡Gracias por tu consulta!',
        })
        
        // Limpiar formulario
        setFormData({
          nombre: '',
          email: '',
          telefono: '',
          empresa: '',
          tipoCliente: 'particular',
          mensaje: '',
        })
      } else {
        throw new Error(result.error || 'Error al enviar el mensaje')
      }
    } catch (error: any) {
      console.error('Error:', error)
      toast({
        title: '❌ Error al enviar',
        description: error.message || 'No se pudo enviar el mensaje. Por favor, intenta más tarde o contactanos por WhatsApp.',
        variant: 'destructive',
      })
    } finally {
      setEnviando(false)
    }
  }
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-brand-red to-brand-darkred text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              ¡Hablemos de tu proyecto!
            </h1>
            <p className="text-xl text-gray-100 max-w-2xl mx-auto">
              Contanos qué necesitás y nuestro equipo te asesorará con la mejor solución. 
              Más de 6 años nos respaldan.
            </p>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              
              {/* Formulario de Contacto */}
              <div>
                <div className="bg-white rounded-xl shadow-lg p-8">
                  <h2 className="text-3xl font-bold text-brand-black mb-3">
                    Dejanos tus datos
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Completá el formulario y nos comunicaremos con vos a la brevedad. 
                    <span className="text-brand-red font-semibold"> ¡Respuesta en menos de 24hs!</span>
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label htmlFor="nombre" className="block text-sm font-semibold text-gray-700 mb-2">
                        Nombre completo *
                      </label>
                      <input
                        type="text"
                        id="nombre"
                        name="nombre"
                        required
                        value={formData.nombre}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent transition-all"
                        placeholder="Tu nombre"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent transition-all"
                          placeholder="tu@email.com"
                        />
                      </div>

                      <div>
                        <label htmlFor="telefono" className="block text-sm font-semibold text-gray-700 mb-2">
                          Teléfono *
                        </label>
                        <input
                          type="tel"
                          id="telefono"
                          name="telefono"
                          required
                          value={formData.telefono}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent transition-all"
                          placeholder="+54 9..."
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="empresa" className="block text-sm font-semibold text-gray-700 mb-2">
                        Empresa (opcional)
                      </label>
                      <input
                        type="text"
                        id="empresa"
                        name="empresa"
                        value={formData.empresa}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent transition-all"
                        placeholder="Nombre de tu empresa"
                      />
                    </div>

                    <div>
                      <label htmlFor="tipoCliente" className="block text-sm font-semibold text-gray-700 mb-2">
                        Tipo de Cliente *
                      </label>
                      <select
                        id="tipoCliente"
                        name="tipoCliente"
                        required
                        value={formData.tipoCliente}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent transition-all"
                      >
                        <option value="particular">🏠 Particular</option>
                        <option value="empresa">🏢 Empresa</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="mensaje" className="block text-sm font-semibold text-gray-700 mb-2">
                        Contanos más sobre tu proyecto *
                      </label>
                      <textarea
                        id="mensaje"
                        name="mensaje"
                        rows={5}
                        required
                        value={formData.mensaje}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent transition-all resize-none"
                        placeholder="Describinos qué necesitás, medidas aproximadas, ubicación, etc."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={enviando}
                      className="w-full bg-brand-red text-white py-4 rounded-lg font-bold text-lg hover:bg-brand-darkred transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {enviando ? 'Enviando...' : 'Enviar consulta'}
                    </button>

                    <p className="text-sm text-gray-500 text-center">
                      Al enviar este formulario aceptás que nos comuniquemos con vos para responder tu consulta.
                    </p>
                  </form>
                </div>

                {/* Métodos de contacto alternativos */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <a
                    href="https://wa.me/5493874773393?text=🌐Hola%20quisiera%20quisiera%20comunicarme%20con%20un%20vendedor%20😃"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-500 text-white p-4 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-3 shadow-md"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    <span className="font-semibold">WhatsApp directo</span>
                  </a>

                  <a
                    href="tel:+5493874773393"
                    className="bg-brand-red text-white p-4 rounded-lg hover:bg-brand-darkred transition-colors flex items-center justify-center gap-3 shadow-md"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="font-semibold">Llamar ahora</span>
                  </a>
                </div>
              </div>

              {/* Información de Contacto y Mapa */}
              <div className="space-y-8">
                {/* Información de contacto */}
                <div className="bg-gray-50 rounded-xl p-8">
                  <h2 className="text-2xl font-bold text-brand-black mb-6">
                    Visitanos en nuestras oficinas
                  </h2>

                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="bg-brand-red rounded-full p-3 flex-shrink-0">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Dirección</h3>
                        <p className="text-gray-700">
                          Gral. Arias Rangel 320<br/>
                          (Altura Zuviría al 2000)<br/>
                          Salta Capital, Argentina
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="bg-brand-red rounded-full p-3 flex-shrink-0">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Teléfonos</h3>
                        <p className="text-gray-700">
                          <a href="tel:+5493874773393" className="hover:text-brand-red transition-colors">
                            +54 9 3874 77-3393
                          </a><br/>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="bg-brand-red rounded-full p-3 flex-shrink-0">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                        <a 
                          href="mailto:info@alambresdelnortesrl.com.ar" 
                          className="text-gray-700 hover:text-brand-red transition-colors break-all"
                        >
                          info@alambresdelnortesrl.com.ar
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="bg-brand-red rounded-full p-3 flex-shrink-0">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Horarios</h3>
                        <p className="text-gray-700">
                          <strong>Lunes a Viernes:</strong> 10:00 - 14:00<br/>
                          <strong>Sábados:</strong> 10:00 - 13:00<br/>
                          <strong>Domingos:</strong> Cerrado
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mapa de Google */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="p-6 bg-brand-red text-white">
                    <h3 className="text-xl font-bold">¿Cómo llegar?</h3>
                    <p className="text-sm mt-1">Estamos ubicados en el norte de Salta</p>
                  </div>
                  <div className="relative h-96">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3622.3956742658144!2d-65.4139342!3d-24.7896389!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x941bc3a2e5e3f5f3%3A0x1234567890abcdef!2sGral.%20Arias%20Rangel%20320%2C%20Salta!5e0!3m2!1ses-419!2sar!4v1234567890123!5m2!1ses-419!2sar"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="absolute inset-0"
                    />
                  </div>
                  <div className="p-4 bg-gray-50">
                    <a
                      href="https://maps.app.goo.gl/1zrjEQqNdvKhzEUE6"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-red hover:text-brand-darkred font-semibold flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Abrir en Google Maps
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gray-50 py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-brand-black mb-4">
              ¿Preferís que te llamemos nosotros?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Dejanos tu número en el formulario y nos comunicamos con vos en el horario que prefieras.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <span className="inline-flex items-center px-4 py-2 bg-white rounded-full shadow-sm">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Respuesta rápida
              </span>
              <span className="inline-flex items-center px-4 py-2 bg-white rounded-full shadow-sm">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Sin compromiso
              </span>
              <span className="inline-flex items-center px-4 py-2 bg-white rounded-full shadow-sm">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Asesoramiento personalizado
              </span>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  )
}

