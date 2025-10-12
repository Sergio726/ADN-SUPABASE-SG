import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Articulo } from '@/lib/supabaseClient'
import { Package, AlertTriangle } from 'lucide-react'

interface ArticuloCardProps {
  articulo: Articulo & { precio?: number }
  showPrice?: boolean
  showStock?: boolean
}

export default function ArticuloCard({ 
  articulo, 
  showPrice = false, 
  showStock = false 
}: ArticuloCardProps) {
  const stockBajo = articulo.stock_actual <= articulo.stock_minimo
  
  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col h-full space-y-3">
          {/* Imagen del artículo */}
          {articulo.imagen_url && (
            <div className="relative w-full h-48 rounded-lg overflow-hidden -mx-6 -mt-6 mb-3">
              <Image
                src={articulo.imagen_url}
                alt={articulo.nombre}
                fill
                className="object-cover"
              />
            </div>
          )}
          
          <div className="flex items-start gap-2">
            <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
            <h3 className="text-lg font-semibold flex-1">
              {articulo.nombre}
            </h3>
          </div>
          
          {articulo.categoria && (
            <Badge variant="secondary" className="w-fit">
              {articulo.categoria}
            </Badge>
          )}
          
          <p className="text-muted-foreground text-sm flex-grow">
            {articulo.descripcion || 'Sin descripción'}
          </p>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Unidad: {articulo.unidad}</span>
            {showStock && (
              <div className="flex items-center gap-1">
                {stockBajo && <AlertTriangle className="h-4 w-4 text-destructive" />}
                <span className={stockBajo ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                  Stock: {articulo.stock_actual}
                </span>
              </div>
            )}
          </div>
          
          {/* Mostrar precio si está disponible */}
          {showPrice && (
            <div className="mt-4 pt-4 border-t">
              {articulo.precio && articulo.precio > 0 ? (
                <div className="text-2xl font-bold text-primary">
                  ${articulo.precio.toLocaleString('es-AR')}
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Consultá precio por WhatsApp
                  </p>
                  <a
                    href="https://wa.me/5493874773393?text=Hola,%20quisiera%20consultar%20el%20precio%20de%20este%20producto"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    Consultar
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

