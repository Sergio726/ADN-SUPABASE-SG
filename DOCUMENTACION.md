# 📚 DOCUMENTACIÓN TÉCNICA - Alambres del Norte SRL

## 📋 **ÍNDICE**

1. [Introducción](#introducción)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Base de Datos](#base-de-datos)
4. [Módulos del Sistema](#módulos-del-sistema)
5. [Flujos de Uso](#flujos-de-uso)
6. [Componentes Principales](#componentes-principales)
7. [Sistema de Cálculos](#sistema-de-cálculos)
8. [Generación de PDF](#generación-de-pdf)
9. [Seguridad y Permisos](#seguridad-y-permisos)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 **INTRODUCCIÓN**

### **Objetivo del Sistema**
Sistema ERP completo para gestionar:
- Catálogo de productos (web pública)
- Gestión interna (artículos, proveedores, precios)
- Sistema de cotización (artículos y servicios de cercado)
- Gestión de clientes y presupuestos
- Configuraciones de productos fabricados (tejidos)
- Configuraciones de servicios (cercado perimetral)

### **Usuarios del Sistema**
1. **Visitantes Web**: Ven catálogo público
2. **Usuarios Admin**: Acceso completo al panel interno
3. **Usuarios Standard**: Acceso limitado (futuro)

### **Estadísticas del Proyecto**
- **Líneas de código**: 19,000+
- **Commits**: 50+
- **Páginas**: 25+
- **Módulos**: 5 principales
- **Tablas BD**: 10
- **Funciones SQL**: 9
- **Triggers**: 5
- **Vistas**: 4

---

## 🏗️ **ARQUITECTURA DEL SISTEMA**

### **Stack Completo**

```
┌─────────────────────────────────────────┐
│         FRONTEND (Next.js 14)           │
│  ┌─────────────┐      ┌──────────────┐ │
│  │ Web Pública │      │ Dashboard    │ │
│  │ (SSR/SSG)   │      │ (Protected)  │ │
│  └─────────────┘      └──────────────┘ │
└─────────────────────────────────────────┘
              │                 │
              ▼                 ▼
┌─────────────────────────────────────────┐
│      SUPABASE (Backend as a Service)    │
│  ┌──────────┐  ┌──────────┐  ┌────────┐│
│  │PostgreSQL│  │   Auth   │  │Storage ││
│  │   + RLS  │  │ (OAuth)  │  │(Images)││
│  └──────────┘  └──────────┘  └────────┘│
└─────────────────────────────────────────┘
```

### **Flujo de Datos**

```
Usuario → Navegador → Next.js → Supabase Client
                                      ↓
                                 PostgreSQL
                                      ↓
                          Triggers + Functions
                                      ↓
                              Vistas Calculadas
```

### **Renderizado**

- **SSR (Server Side Rendering)**: Páginas públicas
- **CSR (Client Side Rendering)**: Dashboard (`"use client"`)
- **SSG (Static Site Generation)**: Landing pages (futuro)

---

## 🗄️ **BASE DE DATOS**

### **Diagrama de Relaciones**

```
usuarios
    ↓
articulos → proveedores
    ↓
precios_venta
    
tejidos_configuraciones ← precio_alambre_base
    ↓
configuraciones_cercado
    ↓
presupuestos ← clientes
    ↓
presupuestos_items
```

### **Tabla: `usuarios`**
```sql
id              UUID PRIMARY KEY
email           TEXT UNIQUE NOT NULL
nombre_completo TEXT
rol             TEXT DEFAULT 'usuario' -- 'admin' | 'usuario'
activo          BOOLEAN DEFAULT true
creado_en       TIMESTAMPTZ
```

### **Tabla: `articulos`**
```sql
id                      UUID PRIMARY KEY
codigo                  TEXT UNIQUE
nombre                  TEXT NOT NULL
descripcion             TEXT
unidad_medida           TEXT
proveedor_id            UUID → proveedores(id)
imagen_url              TEXT
publicado               BOOLEAN DEFAULT false
mostrar_precio_publico  BOOLEAN DEFAULT true
stock                   INTEGER
stock_minimo            INTEGER
altura_compatible       TEXT -- Alturas finales de cerco compatibles (opcional)
```

### **Tabla: `precios_venta`**
```sql
id              UUID PRIMARY KEY
articulo_id     UUID → articulos(id)
precio_costo    NUMERIC(12,2)
precio_venta    NUMERIC(12,2)
margen          NUMERIC(5,2)
vigente         BOOLEAN DEFAULT true
fecha_desde     DATE
```

### **Tabla: `tejidos_configuraciones`**
```sql
id                  UUID PRIMARY KEY
codigo              TEXT UNIQUE AUTO -- TR-{altura}-{rombo}-{calibre} (ej: TR-2.0-3.5-14)
nombre              TEXT
calibre             INTEGER -- 12, 14
altura              NUMERIC(3,2) -- 1.0, 1.2, 1.5, 1.8, 2.0
largo               NUMERIC(3,2) DEFAULT 10.00
tamano_rombo        TEXT -- 2", 2.5", 3", 3.5"
cantidad_alambre    NUMERIC(8,2) -- kg necesarios
costo_mano_obra     NUMERIC(10,2)
precio_venta        NUMERIC(10,2) -- calculado automáticamente
activo              BOOLEAN DEFAULT true
```

**Función Trigger:** `actualizar_precio_tejidos()`
- Se ejecuta al cambiar `precio_alambre_base`
- Recalcula todos los tejidos automáticamente
- Fórmula: `(cantidad_alambre × precio_alambre) + mano_obra`

### **Tabla: `configuraciones_cercado`**
```sql
id                              UUID PRIMARY KEY
nombre                          TEXT
descripcion                     TEXT
altura                          NUMERIC(3,2)
tejido_config_id                UUID → tejidos_configuraciones
tipo_poste                      TEXT

-- Cantidades y precios de postes (para 180m)
cantidad_postes_esquineros      INTEGER
precio_poste_esquinero          NUMERIC(10,2)
cantidad_postes_refuerzos       INTEGER
precio_poste_refuerzo           NUMERIC(10,2)
cantidad_postes_intermedios     INTEGER
precio_poste_intermedio         NUMERIC(10,2)
cantidad_puntales               INTEGER
precio_puntal                   NUMERIC(10,2)

-- Cordón de hormigón
cordon_tipo                     TEXT
cordon_bolsas_ripio             INTEGER
cordon_bolsas_cemento           NUMERIC(5,2)
cordon_precio_total             NUMERIC(10,2)

-- Alambre de púa
hilos_pua                       INTEGER
precio_pua_por_metro            NUMERIC(10,2)

-- Accesorios (7 tipos)
cantidad_ganchos                INTEGER
precio_unitario_ganchos         NUMERIC(10,2)
-- ... (otros accesorios)

-- Mano de obra y transporte
precio_mano_obra_por_metro      NUMERIC(10,2)
precio_transporte_por_metro     NUMERIC(10,2)

-- Totales calculados
precio_total_accesorios         NUMERIC(12,2)
precio_base_180m                NUMERIC(12,2)
precio_por_metro_lineal         NUMERIC(10,2)
precio_por_metro_menor_50m      NUMERIC(10,2) -- +30%

activo                          BOOLEAN DEFAULT true
```

**35+ campos editables** por configuración.

### **Tabla: `clientes`**
```sql
id                      UUID PRIMARY KEY
tipo_documento          TEXT -- 'DNI' | 'CUIL' | 'CUIT'
numero_documento        TEXT UNIQUE NOT NULL
nombre_completo         TEXT NOT NULL
razon_social            TEXT
email                   TEXT
telefono                TEXT NOT NULL
telefono_alternativo    TEXT
direccion               TEXT
ciudad                  TEXT
provincia               TEXT
codigo_postal           TEXT
categoria               TEXT DEFAULT 'Particular'
notas                   TEXT
activo                  BOOLEAN DEFAULT true
usuario_id              UUID → usuarios(id)
```

### **Tabla: `presupuestos`**
```sql
id                      UUID PRIMARY KEY
numero                  TEXT UNIQUE AUTO -- PRES-2024-001, CERC-2024-001
tipo                    TEXT -- 'articulos' | 'cercado'
cliente_id              UUID → clientes(id)
usuario_id              UUID → usuarios(id)

-- Datos del terreno (solo cercado)
terreno_largo           NUMERIC(10,2)
terreno_ancho           NUMERIC(10,2)
terreno_metros_lineales NUMERIC(10,2)

-- Configuración (solo cercado)
cercado_config_id       UUID → configuraciones_cercado(id)

-- Financiero
subtotal                NUMERIC(12,2)
descuento_porcentaje    NUMERIC(5,2)
descuento_monto         NUMERIC(12,2)
total                   NUMERIC(12,2)

-- Metadata
estado                  TEXT DEFAULT 'borrador'
observaciones           TEXT
condiciones_comerciales TEXT
fecha_emision           DATE
fecha_vencimiento       DATE
validez_dias            INTEGER DEFAULT 15
```

**Función:** `generar_numero_presupuesto(tipo TEXT)`
- Genera número automático secuencial por tipo

**Función:** `calcular_totales_presupuesto(presupuesto_id UUID)`
- Calcula subtotal, descuento y total

### **Tabla: `presupuestos_items`**
```sql
id                  UUID PRIMARY KEY
presupuesto_id      UUID → presupuestos(id)
tipo_producto       TEXT -- 'articulo' | 'tejido'
producto_id         UUID -- articulos.id | tejidos_configuraciones.id
descripcion         TEXT
cantidad            NUMERIC(10,2)
unidad              TEXT
precio_unitario     NUMERIC(12,2)
subtotal            NUMERIC(12,2)
orden               INTEGER
```

### **Vistas Optimizadas**

#### `v_tejidos_con_precios`
```sql
-- Une tejidos con precio actual del alambre
-- Calcula precio_venta en tiempo real
```

#### `v_configuraciones_cercado_completas`
```sql
-- Une configuraciones con datos del tejido
-- Calcula costos totales de componentes
```

#### `v_presupuestos_completos`
```sql
-- Une presupuestos con clientes y usuarios
-- Incluye totales calculados
```

---

## 📦 **MÓDULOS DEL SISTEMA**

### **MÓDULO 1: Gestión de Artículos**

**Ubicación:** `/dashboard/articulos`

**Páginas:**
- `/dashboard/articulos` - Listado con DataTable
- `/dashboard/articulos/nuevo` - Crear artículo
- `/dashboard/articulos/editar/[id]` - Editar artículo

**Funcionalidades:**
- ✅ CRUD completo
- ✅ Upload de imágenes (Instagram format 4:5, 1080×1350px)
- ✅ Asociación con proveedor
- ✅ Control de visibilidad pública
- ✅ Mostrar/ocultar precio público
- ✅ Búsqueda y ordenamiento
- ✅ Compatibilidad con alturas finales de cerco (opcional)

**Campo `altura_compatible`:**
- **Tipo:** TEXT (valores separados por coma o "todas")
- **Descripción:** Indica para qué alturas finales de cerco es compatible el artículo
- **IMPORTANTE:** Se refiere a la **altura final del cerco instalado**, no a la altura del tejido romboidal
- **Cálculo altura final:** altura poste - 40cm enterrado + cordón + tejido + púas
- **Valores típicos:** 1.3, 1.5, 1.8, 2.3, 2.5, 3.0, 3.5 (metros)
- **Ejemplos:**
  - `NULL` o vacío: Compatible con todas las alturas (artículo general)
  - `"todas"`: Compatible con todas las alturas finales
  - `"1.5,1.8"`: Compatible solo con alturas finales de 1.5m y 1.8m
  - `"2.3,2.5,3.0"`: Compatible con alturas finales de 2.3m, 2.5m y 3.0m

**Componente Clave:** `ImageUpload.tsx`
- Upload a Supabase Storage
- Preview en tiempo real
- Validación de tamaño y formato
- Aspect ratio 4:5

---

### **MÓDULO 2: Gestión de Tejidos Romboidales**

**Ubicación:** `/dashboard/tejidos`

**Páginas:**
- `/dashboard/tejidos` - Listado con DataTable
- `/dashboard/tejidos/nuevo` - Crear tejido
- `/dashboard/tejidos/[id]` - Ver detalle
- `/dashboard/tejidos/editar/[id]` - Editar tejido

**Funcionalidades:**
- ✅ 40 configuraciones (Cal.12/14 × 5 alturas × 4 rombos)
- ✅ Código auto-generado: `TR-2.0-3.5-14` (Altura-Rombo-Calibre)
- ✅ Cálculo automático de precio
- ✅ Desglose de costos y materiales
- ✅ Actualización en cascada

**Fórmula de Cálculo:**
```javascript
precio_venta = (cantidad_alambre × precio_alambre_galvanizado) + costo_mano_obra
```

**Ejemplo:**
```
Tejido: TR-2.0-3.5-14 (Altura 2.0m, Rombo 3.5", Calibre 14)
- Alambre necesario: 18 kg
- Precio alambre: $3,636.36/kg
- Mano de obra: $0
────────────────────────────
Total: $65,445
```

---

### **MÓDULO 3: Gestión de Configuraciones de Cercado**

**Ubicación:** `/dashboard/cercado`

**Páginas:**
- `/dashboard/cercado` - Listado con estadísticas
- `/dashboard/cercado/nuevo` - Crear configuración
- `/dashboard/cercado/[id]` - Ver detalle completo
- `/dashboard/cercado/editar/[id]` - Editar configuración

**Funcionalidades:**
- ✅ **35+ campos editables** por configuración
- ✅ **Pre-carga inteligente** de precios
- ✅ **Cálculo en tiempo real**
- ✅ **Desglose completo** de componentes
- ✅ Activar/desactivar

**Componentes de una Configuración:**

1. **Tejido Romboidal** (18 rollos para 180m)
2. **Postes** (4 tipos: esquineros, refuerzos, intermedios, puntales)
3. **Cordón de Hormigón** (sin cordón, 10cm, 15cm, 20cm, 30cm)
4. **Alambre de Púa** (0-4 hilos)
5. **Accesorios** (ganchos, planchuelas, torniquetes, etc.)
6. **Mano de Obra** (por metro lineal)
7. **Transporte** (por metro lineal)

**Cálculo Base (180m):**
```
Tejido:      18 rollos × $65,445 = $1,178,010
Postes:      52 postes variados  = $1,110,000
Cordón:      10cm                =   $997,920
Púa:         0 hilos              =        $0
Accesorios:  Varios              = $2,985,042
M. Obra:     180m × $11,438      = $2,058,840
Transporte:  180m × $3,580.50    =   $644,490
────────────────────────────────────────────
TOTAL 180m:                      = $8,974,302
Precio/metro:                    =    $49,857
Precio/metro (<50m) +30%:        =    $64,814
```

**Pre-cargas Inteligentes:**
```javascript
// Al seleccionar tipo de poste
if (tipo_poste === 'Eucalipto') {
  precio_esquinero = $22,500
  precio_refuerzo = $22,500
  precio_intermedio = $22,500
  precio_puntal = $17,500
}
```

---

### **MÓDULO 4: Gestión de Clientes**

**Ubicación:** `/dashboard/clientes`

**Páginas:**
- `/dashboard/clientes` - Listado con estadísticas
- `/dashboard/clientes/nuevo` - Crear cliente
- `/dashboard/clientes/[id]` - Ver detalle + historial
- `/dashboard/clientes/editar/[id]` - Editar cliente

**Funcionalidades:**
- ✅ DNI/CUIL/CUIT como identificador único
- ✅ Datos fiscales completos
- ✅ Historial de presupuestos
- ✅ Búsqueda rápida
- ✅ Registro express desde presupuestos

**Componente:** `BuscarCliente.tsx`
- Búsqueda por número de documento
- Si no existe → popup de registro rápido
- Solo 3 campos obligatorios
- Registro en 30 segundos

---

### **MÓDULO 5: Sistema de Presupuestos**

**Ubicación:** `/dashboard/presupuestos`

**Páginas:**
- `/dashboard/presupuestos` - Listado con filtros
- `/dashboard/presupuestos/nuevo/tipo` - Selector de tipo
- `/dashboard/presupuestos/nuevo/articulos` - Presupuesto artículos
- `/dashboard/presupuestos/nuevo/cercado` - Wizard cercado
- `/dashboard/presupuestos/[id]` - Ver/editar presupuesto

#### **A. Presupuesto de Artículos**

**Características:**
- ✅ Tabla tipo Excel
- ✅ Navegación con Tab/Enter
- ✅ Búsqueda inteligente de productos (combobox)
- ✅ Cálculos automáticos
- ✅ Descuento global

**Componente:** `ProductoCombobox.tsx`
```jsx
// Búsqueda con filtrado en tiempo real
<ProductoCombobox
  value={item.producto_id}
  onChange={(producto) => {
    // Auto-completa descripción, precio, unidad
  }}
  tipo="articulo" // o "tejido"
/>
```

**Flujo:**
1. Buscar cliente por DNI
2. Si no existe → registrar en popup
3. Agregar items en tabla
   - Tab para siguiente campo
   - Enter para nueva fila
4. Aplicar descuento (opcional)
5. Observaciones
6. Guardar → genera número automático

#### **B. Presupuesto de Cercado (Wizard)**

**5 Pasos:**

**Paso 1: Cliente**
- Buscar DNI
- Registrar si no existe

**Paso 2: Datos del Terreno**
- Largo (metros)
- Ancho (metros)
- Cálculo automático de perímetro

**Paso 3: Configuración del Cercado**
- Seleccionar configuración base
- Vista previa de componentes

**Paso 4: Cálculo y Resumen**
- **Cálculo proporcional** según metros lineales
- **Recargo +30%** si terreno <50m
- Desglose completo por componente

**Paso 5: Finalizar**
- Condiciones comerciales
- Observaciones
- Guardar presupuesto

**Cálculo Proporcional:**
```javascript
// Base: 180 metros
factor = terreno_metros_lineales / 180

// Tejido
rollos_necesarios = Math.ceil(terreno_largo / 10)
costo_tejido = rollos_necesarios × precio_rollo

// Postes (proporcional)
postes_intermedios = Math.ceil(
  config.cantidad_postes_intermedios × factor
)

// Accesorios (proporcional)
ganchos = config.cantidad_ganchos × factor

// Mano de obra y transporte
mano_obra = terreno_metros × config.precio_mano_obra_por_metro

// Total
total = suma_componentes
if (terreno_metros < 50) {
  total = total × 1.30  // +30% recargo
}
```

**Ejemplo Real:**
```
Terreno: 40m × 30m = 140 metros lineales
Config base: Cerco 2m Eucalipto 10cm

Factor: 140 / 180 = 0.7778

Tejido:     14 rollos × $65,445  = $916,230
Postes:     41 postes variados   =  $862,500
Cordón:     0.7778 × $997,920    =  $776,238
Accesorios: 0.7778 × $2,985,042  =$2,321,699
M. Obra:    140m × $11,438       =$1,601,320
Transporte: 140m × $3,580.50     =  $501,270
────────────────────────────────────────────
Subtotal:                        =$6,979,257
Recargo terreno <50m (+30%):     =$2,093,777
────────────────────────────────────────────
TOTAL:                           =$9,073,034
Precio/metro:                    =   $64,807
```

---

## 🎯 **FLUJOS DE USO**

### **FLUJO 1: Crear Presupuesto de Artículos (3 min)**

```
1. Dashboard → Presupuestos → Nuevo → Artículos

2. Buscar Cliente
   - Ingresar DNI: 12345678
   - Enter
   
   Si NO existe:
     → Popup aparece
     → Llenar 3 campos (nombre, teléfono, categoría)
     → Guardar → Cliente creado en 30 seg

3. Agregar Items (Tabla Excel)
   - Click en "Tipo" → Seleccionar "Artículo"
   - Tab → "Producto"
   - Escribir: "alam" → Aparece "Alambre Cal.14"
   - Enter → Auto-completa precio y unidad
   - Tab → "Cantidad": 10
   - Enter → Nueva fila aparece
   
4. Repetir paso 3 para más items

5. Descuento (opcional)
   - Porcentaje: 10%
   - Total se actualiza

6. Observaciones: "Entrega en 7 días"

7. Guardar
   → Genera PRES-2024-001
   → Redirecciona a vista del presupuesto
   
8. Descargar PDF
   → Click botón "Descargar PDF"
   → Archivo: PRES-2024-001_Cliente.pdf
```

### **FLUJO 2: Actualizar Precio de Alambre (30 seg)**

```
1. Dashboard → Tejidos

2. Ver estadística: "Precio Alambre Base: $3,636.36"

3. Click botón "Actualizar Precio Alambre"

4. Ingresar nuevo precio: $4,000

5. Confirmar

   → Sistema actualiza automáticamente:
     ✅ 40 configuraciones de tejidos
     ✅ Todos los precios recalculados
     ✅ Vista actualizada
     
6. Ver tejido TR-2.0-3.5-14
   - Antes: $65,445
   - Ahora: $72,000
```

### **FLUJO 3: Modificar Configuración de Cercado (2 min)**

```
Escenario: El alambre A/R subió de precio

1. Dashboard → Cercado

2. Click "Editar" en "Cerco 2m Económico"

3. Buscar campo "Alambre A/R"
   - Metros: 720
   - Precio/m: $3,105.48 → Cambiar a $3,500

4. Ver actualización en tiempo real:
   Vista Previa (derecha):
   - Accesorios: $2,985,042 → $3,269,538
   - Total 180m: $8,974,302 → $9,258,798
   - Precio/metro: $49,857 → $51,438

5. Guardar

6. Ir a Presupuestos → Nuevo → Cercado
   → Al seleccionar esa configuración
   → Usa el nuevo precio $51,438/metro
```

---

## 🧩 **COMPONENTES PRINCIPALES**

### **1. DataTable** (`components/ui/data-table.tsx`)

Tabla con:
- ✅ Ordenamiento por columnas
- ✅ Búsqueda global
- ✅ Paginación
- ✅ Responsive

**Uso:**
```tsx
<DataTable
  columns={columns}
  data={data}
  searchKey="nombre"
  searchPlaceholder="Buscar artículo..."
/>
```

### **2. ProductoCombobox** (`components/ProductoCombobox.tsx`)

Búsqueda inteligente de productos:
```tsx
<ProductoCombobox
  value={productoId}
  onChange={(producto) => {
    setDescripcion(producto.nombre)
    setPrecio(producto.precio)
    setUnidad(producto.unidad)
  }}
  tipo="articulo" // o "tejido"
  placeholder="Buscar producto..."
/>
```

**Características:**
- Filtrado en tiempo real
- Muestra nombre + precio
- Keyboard navigation
- Responsive

### **3. BuscarCliente** (`components/BuscarCliente.tsx`)

Búsqueda + registro rápido:
```tsx
<BuscarCliente
  onClienteSeleccionado={(cliente) => {
    setClienteId(cliente.id)
    setClienteNombre(cliente.nombre_completo)
  }}
/>
```

**Flujo:**
1. Usuario ingresa DNI
2. Si existe → lo selecciona
3. Si NO existe → popup de registro rápido

### **4. ImageUpload** (`components/ImageUpload.tsx`)

Upload de imágenes:
```tsx
<ImageUpload
  currentImageUrl={articulo.imagen_url}
  onImageUploaded={(url) => {
    setFormData({ ...formData, imagen_url: url })
  }}
  bucket="articulos-images"
/>
```

**Características:**
- Preview en tiempo real
- Aspect ratio 4:5 (Instagram)
- Validación de tamaño
- Upload a Supabase Storage

---

## 🧮 **SISTEMA DE CÁLCULOS**

### **Cálculo de Tejidos**

**Trigger:** `actualizar_precio_tejidos()`

**Se ejecuta cuando:**
- Se actualiza `precio_alambre_base.precio`
- Se inserta/actualiza `tejidos_configuraciones`

**Lógica:**
```sql
UPDATE tejidos_configuraciones
SET precio_venta = (
  cantidad_alambre * (SELECT precio FROM precio_alambre_base LIMIT 1)
) + costo_mano_obra
WHERE activo = true;
```

### **Cálculo de Cercado (Proporcional)**

**Función:** `calcular_cercado_para_terreno()`

**Parámetros:**
- `config_id`: UUID de configuración base
- `metros_lineales`: Perímetro del terreno

**Retorna:** JSON con desglose completo

**Lógica simplificada:**
```javascript
factor = metros_lineales / 180

// Tejido: según rollos necesarios
rollos = Math.ceil(largo_terreno / 10)
costo_tejido = rollos × precio_rollo

// Postes: proporcional con redondeo
postes_esquineros = 4 // fijo
postes_refuerzos = 2  // fijo
postes_intermedios = Math.ceil(base.intermedios × factor)
puntales = Math.ceil(base.puntales × factor)

// Cordón: proporcional
costo_cordon = base.cordon_total × factor

// Accesorios: proporcional
ganchos = base.ganchos × factor
planchuelas = base.planchuelas × factor
// ...

// Mano obra y transporte: por metro
mano_obra = metros_lineales × precio_mo_metro
transporte = metros_lineales × precio_trans_metro

// Total
subtotal = suma_componentes

// Recargo para terrenos pequeños
if (metros_lineales < 50) {
  recargo = subtotal × 0.30
  total = subtotal + recargo
} else {
  total = subtotal
}

precio_metro = total / metros_lineales
```

### **Cálculo de Totales de Presupuesto**

**Función:** `calcular_totales_presupuesto()`

**Trigger:** Automático al insertar/actualizar items

**Lógica:**
```sql
-- Subtotal
subtotal = SUM(items.subtotal)

-- Descuento
descuento_monto = subtotal × (descuento_porcentaje / 100)

-- Total
total = subtotal - descuento_monto

-- Actualizar presupuesto
UPDATE presupuestos
SET subtotal = ..., descuento_monto = ..., total = ...
WHERE id = presupuesto_id;
```

---

## 📄 **GENERACIÓN DE PDF**

**Librería:** jsPDF + jsPDF-AutoTable

**Archivo:** `lib/pdf-generator.ts`

**Función:** `generarPDFPresupuesto(presupuesto)`

### **Estructura del PDF:**

1. **Header**
   - Logo (texto "ADN")
   - Datos de la empresa
   - Número de presupuesto (rojo, grande)

2. **Fechas**
   - Emisión
   - Vencimiento

3. **Datos del Cliente**
   - Nombre/Razón social
   - Documento
   - Teléfono
   - Email
   - Dirección

4. **Datos del Terreno** (solo cercado)
   - Dimensiones
   - Metros lineales
   - Recargo si aplica

5. **Tabla de Items** (AutoTable)
   - Columnas: #, Descripción, Cant, Unidad, P.Unit, Total
   - Header en rojo
   - Rows alternadas (striped)

6. **Totales**
   - Subtotal
   - Descuento (si aplica)
   - **TOTAL** (verde, grande)

7. **Condiciones Comerciales**
   - Bullets con condiciones

8. **Observaciones**
   - Con text wrapping

9. **Footer**
   - Datos de contacto
   - Validez del presupuesto

**Nombre del archivo:**
```javascript
const filename = `${presupuesto.numero}_${clienteNombre}.pdf`
// Ejemplo: PRES-2024-001_Juan Perez.pdf
```

**Uso:**
```tsx
import { generarPDFPresupuesto } from '@/lib/pdf-generator'

const handleDescargarPDF = async () => {
  try {
    await generarPDFPresupuesto(presupuesto)
    toast({ title: "PDF descargado" })
  } catch (error) {
    toast({ 
      title: "Error al generar PDF",
      variant: "destructive" 
    })
  }
}
```

---

## 🔐 **SEGURIDAD Y PERMISOS**

### **Row Level Security (RLS)**

Habilitado en todas las tablas:
```sql
ALTER TABLE tabla_nombre ENABLE ROW LEVEL SECURITY;
```

### **Políticas de Acceso**

**Tabla `articulos`:**
```sql
-- Todos pueden leer artículos publicados
CREATE POLICY "Articulos publicos visibles"
ON articulos FOR SELECT
TO anon, authenticated
USING (publicado = true);

-- Solo admins pueden modificar
CREATE POLICY "Solo admins pueden editar"
ON articulos FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE id = auth.uid() AND rol = 'admin'
  )
);
```

**Tabla `presupuestos`:**
```sql
-- Usuarios ven solo sus presupuestos
CREATE POLICY "Usuarios ven sus presupuestos"
ON presupuestos FOR SELECT
TO authenticated
USING (usuario_id = auth.uid());

-- Admins ven todos
CREATE POLICY "Admins ven todos"
ON presupuestos FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE id = auth.uid() AND rol = 'admin'
  )
);

-- Solo el creador puede insertar
CREATE POLICY "Usuario crea presupuesto"
ON presupuestos FOR INSERT
TO authenticated
WITH CHECK (usuario_id = auth.uid());
```

### **Middleware** (`middleware.ts`)

Protege rutas del dashboard:
```typescript
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  if (pathname.startsWith('/dashboard')) {
    const token = request.cookies.get('sb-access-token')
    
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }
  
  return NextResponse.next()
}
```

### **Storage Policies**

**Bucket `articulos-images`:**
```sql
-- Lectura pública
CREATE POLICY "Imagenes publicas"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'articulos-images');

-- Solo usuarios autenticados pueden subir
CREATE POLICY "Usuarios pueden subir"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'articulos-images');

-- Solo usuarios autenticados pueden eliminar
CREATE POLICY "Usuarios pueden eliminar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'articulos-images');
```

---

## 🐛 **TROUBLESHOOTING**

### **Error: "Bucket not found"**

**Causa:** El bucket `articulos-images` no existe en Supabase Storage.

**Solución:**
```bash
node scripts/crear-bucket-storage.js
```

O crear manualmente en Supabase Dashboard:
1. Storage → Buckets → New bucket
2. Name: `articulos-images`
3. Public: Yes
4. Crear policies (ver arriba)

---

### **Error: RLS Policy Violation**

**Ejemplo:**
```
{code: '42501', message: 'new row violates row-level security policy'}
```

**Causa:** Falta el `usuario_id` al insertar registro.

**Solución:**
```typescript
// Obtener usuario autenticado
const { data: { user } } = await supabase.auth.getUser()

// Incluir usuario_id al insertar
const { error } = await supabase
  .from('tabla')
  .insert({ ...data, usuario_id: user.id })
```

---

### **Error: Function not found**

**Ejemplo:**
```
{code: 'PGRST202', message: 'Could not find function...'}
```

**Causa:** La función SQL no se ejecutó en Supabase.

**Solución:**
Ejecutar la migración correspondiente en Supabase SQL Editor.

---

### **Error: Imágenes no se muestran**

**Causa 1:** URL mal configurada en `next.config.js`

**Solución:**
```javascript
// next.config.js
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'tu-proyecto.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}
```

**Causa 2:** Imagen no existe en Storage

**Solución:** Re-subir imagen desde formulario de edición.

---

### **Error: Cálculo de precio incorrecto**

**Tejidos:**
1. Verificar `precio_alambre_base` tiene valor
2. Verificar trigger `actualizar_precio_tejidos` está creado
3. Ejecutar manualmente:
```sql
SELECT actualizar_precio_tejidos();
```

**Cercado:**
1. Verificar configuración base tiene todos los precios
2. Verificar función `calcular_cercado_para_terreno()` existe
3. Probar manualmente en SQL Editor

---

### **Build Error: Module not found**

**Causa:** Falta instalar dependencia

**Solución:**
```bash
npm install [paquete-faltante]
```

Verificar `package.json` tiene:
- `@supabase/supabase-js`
- `@supabase/auth-helpers-nextjs`
- `@tanstack/react-table`
- `lucide-react`
- `jspdf`
- `jspdf-autotable`
- `xlsx`
- shadcn/ui components

---

## 📊 **ESTADÍSTICAS FINALES**

```
✅ Módulos:             5 completos al 100%
✅ Páginas:             25+
✅ Componentes:         9 personalizados
✅ Tablas BD:           10
✅ Funciones SQL:       9
✅ Triggers:            5
✅ Vistas:              4
✅ RLS Policies:        15+
✅ Líneas de código:    19,000+
✅ Commits:             50+
✅ Configuraciones:     40 tejidos
✅ Campos editables:    35+ por config cercado
```

---

## 🎯 **RESUMEN TÉCNICO**

Este sistema es un **ERP completo** que maneja:

1. **Catálogo Web Público**
   - Productos con imágenes
   - Control de visibilidad
   - WhatsApp integration

2. **Gestión Interna**
   - Artículos, proveedores, precios
   - Leads del sitio web

3. **Productos Fabricados**
   - 40 configuraciones de tejidos
   - Cálculo automático de precios
   - Actualización en cascada

4. **Servicios de Cercado**
   - Configuraciones base detalladas
   - 35+ componentes por configuración
   - Cálculo proporcional por terreno
   - Recargos automáticos

5. **Sistema de Cotización**
   - Presupuestos de artículos
   - Presupuestos de cercado (wizard)
   - Generación de PDF
   - Workflow completo

6. **Gestión de Clientes**
   - Datos fiscales
   - Historial de presupuestos
   - Registro express

**Todo con:**
- ✅ Seguridad (RLS)
- ✅ Cálculos automáticos
- ✅ UX profesional
- ✅ Responsive
- ✅ Listo para producción

---

**Última actualización:** Octubre 2024
**Versión:** 1.0.0
**Estado:** ✅ Producción Ready


## Políticas de Precios (Artículos, Postes, Tejido Romboidal)

Estas políticas definen cómo se calculan y utilizan los distintos precios en el sistema.

### Políticas Particulares (Cálculo del Precio Base)

**Artículos:**
- Precio Base (o precio de venta) = `precio_costo × 1.56` (margen editable, por defecto 56%)
- El margen de ganancia es configurable por artículo

**Tejidos:**
- Precio Base (o precio de venta) = `precio_costo × 1.45` (margen editable, por defecto 45%)
- El margen de ganancia es configurable por tejido

### Políticas Generales (Aplican a Artículos y Tejidos)

Todas las formas de pago se calculan desde el **Precio Base**:

- **Efectivo**: `precio_base × 1.0` (sin IVA)
- **Factura/Lista**: `precio_base × 1.21` (incluye IVA 21%)
- **Tarjeta**: `precio_base × 1.3` (incluye IVA 21%)
- **E-cheq 45 días**: igual que Factura/Lista = `precio_base × 1.21` (incluye IVA 21%)
- **E-cheq 60 días**: igual que Tarjeta = `precio_base × 1.3` (incluye IVA 21%)
- **E-cheq 90 días**: `precio_base × 1.4` (incluye IVA 21%)

### Reglas del Sistema

- **Precio por defecto del sistema**: Precio Factura / Lista (`precio_base × 1.21`)
- **Precio mostrado en la web pública**: Precio Factura / Lista
- **En la edición de precios (dashboard)**:
  - Se guarda solo `precio_costo` y `precio_venta` (precio base)
  - Los demás precios se calculan dinámicamente según la forma de pago
  - Se muestra un desglose informativo de todos los precios derivados
- **Presupuestos (artículos y tejidos)**:
  - Antes de cotizar, se debe definir la Forma de Pago de la cotización
  - Al seleccionar un artículo o tejido, se obtiene su `precio_venta` (precio base)
  - Se calcula el Precio Unitario multiplicando el precio base por el factor correspondiente según la Forma de Pago
  - Al cambiar la Forma de Pago, se recalculan todos los ítems del presupuesto

### Ejemplo de Cálculo

**Artículo con costo $100:**
- Precio Base: $100 × 1.56 = **$156**
- Efectivo: $156 × 1.0 = **$156**
- Factura/Lista: $156 × 1.21 = **$188.76**
- Tarjeta: $156 × 1.3 = **$202.80**
- E-cheq 45: $156 × 1.21 = **$188.76**
- E-cheq 60: $156 × 1.3 = **$202.80**
- E-cheq 90: $156 × 1.4 = **$218.40**

**Tejido con costo $100:**
- Precio Base: $100 × 1.45 = **$145**
- Efectivo: $145 × 1.0 = **$145**
- Factura/Lista: $145 × 1.21 = **$175.45**
- Tarjeta: $145 × 1.3 = **$188.50**
- E-cheq 45: $145 × 1.21 = **$175.45**
- E-cheq 60: $145 × 1.3 = **$188.50**
- E-cheq 90: $145 × 1.4 = **$203.00**

> Nota: Estas políticas aplican a artículos, postes y tejido romboidal. Si se requieren excepciones por categoría o por producto, documentarlas aquí y ajustarlas en el código correspondiente.
