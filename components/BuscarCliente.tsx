'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Plus, User, Building2, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ClienteData {
  id?: string
  tipo_documento: string
  numero_documento: string
  nombre_completo: string
  razon_social?: string
  email?: string
  telefono: string
  telefono_alternativo?: string
  direccion?: string
  ciudad?: string
  provincia?: string
  codigo_postal?: string
  categoria: string
}

interface BuscarClienteProps {
  onClienteSeleccionado: (cliente: ClienteData) => void
}

export function BuscarCliente({ onClienteSeleccionado }: BuscarClienteProps) {
  const { toast } = useToast()
  const [buscando, setBuscando] = useState(false)
  const [clienteEncontrado, setClienteEncontrado] = useState<ClienteData | null>(null)
  const [dialogAbierto, setDialogAbierto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    cargarUsuario()
  }, [])

  async function cargarUsuario() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserId(user.id)
    }
  }

  const [busqueda, setBusqueda] = useState({
    tipo_documento: 'DNI',
    numero_documento: '',
  })

  const [nuevoCliente, setNuevoCliente] = useState<ClienteData>({
    tipo_documento: 'DNI',
    numero_documento: '',
    nombre_completo: '',
    razon_social: '',
    email: '',
    telefono: '',
    telefono_alternativo: '',
    direccion: '',
    ciudad: 'Salta',
    provincia: 'Salta',
    codigo_postal: '',
    categoria: 'Particular',
  })

  async function buscarCliente() {
    if (!busqueda.numero_documento) {
      toast({
        title: "Campo requerido",
        description: "Ingresa el número de documento",
        variant: "destructive",
      })
      return
    }

    setBuscando(true)
    try {
      const numeroLimpio = busqueda.numero_documento.replace(/[-\s]/g, '')

      // Buscar cliente directamente (sin RPC)
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('numero_documento', numeroLimpio)
        .eq('activo', true)
        .limit(1)

      if (error) throw error

      if (data && data.length > 0) {
        // Cliente encontrado
        const cliente = data[0]
        setClienteEncontrado(cliente)
        toast({
          title: "¡Cliente encontrado!",
          description: `${cliente.nombre_completo} - ${cliente.tipo_documento} ${cliente.numero_documento}`,
        })
      } else {
        // Cliente no encontrado - Abrir dialog
        setClienteEncontrado(null)
        setNuevoCliente({
          ...nuevoCliente,
          tipo_documento: busqueda.tipo_documento,
          numero_documento: busqueda.numero_documento.replace(/[-\s]/g, ''),
        })
        setDialogAbierto(true)
        toast({
          title: "Cliente no encontrado",
          description: "Registra los datos básicos para continuar",
        })
      }
    } catch (error: any) {
      console.error('Error:', error)
      toast({
        title: "Error al buscar cliente",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setBuscando(false)
    }
  }

  async function guardarNuevoCliente() {
    setGuardando(true)
    try {
      if (!userId) {
        throw new Error('Usuario no autenticado')
      }

      const clienteData = {
        ...nuevoCliente,
        razon_social: nuevoCliente.razon_social || null,
        email: nuevoCliente.email || null,
        telefono_alternativo: nuevoCliente.telefono_alternativo || null,
        direccion: nuevoCliente.direccion || null,
        ciudad: nuevoCliente.ciudad || null,
        provincia: nuevoCliente.provincia || null,
        codigo_postal: nuevoCliente.codigo_postal || null,
        activo: true,
        usuario_id: userId,
      }

      const { data, error } = await supabase
        .from('clientes')
        .insert(clienteData)
        .select()
        .single()

      if (error) throw error

      toast({
        title: "¡Cliente registrado!",
        description: "El cliente se ha guardado correctamente",
      })

      // Seleccionar el cliente recién creado
      onClienteSeleccionado({ ...data })
      setClienteEncontrado(data)
      setDialogAbierto(false)
    } catch (error: any) {
      console.error('Error:', error)
      toast({
        title: "Error al guardar cliente",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setGuardando(false)
    }
  }

  function seleccionarCliente() {
    if (clienteEncontrado) {
      onClienteSeleccionado(clienteEncontrado)
    }
  }

  return (
    <div className="space-y-6">
      {/* Búsqueda de Cliente */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle>Buscar Cliente</CardTitle>
          <CardDescription>
            Ingresa el DNI/CUIL/CUIT para buscar o registrar un cliente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Tipo Documento</Label>
              <Select
                value={busqueda.tipo_documento}
                onValueChange={(value) => setBusqueda({ ...busqueda, tipo_documento: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DNI">DNI</SelectItem>
                  <SelectItem value="CUIL">CUIL</SelectItem>
                  <SelectItem value="CUIT">CUIT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label>Número de Documento</Label>
              <div className="flex gap-2">
                <Input
                  value={busqueda.numero_documento}
                  onChange={(e) => setBusqueda({ ...busqueda, numero_documento: e.target.value })}
                  placeholder="12345678 o 20-12345678-9"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      buscarCliente()
                    }
                  }}
                />
                <Button type="button" onClick={buscarCliente} disabled={buscando}>
                  <Search className={`h-4 w-4 mr-2 ${buscando ? 'animate-spin' : ''}`} />
                  {buscando ? 'Buscando...' : 'Buscar'}
                </Button>
              </div>
            </div>
          </div>

          {/* Cliente Encontrado */}
          {clienteEncontrado && (
            <div className="mt-4 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-green-900">{clienteEncontrado.nombre_completo}</h3>
                    <p className="text-sm text-green-700">
                      {clienteEncontrado.tipo_documento} {clienteEncontrado.numero_documento}
                    </p>
                    {clienteEncontrado.razon_social && (
                      <p className="text-sm text-green-700">{clienteEncontrado.razon_social}</p>
                    )}
                    <div className="text-xs text-green-600 space-y-0.5 mt-2">
                      {clienteEncontrado.telefono && <p>Tel: {clienteEncontrado.telefono}</p>}
                      {clienteEncontrado.email && <p>Email: {clienteEncontrado.email}</p>}
                      {clienteEncontrado.direccion && <p>Dir: {clienteEncontrado.direccion}</p>}
                    </div>
                  </div>
                </div>
                <Button onClick={seleccionarCliente} size="sm">
                  Seleccionar Cliente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Registro Rápido */}
      <Dialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-orange-600" />
              Registrar Nuevo Cliente
            </DialogTitle>
            <DialogDescription>
              El cliente no existe en el sistema. Completa los datos básicos para registrarlo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Documento (bloqueado) */}
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo Documento</Label>
                <Input value={nuevoCliente.tipo_documento} disabled className="bg-muted font-mono" />
              </div>
              <div className="space-y-2">
                <Label>Número</Label>
                <Input value={nuevoCliente.numero_documento} disabled className="bg-muted font-mono" />
              </div>
            </div>

            {/* Nombre - OBLIGATORIO */}
            <div className="space-y-2">
              <Label htmlFor="dialog_nombre">
                Nombre Completo <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dialog_nombre"
                value={nuevoCliente.nombre_completo}
                onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre_completo: e.target.value })}
                placeholder="Juan Pérez o Empresa SRL"
                autoFocus
                required
              />
            </div>

            {/* Teléfono - OBLIGATORIO */}
            <div className="space-y-2">
              <Label htmlFor="dialog_telefono">
                Teléfono <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dialog_telefono"
                type="tel"
                value={nuevoCliente.telefono}
                onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })}
                placeholder="+54 387 123-4567"
                required
              />
            </div>

            {/* Categoría - OBLIGATORIO */}
            <div className="space-y-2">
              <Label htmlFor="dialog_categoria">
                Categoría <span className="text-red-500">*</span>
              </Label>
              <Select
                value={nuevoCliente.categoria}
                onValueChange={(value) => setNuevoCliente({ ...nuevoCliente, categoria: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Particular">Particular</SelectItem>
                  <SelectItem value="Empresa">Empresa</SelectItem>
                  <SelectItem value="Gobierno">Gobierno</SelectItem>
                  <SelectItem value="Revendedor">Revendedor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Email - OPCIONAL */}
            <div className="space-y-2">
              <Label htmlFor="dialog_email">Email (opcional)</Label>
              <Input
                id="dialog_email"
                type="email"
                value={nuevoCliente.email}
                onChange={(e) => setNuevoCliente({ ...nuevoCliente, email: e.target.value })}
                placeholder="cliente@example.com"
              />
            </div>

            <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded border border-blue-200">
              <p className="font-semibold mb-1">💡 Registro rápido</p>
              <p>Solo completa los datos básicos ahora. Podrás agregar más información después en la ficha del cliente.</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogAbierto(false)}
              disabled={guardando}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={guardarNuevoCliente}
              disabled={guardando || !nuevoCliente.nombre_completo || !nuevoCliente.telefono}
            >
              <Plus className="h-4 w-4 mr-2" />
              {guardando ? 'Guardando...' : 'Guardar y Continuar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

