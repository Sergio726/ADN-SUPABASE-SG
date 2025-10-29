import { BRAND } from '@/lib/logos'

export function StructuredData() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  
  // Schema LocalBusiness
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${siteUrl}#business`,
    "name": BRAND.name,
    "description": BRAND.description,
    "url": siteUrl,
    "telephone": BRAND.contact.phone,
    "email": BRAND.contact.email,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Salta",
      "addressRegion": "Salta",
      "addressCountry": "AR"
    },
    "areaServed": {
      "@type": "City",
      "name": "Salta"
    },
    "priceRange": "$$",
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday"
        ],
        "opens": "08:00",
        "closes": "18:00"
      }
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "25",
      "bestRating": "5",
      "worstRating": "1"
    },
    "sameAs": [
      `https://wa.me/${BRAND.contact.whatsapp}`
    ]
  }

  // Schema Organization
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}#organization`,
    "name": BRAND.name,
    "legalName": BRAND.name,
    "url": siteUrl,
    "logo": `${siteUrl}/logos/logo-color.png`,
    "description": BRAND.description,
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": BRAND.contact.phone,
      "contactType": "customer service",
      "availableLanguage": ["Spanish", "es"]
    },
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Salta",
      "addressRegion": "Salta",
      "addressCountry": "AR"
    },
    "areaServed": {
      "@type": "Country",
      "name": "Argentina"
    }
  }

  // Schema Service - Fabricación de Tejido
  const serviceFabricacionSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Fabricación de Tejido Romboidal",
    "description": "Fabricamos rollos de tejido romboidal en diferentes alturas y calibres. Calidad superior a precio de fábrica.",
    "provider": {
      "@id": `${siteUrl}#business`
    },
    "areaServed": {
      "@type": "City",
      "name": "Salta"
    },
    "serviceType": "Manufacturing",
    "offers": {
      "@type": "Offer",
      "availability": "https://schema.org/InStock",
      "priceCurrency": "ARS",
      "priceSpecification": {
        "@type": "UnitPriceSpecification",
        "price": "A consultar",
        "priceCurrency": "ARS"
      }
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Productos de Tejido Romboidal",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Product",
            "name": "Tejido Romboidal Calibre 12"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Product",
            "name": "Tejido Romboidal Calibre 14"
          }
        }
      ]
    }
  }

  // Schema Service - Instalación
  const serviceInstalacionSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Instalación de Cercos Perimetrales",
    "description": "Servicio 'llave en mano' con todo incluido. Medición del terreno, todos los materiales, mano de obra especializada y garantía de 90 días.",
    "provider": {
      "@id": `${siteUrl}#business`
    },
    "areaServed": {
      "@type": "City",
      "name": "Salta"
    },
    "serviceType": "Installation",
    "offers": {
      "@type": "Offer",
      "availability": "https://schema.org/InStock",
      "priceCurrency": "ARS"
    }
  }

  // Schema Service - Asesoramiento
  const serviceAsesoramientoSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Asesoramiento Técnico en Cercos",
    "description": "Te ayudamos a elegir el cerco ideal según tu necesidad, presupuesto y tipo de terreno. Presupuesto sin cargo.",
    "provider": {
      "@id": `${siteUrl}#business`
    },
    "areaServed": {
      "@type": "City",
      "name": "Salta"
    },
    "serviceType": "Consulting",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "ARS"
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema, null, 0) }}
        id="localBusinessSchema"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema, null, 0) }}
        id="organizationSchema"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceFabricacionSchema, null, 0) }}
        id="serviceFabricacionSchema"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceInstalacionSchema, null, 0) }}
        id="serviceInstalacionSchema"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceAsesoramientoSchema, null, 0) }}
        id="serviceAsesoramientoSchema"
      />
    </>
  )
}

