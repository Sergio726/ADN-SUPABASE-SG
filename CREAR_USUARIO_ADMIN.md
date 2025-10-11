# 👤 Crear Usuario Admin - Solución Temporal

Como Google OAuth no está configurado todavía, podés crear un usuario admin manualmente para acceder al dashboard.

## 🚀 Opción 1: Crear usuario desde Supabase (Recomendado)

### Paso 1: Ir al panel de Supabase

1. Abre: https://supabase.com/dashboard/project/vgsnfshbirzucddwbdpt
2. Ve a **Authentication** → **Users** (en el menú lateral)
3. Click en el botón **Add user** → **Create new user**

### Paso 2: Crear el usuario

Completa los datos:
- **Email**: admin@alambresdelnorte.com (o el que prefieras)
- **Password**: Crea una contraseña segura
- **Auto Confirm User**: ✅ Activar (importante!)

Click en **Create user**

### Paso 3: Hacer el usuario Admin

1. Ve a **SQL Editor** en el menú lateral
2. Click en **New query**
3. Pega este código (reemplaza el email si usaste otro):

```sql
-- Insertar en la tabla usuarios con rol admin
INSERT INTO usuarios (id, nombre, rol)
SELECT id, email, 'admin'
FROM auth.users 
WHERE email = 'admin@alambresdelnorte.com'
ON CONFLICT (id) DO UPDATE 
SET rol = 'admin';
```

4. Click en **Run** (o Ctrl+Enter)

### Paso 4: Iniciar sesión

1. Abre http://localhost:3002/login
2. Usa:
   - Email: admin@alambresdelnorte.com
   - Password: la que creaste

¡Listo! Ya podés acceder al dashboard.

---

## 🔧 Opción 2: Crear usuario con SQL directo

Si preferís hacerlo todo desde SQL:

```sql
-- IMPORTANTE: Cambia estos valores
-- email: tu email deseado
-- password_hash: Esta es la contraseña "admin123" hasheada
-- Puedes generar tu propio hash en: https://supabase.com/dashboard/project/_/auth/users

-- 1. Primero inserta en auth.users (tabla del sistema)
-- Esto debe hacerse desde el panel de Authentication → Users
-- porque requiere permisos especiales

-- 2. Después crea el perfil de usuario admin
INSERT INTO usuarios (id, nombre, rol)
SELECT id, 'Administrador', 'admin'
FROM auth.users 
WHERE email = 'admin@alambresdelnorte.com'
ON CONFLICT (id) DO UPDATE 
SET rol = 'admin';
```

---

## 📧 Emails de prueba sugeridos:

- `admin@alambresdelnorte.com` - Usuario principal
- `sebastian@alambresdelnorte.com` - Para Sebastián
- `alexia@alambresdelnorte.com` - Para Alexia

---

## ⚠️ IMPORTANTE

- La **contraseña debe tener al menos 6 caracteres**
- Marca **Auto Confirm User** para no tener que confirmar por email
- El usuario debe existir en `auth.users` ANTES de insertarlo en `usuarios`

---

## ✅ Verificar que funciona

Después de crear el usuario:

1. Ve a http://localhost:3002/login
2. Ingresa email y contraseña
3. Deberías ser redirigido a http://localhost:3002/dashboard
4. Verás el panel de administración completo

---

## 🔐 Configurar Google OAuth (Opcional)

Si más adelante querés configurar Google OAuth, seguí el archivo `SETUP.md` sección "Configurar Google OAuth".

Por ahora, el login con email/password funciona perfecto para desarrollo y uso interno.

