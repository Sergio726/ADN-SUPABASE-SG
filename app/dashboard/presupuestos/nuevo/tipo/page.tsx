'use client'

import Link from 'next/link'
import { ArrowLeft, Package, Grid3x3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function TipoPresupuestoPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" asChild>
          <Link href="/dashboard/presupuestos">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nuevo Presupuesto</h1>
          <p className="text-muted-foreground">Selecciona el tipo de presupuesto a crear</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto mt-12">
        <Link href="/dashboard/presupuestos/nuevo/articulos" className="group">
          <Card className="h-full transition-all duration-200 hover:shadow-lg hover:border-brand-red cursor-pointer">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-full group-hover:from-red-100 group-hover:to-red-200 transition-all">
                <Package className="h-16 w-16 text-red-600" />
              </div>
              <CardTitle className="text-2xl group-hover:text-brand-red transition-colors">
                Presupuesto de Artículos
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <CardDescription className="text-base">
                Crear un presupuesto para venta de productos individuales del catálogo
              </CardDescription>
              <ul className="mt-4 space-y-2 text-sm text-left">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-600"></div>
                  <span>Artículos del catálogo</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-600"></div>
                  <span>Tejidos romboidales</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-600"></div>
                  <span>Cantidades personalizadas</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-600"></div>
                  <span>Descuentos aplicables</span>
                </li>
              </ul>
              <div className="mt-6">
                <Button className="w-full group-hover:bg-brand-red group-hover:text-white transition-colors">
                  Crear Presupuesto →
                </Button>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/presupuestos/nuevo/cercado" className="group">
          <Card className="h-full transition-all duration-200 hover:shadow-lg hover:border-brand-red cursor-pointer">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-full group-hover:from-red-100 group-hover:to-red-200 transition-all">
                <Grid3x3 className="h-16 w-16 text-red-600" />
              </div>
              <CardTitle className="text-2xl group-hover:text-brand-red transition-colors">
                Presupuesto de Cercado
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <CardDescription className="text-base">
                Crear un presupuesto para servicio completo de instalación de cerco perimetral
              </CardDescription>
              <ul className="mt-4 space-y-2 text-sm text-left">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-600"></div>
                  <span>Cálculo por metro lineal</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-600"></div>
                  <span>Incluye materiales y mano de obra</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-600"></div>
                  <span>Múltiples configuraciones</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-600"></div>
                  <span>Opciones: cordón, púa, postes</span>
                </li>
              </ul>
              <div className="mt-6">
                <Button className="w-full group-hover:bg-brand-red group-hover:text-white transition-colors">
                  Crear Presupuesto →
                </Button>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="text-center text-sm text-muted-foreground mt-8">
        <p>Selecciona el tipo de presupuesto que deseas crear</p>
        <p className="mt-1">Podrás agregar items y generar el PDF al finalizar</p>
      </div>
    </div>
  )
}

