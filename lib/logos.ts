/**
 * Configuración de logos y assets de la empresa
 */

export const LOGOS = {
  // Logos principales
  color: '/logos/logo-color.png',
  white: '/logos/logo-white.png',
  
  // Isologos (versiones pequeñas)
  isoRed: '/logos/isologo.png',
  isoWhite: '/logos/isologo-white.png',
  
  // Favicon
  favicon: '/logos/favicon.ico',
  
  // Metadatos para SEO
  openGraph: {
    url: '/logos/logo-color.png',
    width: 1200,
    height: 630,
    alt: 'Alambres del Norte SRL',
  },
  
  // Tamaños recomendados
  sizes: {
    header: { width: 200, height: 60 },
    footer: { width: 150, height: 45 },
    favicon: { width: 32, height: 32 },
    social: { width: 1200, height: 630 },
  }
} as const

export const BRAND = {
  name: 'Alambres del Norte SRL',
  tagline: 'Tu seguridad comienza con nosotros',
  description: 'Fabricación, instalación y suministro de cercos, alambrados y productos para cercado. Más de 30 años de experiencia en Salta, Argentina.',
  keywords: ['alambres', 'cercos', 'alambrados', 'tejidos', 'postes', 'Salta', 'Argentina'],
  contact: {
    phone: '+54 387 477-3393',
    whatsapp: '5493874773393',
    email: 'info@alambresdelnorte.com',
  }
} as const
