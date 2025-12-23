import { createServerClient } from '@/lib/supabaseServer'
import { formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mail, Phone, Clock, MessageSquare } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

// Forzar renderizado dinámico porque usa cookies
export const dynamic = 'force-dynamic'

async function getLeads() {
  const supabase = createServerClient()
  
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('creado_en', { ascending: false })

  if (error) {
    console.error('Error al cargar leads:', error)
    return []
  }

  return data || []
}

export default async function LeadsPage() {
  const leads = await getLeads()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Leads y Suscriptores</h2>
        <p className="text-muted-foreground mt-2">
          Consultas recibidas desde el sitio web y suscriptores del newsletter
        </p>
      </div>

      {leads.length > 0 ? (
        <div className="space-y-4">
          {leads.map((lead: any) => (
            <Card key={lead.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{lead.nombre}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {formatDate(lead.creado_en)}
                    </div>
                  </div>
                  <Badge>
                    {lead.origen}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lead.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <a href={`mailto:${lead.email}`} className="hover:text-primary hover:underline">
                              {lead.email}
                            </a>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Enviar email</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                  {lead.telefono && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <a href={`tel:${lead.telefono}`} className="hover:text-primary hover:underline">
                              {lead.telefono}
                            </a>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Llamar por teléfono</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                </div>

                {/* Mostrar información especial para suscriptores con descuento */}
                {lead.origen === 'newsletter' && lead.mensaje?.includes('descuento') && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-green-600 font-bold">🎁 Suscriptor con Descuento</span>
                    </div>
                    <div className="text-sm text-green-700">
                      {lead.mensaje.includes('10%') && (
                        <p className="font-semibold">✅ 10% de descuento aplicado</p>
                      )}
                      {lead.mensaje.includes('DESC') && (
                        <p className="mt-1">
                          <span className="font-medium">Código:</span> 
                          <span className="bg-green-100 px-2 py-1 rounded font-mono text-xs ml-1">
                            {lead.mensaje.match(/DESC[A-Z0-9]+/)?.[0]}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {lead.mensaje && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      {lead.origen === 'newsletter' ? 'Detalles de Suscripción' : 'Mensaje'}
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">
                        {lead.mensaje}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="h-16 w-16 text-muted-foreground mb-4" />
            <CardTitle className="mb-2">No hay leads todavía</CardTitle>
            <CardDescription className="text-center">
              Los clientes que completen el formulario de contacto o se suscriban al newsletter aparecerán aquí
            </CardDescription>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
