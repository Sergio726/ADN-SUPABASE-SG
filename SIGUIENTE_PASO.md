# 🎯 SIGUIENTE PASO - Actualizar Precios de Tejidos

## ⚠️ **SITUACIÓN ACTUAL**

Has ejecutado exitosamente las migraciones y los 40 tejidos están importados ✅

**Problema detectado:**
- ✅ 40 tejidos importados correctamente
- ❌ Precios NO calculados (todos muestran NULL)
- ❌ La función usa una columna que no existe en `precios_venta`

---

## 🔧 **SOLUCIÓN**

### **Paso 1: Actualizar la Función SQL**

**Ejecuta este SQL en Supabase SQL Editor:**

Copia y ejecuta el contenido de:
```
supabase/migrations/fix_actualizar_precio_tejido.sql
```

Este fix:
- ✅ Elimina referencia a `actualizado_en` en `precios_venta`
- ✅ Mantiene toda la funcionalidad de cálculo
- ✅ Permite actualizar precios correctamente

---

### **Paso 2: Actualizar Precios Manualmente**

**Opción A: Ejecutar función SQL para todos los tejidos**

```sql
-- En Supabase SQL Editor, ejecuta:

DO $$
DECLARE
  tejido RECORD;
  v_precios RECORD;
BEGIN
  FOR tejido IN 
    SELECT id FROM tejidos_configuraciones
  LOOP
    -- Calcular precios
    SELECT * INTO v_precios FROM calcular_precio_tejido(tejido.id);
    
    -- Actualizar
    UPDATE tejidos_configuraciones
    SET 
      precio_costo = v_precios.precio_costo,
      precio_venta = v_precios.precio_venta
    WHERE id = tejido.id;
    
    RAISE NOTICE 'Actualizado: %', tejido.id;
  END LOOP;
END $$;

-- Verificar resultados
SELECT codigo, precio_costo, precio_venta
FROM tejidos_configuraciones
ORDER BY codigo
LIMIT 10;
```

---

**Opción B: Usar el script de actualización (después del fix SQL)**

```bash
node scripts/verificar-tejidos.js
```

---

### **Paso 3: Verificar que Funcionó**

```sql
-- Verificar que TODOS tienen precios
SELECT 
  COUNT(*) as total,
  COUNT(precio_costo) as con_costo,
  COUNT(precio_venta) as con_venta
FROM tejidos_configuraciones;

-- Ver algunos ejemplos
SELECT codigo, calibre, altura, tamano_rombo, 
       peso_kg, mano_obra, 
       precio_costo, precio_venta
FROM tejidos_configuraciones
WHERE codigo IN ('RC14x3,5x2', 'RC12x3x2', 'RC14x2x1,8')
ORDER BY codigo;
```

**Resultado esperado:**
```
Total: 40
Con costo: 40
Con venta: 40
```

---

## 🎯 **DESPUÉS DE ESTO**

Una vez que los precios estén calculados:

### **1. Probar el Dashboard** (3 min)
```bash
npm run dev
```

Ir a: `http://localhost:3000/dashboard/tejidos`

**Deberías ver:**
- ✅ 40 tejidos listados
- ✅ Todos con precios calculados
- ✅ Cards con estadísticas correctas
- ✅ Filtros y búsqueda funcionando

---

### **2. Continuar con el Desarrollo**

Yo continuaré con:
- ✅ Página de editar tejido
- ✅ Página de ver detalle
- ✅ Sistema de presupuestos
- ✅ Generación de PDF

---

## 📋 **RESUMEN RÁPIDO**

```
EJECUTA ESTO:

1. Supabase SQL Editor → Ejecutar fix_actualizar_precio_tejido.sql
2. Supabase SQL Editor → Ejecutar el script DO $$ para actualizar precios
3. Verificar con SELECT COUNT(*)
4. npm run dev
5. Ir a /dashboard/tejidos
6. ✅ ¡Listo!
```

---

**Tiempo estimado: 5 minutos** ⏱️

**¿Listo para continuar?** 🚀

