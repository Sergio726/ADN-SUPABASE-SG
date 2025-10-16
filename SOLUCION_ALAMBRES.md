# 🔧 SOLUCIÓN: Alambres no se cargan en dropdown

## 🐛 **PROBLEMA IDENTIFICADO**

Los artículos con ID 7 y 8 (Alambre Galvanizado Cal.12 y Cal.14) tienen `publicado = false`, por lo que la política RLS los está bloqueando.

**Política actual:**
```sql
CREATE POLICY "lectura pública de artículos publicados"
ON articulos FOR SELECT 
USING (
  publicado = true OR 
  auth.uid() IS NOT NULL  -- ← Esto debería funcionar si estás logueado
);
```

---

## ✅ **SOLUCIÓN 1: Publicar los artículos (Rápido)**

Ejecutar en **Supabase SQL Editor:**

```sql
-- Marcar como publicados los alambres galvanizados
UPDATE articulos
SET publicado = true
WHERE id IN (7, 8);
```

**Resultado:**
- Los artículos 7 y 8 ahora se verán en todos lados
- Aparecerán en el dropdown ✅

---

## ✅ **SOLUCIÓN 2: Actualizar política RLS (Mejor)**

Si quieres que TODOS los artículos sean visibles para usuarios autenticados (no solo publicados):

```sql
-- Eliminar política actual
DROP POLICY IF EXISTS "lectura pública de artículos publicados" ON articulos;

-- Crear nueva política más permisiva para autenticados
CREATE POLICY "lectura de artículos"
ON articulos FOR SELECT 
USING (
  -- Usuarios no autenticados solo ven publicados
  (auth.uid() IS NULL AND publicado = true) OR
  -- Usuarios autenticados ven todos
  (auth.uid() IS NOT NULL)
);
```

**Ventaja:**
- Usuarios autenticados ven TODOS los artículos
- Web pública solo ve los publicados
- No necesitas publicar artículos internos

---

## ✅ **SOLUCIÓN 3: Verificar autenticación**

Puede que `auth.uid()` esté retornando `null` aunque estés logueado.

Ejecutar en consola del navegador:
```javascript
const { data: { user } } = await supabase.auth.getUser()
console.log('Usuario autenticado:', user)
```

Si `user` es `null`:
- No estás autenticado correctamente
- Vuelve a hacer login

---

## 🎯 **RECOMENDACIÓN**

**Ejecuta la SOLUCIÓN 2** (actualizar política RLS):

```sql
DROP POLICY IF EXISTS "lectura pública de artículos publicados" ON articulos;

CREATE POLICY "lectura de articulos"
ON articulos FOR SELECT 
USING (
  (auth.uid() IS NULL AND publicado = true) OR
  (auth.uid() IS NOT NULL)
);
```

**Por qué:**
- ✅ Usuarios logueados ven TODO el catálogo
- ✅ Web pública solo ve artículos publicados
- ✅ No necesitas publicar materias primas
- ✅ Más flexible para gestión interna

---

## 🚀 **DESPUÉS DE EJECUTAR**

1. Recarga la página de editar tejido
2. El dropdown "Alambre Galvanizado" debería mostrar:
   ```
   Alambre de Púas 2.5mm
   Alambre Galvanizado Calibre 12  ← Ahora visible
   Alambre Galvanizado Calibre 14  ← Ahora visible
   Alambre Liso 17/15
   ```

---

## 💡 **EXPLICACIÓN**

**Problema:**
- Alambres Galvanizados: `publicado = false` (son materia prima, no productos finales)
- Política RLS: Solo muestra `publicado = true` o si `auth.uid()` existe
- `auth.uid()` puede estar retornando `null` por algún motivo

**Solución:**
- Política RLS mejorada que distingue entre usuarios anónimos y autenticados
- Usuarios autenticados → ven TODO
- Usuarios anónimos → solo ven publicados

---

**¿Quieres que actualice la política RLS automáticamente con una migración?** 🚀

