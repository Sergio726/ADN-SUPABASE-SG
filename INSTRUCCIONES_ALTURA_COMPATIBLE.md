# 📋 SISTEMA DE ALTURA COMPATIBLE - INSTRUCCIONES

## ✅ **IMPLEMENTADO AL 100%**

---

## 🎯 **¿QUÉ ES?**

Un sistema para indicar con qué alturas de cercado es compatible cada artículo, facilitando la selección de productos al crear presupuestos.

---

## 📄 **SCRIPTS EJECUTADOS EN SUPABASE**

✅ **1. `20241016_tejidos_precios_multiples_fix.sql`**
- Sistema de 3 precios para tejidos

✅ **2. `fix_rls_articulos_autenticados.sql`**
- Políticas RLS corregidas

✅ **3. `20241016_articulos_altura_compatible.sql`** ⭐
- Campo `altura_compatible` agregado
- Función `es_articulo_compatible_con_altura()`

✅ **4. `fix_vista_cercado_completa.sql`**
- Vista de cercado mejorada

---

## 🎨 **CÓMO USAR**

### **1. Crear Artículo con Altura Compatible**

```
Dashboard → Artículos → Nuevo Artículo

... campos normales ...

┌──────────────────────────────────────────┐
│ Compatibilidad con Cercado (Opcional)   │
├──────────────────────────────────────────┤
│ Alturas Compatibles:                     │
│                                          │
│ ☑ Todas las alturas                     │
│   (Desmarca para elegir específicas)    │
│                                          │
│   ☐ 1.0 metros    ☐ 1.5 metros          │
│   ☐ 1.2 metros    ☐ 1.8 metros          │
│                   ☐ 2.0 metros          │
│                                          │
│ Compatible con: Todas las alturas       │
└──────────────────────────────────────────┘

Guardar → altura_compatible = "todas"
```

---

## 📊 **EJEMPLOS DE CONFIGURACIÓN**

### **Ejemplo 1: Postes (todas las alturas)**
```
Artículo: Poste Eucalipto 2.5m
☑ Todas las alturas
→ Guarda: "todas"
→ Uso: Cualquier altura de cercado
```

### **Ejemplo 2: Grapa pequeña (alturas bajas)**
```
Artículo: Grapa galvanizada pequeña 3/4"
☑ 1.0 metros
☑ 1.2 metros
→ Guarda: "1.0,1.2"
→ Uso: Solo cercados de 1.0m o 1.2m
```

### **Ejemplo 3: Torniquete reforzado (alturas grandes)**
```
Artículo: Torniquete galvanizado reforzado
☑ 1.8 metros
☑ 2.0 metros
→ Guarda: "1.8,2.0"
→ Uso: Solo cercados de 1.8m o 2.0m
```

### **Ejemplo 4: Cemento (sin restricción)**
```
Artículo: Cemento Portland 50kg
(Sin marcar nada)
→ Guarda: NULL
→ Uso: Artículo general, no se filtra por altura
```

---

## 🔍 **FUNCIÓN SQL PARA FILTRAR**

### **En el código:**
```javascript
// Filtrar artículos compatibles con altura 2.0m
const articulosCompatibles = articulos.filter(a => 
  !a.altura_compatible ||                    // Sin restricción (NULL)
  a.altura_compatible === 'todas' ||         // Compatible con todas
  a.altura_compatible.includes('2.0')        // Incluye 2.0
)
```

### **En SQL:**
```sql
-- Obtener artículos compatibles con altura 2.0m
SELECT * FROM articulos
WHERE es_articulo_compatible_con_altura(altura_compatible, 2.0);
```

---

## 🎯 **CASOS DE USO**

### **Caso 1: Filtrar en wizard de cercado**
```
Wizard → Paso 3: Configuración
Altura seleccionada: 2.0 metros

Al elegir accesorios adicionales:
✅ Grapa grande (todas) → Visible
✅ Torniquete reforzado (1.8,2.0) → Visible
✅ Cemento (null) → Visible
❌ Grapa pequeña (1.0,1.2) → NO visible
```

### **Caso 2: Búsqueda inteligente**
```
Cliente pregunta: "¿Qué grapas tengo para un cerco de 1.2m?"

Filtrar artículos:
- categoria LIKE '%grapa%'
- altura_compatible es NULL, "todas", o incluye "1.2"

Resultado:
✅ Grapa pequeña 3/4" (1.0,1.2)
✅ Grapa mediana (todas)
❌ Grapa grande reforzada (1.8,2.0)
```

### **Caso 3: Actualización masiva**
```sql
-- Marcar todos los postes como compatibles con todas las alturas
UPDATE articulos 
SET altura_compatible = 'todas'
WHERE categoria = 'Postes';

-- Marcar grapas pequeñas solo para alturas bajas
UPDATE articulos 
SET altura_compatible = '1.0,1.2,1.5'
WHERE nombre ILIKE '%grapa%peque%';

-- Marcar torniquetes reforzados para alturas grandes
UPDATE articulos 
SET altura_compatible = '1.8,2.0'
WHERE nombre ILIKE '%torniquete%reforzado%';
```

---

## 📈 **VALOR EN BD**

| Artículo | altura_compatible | Significado |
|----------|-------------------|-------------|
| Poste Eucalipto | `"todas"` | Cualquier altura |
| Grapa pequeña | `"1.0,1.2"` | Solo 1.0m y 1.2m |
| Torniquete reforzado | `"1.8,2.0"` | Solo 1.8m y 2.0m |
| Cemento | `NULL` | Sin restricción |
| Alambre de púas | `"todas"` | Cualquier altura |

---

## 🛠️ **INTEGRACIÓN FUTURA**

### **En ProductoCombobox:**
```typescript
// Agregar prop opcional para filtrar por altura
<ProductoCombobox
  value={productoId}
  onChange={handleChange}
  tipo="articulo"
  filtrarPorAltura={2.0}  // ← Nueva prop
  placeholder="Buscar accesorio..."
/>
```

### **Lógica interna:**
```typescript
const articulosFiltrados = articulos.filter(a => {
  // Filtros normales...
  
  // Filtro por altura si está especificado
  if (filtrarPorAltura) {
    if (a.altura_compatible) {
      if (a.altura_compatible !== 'todas' && 
          !a.altura_compatible.includes(filtrarPorAltura.toString())) {
        return false
      }
    }
  }
  
  return true
})
```

---

## 📊 **ESTADÍSTICAS**

```sql
-- Ver artículos por compatibilidad
SELECT 
  CASE 
    WHEN altura_compatible IS NULL THEN 'Sin restricción'
    WHEN altura_compatible = 'todas' THEN 'Todas las alturas'
    ELSE 'Alturas específicas'
  END as tipo_compatibilidad,
  COUNT(*) as cantidad
FROM articulos
GROUP BY 
  CASE 
    WHEN altura_compatible IS NULL THEN 'Sin restricción'
    WHEN altura_compatible = 'todas' THEN 'Todas las alturas'
    ELSE 'Alturas específicas'
  END;
```

---

## ✨ **BENEFICIOS**

✅ **Para el usuario:**
- Encuentra rápidamente artículos adecuados
- Evita errores de selección
- Menos opciones irrelevantes

✅ **Para el sistema:**
- Filtrado inteligente
- Mejor experiencia de usuario
- Organización clara del catálogo

✅ **Para el negocio:**
- Menos errores en presupuestos
- Recomendaciones automáticas
- Ventas más precisas

---

## 🎉 **RESUMEN**

**Implementado:**
- ✅ Campo opcional en tabla `articulos`
- ✅ Función SQL de compatibilidad
- ✅ Selector múltiple en formularios
- ✅ Pre-carga en editar
- ✅ Preview de selección
- ✅ Guardado automático

**Listo para usar:**
- ✅ Crear artículos con compatibilidad
- ✅ Editar artículos existentes
- ✅ Filtrar con función SQL
- ✅ Integrar en cualquier flujo

---

**Sistema 100% funcional** 🚀

**Próximo paso:** Integrar filtrado automático en flujos de presupuestos (opcional)

