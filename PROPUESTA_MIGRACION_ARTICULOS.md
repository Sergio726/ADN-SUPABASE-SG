# 📦 PROPUESTA: MIGRACIÓN DE ARTÍCULOS DESDE EXCEL

## 📊 **ANÁLISIS DEL ARCHIVO**

**Archivo:** `Articulos.xlsx`
**Total artículos:** 42

### **Columnas en Excel:**
1. Articulo Detalle
2. Unidad
3. Dimensiones
4. Precio Costo (neto + impuestos)
5. **Precio Efectivo/Transf.** ⭐
6. **Precio Venta/Lista** ⭐
7. **Precio Tarjeta** ⭐
8. cheq 45 días
9. cheq 60 días
10. cheq 90 días

---

## ✅ **COMPATIBILIDAD CON SISTEMA ACTUAL**

### **¡PERFECTA COINCIDENCIA!** 🎉

Tu Excel tiene **EXACTAMENTE** los 3 precios que acabamos de implementar:

| Excel | Sistema Actual | Match |
|-------|----------------|-------|
| Precio Efectivo/Transf. | `precio_venta` (Efectivo 45%) | ✅ |
| Precio Venta/Lista | `precio_lista` (Lista 57%) | ✅ |
| Precio Tarjeta | `precio_tarjeta` (Tarjeta 65%) | ✅ |

---

## 🎯 **CATEGORIZACIÓN AUTOMÁTICA**

He identificado estas categorías en tus 42 artículos:

### **1. Alambres (8 artículos)**
- Alambre Galvanizado Calibre 12, 13, 14, 20
- Alambre de Púas (rollo 100m, 500m, por metro)
- Alambre A/R 17/15, 16/14
- Alambre Negro 8, 14, 16

**Altura compatible:** `todas`

### **2. Accesorios de Fijación (7 artículos)**
- Ganchos Galvanizados 3/8" x 7", 8", 10"
- Torniqueta Galvanizada Micro, Mini N5, N7
- Esparragos Galvanizados 3/8" x 10"

**Altura compatible:** 
- Micro/Mini → `1.0,1.2,1.5`
- N7 → `1.8,2.0`
- Ganchos → `todas`

### **3. Materiales Estructurales (4 artículos)**
- Varilla roscada 3/8"
- Planchuela 7/8 x 3/16" (por metro y 2mt)

**Altura compatible:** `todas`

### **4. Materiales de Construcción (3 artículos)**
- Arena
- Ripio
- Cemento 50kg

**Altura compatible:** `todas`

### **5. Hierros (7 artículos)**
- Hierro liso 8mm
- Hierro torsionado 6mm, 8mm, 10mm
- Barra de hierro Ø 6mm, 10mm, 12mm

**Altura compatible:** No aplica (construcción general)

### **6. Otros (3 artículos)**
- Travillas Cebil 1.4mt x 12un
- Electrodo 2.5mm
- Disco corte amoladora
- Concertinas 30cm x 10mt

**Altura compatible:** 
- Concertinas → `1.8,2.0`
- Resto → No aplica

### **7. Servicios (2 artículos)**
- Mano de obra x mt s/cordón
- Mano de obra x mt c/cordón
- Transporte x mtl

**Altura compatible:** `todas`

---

## 💡 **MEJORAS PROPUESTAS**

### **MEJORA 1: Agregar campo `tipo_precio`**

Los artículos tienen diferentes formas de cotizar:

```sql
ALTER TABLE articulos
ADD COLUMN tipo_precio TEXT DEFAULT 'manual';

-- Valores:
-- 'manual': Se ingresan precios manualmente
-- 'margen': Se calculan desde costo + márgenes (como tejidos)
-- 'servicio': Precio especial para servicios
```

### **MEJORA 2: Agregar márgenes a artículos**

Para que puedan actualizar automáticamente como los tejidos:

```sql
ALTER TABLE articulos
ADD COLUMN margen_efectivo NUMERIC(5,2),
ADD COLUMN margen_lista NUMERIC(5,2),
ADD COLUMN margen_tarjeta NUMERIC(5,2),
ADD COLUMN precio_lista NUMERIC(12,2),
ADD COLUMN precio_tarjeta NUMERIC(12,2);
```

**Ventaja:** Al cambiar el precio de costo, se recalculan los 3 precios automáticamente.

### **MEJORA 3: Campo `dimensiones`**

```sql
ALTER TABLE articulos
ADD COLUMN dimensiones TEXT;
```

Para guardar: "12'", "3/8"", "7/8 x 3/16", etc.

---

## 🚀 **SCRIPT DE IMPORTACIÓN**

Voy a crear un script que:

1. ✅ Lee el Excel
2. ✅ Categoriza automáticamente
3. ✅ Asigna altura_compatible según categoría
4. ✅ Calcula márgenes promedio desde los precios del Excel
5. ✅ Crea el artículo
6. ✅ Crea el precio vigente en `precios_venta`
7. ✅ Guarda los 3 precios
8. ✅ Actualiza IDs 7 y 8 si ya existen (Alambre Cal.12 y 14)

---

## 📋 **MAPEO DE CAMPOS**

| Excel | Tabla articulos | Tabla precios_venta |
|-------|-----------------|---------------------|
| Articulo Detalle | `nombre` | - |
| Unidad | `unidad` | - |
| Dimensiones | `dimensiones` | - |
| Precio Costo | - | `precio_costo` |
| Precio Efectivo | - | `precio_venta` |
| Precio Lista | - | `precio_lista` |
| Precio Tarjeta | - | `precio_tarjeta` |

**Categoría:** Auto-detectada por nombre
**Altura compatible:** Auto-asignada por categoría
**Márgenes:** Calculados inversos desde los precios

---

## 📐 **CÁLCULO DE MÁRGENES**

```javascript
// Desde los datos del Excel podemos calcular los márgenes reales:
margen_efectivo = ((precio_efectivo / precio_costo) - 1) * 100
margen_lista = ((precio_lista / precio_costo) - 1) * 100
margen_tarjeta = ((precio_tarjeta / precio_costo) - 1) * 100

// Ejemplo: Alambre Cal.14
// Costo: $3,135.77
// Efectivo: $4,887.03
// margen_efectivo = ((4887.03 / 3135.77) - 1) * 100 = 55.87%
```

---

## 🎯 **RESULTADO FINAL**

Después de la migración tendrás:

```
✅ 42 artículos importados
✅ Categorías auto-asignadas
✅ Alturas compatibles configuradas
✅ 3 precios importados para cada uno
✅ Márgenes calculados y guardados
✅ IDs 7 y 8 actualizados (Alambre Cal.12 y 14)
✅ Todo compatible con sistema de tejidos
✅ Listo para usar en presupuestos
```

---

## 🔧 **OPCIONES DE MIGRACIÓN**

### **Opción A: Migración Simple (Recomendada)**
- Importar artículos tal cual
- Solo agregar categoría y altura_compatible
- Mantener estructura actual
- Rápido y seguro

### **Opción B: Migración Completa (Avanzada)**
- Agregar campos: tipo_precio, márgenes, dimensiones
- Sistema automático de actualización de precios
- Más potente pero más complejo
- Requiere más migraciones SQL

---

## 💬 **MI RECOMENDACIÓN**

### **OPCIÓN A + Mejoras Graduales**

1. **Ahora:** Importar con Opción A (simple)
2. **Después:** Agregar mejoras progresivamente si las necesitas

**¿Por qué?**
- ✅ Funciona inmediatamente
- ✅ Sin riesgos
- ✅ Compatible con todo
- ✅ Puedes mejorar después

---

## 🚀 **¿QUÉ PREFIERES?**

**A) Migración Simple** (30 min)
- Importar todo tal cual
- Categorías automáticas
- Alturas compatibles básicas
- Listo para producción

**B) Migración Completa** (2-3 horas)
- Importar + nuevos campos
- Sistema de márgenes automáticos
- Actualización en cascada
- Máxima potencia

---

**¿Con cuál opción procedemos?** 🎯

