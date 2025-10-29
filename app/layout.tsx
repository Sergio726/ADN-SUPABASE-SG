import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { LOGOS, BRAND } from '@/lib/logos'
import { StructuredData } from '@/components/StructuredData'

const montserrat = Montserrat({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002'),
  title: `${BRAND.name} | ${BRAND.tagline}`,
  description: BRAND.description,
  keywords: BRAND.keywords.join(', '),
  authors: [{ name: BRAND.name }],
  icons: {
    icon: LOGOS.favicon,
    shortcut: LOGOS.favicon,
    apple: LOGOS.isoWhite,
  },
  openGraph: {
    title: BRAND.name,
    description: BRAND.tagline,
    type: 'website',
    locale: 'es_AR',
    images: [LOGOS.openGraph],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={montserrat.className}>
        <StructuredData />
        {children}
        <Toaster />
      </body>
    </html>
  )
}
