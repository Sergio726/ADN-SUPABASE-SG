# 🚀 EJECUTAR PARA COMPLETAR MIGRACIÓN DE ARTÍCULOS

## ✅ **LO QUE YA TIENES**

- ✅ 42 artículos importados en la tabla `articulos`
- ✅ Categorías asignadas automáticamente
- ✅ Alturas compatibles configuradas
- ⏳ Precios pendientes de crear

---

## 📋 **EJECUTA EN SUPABASE SQL EDITOR (EN ORDEN)**

### **PASO 1: Corregir función de cálculo**
```sql
-- Archivo: supabase/migrations/fix_fecha_inicio_tejidos.sql
-- Corrige el nombre de columna fecha_desde → fecha_inicio
```

**Copiar y ejecutar TODO el contenido** ✅

---

### **PASO 2: Arreglar trigger de precios**
```sql
-- Archivo: supabase/migrations/fix_trigger_precios_venta.sql
-- Corrige el trigger que actualiza tejidos cuando cambia precio de alambre
```

**Copiar y ejecutar TODO el contenido** ✅

---

### **PASO 3: Insertar los 42 precios**
```sql
-- Archivo: supabase/migrations/insertar_precios_articulos.sql
-- Crea los precios vigentes para los 42 artículos
```

**Copiar y ejecutar TODO el contenido** ✅

---

## ✅ **VERIFICACIÓN**

Después del PASO 3, deberías ver:

```sql
total_precios_creados
---------------------
42
```

---

## 🌐 **WEB PÚBLICA**

Después de ejecutar los 3 pasos:

1. Ve a: `http://localhost:3000`
2. Scroll hasta "Nuestros Productos"
3. Deberías ver los artículos que tienen:
   - ✅ `publicado = true`
   - ✅ Precio vigente

**Nota:** Los artículos sin imagen se mostrarán con placeholder.

---

## 📊 **ARTÍCULOS QUE SE VERÁN EN WEB**

Todos los 42 artículos importados tienen `publicado = true`, así que una vez que tengan precios, aparecerán:

- Alambre Galvanizado Calibre 12, 13, 14, 20
- Alambre de Púas (rollos y por metro)
- Alambre A/R 17/15, 16/14
- Alambre Negro 8, 14, 16
- Ganchos Galvanizados (varios tamaños)
- Torniquetas (Micro, Mini, N7)
- Esparragos
- Varilla roscada
- Planchuelas
- Arena, Ripio, Cemento
- Hierros (varios tipos)
- Clavos
- Electrodos
- Discos
- Concertinas
- etc.

---

## 🎯 **DESPUÉS DE LA MIGRACIÓN**

Podrás:
- ✅ Ver 42 artículos en `/dashboard/articulos`
- ✅ Ver 42 precios en `/dashboard/precios`
- ✅ Ver artículos en la web pública `/`
- ✅ Usar artículos en presupuestos
- ✅ Filtrar por categoría
- ✅ Filtrar por altura compatible
- ✅ Editar precios y recalcular márgenes

---

## 🔧 **SI NO APARECEN EN LA WEB**

Verifica:
1. Que los 3 scripts SQL se ejecutaron sin error
2. Que el contador muestra 42 precios
3. Recarga la página con Ctrl+Shift+R (hard reload)
4. Revisa la consola del servidor para ver cuántos artículos carga

---

**¡Ejecuta los 3 pasos en orden y tendrás todo funcionando!** 🎉

