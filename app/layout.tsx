import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002'),
  title: 'Alambres del Norte SRL | Cercos y Alambrados de Calidad',
  description: 'Fabricación, instalación y suministro de cercos, alambrados y productos para cercado. Más de 30 años de experiencia en Salta, Argentina.',
  keywords: 'alambres, cercos, alambrados, tejidos, postes, Salta, Argentina',
  authors: [{ name: 'Alambres del Norte SRL' }],
  openGraph: {
    title: 'Alambres del Norte SRL',
    description: 'Fabricación, instalación y suministro de cercos de calidad',
    type: 'website',
    locale: 'es_AR',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/logos/isologo.png" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
