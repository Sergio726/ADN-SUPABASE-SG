'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Package,
  Building2,
  DollarSign,
  Mail,
  Menu,
  X,
  ExternalLink,
  LogOut,
  Grid3x3,
  FileText,
  Users,
  Shield,
  Settings,
  BarChart3,
} from 'lucide-react'
import { IsoLogo } from '@/components/Logo'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClientComponentClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
      } else {
        setUser(session.user)
      }
      setLoading(false)
    }
    getUser()
  }, [supabase, router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const navSections = [
    {
      title: 'Panel',
      links: [{ name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }],
    },
    {
      title: 'Catálogo',
      links: [
        { name: 'Artículos', href: '/dashboard/articulos', icon: Package },
        { name: 'Tejidos', href: '/dashboard/tejidos', icon: Grid3x3 },
        { name: 'Cercado', href: '/dashboard/cercado', icon: Shield },
      ],
    },
    {
      title: 'Ventas y atención',
      links: [
        { name: 'Presupuestos', href: '/dashboard/presupuestos', icon: FileText },
        { name: 'Clientes', href: '/dashboard/clientes', icon: Users },
        { name: 'Leads', href: '/dashboard/leads', icon: Mail },
      ],
    },
    {
      title: 'Operaciones',
      links: [
        { name: 'Precios', href: '/dashboard/precios', icon: DollarSign },
        { name: 'Proveedores', href: '/dashboard/proveedores', icon: Building2 },
      ],
    },
    {
      title: 'Administración',
      links: [
        { name: 'Configuraciones', href: '/dashboard/configuraciones', icon: Settings },
        { name: 'Visitas Web', href: '/dashboard/visitas', icon: BarChart3 },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <Link href="/dashboard" className="flex items-center">
              <div className="bg-white p-2 rounded-lg">
                <img 
                  src="/logos/isologo.png" 
                  alt="ADN" 
                  width={48}
                  height={48}
                  className="w-12 h-12 object-contain"
                />
              </div>
              <div className="ml-3 flex flex-col">
                <span className="text-lg font-bold text-brand-red">
                  ERP
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  Alambres del Norte
                </span>
              </div>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden hover:bg-red-50"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-5">
            {navSections.map((section) => (
              <div key={section.title} className="space-y-2">
                <p className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
                  {section.title}
                </p>
                <div className="space-y-1">
                  {section.links.map((item) => {
                    const isActive =
                      pathname === item.href || pathname?.startsWith(item.href + '/')
                    const Icon = item.icon
                    return (
                      <Button
                        key={item.name}
                        variant="ghost"
                        className={`w-full justify-start gap-3 text-sm font-medium transition ${
                          isActive
                            ? 'bg-primary/10 text-primary hover:bg-primary/20'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                        asChild
                      >
                        <Link href={item.href}>
                          <Icon className="h-5 w-5" />
                          <span>{item.name}</span>
                        </Link>
                      </Button>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* User info */}
          <div className="border-t p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-semibold text-sm">
                  {user?.email?.[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.user_metadata?.full_name || user?.email}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-30 flex h-16 items-center gap-x-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 sm:gap-x-6 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex flex-1 justify-between items-center">
            <h1 className="text-xl font-semibold">
              Panel de Control
            </h1>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/" target="_blank" className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                <span className="hidden sm:inline">Ver sitio web</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

