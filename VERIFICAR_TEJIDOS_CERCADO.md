# 🔍 VERIFICAR CARGA DE TEJIDOS EN CONFIGURACIÓN DE CERCADO

## ❓ **PROBLEMA**

El dropdown "Seleccionar tejido" no muestra opciones al seleccionar una altura de cerco.

---

## ✅ **CÓMO FUNCIONA**

El código **SÍ está correcto** y filtra automáticamente:

```typescript
// app/dashboard/cercado/nuevo/page.tsx (línea 299)
{tejidos
  .filter((t) => t.altura.toString() === formData.altura)
  .map((tejido) => (
    <SelectItem key={tejido.id} value={tejido.id}>
      {tejido.codigo} - ${tejido.precio_venta?.toLocaleString()}
    </SelectItem>
  ))}
```

**Ejemplo:**
- Si seleccionas "1.8 metros" en altura
- El sistema filtra solo tejidos con `altura = 1.8`
- Muestra: TR-1.8-12-3.5, TR-1.8-12-3.0, TR-1.8-14-2.5, etc.

---

## 🔍 **VERIFICACIÓN PASO A PASO**

### **PASO 1: Verificar que existe la vista**

Ejecuta en **Supabase SQL Editor**:

```sql
-- Verificar que existe la vista
SELECT table_name 
FROM information_schema.views 
WHERE table_name = 'v_tejidos_con_precios';
```

**Resultado esperado:**
```
table_name
------------------
v_tejidos_con_precios
```

✅ Si aparece: La vista existe
❌ Si no aparece: Ejecutar migración `20241015_tejidos_configuraciones.sql`

---

### **PASO 2: Verificar que hay tejidos en la tabla**

```sql
-- Contar tejidos activos
SELECT COUNT(*) as total_tejidos
FROM tejidos_configuraciones
WHERE activo = true;
```

**Resultado esperado:** `40`

✅ Si hay 40: Los tejidos están importados
❌ Si hay 0: Ejecutar script de importación

---

### **PASO 3: Verificar tejidos por altura**

```sql
-- Ver cantidad de tejidos por altura
SELECT 
  altura,
  COUNT(*) as cantidad
FROM tejidos_configuraciones
WHERE activo = true
GROUP BY altura
ORDER BY altura;
```

**Resultado esperado:**
```
altura | cantidad
-------|---------
1.00   |    8
1.20   |    8
1.50   |    8
1.80   |    8
2.00   |    8
```

✅ Cada altura debe tener 8 tejidos (2 calibres × 4 rombos)

---

### **PASO 4: Ver tejidos de altura 1.8 específicamente**

```sql
-- Ver tejidos de 1.8m
SELECT 
  codigo,
  calibre,
  tamano_rombo,
  precio_venta
FROM v_tejidos_con_precios
WHERE altura = 1.8
ORDER BY codigo;
```

**Resultado esperado:**
```
codigo          | calibre | tamano_rombo | precio_venta
----------------|---------|--------------|-------------
TR-1.8-12-2.0   |   12    |     2.0      |   XX,XXX
TR-1.8-12-2.5   |   12    |     2.5      |   XX,XXX
TR-1.8-12-3.0   |   12    |     3.0      |   XX,XXX
TR-1.8-12-3.5   |   12    |     3.5      |   XX,XXX
TR-1.8-14-2.0   |   14    |     2.0      |   XX,XXX
TR-1.8-14-2.5   |   14    |     2.5      |   XX,XXX
TR-1.8-14-3.0   |   14    |     3.0      |   XX,XXX
TR-1.8-14-3.5   |   14    |     3.5      |   XX,XXX
```

✅ Debe mostrar 8 tejidos

---

### **PASO 5: Verificar permisos de la vista**

```sql
-- Verificar permisos
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'v_tejidos_con_precios';
```

**Resultado esperado:**
Debe incluir permisos para `authenticated` y `anon`

---

## 🛠️ **SOLUCIONES**

### **Solución 1: La vista no existe**

```sql
-- Ejecutar en Supabase SQL Editor:
-- Contenido completo del archivo:
supabase/migrations/20241015_tejidos_configuraciones.sql
```

---

### **Solución 2: No hay tejidos (tabla vacía)**

```bash
# Ejecutar en terminal local:
node scripts/importar-tejidos.js
```

O ejecutar manualmente en Supabase:

```sql
-- Ejemplo de inserción manual de 1 tejido de 1.8m
INSERT INTO tejidos_configuraciones (
  codigo, nombre, calibre, altura, largo, tamano_rombo,
  cantidad_alambre, costo_mano_obra, precio_venta, activo
) VALUES (
  'TR-1.8-14-3.5',
  'Tejido Romboidal 1.8m Cal.14 Rombo 3.5"',
  14,
  1.80,
  10.00,
  3.5,
  16.20,
  0,
  58901,
  true
);
```

**Para importar los 40:**
Usa el script: `node scripts/importar-tejidos.js`

---

### **Solución 3: Tejidos sin precio**

```sql
-- Verificar precio del alambre base
SELECT * FROM precio_alambre_base;

-- Si no existe, crear:
INSERT INTO precio_alambre_base (precio) VALUES (3636.36);

-- Actualizar precios de tejidos
SELECT actualizar_precio_tejidos();
```

---

### **Solución 4: Permisos faltantes**

```sql
-- Otorgar permisos a la vista
GRANT SELECT ON v_tejidos_con_precios TO authenticated;
GRANT SELECT ON v_tejidos_con_precios TO anon;
```

---

## 🧪 **PRUEBA EN DESARROLLO**

### **Consola del navegador:**

```javascript
// Abrir consola en /dashboard/cercado/nuevo
// Verificar que se carguen los tejidos

// 1. Ver todos los tejidos cargados
console.log('Tejidos:', tejidos)

// 2. Ver tejidos filtrados por altura 1.8
console.log('Tejidos 1.8m:', 
  tejidos.filter(t => t.altura.toString() === '1.80')
)

// 3. Ver altura seleccionada
console.log('Altura seleccionada:', formData.altura)
```

---

## 📋 **CHECKLIST COMPLETO**

```
□ Vista v_tejidos_con_precios existe
□ Hay 40 tejidos en la tabla
□ Cada altura tiene 8 tejidos
□ Tejidos tienen precio_venta calculado
□ precio_alambre_base tiene valor
□ Permisos SELECT otorgados a authenticated
□ Script importar-tejidos.js ejecutado
```

---

## 🎯 **SOLUCIÓN RÁPIDA**

Si quieres resolver todo de una vez:

```bash
# 1. Ejecutar en Supabase SQL Editor (en orden):
supabase/migrations/20241015_tejidos_configuraciones.sql

# 2. Ejecutar en terminal local:
node scripts/importar-tejidos.js

# 3. Verificar en SQL Editor:
SELECT COUNT(*) FROM v_tejidos_con_precios;
-- Debe retornar 40

# 4. Recargar página en navegador
# Ctrl + Shift + R (hard reload)
```

---

## 💡 **NOTA IMPORTANTE**

El filtrado **funciona automáticamente** en el código:

```typescript
.filter((t) => t.altura.toString() === formData.altura)
```

**Conversión de tipos:**
- `formData.altura` es string: `"1.80"`
- `t.altura` es number: `1.8`
- Por eso hacemos `t.altura.toString()` → `"1.8"`

⚠️ **Importante:** `"1.8"` es diferente de `"1.80"`

Si en la BD tienes `1.80` pero el código espera `"1.80"`, el filtro funcionará.
Si en la BD tienes `1.8` pero el código espera `"1.80"`, NO coincidirá.

**Verifica:**
```sql
-- Ver el formato exacto de altura en BD
SELECT DISTINCT altura, altura::text 
FROM tejidos_configuraciones;
```

---

## 🔧 **FIX APLICADO** ✅

**PROBLEMA RESUELTO:** El filtrado ahora usa comparación numérica con tolerancia.

```typescript
// ✅ SOLUCIONADO en líneas 299-303
.filter((t) => {
  const alturaFloat = parseFloat(formData.altura)
  const tejidoAltura = typeof t.altura === 'number' ? t.altura : parseFloat(t.altura)
  return Math.abs(tejidoAltura - alturaFloat) < 0.01
})
```

**Por qué funcionaba antes:**
- `formData.altura` = `"2.00"` (string)
- `t.altura` = `2` (number)
- `t.altura.toString()` = `"2"` ❌ NO coincidía con `"2.00"`

**Solución:**
- Convertimos ambos a números decimales
- Comparamos con tolerancia de 0.01 para evitar problemas de precisión
- Funciona con cualquier formato: `1.8`, `1.80`, `2`, `2.00`

---

**¿Necesitas ayuda?** Ejecuta los pasos 1-4 y comparte los resultados. 🚀

