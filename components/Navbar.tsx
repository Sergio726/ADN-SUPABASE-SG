'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <img 
                src="/logos/logo-color.png" 
                alt="Alambres del Norte" 
                className="h-10 w-auto"
              />
            </Link>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className="text-gray-700 hover:text-brand-red transition-colors font-medium"
            >
              Inicio
            </Link>
            <Link 
              href="/#productos" 
              className="text-gray-700 hover:text-brand-red transition-colors font-medium"
            >
              Productos
            </Link>
            <Link 
              href="/contacto" 
              className="text-gray-700 hover:text-brand-red transition-colors font-medium"
            >
              Contacto
            </Link>
            <Link
              href="/login"
              className="bg-brand-red text-white px-6 py-2 rounded-lg hover:bg-brand-darkred transition-colors font-semibold"
            >
              Ingresar
            </Link>
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
          <div className="md:hidden pb-4">
            <div className="flex flex-col space-y-4">
              <Link href="/" className="text-gray-700 hover:text-brand-red font-medium">
                Inicio
              </Link>
              <Link href="/#productos" className="text-gray-700 hover:text-brand-red font-medium">
                Productos
              </Link>
              <Link href="/contacto" className="text-gray-700 hover:text-brand-red font-medium">
                Contacto
              </Link>
              <Link
                href="/login"
                className="bg-brand-red text-white px-4 py-2 rounded-lg hover:bg-brand-darkred text-center font-semibold"
              >
                Ingresar
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

