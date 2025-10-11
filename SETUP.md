# 📋 Guía de Configuración Paso a Paso

## 🎯 Pre-requisitos

- Node.js 18+ instalado
- Una cuenta de Supabase (gratis)
- Una cuenta de Google Cloud Console (para OAuth)
- Git instalado

---

## 📦 Paso 1: Instalación del Proyecto

```bash
# Clonar o navegar al proyecto
cd ADN-SUPABASE

# Instalar dependencias
npm install
```

---

## 🗄️ Paso 2: Configurar Supabase

### 2.1 Crear Proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Click en "Start your project"
3. Crea una organización (si no tienes una)
4. Click en "New Project"
5. Completa los datos:
   - **Project Name**: Alambres del Norte
   - **Database Password**: (guarda esta contraseña en un lugar seguro)
   - **Region**: South America (São Paulo) - para mejor latencia
   - **Pricing Plan**: Free (para empezar)
6. Click en "Create new project" y espera 1-2 minutos

### 2.2 Ejecutar Script SQL

1. En el panel de Supabase, ve a **SQL Editor** (icono de base de datos en el menú lateral)
2. Click en "New query"
3. Copia TODO el contenido del archivo `supabase/migrations/init.sql`
4. Pégalo en el editor
5. Click en "Run" (o presiona Ctrl+Enter)
6. Deberías ver el mensaje "Success. No rows returned"

### 2.3 (Opcional) Cargar Datos de Prueba

1. En el mismo SQL Editor, crea una nueva query
2. Copia el contenido de `supabase/seed.sql`
3. Pégalo y ejecuta con "Run"
4. Esto creará proveedores y artículos de ejemplo

### 2.4 Obtener Credenciales de Supabase

1. Ve a **Project Settings** (icono de engranaje en el menú)
2. Click en **API** en el menú lateral
3. Verás dos claves importantes:
   - **anon public**: Esta es tu `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role**: Esta es tu `SUPABASE_SERVICE_ROLE_KEY` (⚠️ mantenerla secreta)
4. También verás la **Project URL**: Esta es tu `NEXT_PUBLIC_SUPABASE_URL`

---

## 🔐 Paso 3: Configurar Google OAuth

### 3.1 Crear Proyecto en Google Cloud

1. Ve a [https://console.cloud.google.com](https://console.cloud.google.com)
2. Crea un nuevo proyecto o selecciona uno existente
3. En el menú, ve a **APIs & Services** → **OAuth consent screen**
4. Selecciona "External" y click en "Create"
5. Completa la información básica:
   - **App name**: Alambres del Norte ERP
   - **User support email**: tu email
   - **Developer contact**: tu email
6. Click en "Save and Continue"
7. En "Scopes", click en "Add or Remove Scopes"
8. Agrega estos scopes:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`
9. Click en "Save and Continue"
10. Agrega tu email como Test User y continúa

### 3.2 Crear Credenciales OAuth

1. Ve a **APIs & Services** → **Credentials**
2. Click en "+ CREATE CREDENTIALS" → "OAuth client ID"
3. Selecciona "Web application"
4. Dale un nombre: "Alambres del Norte Web"
5. En **Authorized JavaScript origins**, agrega:
   ```
   http://localhost:3000
   ```
6. En **Authorized redirect URIs**, agrega:
   ```
   https://TU-PROYECTO.supabase.co/auth/v1/callback
   ```
   (⚠️ Reemplaza TU-PROYECTO con tu ID de proyecto de Supabase)
7. Click en "Create"
8. Guarda el **Client ID** y **Client Secret**

### 3.3 Configurar en Supabase

1. En tu proyecto de Supabase, ve a **Authentication** → **Providers**
2. Busca "Google" en la lista
3. Activa el toggle "Enable Sign in with Google"
4. Pega tu **Client ID** y **Client Secret** de Google
5. En "Authorized Client IDs", pega el Client ID nuevamente
6. Click en "Save"

---

## ⚙️ Paso 4: Configurar Variables de Entorno

1. En la raíz del proyecto, crea un archivo `.env.local`
2. Copia las credenciales que obtuviste:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_clave_service_role_aqui

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

⚠️ **IMPORTANTE**: No subas este archivo a Git. Ya está incluido en `.gitignore`.

---

## 🚀 Paso 5: Ejecutar el Proyecto

```bash
# Iniciar el servidor de desarrollo
npm run dev
```

Abre tu navegador en [http://localhost:3000](http://localhost:3000)

---

## ✅ Verificación

### Verificar que funciona:

1. **Página pública**: Deberías ver la landing page
2. **Ver artículos**: Si cargaste los datos de prueba, verás 6 artículos
3. **Login**: Click en "Ingresar" → Debería redirigir a Google OAuth
4. **Dashboard**: Después de autenticarte, deberías ver el panel de control

### Si hay errores:

**Error: "Invalid API Key"**
- Verifica que copiaste bien las claves de Supabase
- Asegúrate de tener el archivo `.env.local` en la raíz del proyecto

**Error: "Failed to fetch"**
- Verifica la URL de Supabase
- Verifica tu conexión a internet

**Error: "OAuth redirect URI mismatch"**
- Verifica que la URL de callback en Google Cloud coincida con tu proyecto de Supabase
- Formato: `https://TU-PROYECTO.supabase.co/auth/v1/callback`

---

## 🎨 Paso 6: Crear tu Primer Usuario Admin

Después de iniciar sesión por primera vez:

1. Ve al **SQL Editor** en Supabase
2. Ejecuta esta query para hacerte admin:

```sql
-- Reemplaza 'tu-email@gmail.com' con tu email de Google
UPDATE usuarios 
SET rol = 'admin' 
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'tu-email@gmail.com'
);
```

3. Si el usuario no existe en la tabla `usuarios`, créalo primero:

```sql
-- Inserta tu usuario como admin
INSERT INTO usuarios (id, nombre, rol)
SELECT id, email, 'admin'
FROM auth.users 
WHERE email = 'tu-email@gmail.com'
ON CONFLICT (id) DO UPDATE SET rol = 'admin';
```

---

## 📱 Paso 7: Deploy a Producción (Opcional)

### Deploy en Vercel:

1. Push tu código a GitHub
2. Ve a [vercel.com](https://vercel.com)
3. Click en "New Project"
4. Importa tu repositorio de GitHub
5. Agrega las variables de entorno:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` (tu URL de Vercel)
6. Click en "Deploy"

### Actualizar Google OAuth:

1. En Google Cloud Console, edita tu OAuth client
2. Agrega tu URL de producción a:
   - Authorized JavaScript origins: `https://tu-app.vercel.app`
   - Authorized redirect URIs: `https://TU-PROYECTO.supabase.co/auth/v1/callback`

---

## 🆘 Soporte

Si tienes problemas:

1. Revisa la consola del navegador (F12)
2. Revisa los logs del servidor en la terminal
3. Verifica que todas las variables de entorno estén correctas
4. Asegúrate de haber ejecutado el script SQL completo

---

## 🎉 ¡Listo!

Tu sistema ya está funcionando. Ahora puedes:

- ✅ Agregar artículos desde el dashboard
- ✅ Gestionar proveedores
- ✅ Ver el catálogo público
- ✅ Recibir consultas de clientes
- ✅ Controlar precios y stock

---

**¡Éxitos con tu proyecto! 🚀**

