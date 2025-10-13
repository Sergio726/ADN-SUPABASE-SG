import { supabase } from '@/lib/supabaseClient'
import { formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mail, Phone, Clock, MessageSquare } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

async function getLeads() {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('creado_en', { ascending: false })

  if (error) {
    console.error('Error:', error)
    return []
  }

  return data || []
}

export default async function LeadsPage() {
  const leads = await getLeads()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Leads y Consultas</h2>
        <p className="text-muted-foreground mt-2">
          Consultas recibidas desde el sitio web
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

                {lead.mensaje && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      Mensaje
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
              Los clientes que completen el formulario de contacto aparecerán aquí
            </CardDescription>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
