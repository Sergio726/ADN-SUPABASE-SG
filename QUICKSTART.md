# 🚀 Inicio Rápido - 5 minutos

## ✅ Pre-requisitos ya completados:
- ✅ Proyecto configurado
- ✅ Credenciales de Supabase obtenidas
- ✅ Código listo para usar

---

## 📋 Solo sigue estos pasos:

### 1️⃣ Renombrar archivo de configuración (10 segundos)

```bash
# En Windows PowerShell
Rename-Item -Path "env.local.example" -NewName ".env.local"

# O simplemente renombra el archivo manualmente:
# env.local.example → .env.local
```

### 2️⃣ Configurar la base de datos (2 minutos)

1. Abre: https://supabase.com/dashboard/project/vgsnfshbirzucddwbdpt
2. Click en **SQL Editor** (menú izquierdo)
3. Click en **New query**
4. Abre el archivo `supabase/migrations/init.sql` de este proyecto
5. **Copia TODO** su contenido
6. Pégalo en el editor SQL de Supabase
7. Click en **Run** ▶️

✅ Deberías ver: "Success. No rows returned"

### 3️⃣ (Opcional) Cargar datos de ejemplo (1 minuto)

1. En SQL Editor, click en **New query**
2. Abre el archivo `supabase/seed.sql`
3. Copia su contenido y pégalo
4. Click en **Run** ▶️

Esto crea 3 proveedores y 6 artículos de ejemplo.

### 4️⃣ Instalar y ejecutar (2 minutos)

```bash
# Instalar dependencias
npm install

# Iniciar el proyecto
npm run dev
```

### 5️⃣ Ver en el navegador

Abre: http://localhost:3000

---

## 🎉 ¡Ya está funcionando!

Deberías ver:
- ✅ Landing page de "Alambres del Norte"
- ✅ Catálogo de productos (si cargaste los datos de ejemplo)
- ✅ Botón "Ingresar" para el panel administrativo

---

## 🔐 Para acceder al Dashboard:

### Opción rápida (sin Google OAuth):
Crea un usuario admin manualmente:

1. En Supabase, ve a **Authentication** → **Users**
2. Click en **Add user** → **Create new user**
3. Ingresa un email y contraseña
4. Ve a **SQL Editor** y ejecuta:

```sql
-- Reemplaza con el email que creaste
INSERT INTO usuarios (id, nombre, rol)
SELECT id, email, 'admin'
FROM auth.users 
WHERE email = 'tu-email@ejemplo.com';
```

5. Ahora en tu sitio, click en "Ingresar"
6. Usa email y contraseña para acceder

### Opción completa (con Google OAuth):
Ver archivo `SETUP.md` para instrucciones detalladas.

---

## 📂 Estructura rápida del proyecto:

```
app/
├── page.tsx              → Landing pública
├── articulos/[id]/       → Detalle de artículo
├── dashboard/            → Panel administrativo
│   ├── articulos/        → Gestión de productos
│   ├── proveedores/      → Gestión de proveedores
│   ├── precios/          → Control de precios
│   └── leads/            → Consultas recibidas
└── login/                → Página de login

supabase/
├── migrations/init.sql   → Schema de base de datos
└── seed.sql              → Datos de prueba
```

---

## ❓ ¿Problemas?

### Error: "Invalid API Key"
→ Verifica que renombraste `env.local.example` a `.env.local`

### Error: "Failed to fetch"
→ Ejecuta el script SQL en Supabase (Paso 2)

### No veo artículos
→ Carga los datos de ejemplo (Paso 3)

### No puedo hacer login
→ Configura un usuario como se indica arriba

---

## 🎯 Próximos pasos:

1. ✅ Explora el dashboard
2. ✅ Agrega tus propios artículos
3. ✅ Configura proveedores
4. ✅ Personaliza precios
5. 🔐 Configura Google OAuth (ver SETUP.md)

---

**¡Éxito! Tu sistema está listo para usar.** 🚀

