'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-24">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-4 group">
              <img 
                src="/logos/logo-color.png" 
                alt="Alambres del Norte" 
                className="h-20 w-auto transition-transform duration-200 group-hover:scale-105"
              />
              <div className="hidden sm:block">
                <span className="text-xl font-bold text-brand-red">Tu seguridad comienza con nosotros</span>
                <p className="text-xs text-gray-600">Cercos y Alambrados de Calidad</p>
              </div>
            </Link>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-2">
            <Link 
              href="/" 
              className="relative px-4 py-2 text-gray-700 hover:text-brand-red transition-all duration-200 font-medium rounded-md hover:bg-red-50 group"
            >
              <span className="relative z-10">Inicio</span>
              <div className="absolute inset-0 bg-gradient-to-r from-brand-red/5 to-transparent rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </Link>
            <Link 
              href="/#productos" 
              className="relative px-4 py-2 text-gray-700 hover:text-brand-red transition-all duration-200 font-medium rounded-md hover:bg-red-50 group"
            >
              <span className="relative z-10">Productos</span>
              <div className="absolute inset-0 bg-gradient-to-r from-brand-red/5 to-transparent rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </Link>
            <Link 
              href="/contacto" 
              className="relative px-4 py-2 text-gray-700 hover:text-brand-red transition-all duration-200 font-medium rounded-md hover:bg-red-50 group"
            >
              <span className="relative z-10">Contacto</span>
              <div className="absolute inset-0 bg-gradient-to-r from-brand-red/5 to-transparent rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </Link>
            <div className="ml-4 pl-4 border-l border-gray-200 hidden">
              <Link
                href="/login"
                className="bg-gradient-to-r from-brand-red to-brand-darkred text-white px-6 py-2.5 rounded-lg hover:from-brand-darkred hover:to-brand-red transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Ingresar
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-primary-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden pb-6 border-t border-gray-100 mt-4">
            <div className="flex flex-col space-y-2 pt-4">
              <Link href="/" className="px-4 py-3 text-gray-700 hover:text-brand-red hover:bg-red-50 rounded-lg transition-all duration-200 font-medium">
                Inicio
              </Link>
              <Link href="/#productos" className="px-4 py-3 text-gray-700 hover:text-brand-red hover:bg-red-50 rounded-lg transition-all duration-200 font-medium">
                Productos
              </Link>
              <Link href="/contacto" className="px-4 py-3 text-gray-700 hover:text-brand-red hover:bg-red-50 rounded-lg transition-all duration-200 font-medium">
                Contacto
              </Link>
              <div className="pt-2 hidden">
                <Link
                  href="/login"
                  className="block bg-gradient-to-r from-brand-red to-brand-darkred text-white px-4 py-3 rounded-lg hover:from-brand-darkred hover:to-brand-red text-center font-semibold transition-all duration-200 shadow-md"
                >
                  Ingresar
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

