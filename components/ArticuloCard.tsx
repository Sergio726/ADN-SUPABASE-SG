import Link from 'next/link'
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
          
          {showPrice && articulo.precio && (
            <div className="mt-4 pt-4 border-t">
              <div className="text-2xl font-bold text-primary">
                ${articulo.precio.toLocaleString('es-AR')}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

