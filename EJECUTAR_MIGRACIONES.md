# 🚀 GUÍA: Ejecutar Migraciones SQL en Supabase

## 📋 **PASOS PARA EJECUTAR LAS MIGRACIONES**

---

## ⚠️ **ANTES DE COMENZAR**

### **Prerequisitos:**

1. ✅ Tener acceso a tu proyecto de Supabase
2. ✅ Tener artículos de Alambre Galvanizado creados
3. ✅ Hacer backup de la base de datos (recomendado)

---

## 🔧 **PASO 1: Verificar Artículos de Alambre**

Antes de ejecutar las migraciones, necesitas tener los artículos de alambre galvanizado con precios vigentes.

### **1.1 Verificar si existen:**

```sql
-- Ejecutar en Supabase SQL Editor
SELECT id, nombre 
FROM articulos 
WHERE nombre ILIKE '%Alambre Galvanizado Calibre%';
```

### **1.2 Si NO existen, créalos:**

```sql
-- Insertar Alambre Galvanizado Calibre 12
INSERT INTO articulos (nombre, descripcion, categoria, unidad, stock_actual, stock_minimo)
VALUES (
  'Alambre Galvanizado Calibre 12',
  'Alambre galvanizado calibre 12 para fabricación de tejido romboidal',
  'Materia Prima',
  'kg',
  0,
  0
);

-- Insertar Alambre Galvanizado Calibre 14
INSERT INTO articulos (nombre, descripcion, categoria, unidad, stock_actual, stock_minimo)
VALUES (
  'Alambre Galvanizado Calibre 14',
  'Alambre galvanizado calibre 14 para fabricación de tejido romboidal',
  'Materia Prima',
  'kg',
  0,
  0
);
```

### **1.3 Agregar precios vigentes:**

```sql
-- Obtener IDs de los alambres
SELECT id, nombre FROM articulos WHERE nombre ILIKE '%Alambre Galvanizado Calibre%';

-- Reemplazar <ID_CAL_12> y <ID_CAL_14> con los IDs obtenidos

-- Precio para Calibre 12 (según tu Excel: $2,912/kg)
INSERT INTO precios_venta (articulo_id, precio_costo, precio_venta, margen, vigente, fecha_inicio)
VALUES (
  <ID_CAL_12>,  -- Reemplazar con el ID real
  2912,
  4932.928,
  69.4,
  true,
  CURRENT_DATE
);

-- Precio para Calibre 14 (según tu Excel: $3,135.77/kg)
INSERT INTO precios_venta (articulo_id, precio_costo, precio_venta, margen, vigente, fecha_inicio)
VALUES (
  <ID_CAL_14>,  -- Reemplazar con el ID real
  3135.77,
  5311.99,
  69.4,
  true,
  CURRENT_DATE
);
```

---

## 🗄️ **PASO 2: Ejecutar Migraciones en Orden**

### **Importante:**
- ✅ Ejecutar en el **orden indicado**
- ✅ Verificar que cada una se ejecute sin errores
- ✅ Si hay errores, leer el mensaje y corregir

---

### **MIGRACIÓN 1: Tejidos Configuraciones**

**Archivo:** `supabase/migrations/20241015_tejidos_configuraciones.sql`

**Acción:**
1. Abrir Supabase Dashboard
2. Ir a **SQL Editor**
3. Click en **"New query"**
4. Copiar TODO el contenido de `20241015_tejidos_configuraciones.sql`
5. Pegar en el editor
6. Click en **"Run"** o presionar `Ctrl+Enter`

**Verificación:**
```sql
-- Verificar que la tabla se creó
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'tejidos_configuraciones';

-- Verificar funciones creadas
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name LIKE '%tejido%';
```

**Resultado esperado:**
- ✅ Tabla `tejidos_configuraciones` creada
- ✅ 3-4 funciones creadas
- ✅ Triggers creados
- ✅ Vista `v_tejidos_con_precios` creada

---

### **MIGRACIÓN 2: Presupuestos**

**Archivo:** `supabase/migrations/20241015_presupuestos.sql`

**Acción:**
1. Nueva query en SQL Editor
2. Copiar TODO el contenido de `20241015_presupuestos.sql`
3. Pegar y ejecutar

**Verificación:**
```sql
-- Verificar tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('presupuestos', 'presupuestos_items');

-- Verificar vista
SELECT table_name 
FROM information_schema.views 
WHERE table_name = 'v_presupuestos_completos';
```

**Resultado esperado:**
- ✅ Tabla `presupuestos` creada
- ✅ Tabla `presupuestos_items` creada
- ✅ Función `generar_numero_presupuesto()` creada
- ✅ Vista `v_presupuestos_completos` creada

---

### **MIGRACIÓN 3: Configuraciones de Cercado**

**Archivo:** `supabase/migrations/20241015_configuraciones_cercado.sql`

**Acción:**
1. Nueva query en SQL Editor
2. Copiar TODO el contenido de `20241015_configuraciones_cercado.sql`
3. Pegar y ejecutar

**Verificación:**
```sql
-- Verificar tabla creada
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'configuraciones_cercado';

-- Verificar funciones
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name LIKE '%cercado%';
```

**Resultado esperado:**
- ✅ Tabla `configuraciones_cercado` creada
- ✅ Funciones de cálculo creadas
- ✅ Vista `v_configuraciones_cercado_completas` creada

---

## ✅ **PASO 3: Verificación Final**

### **3.1 Verificar todas las tablas:**

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**Deberías ver:**
- ✅ `tejidos_configuraciones`
- ✅ `presupuestos`
- ✅ `presupuestos_items`
- ✅ `configuraciones_cercado`
- (Más las tablas existentes: articulos, precios_venta, etc.)

---

### **3.2 Verificar funciones:**

```sql
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_name LIKE ANY(ARRAY['%tejido%', '%presupuesto%', '%cercado%'])
ORDER BY routine_name;
```

**Deberías ver funciones como:**
- ✅ `calcular_precio_tejido`
- ✅ `actualizar_precio_tejido`
- ✅ `calcular_precio_total_cercado`
- ✅ `calcular_cercado_para_terreno`
- ✅ `generar_numero_presupuesto`
- ✅ `calcular_totales_presupuesto`

---

### **3.3 Verificar vistas:**

```sql
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Deberías ver:**
- ✅ `v_tejidos_con_precios`
- ✅ `v_presupuestos_completos`
- ✅ `v_configuraciones_cercado_completas`

---

### **3.4 Verificar RLS (Row Level Security):**

```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('tejidos_configuraciones', 'presupuestos', 'presupuestos_items', 'configuraciones_cercado');
```

**Todas deben tener `rowsecurity = true`**

---

## 📊 **PASO 4: Importar Configuraciones de Tejidos**

Una vez ejecutadas las migraciones exitosamente:

### **4.1 Preparar variables de entorno:**

Asegúrate de tener en `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

### **4.2 Ejecutar script de importación:**

```bash
node scripts/importar-tejidos.js
```

**Resultado esperado:**
```
✅ Excel leído correctamente
✅ Alambre Cal.12 encontrado: ID XX
✅ Alambre Cal.14 encontrado: ID XX
✅ RC14x3,5x2 - Tejido Romboidal Cal.14 - 2m - Rombo 3.5"
✅ RC14x3,5x1,8 - Tejido Romboidal Cal.14 - 1.8m - Rombo 3.5"
...
✅ Insertados exitosamente: 40
❌ Errores: 0
📦 Total procesados: 40
```

### **4.3 Verificar importación:**

```sql
-- Ver todos los tejidos importados
SELECT codigo, nombre, calibre, altura, tamano_rombo, precio_costo, precio_venta
FROM v_tejidos_con_precios
ORDER BY calibre, altura DESC, tamano_rombo DESC;
```

**Deberías ver 40 filas con precios calculados**

---

## 🎯 **PASO 5: Probar en la Aplicación**

1. **Iniciar el servidor:**
   ```bash
   npm run dev
   ```

2. **Abrir el dashboard:**
   ```
   http://localhost:3000/dashboard
   ```

3. **Ir a "Tejidos":**
   - Deberías ver los 40 tejidos importados
   - Todos con precios calculados
   - Estadísticas correctas

4. **Probar crear un nuevo tejido:**
   - Click en "Nuevo Tejido"
   - Completar formulario
   - Ver cálculo en tiempo real
   - Guardar

---

## 🐛 **SOLUCIÓN DE PROBLEMAS**

### **Error: "relation already exists"**
**Solución:** La tabla ya existe. Puedes:
- Ignorar el error y continuar
- O eliminar la tabla primero: `DROP TABLE IF EXISTS nombre_tabla CASCADE;`

### **Error: "function already exists"**
**Solución:** Usar `CREATE OR REPLACE FUNCTION` (ya incluido en las migraciones)

### **Error: "permission denied"**
**Solución:** Asegúrate de estar conectado con un usuario admin de Supabase

### **Error: "column does not exist"**
**Solución:** Verifica que las migraciones anteriores se ejecutaron correctamente

### **Tejidos no se importan:**
**Verificar:**
1. ¿Existen los artículos de alambre?
2. ¿Tienen precios vigentes?
3. ¿Las variables de entorno están correctas?

---

## 📝 **CHECKLIST COMPLETO**

Marca cada paso al completarlo:

### **Preparación:**
- [ ] Acceso a Supabase Dashboard
- [ ] Artículos de alambre creados
- [ ] Precios de alambre agregados
- [ ] Variables de entorno configuradas

### **Migraciones:**
- [ ] Migración 1: Tejidos (ejecutada sin errores)
- [ ] Migración 2: Presupuestos (ejecutada sin errores)
- [ ] Migración 3: Cercado (ejecutada sin errores)

### **Verificación:**
- [ ] Tablas creadas correctamente
- [ ] Funciones disponibles
- [ ] Vistas creadas
- [ ] RLS habilitado

### **Importación:**
- [ ] Script ejecutado sin errores
- [ ] 40 tejidos importados
- [ ] Precios calculados correctamente

### **Testing:**
- [ ] Dashboard carga sin errores
- [ ] Listado de tejidos funciona
- [ ] Crear nuevo tejido funciona
- [ ] Cálculo de precios en tiempo real

---

## ✅ **¡LISTO!**

Una vez completados todos los pasos, tendrás:
- ✅ Base de datos completa y funcional
- ✅ 40 configuraciones de tejidos importadas
- ✅ Sistema de cálculo automático funcionando
- ✅ Interfaz lista para usar

**¿Necesitas ayuda con algún paso?** 🚀

