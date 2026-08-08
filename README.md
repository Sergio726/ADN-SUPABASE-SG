# 🧱 Alambres del Norte SRL - Sistema ERP + Web

Sistema completo de gestión empresarial y catálogo web para **Alambres del Norte SRL** desarrollado con Next.js 14, TypeScript y Supabase.

## Por dónde empezar

1. **`docs/HANDOFF.md`** — estado, roles y forma de trabajo.
2. **Este README** — cómo correr el proyecto.
3. **`docs/PENDIENTES.md`** — qué falta y de quién depende.
4. **`DOCUMENTACION.md`** — detalle técnico (parcialmente desactualizado).

## 🎯 **¿Qué es este sistema?**

Un ERP completo que incluye:
- ✅ **Web Pública**: Catálogo de productos, contacto, WhatsApp
- ✅ **Panel Interno**: Gestión de artículos, proveedores, precios, clientes
- ✅ **Sistema de Cotización**: Presupuestos de artículos y servicios de cercado
- ✅ **Gestión de Tejidos**: 40 configuraciones con cálculo automático de precios
- ✅ **Gestión de Cercado**: Configuraciones base para servicios perimetrales
- ✅ **Generación de PDF**: Presupuestos profesionales descargables

---

## 🚀 **Inicio Rápido** (5 minutos)

### **1. Instalar Dependencias**
```bash
npm install
```

### **2. Configurar Variables de Entorno**
Crear archivo `.env.local` en la raíz:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### **3. Configurar Base de Datos en Supabase**
En un proyecto **ya existente** no re-apliques el dump histórico. Las migraciones vigentes están en `supabase/migrations/`; las viejas en `supabase/migrations/archived/`.

Si levantás un entorno nuevo desde cero, revisá `docs/HANDOFF.md` y el orden real de archivos en esas carpetas (el listado largo que había acá quedó desfasado).

### **4. Crear Bucket de Storage**
En **Supabase Storage**, crear bucket `articulos-images` con:
- Public: `true`
- Allowed MIME types: `image/*`

O ejecutar script:
```bash
node scripts/crear-bucket-storage.js
```

### **5. Importar Datos de Tejidos (Opcional)**
```bash
node scripts/importar-tejidos.js
```

### **6. Iniciar Servidor**
```bash
npm run dev
```

Abrir: **http://localhost:3000**

---

## 📁 **Estructura del Proyecto**

```
ADN-SUPABASE/
├── app/                          # Next.js 14 App Router
│   ├── page.tsx                 # Landing page pública
│   ├── articulos/[id]/          # Detalle público de artículo
│   ├── contacto/                # Formulario de contacto
│   ├── login/                   # Login con Supabase Auth
│   └── dashboard/               # Panel administrativo (protegido)
│       ├── page.tsx            # Dashboard principal
│       ├── articulos/          # CRUD artículos
│       ├── proveedores/        # CRUD proveedores
│       ├── precios/            # Gestión de precios
│       ├── leads/              # Consultas recibidas
│       ├── tejidos/            # CRUD tejidos romboidales
│       ├── cercado/            # CRUD configuraciones cercado
│       ├── clientes/           # CRUD clientes
│       ├── tareas/             # Tareas CRM
│       ├── visitas/            # Analytics web
│       ├── configuracion/horarios/
│       └── presupuestos/       # Sistema de presupuestos
│           ├── nuevo/tipo/     # Selector de tipo
│           ├── nuevo/articulos/# Presupuesto de artículos
│           ├── nuevo/cercado/  # Wizard de cercado
│           ├── nuevo/general/  # Presupuesto general
│           └── [id]/           # Ver/editar presupuesto
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── ArticuloCard.tsx        # Card de producto
│   ├── BuscarCliente.tsx       # Búsqueda con registro rápido
│   ├── ProductoCombobox.tsx    # Búsqueda inteligente
│   ├── ImageUpload.tsx         # Upload a Supabase Storage
│   ├── Logo.tsx                # Componentes de logo
│   ├── Navbar.tsx              # Navegación pública
│   ├── Footer.tsx              # Footer
│   └── WhatsAppButton.tsx      # Botón flotante WhatsApp
├── lib/
│   ├── supabaseClient.ts       # Cliente Supabase (browser)
│   ├── supabaseServer.ts       # Cliente Supabase (server)
│   ├── pdf-generator.ts        # Generación de PDF con jsPDF
│   ├── logos.ts                # Configuración de branding
│   └── utils.ts                # Utilidades (cn, etc.)
├── supabase/
│   ├── migrations/             # Migraciones SQL
│   └── seed.sql                # Datos de prueba (opcional)
├── scripts/
│   ├── crear-bucket-storage.js # Crear bucket automático
│   └── importar-tejidos.js     # Importar 40 configuraciones
└── public/
    └── logos/                  # Logos e imágenes de marca
```

---

## 🗄️ **Base de Datos**

### **Tablas Principales:**
| Tabla | Descripción |
|-------|-------------|
| `usuarios` | Usuarios del sistema con roles |
| `articulos` | Catálogo general de productos |
| `proveedores` | Proveedores de artículos |
| `precios_venta` | Historial de precios con vigencia |
| `leads` | Consultas desde web pública |
| `tejidos_configuraciones` | 40 configuraciones de tejido romboidal |
| `configuraciones_cercado` | Configuraciones base de cercado |
| `clientes` | Clientes con DNI/CUIL/CUIT |
| `presupuestos` | Presupuestos de artículos y cercado |
| `presupuestos_items` | Items de cada presupuesto |

### **Funciones y Triggers:**
- ✅ Cálculo automático de precios de tejidos
- ✅ Actualización de precios al cambiar materias primas
- ✅ Generación automática de números de presupuesto
- ✅ Cálculo proporcional de cercado según terreno
- ✅ Recargo automático para terrenos <50m

---

## 🛠️ **Stack Tecnológico**

### **Frontend:**
- Next.js 14 (App Router, Server Components)
- TypeScript
- TailwindCSS
- shadcn/ui (componentes)
- Lucide React (iconos)
- React Hook Form (formularios)

### **Backend:**
- Supabase (PostgreSQL, Auth, Storage)
- Row Level Security (RLS)
- SQL Functions & Triggers
- Views optimizadas

### **Generación PDF:**
- jsPDF
- jsPDF AutoTable

### **Análisis de Datos:**
- xlsx (lectura de Excel)

---

## 🔐 **Seguridad**

- ✅ **Row Level Security (RLS)** en todas las tablas
- ✅ **Políticas por rol** (admin, usuario)
- ✅ **Autenticación** con Supabase Auth
- ✅ **Middleware** protege rutas del dashboard
- ✅ **Storage policies** para imágenes

---

## 📊 **Módulos del Sistema**

### **1. Gestión de Artículos**
- CRUD completo
- Upload de imágenes (Instagram format 4:5)
- Control de visibilidad pública
- Mostrar/ocultar precio
- Asociación con proveedores

### **2. Gestión de Tejidos Romboidales**
- 40 configuraciones (Cal.12/14, alturas, rombos)
- Cálculo automático según precio de alambre
- Desglose de costos y materiales
- Vista detallada de fórmulas

### **3. Gestión de Configuraciones de Cercado**
- Configuraciones base para 180m lineales
- 35+ campos editables por configuración
- Desglose completo de componentes
- Pre-carga inteligente de precios
- Cálculo en tiempo real

### **4. Gestión de Clientes**
- DNI/CUIL/CUIT
- Datos fiscales y de contacto
- Historial de presupuestos
- Registro rápido desde presupuestos

### **5. Sistema de Presupuestos**
- **Tipo Artículos:** Tabla tipo Excel con búsqueda inteligente
- **Tipo Cercado:** Wizard de 5 pasos con cálculo proporcional
- Generación de PDF profesional
- Cambio de estados (Borrador → Enviado → Aceptado/Rechazado)
- Duplicar presupuestos

### **6. Web Pública**
- Catálogo de artículos publicados
- Detalle con imágenes
- Botón WhatsApp
- Formulario de contacto (leads)

---

## 🎨 **Diseño**

- **Branding:** Rojo #DC2626 (Alambres del Norte)
- **UI Library:** shadcn/ui (Radix UI + TailwindCSS)
- **Responsive:** Mobile-first
- **Iconos:** Lucide React
- **Toasts:** Notificaciones elegantes
- **Tooltips:** Ayuda contextual

---

## 📦 **Scripts Disponibles**

```bash
npm run dev          # Desarrollo en localhost:3000
npm run build        # Build para producción
npm run start        # Iniciar build de producción
npm run lint         # Linter
```

### **Scripts Personalizados:**
```bash
node scripts/crear-bucket-storage.js   # Crear bucket de imágenes
node scripts/importar-tejidos.js       # Importar 40 tejidos
```

---

## 🔧 **Configuración Adicional**

### **Google OAuth (Opcional):**
1. Google Cloud Console → Crear proyecto
2. Habilitar Google+ API
3. Crear credenciales OAuth 2.0
4. Supabase → Authentication → Providers → Google
5. Agregar Client ID y Secret

### **Crear Usuario Admin:**
1. Registrarse en `/login`
2. En Supabase SQL Editor:
```sql
UPDATE usuarios 
SET rol = 'admin' 
WHERE email = 'tu-email@ejemplo.com';
```

---

## 📖 **Documentación Completa**

Empezá por **`docs/HANDOFF.md`**. Después:

- **`docs/PENDIENTES.md`** — checklist vivo (fuente de verdad de tareas)
- **`DOCUMENTACION.md`** — flujos, BD, cálculos, troubleshooting (puede estar desfasada vs. el código)
- **`app/files/IDEAS_MEJORA.md`** — roadmap / ideas, no es el checklist operativo

---

## 🚢 **Deploy en Vercel**

1. Conectar repositorio con Vercel
2. Configurar variables de entorno
3. Deploy automático en cada push a `main`

```bash
npm run build   # Verificar build local
```

---

## 📝 **Estado Actual**

✅ **Núcleo en uso / listo para operar** (no es “100% cerrado”: hay backlog).
- Catálogo, tejidos, cercado, clientes, presupuestos (artículos / cercado / general)
- Tareas CRM, horarios, visitas web + UTM
- PDF / remitos, incremento en presupuestos

Detalle y huecos: **`docs/HANDOFF.md`** + **`docs/PENDIENTES.md`**.

---

## 📞 **Soporte**

Para consultas sobre el proyecto:
- Email: info@alambresdelnorte.com
- WhatsApp: +54 387 477-3393 (canónico en `lib/logos.ts`)

---

## 📄 **Licencia**

Este proyecto es privado y pertenece a **Alambres del Norte SRL**.

---

**Desarrollado con ❤️ para Alambres del Norte SRL**
