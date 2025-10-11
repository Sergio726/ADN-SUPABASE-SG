# 🧱 Alambres del Norte SRL - Sistema ERP + Web

Sistema completo de gestión y catálogo web para **Alambres del Norte SRL** desarrollado con Next.js 14 y Supabase.

## 🎯 Características

### 🌐 Sitio Web Público
- Landing page moderna y responsive
- Catálogo de productos con precios
- Página de detalle de cada artículo
- Formulario de contacto (leads)
- Diseño optimizado para conversión

### 📊 Panel de Administración (ERP)
- Dashboard con estadísticas en tiempo real
- Gestión completa de artículos
- Administración de proveedores
- Control de precios y márgenes
- Sistema de alertas de stock bajo
- Gestión de leads y consultas
- Autenticación segura con Google OAuth

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 14 (App Router)
- **Base de datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth + Google OAuth
- **Estilos**: TailwindCSS
- **Lenguaje**: TypeScript
- **Deploy**: Vercel

## 🚀 Instalación

### 1. Clonar el repositorio

\`\`\`bash
git clone <url-del-repo>
cd ADN-SUPABASE
\`\`\`

### 2. Instalar dependencias

\`\`\`bash
npm install
\`\`\`

### 3. Configurar Supabase

1. Crear una cuenta en [Supabase](https://supabase.com)
2. Crear un nuevo proyecto
3. En el **SQL Editor**, ejecutar el script `supabase/migrations/init.sql`
4. (Opcional) Ejecutar `supabase/seed.sql` para datos de prueba

### 4. Configurar variables de entorno

Crear un archivo `.env.local` en la raíz del proyecto:

\`\`\`bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
NEXT_PUBLIC_SITE_URL=http://localhost:3000
\`\`\`

### 5. Configurar Google OAuth

1. Ve a **Authentication → Providers** en tu panel de Supabase
2. Habilita el proveedor **Google**
3. Crea credenciales OAuth en [Google Cloud Console](https://console.cloud.google.com/)
4. Añade las URLs autorizadas:
   - `http://localhost:3000`
   - Tu URL de Supabase para callback
5. Copia el Client ID y Client Secret en Supabase

### 6. Ejecutar en desarrollo

\`\`\`bash
npm run dev
\`\`\`

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📁 Estructura del Proyecto

\`\`\`
ADN-SUPABASE/
├── app/
│   ├── (public)/              # Rutas públicas
│   │   ├── page.tsx          # Landing page
│   │   └── articulos/[id]/   # Detalle de artículo
│   ├── dashboard/            # Panel administrativo
│   │   ├── layout.tsx        # Layout con sidebar
│   │   ├── page.tsx          # Dashboard principal
│   │   ├── articulos/        # Gestión de artículos
│   │   ├── proveedores/      # Gestión de proveedores
│   │   ├── precios/          # Gestión de precios
│   │   └── leads/            # Consultas recibidas
│   ├── auth/
│   │   └── callback/         # Callback OAuth
│   ├── login/                # Página de login
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                   # Componentes reutilizables
│   ├── ArticuloCard.tsx
│   ├── Navbar.tsx
│   └── Footer.tsx
├── lib/
│   ├── supabaseClient.ts     # Cliente Supabase
│   ├── supabaseServer.ts     # Cliente servidor
│   └── utils.ts              # Utilidades
├── supabase/
│   ├── migrations/
│   │   └── init.sql          # Esquema de BD
│   └── seed.sql              # Datos de prueba
└── middleware.ts             # Protección de rutas
\`\`\`

## 🗄️ Esquema de Base de Datos

### Tablas principales:
- **usuarios**: Perfiles de usuario con roles
- **articulos**: Catálogo de productos
- **proveedores**: Proveedores de artículos
- **precios_venta**: Historial de precios y márgenes
- **leads**: Consultas desde el sitio web

## 🔐 Seguridad

- Row Level Security (RLS) habilitado en todas las tablas
- Políticas de acceso por rol
- Autenticación OAuth segura
- Middleware para protección de rutas del dashboard

## 🚢 Deploy en Vercel

1. Conecta tu repositorio con Vercel
2. Configura las variables de entorno
3. Deploy automático

\`\`\`bash
npm run build
\`\`\`

## 📝 Próximas Funcionalidades

- [ ] Sistema de cotizaciones
- [ ] Gestión de clientes
- [ ] Historial de ventas
- [ ] Reportes y analytics
- [ ] Gestión de stock con movimientos
- [ ] Facturación
- [ ] Catálogo con imágenes
- [ ] Búsqueda y filtros avanzados

## 🤝 Contribución

Para contribuir al proyecto:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es privado y pertenece a **Alambres del Norte SRL**.

## 👥 Contacto

**Alambres del Norte SRL**
- Email: info@alambresdelnorte.com
- Teléfono: +54 9 11 1234-5678
- Sitio: [www.alambresdelnorte.com](https://alambresdelnorte.com)

---

Desarrollado con ❤️ para Alambres del Norte SRL
\`\`\`

