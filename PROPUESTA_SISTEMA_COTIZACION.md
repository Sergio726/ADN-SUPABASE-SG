# 📊 PROPUESTA: Sistema de Cotización - Alambres del Norte

## 📋 Resumen Ejecutivo

Basado en el análisis del Excel "Tejido romboidal.xlsx", se propone implementar un sistema completo de cotización que gestione:

1. **Tejidos Romboidales** (Producto de fabricación propia)
2. **Presupuestos de Artículos** (Venta de productos individuales)
3. **Presupuestos de Cercado Perimetral** (Servicio completo de instalación)

---

## 🏭 1. TEJIDOS ROMBOIDALES - Análisis del Excel

### **Datos Identificados:**

#### **Configuraciones Totales:** 40
- **Calibre 12:** 20 configuraciones
- **Calibre 14:** 20 configuraciones

#### **Alturas Disponibles:**
- 2.0 metros
- 1.8 metros
- 1.5 metros
- 1.2 metros
- 1.0 metro

#### **Tamaños de Rombo:**
- 3.5 pulgadas (Calidad Económica)
- 3.0 pulgadas (Calidad Standard)
- 2.5 pulgadas (Calidad Reforzada)
- 2.0 pulgadas (Calidad Reforzada)

#### **Formato Estándar:** Rollo de 10 metros

---

### **Fórmula de Cálculo (Verificada):**

```javascript
// Precio de Costo
precio_costo = (peso_kg × precio_alambre_kg) + mano_obra

// Precio de Venta
precio_venta = precio_costo × 1.30  // Margen 30%
// O bien:
precio_venta = precio_costo + (precio_costo × 0.30)

// Ejemplo Real del Excel:
// Tejido Cal.14 - 2m - Rombo 3.5"
// (12 kg × $3,135.77) + $7,600 = $45,229.24 (costo)
// $45,229.24 × 1.30 = $58,798.01 (venta)
```

---

### **Precios Actuales del Alambre Galvanizado:**

| Calibre | Precio por kg | Fuente |
|---------|--------------|--------|
| Calibre 12 | $2,912 | Excel - Hoja "Articulos" |
| Calibre 14 | $3,135.77 | Excel - Hoja "Articulos" |

---

### **Matriz de Peso por Configuración:**

| Calibre | Altura | Rombo 3.5" | Rombo 3" | Rombo 2.5" | Rombo 2" |
|---------|--------|------------|----------|------------|----------|
| **14** | 2.0m | 12 kg | 15 kg | 18 kg | 21 kg |
| **14** | 1.8m | 11 kg | 14 kg | 16 kg | 19 kg |
| **14** | 1.5m | 9 kg | 11.3 kg | 13 kg | 16 kg |
| **14** | 1.2m | 7.8 kg | 9.5 kg | 11 kg | 13 kg |
| **14** | 1.0m | 6 kg | 8 kg | 9 kg | 11 kg |
| **12** | 2.0m | 20 kg | 22 kg | 28 kg | 31 kg |
| **12** | 1.8m | 18 kg | 20 kg | 25 kg | 28 kg |
| **12** | 1.5m | 15 kg | 17 kg | 21 kg | 23 kg |
| **12** | 1.2m | 12 kg | 14 kg | 17 kg | 19 kg |
| **12** | 1.0m | 10 kg | 12 kg | 14 kg | 16 kg |

---

### **Matriz de Mano de Obra por Configuración:**

| Calibre | Altura | Rombo 3.5" | Rombo 3" | Rombo 2.5" | Rombo 2" |
|---------|--------|------------|----------|------------|----------|
| **14** | 2.0m | $7,600 | $8,700 | $12,000 | $14,000 |
| **14** | 1.8m | $7,100 | $8,100 | $10,500 | $12,000 |
| **14** | 1.5m | $6,800 | $7,600 | $9,000 | $10,500 |
| **14** | 1.2m | $6,400 | $7,100 | $8,000 | $9,500 |
| **14** | 1.0m | $6,200 | $6,900 | $7,800 | $8,500 |
| **12** | 2.0m | $11,000 | $12,500 | $17,000 | $19,000 |
| **12** | 1.8m | $10,000 | $10,500 | $15,000 | $16,500 |
| **12** | 1.5m | $9,000 | $9,500 | $13,000 | $14,500 |
| **12** | 1.2m | $8,000 | $8,500 | $11,500 | $13,000 |
| **12** | 1.0m | $7,000 | $7,500 | $10,000 | $11,500 |

---

## 🗄️ 2. DISEÑO DE BASE DE DATOS

### **2.1 Tabla: `tejidos_configuraciones`**

```sql
CREATE TABLE tejidos_configuraciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificación
  codigo VARCHAR(50) UNIQUE NOT NULL, -- "RC14x3,5x2"
  nombre VARCHAR(200) NOT NULL, -- "Tejido Romboidal Cal.14 - 2m - Rombo 3.5""
  descripcion TEXT,
  
  -- Especificaciones técnicas
  calibre INTEGER NOT NULL CHECK (calibre IN (12, 14)),
  altura DECIMAL(3,2) NOT NULL CHECK (altura IN (1.00, 1.20, 1.50, 1.80, 2.00)),
  tamano_rombo DECIMAL(3,1) NOT NULL CHECK (tamano_rombo IN (2.0, 2.5, 3.0, 3.5)),
  largo DECIMAL(4,2) DEFAULT 10.00, -- metros
  
  -- Fabricación
  peso_kg DECIMAL(6,2) NOT NULL, -- Kg de alambre que usa
  mano_obra DECIMAL(10,2) NOT NULL, -- Costo fijo de mano de obra
  horas_fabricacion DECIMAL(4,2), -- Opcional, informativo
  
  -- Relación con alambre galvanizado (materia prima)
  alambre_articulo_id INTEGER REFERENCES articulos(id) NOT NULL,
  
  -- Precios calculados (se actualizan automáticamente)
  precio_costo DECIMAL(10,2),
  precio_venta DECIMAL(10,2),
  margen_porcentaje DECIMAL(5,2) DEFAULT 30.00,
  
  -- Relación con catálogo de artículos
  articulo_id INTEGER REFERENCES articulos(id), -- ID en tabla articulos (se crea automáticamente)
  
  -- Categoría de calidad
  categoria_calidad VARCHAR(50), -- 'Económica', 'Standard', 'Reforzada'
  
  -- Control
  activo BOOLEAN DEFAULT true,
  usuario_id UUID REFERENCES auth.users(id),
  creado_en TIMESTAMP DEFAULT NOW(),
  actualizado_en TIMESTAMP DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX idx_tejidos_calibre ON tejidos_configuraciones(calibre);
CREATE INDEX idx_tejidos_altura ON tejidos_configuraciones(altura);
CREATE INDEX idx_tejidos_rombo ON tejidos_configuraciones(tamano_rombo);
CREATE INDEX idx_tejidos_activo ON tejidos_configuraciones(activo);
CREATE INDEX idx_tejidos_alambre ON tejidos_configuraciones(alambre_articulo_id);

-- Trigger para actualizar timestamp
CREATE TRIGGER update_tejidos_timestamp
BEFORE UPDATE ON tejidos_configuraciones
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

---

### **2.2 Función: Calcular Precio del Tejido**

```sql
CREATE OR REPLACE FUNCTION calcular_precio_tejido(config_id UUID)
RETURNS TABLE(
  precio_costo DECIMAL,
  precio_venta DECIMAL
) AS $$
DECLARE
  v_config RECORD;
  v_precio_alambre DECIMAL;
  v_costo DECIMAL;
  v_venta DECIMAL;
  v_margen DECIMAL;
BEGIN
  -- Obtener configuración del tejido
  SELECT * INTO v_config
  FROM tejidos_configuraciones
  WHERE id = config_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Configuración no encontrada: %', config_id;
  END IF;
  
  -- Obtener precio vigente del alambre
  SELECT pv.precio_costo INTO v_precio_alambre
  FROM precios_venta pv
  WHERE pv.articulo_id = v_config.alambre_articulo_id
    AND pv.vigente = true
  ORDER BY pv.fecha_inicio DESC
  LIMIT 1;
  
  IF v_precio_alambre IS NULL THEN
    RAISE EXCEPTION 'No hay precio vigente para el alambre';
  END IF;
  
  -- Calcular costo: (kg × precio_alambre) + mano_obra
  v_costo := (v_config.peso_kg * v_precio_alambre) + v_config.mano_obra;
  
  -- Calcular precio de venta con margen
  v_margen := COALESCE(v_config.margen_porcentaje, 30.00);
  v_venta := v_costo * (1 + (v_margen / 100));
  
  RETURN QUERY SELECT v_costo, v_venta;
END;
$$ LANGUAGE plpgsql;
```

---

### **2.3 Trigger: Actualización Automática de Precios**

```sql
-- Trigger para recalcular precio cuando se actualiza el alambre
CREATE OR REPLACE FUNCTION trigger_actualizar_precios_tejidos()
RETURNS TRIGGER AS $$
BEGIN
  -- Cuando se actualiza el precio del alambre galvanizado
  -- Recalcular todos los tejidos que usan ese alambre
  
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.vigente = true THEN
      -- Actualizar precios de tejidos
      UPDATE tejidos_configuraciones tc
      SET 
        precio_costo = calc.precio_costo,
        precio_venta = calc.precio_venta,
        actualizado_en = NOW()
      FROM LATERAL calcular_precio_tejido(tc.id) calc
      WHERE tc.alambre_articulo_id = NEW.articulo_id
        AND tc.activo = true;
      
      -- También actualizar en precios_venta si existe
      UPDATE precios_venta pv
      SET
        precio_costo = tc.precio_costo,
        precio_venta = tc.precio_venta,
        margen = tc.margen_porcentaje,
        actualizado_en = NOW()
      FROM tejidos_configuraciones tc
      WHERE tc.alambre_articulo_id = NEW.articulo_id
        AND pv.articulo_id = tc.articulo_id
        AND pv.vigente = true
        AND tc.activo = true;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER actualizar_precios_tejidos_on_alambre_change
AFTER INSERT OR UPDATE ON precios_venta
FOR EACH ROW
EXECUTE FUNCTION trigger_actualizar_precios_tejidos();
```

---

### **2.4 Tabla: `presupuestos`**

```sql
CREATE TABLE presupuestos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero VARCHAR(50) UNIQUE, -- "PRES-2024-001"
  
  -- Tipo de presupuesto
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('articulos', 'cercado')),
  
  -- Cliente
  cliente_nombre VARCHAR(200) NOT NULL,
  cliente_email VARCHAR(200),
  cliente_telefono VARCHAR(50),
  cliente_direccion TEXT,
  
  -- Datos específicos para cercado
  terreno_largo DECIMAL(10,2), -- metros
  terreno_ancho DECIMAL(10,2), -- metros
  metros_lineales_total DECIMAL(10,2),
  
  -- Configuración de cercado (si aplica)
  cercado_altura DECIMAL(3,2), -- 2.0, 1.8, 1.5, 1.2
  cercado_con_cordon BOOLEAN DEFAULT false,
  cercado_con_pua BOOLEAN DEFAULT false,
  cercado_portones INTEGER DEFAULT 0,
  
  -- Montos
  subtotal DECIMAL(12,2) NOT NULL,
  descuento DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  
  -- Detalles
  observaciones TEXT,
  condiciones_comerciales TEXT,
  validez_dias INTEGER DEFAULT 15,
  
  -- Estado
  estado VARCHAR(20) DEFAULT 'borrador' CHECK (estado IN ('borrador', 'enviado', 'aprobado', 'rechazado', 'vencido')),
  
  -- Auditoría
  usuario_id UUID REFERENCES auth.users(id),
  fecha_emision DATE DEFAULT CURRENT_DATE,
  fecha_vencimiento DATE,
  creado_en TIMESTAMP DEFAULT NOW(),
  actualizado_en TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_presupuestos_tipo ON presupuestos(tipo);
CREATE INDEX idx_presupuestos_estado ON presupuestos(estado);
CREATE INDEX idx_presupuestos_fecha ON presupuestos(fecha_emision);
CREATE INDEX idx_presupuestos_usuario ON presupuestos(usuario_id);
```

---

### **2.5 Tabla: `presupuestos_items`**

```sql
CREATE TABLE presupuestos_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presupuesto_id UUID REFERENCES presupuestos(id) ON DELETE CASCADE,
  
  -- Item
  articulo_id INTEGER REFERENCES articulos(id),
  descripcion VARCHAR(500) NOT NULL,
  cantidad DECIMAL(10,2) NOT NULL,
  unidad VARCHAR(20), -- 'rollo', 'metro', 'unidad', 'kg'
  
  -- Precios
  precio_unitario DECIMAL(10,2) NOT NULL,
  precio_total DECIMAL(12,2) NOT NULL,
  
  -- Orden
  orden INTEGER,
  
  creado_en TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_presupuestos_items_presupuesto ON presupuestos_items(presupuesto_id);
CREATE INDEX idx_presupuestos_items_articulo ON presupuestos_items(articulo_id);
```

---

### **2.6 Tabla: `configuraciones_cercado`** (Para próxima fase)

```sql
CREATE TABLE configuraciones_cercado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(200) NOT NULL,
  altura_tejido DECIMAL(3,2) NOT NULL,
  tejido_config_id UUID REFERENCES tejidos_configuraciones(id),
  
  -- Materiales para 180m base
  cantidad_postes INTEGER,
  tipo_poste VARCHAR(100),
  metros_tejido DECIMAL(10,2),
  
  -- Opcionales
  metros_cordon_hormigon DECIMAL(10,2),
  rollos_alambre_pua INTEGER,
  
  -- Costos
  precio_base_180m DECIMAL(12,2),
  precio_por_metro DECIMAL(10,2),
  costo_mano_obra_instalacion DECIMAL(10,2),
  
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMP DEFAULT NOW()
);
```

---

## 🎨 3. INTERFACES DE USUARIO

### **3.1 Dashboard - Gestión de Tejidos Romboidales**

#### **📁 Estructura de Archivos:**
```
app/dashboard/tejidos/
├── page.tsx                    # Listado con DataTable
├── nuevo/page.tsx             # Crear configuración
├── editar/[id]/page.tsx       # Editar configuración
└── importar/page.tsx          # Importar desde Excel (opcional)
```

#### **📋 Listado de Tejidos (`page.tsx`)**
```typescript
// Columnas del DataTable:
- Código (RC14x3,5x2)
- Descripción (Cal.14 - 2m - Rombo 3.5")
- Calibre
- Altura
- Rombo
- Peso (kg)
- Precio Alambre
- Mano de Obra
- Precio Costo (calculado)
- Precio Venta (calculado)
- Estado (Activo/Inactivo)
- Acciones (Editar, Ver detalle, Activar/Desactivar)
```

#### **➕ Crear/Editar Tejido (`nuevo/page.tsx`)**
```typescript
Formulario con campos:

1. Datos Básicos:
   - Código (auto-generado: RC{calibre}x{rombo}x{altura})
   - Nombre (auto-generado)
   - Descripción (opcional)

2. Especificaciones:
   - Calibre: Select [12, 14]
   - Altura: Select [1.0, 1.2, 1.5, 1.8, 2.0] metros
   - Tamaño Rombo: Select [2.0, 2.5, 3.0, 3.5] pulgadas
   - Largo rollo: Input (default: 10 metros)

3. Fabricación:
   - Peso del rollo (kg): Input numérico
   - Mano de obra: Input moneda
   - Horas fabricación: Input numérico (opcional)

4. Materia Prima:
   - Alambre Galvanizado: Select de artículos (filtrado por calibre)
   - Precio actual del alambre: Display (solo lectura)

5. Pricing:
   - Margen %: Input (default: 30%)
   - Precio Costo: Display calculado en tiempo real
   - Precio Venta: Display calculado en tiempo real

6. Categoría:
   - Calidad: Select ['Económica', 'Standard', 'Reforzada']

7. Card de Preview:
   ┌─────────────────────────────────────┐
   │  📦 TEJIDO ROMBOIDAL                │
   │  RC14x3,5x2                         │
   │                                     │
   │  ✓ Cal. 14 - 2m - Rombo 3.5"       │
   │  ✓ Peso: 12 kg                      │
   │  ✓ Alambre: $3,135.77/kg           │
   │  ✓ Mano de obra: $7,600            │
   │                                     │
   │  💰 Costo: $45,229.24               │
   │  💰 Venta: $58,798.01 (+30%)       │
   └─────────────────────────────────────┘
```

---

### **3.2 Dashboard - Presupuestos**

#### **📁 Estructura de Archivos:**
```
app/dashboard/presupuestos/
├── page.tsx                           # Listado de presupuestos
├── nuevo/
│   ├── tipo/page.tsx                 # Selector de tipo
│   ├── articulos/page.tsx            # Presupuesto de artículos
│   └── cercado/page.tsx              # Presupuesto de cercado
├── [id]/
│   ├── page.tsx                      # Ver detalle
│   ├── editar/page.tsx              # Editar
│   └── pdf/route.ts                 # Generar PDF
```

#### **📋 Listado de Presupuestos (`page.tsx`)**
```typescript
// DataTable con columnas:
- Número (PRES-2024-001)
- Cliente
- Tipo (Artículos/Cercado)
- Fecha
- Total
- Estado (Badge con colores)
- Vencimiento
- Acciones (Ver, Editar, PDF, Enviar, Duplicar)
```

#### **🔀 Selector de Tipo (`nuevo/tipo/page.tsx`)**
```typescript
// Pantalla de selección con 2 cards grandes:

┌─────────────────────────────────┐  ┌─────────────────────────────────┐
│  📦 PRESUPUESTO DE ARTÍCULOS    │  │  🏗️ PRESUPUESTO DE CERCADO      │
│                                 │  │                                 │
│  Venta de productos             │  │  Servicio completo de           │
│  individuales del catálogo      │  │  instalación de cerco           │
│                                 │  │  perimetral                     │
│  [Crear Presupuesto]            │  │  [Crear Presupuesto]            │
└─────────────────────────────────┘  └─────────────────────────────────┘
```

#### **📦 Presupuesto de Artículos (`nuevo/articulos/page.tsx`)**
```typescript
Formulario en 3 secciones:

1. Datos del Cliente:
   - Nombre completo *
   - Email
   - Teléfono *
   - Dirección

2. Items del Presupuesto:
   ┌────────────────────────────────────────────────────────┐
   │  [+ Agregar Item]                                       │
   │                                                         │
   │  Item 1:                                               │
   │  - Artículo: [Select con buscador]                     │
   │  - Cantidad: [Input]                                   │
   │  - Precio Unit: $XX.XX (desde artículo)               │
   │  - Total: $XX.XX                                       │
   │  [Quitar]                                              │
   │                                                         │
   │  Item 2: ...                                           │
   └────────────────────────────────────────────────────────┘

3. Totales y Condiciones:
   - Subtotal: $XX.XX
   - Descuento %: [Input]
   - Total: $XX.XX
   - Validez (días): [Input - default 15]
   - Observaciones: [Textarea]
   - Condiciones comerciales: [Textarea]

4. Preview en sidebar:
   [Preview del presupuesto tal como se verá en el PDF]

5. Acciones:
   [Guardar Borrador] [Generar PDF] [Enviar por Email]
```

#### **🏗️ Presupuesto de Cercado (`nuevo/cercado/page.tsx`)**
```typescript
Formulario wizard (pasos):

PASO 1: Datos del Cliente
   - Nombre completo *
   - Email
   - Teléfono *
   - Dirección del terreno *

PASO 2: Dimensiones del Terreno
   - Largo (metros): [Input]
   - Ancho (metros): [Input]
   - Metros lineales totales: [Calculado o manual]
   
   [Visualización gráfica del terreno]

PASO 3: Configuración del Cerco
   - Altura del tejido: [Select: 2m, 1.8m, 1.5m, 1.2m]
   - Calibre: [Select: 12, 14]
   - Tamaño rombo: [Select: 2", 2.5", 3", 3.5"]
   
   Opciones adicionales:
   ☐ Cordón de hormigón superior
   ☐ Alambre de púa
   ☐ Cantidad de portones/accesos: [Input]

PASO 4: Cálculo y Preview
   - Configuración seleccionada
   - Materiales necesarios
   - Costo por metro lineal
   - Total del proyecto
   
PASO 5: Condiciones
   - Validez (días): [Input - default 15]
   - Observaciones: [Textarea]
   - Condiciones comerciales: [Textarea - pre-cargado]

PASO 6: Confirmación
   [Preview completo del presupuesto]
   
   [Guardar Borrador] [Generar PDF] [Enviar por Email]
```

---

## 📄 4. GENERACIÓN DE PDF

### **📦 Librería Recomendada:**
```bash
npm install @react-pdf/renderer
# O alternativa:
npm install jspdf jspdf-autotable
```

### **📋 Estructura del PDF:**

```
┌─────────────────────────────────────────────────────────┐
│  [Logo ADN]                    PRESUPUESTO              │
│  Alambres del Norte SRL        Nº PRES-2024-001         │
│                                Fecha: 13/10/2024         │
│                                Vencimiento: 28/10/2024   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  CLIENTE:                                               │
│  Juan Pérez                                             │
│  Email: juan@example.com                                │
│  Teléfono: +54 387 123-4567                            │
│  Dirección: Av. Principal 123, Salta                    │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  DETALLE:                                               │
│                                                          │
│  [Tabla de items]                                       │
│  ┌────┬─────────────────┬────┬──────┬───────┬──────────┐│
│  │ # │ Descripción     │ Ud │ Cant │ P.Unit│  Total   ││
│  ├────┼─────────────────┼────┼──────┼───────┼──────────┤│
│  │ 1 │ Tejido RC14...  │ u  │  5   │$58,798│ $293,990 ││
│  │ 2 │ Postes...       │ u  │ 30   │ $5,000│ $150,000 ││
│  └────┴─────────────────┴────┴──────┴───────┴──────────┘│
│                                                          │
│                                      Subtotal: $443,990 │
│                                      Descuento: $0      │
│                                      TOTAL: $443,990    │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  CONDICIONES COMERCIALES:                               │
│  - Validez: 15 días                                     │
│  - Pago: Contado / Transferencia                       │
│  - Garantía: 12 meses                                   │
│                                                          │
│  OBSERVACIONES:                                         │
│  Instalación incluida en el precio...                   │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  Alambres del Norte SRL                                 │
│  Tel: +54 387 XXX-XXXX                                  │
│  Email: info@alambres.com                               │
│  Web: www.alambres.com                                  │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 5. PLAN DE IMPLEMENTACIÓN

### **FASE 1: Gestión de Tejidos (Semana 1-2)**
- [x] Análisis del Excel ✅
- [ ] Migración SQL (tablas + funciones + triggers)
- [ ] Importar 40 configuraciones desde Excel
- [ ] CRUD de tejidos en dashboard
- [ ] Cálculo automático de precios
- [ ] Testing de actualización automática

### **FASE 2: Presupuestos de Artículos (Semana 3)**
- [ ] Tabla presupuestos + presupuestos_items
- [ ] Listado de presupuestos (DataTable)
- [ ] Formulario de presupuesto de artículos
- [ ] Sistema de numeración automática
- [ ] Estados y workflow

### **FASE 3: Generación de PDF (Semana 4)**
- [ ] Configurar librería PDF
- [ ] Template de presupuesto
- [ ] Descarga automática
- [ ] Preview antes de generar

### **FASE 4: Presupuestos de Cercado (Semana 5-6)**
- [ ] Análisis del Excel de cercados (pendiente)
- [ ] Tabla configuraciones_cercado
- [ ] Wizard de presupuesto de cercado
- [ ] Cálculo por metro lineal
- [ ] Visualización de terreno

### **FASE 5: Mejoras y Optimizaciones (Semana 7)**
- [ ] Envío por email
- [ ] Duplicar presupuesto
- [ ] Dashboard de estadísticas
- [ ] Reportes
- [ ] Testing completo

---

## 📊 6. PRÓXIMOS PASOS INMEDIATOS

1. **Confirmación del Usuario:**
   - ¿Aprobar esta propuesta?
   - ¿Algún ajuste necesario?

2. **Excel de Cercados:**
   - Compartir Excel de cercados perimetrales
   - Analizar estructura y fórmulas
   - Ajustar diseño de BD si es necesario

3. **Inicio de Implementación:**
   - Crear migraciones SQL
   - Importar configuraciones de tejidos
   - Desarrollar CRUD de tejidos

---

## 💡 RECOMENDACIONES

### **Mejoras Sugeridas:**

1. **Sistema de Versionado de Precios:**
   - Mantener historial de cambios de precio del alambre
   - Poder ver cómo afecta a todos los tejidos
   - Reporte de impacto de cambio de precio

2. **Alertas Automáticas:**
   - Notificar cuando cambia el precio del alambre
   - Avisar cuando un presupuesto está por vencer
   - Recordatorio de seguimiento de presupuestos enviados

3. **Integración con WhatsApp:**
   - Enviar presupuestos por WhatsApp
   - Plantillas de mensaje predefinidas
   - Link para ver presupuesto online

4. **Panel de Estadísticas:**
   - Presupuestos por mes
   - Tasa de conversión
   - Productos más cotizados
   - Análisis de rentabilidad

5. **Modo Público (Futuro):**
   - Cotizador online para clientes
   - Cálculo instantáneo de cerco
   - Generación automática de presupuesto

---

**¿Procedemos con la implementación?** 🚀

