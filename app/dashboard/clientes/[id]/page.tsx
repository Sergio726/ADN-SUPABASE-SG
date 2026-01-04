'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { ArrowLeft, Edit, User, Phone, Mail, MapPin, FileText, Calendar, CreditCard, Building2, CheckSquare } from 'lucide-react'
import { TareasSection } from '@/components/TareasSection'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { DataTable } from '@/components/ui/data-table'
import { SortableHeader } from '@/components/ui/sortable-header'

export default function VerClientePage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [cliente, setCliente] = useState<any>(null)
  const [presupuestos, setPresupuestos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarCliente()
    cargarPresupuestos()
  }, [params.id])

  async function cargarCliente() {
    try {
      const { data, error } = await supabase
        .from('v_clientes_con_stats')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error
      setCliente(data)
    } catch (error: any) {
      console.error('Error:', error)
      toast({
        title: "Error al cargar cliente",
        description: error.message,
        variant: "destructive",
      })
      router.push('/dashboard/clientes')
    } finally {
      setLoading(false)
    }
  }

  async function cargarPresupuestos() {
    const { data } = await supabase
      .from('presupuestos')
      .select('*')
      .eq('cliente_id', params.id)
      .order('fecha_emision', { ascending: false })

    setPresupuestos(data || [])
  }

  if (loading || !cliente) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const categoriaBadgeVariant = (categoria: string) => {
    switch (categoria) {
      case 'Empresa': return 'default'
      case 'Revendedor': return 'secondary'
      case 'Gobierno': return 'outline'
      default: return 'outline'
    }
  }

  const presupuestosColumns = [
    {
      accessorKey: 'numero',
      header: ({ column }: any) => <SortableHeader column={column} title="Número" />,
      cell: ({ row }: any) => (
        <Link href={`/dashboard/presupuestos/${row.original.id}`} className="font-mono font-semibold hover:text-primary">
          {row.original.numero}
        </Link>
      ),
    },
    {
      accessorKey: 'tipo',
      header: 'Tipo',
      cell: ({ row }: any) => (
        <Badge variant={row.original.tipo === 'cercado' ? 'default' : 'secondary'}>
          {row.original.tipo === 'articulos' ? 'Artículos' : 'Cercado'}
        </Badge>
      ),
    },
    {
      accessorKey: 'fecha_emision',
      header: ({ column }: any) => <SortableHeader column={column} title="Fecha" />,
      cell: ({ row }: any) => new Date(row.original.fecha_emision).toLocaleDateString('es-AR'),
    },
    {
      accessorKey: 'total',
      header: ({ column }: any) => <SortableHeader column={column} title="Total" />,
      cell: ({ row }: any) => (
        <span className="font-bold text-green-600">${row.original.total?.toLocaleString()}</span>
      ),
    },
    {
      accessorKey: 'estado',
      header: 'Estado',
      cell: ({ row }: any) => {
        const variant = row.original.estado === 'aprobado' ? 'default' : 'outline'
        return <Badge variant={variant}>{row.original.estado}</Badge>
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link href="/dashboard/clientes">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{cliente.nombre_completo}</h1>
            <p className="text-muted-foreground mt-1 font-mono">
              {cliente.tipo_documento} {cliente.numero_documento}
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/dashboard/clientes/editar/${params.id}`}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Información General */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Documento</p>
                    <p className="font-mono font-bold">{cliente.tipo_documento} {cliente.numero_documento}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    {cliente.categoria === 'Empresa' ? (
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <User className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Categoría</p>
                    <Badge variant={categoriaBadgeVariant(cliente.categoria)}>
                      {cliente.categoria}
                    </Badge>
                  </div>
                </div>
              </div>

              {cliente.razon_social && (
                <div className="pt-3 border-t">
                  <p className="text-sm text-muted-foreground">Razón Social</p>
                  <p className="font-semibold">{cliente.razon_social}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contacto */}
          <Card>
            <CardHeader>
              <CardTitle>Datos de Contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {cliente.telefono && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Teléfono</p>
                    <a href={`tel:${cliente.telefono}`} className="font-medium hover:text-primary">
                      {cliente.telefono}
                    </a>
                  </div>
                </div>
              )}

              {cliente.telefono_alternativo && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Teléfono Alternativo</p>
                    <a href={`tel:${cliente.telefono_alternativo}`} className="font-medium hover:text-primary">
                      {cliente.telefono_alternativo}
                    </a>
                  </div>
                </div>
              )}

              {cliente.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <a href={`mailto:${cliente.email}`} className="font-medium hover:text-primary">
                      {cliente.email}
                    </a>
                  </div>
                </div>
              )}

              {cliente.direccion && (
                <div className="flex items-start gap-3 pt-3 border-t">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Dirección</p>
                    <p className="font-medium">{cliente.direccion}</p>
                    {(cliente.ciudad || cliente.provincia) && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {cliente.ciudad}{cliente.ciudad && cliente.provincia && ', '}{cliente.provincia}
                        {cliente.codigo_postal && ` (${cliente.codigo_postal})`}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Presupuestos del Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Presupuestos
              </CardTitle>
              <CardDescription>
                Historial de presupuestos de este cliente
              </CardDescription>
            </CardHeader>
            <CardContent>
              {presupuestos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No hay presupuestos registrados</p>
                </div>
              ) : (
                <DataTable
                  columns={presupuestosColumns}
                  data={presupuestos}
                  searchKey="numero"
                  searchPlaceholder="Buscar presupuesto..."
                />
              )}
            </CardContent>
          </Card>

          {/* Tareas del Cliente */}
          <TareasSection
            clienteId={params.id as string}
            titulo="Tareas"
            descripcion="Gestiona las tareas y seguimientos relacionados con este cliente"
            mostrarEstadisticas={true}
          />

          {/* Notas */}
          {cliente.notas && (
            <Card>
              <CardHeader>
                <CardTitle>Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-line">{cliente.notas}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Estadísticas */}
          <Card>
            <CardHeader>
              <CardTitle>Estadísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Presupuestos</p>
                <p className="text-3xl font-bold">{cliente.total_presupuestos || 0}</p>
              </div>
              <div className="pt-3 border-t">
                <p className="text-sm text-muted-foreground">Monto Total</p>
                <p className="text-2xl font-bold text-green-600">
                  ${cliente.monto_total_presupuestado?.toLocaleString() || '0'}
                </p>
              </div>
              {cliente.ultimo_presupuesto && (
                <div className="pt-3 border-t">
                  <p className="text-sm text-muted-foreground">Último Presupuesto</p>
                  <p className="font-medium">
                    {new Date(cliente.ultimo_presupuesto).toLocaleDateString('es-AR')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Información del Sistema */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Información del Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Registrado</p>
                  <p className="text-sm font-medium">
                    {new Date(cliente.creado_en).toLocaleDateString('es-AR')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Última Actualización</p>
                  <p className="text-sm font-medium">
                    {new Date(cliente.actualizado_en).toLocaleDateString('es-AR')}
                  </p>
                </div>
              </div>
              <div className="pt-3 border-t">
                <p className="text-xs text-muted-foreground mb-2">Estado</p>
                <Badge variant={cliente.activo ? 'default' : 'outline'}>
                  {cliente.activo ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Acciones */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" asChild>
                <Link href={`/dashboard/presupuestos/nuevo/tipo?cliente_id=${params.id}`}>
                  <FileText className="h-4 w-4 mr-2" />
                  Nuevo Presupuesto
                </Link>
              </Button>
              <Button className="w-full" variant="outline" asChild>
                <Link href={`/dashboard/clientes/editar/${params.id}`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Cliente
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

