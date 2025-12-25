-- =====================================================
-- Migración: Sistema de Presupuestos
-- Fecha: 2024-10-15
-- Descripción: Tablas para gestionar presupuestos de artículos y cercados
-- =====================================================

-- =====================================================
-- Tabla: presupuestos
-- =====================================================
CREATE TABLE IF NOT EXISTS presupuestos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero VARCHAR(50) UNIQUE NOT NULL,
  
  -- Tipo de presupuesto
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('articulos', 'cercado')),
  
  -- Cliente
  cliente_nombre VARCHAR(200) NOT NULL,
  cliente_email VARCHAR(200),
  cliente_telefono VARCHAR(50),
  cliente_direccion TEXT,
  
  -- Datos específicos para cercado
  terreno_largo DECIMAL(10,2),
  terreno_ancho DECIMAL(10,2),
  metros_lineales_total DECIMAL(10,2),
  
  -- Configuración de cercado (si aplica)
  cercado_config_id UUID, -- Referencia a configuraciones_cercado (se crea después)
  
  -- Montos
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  descuento DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  
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

-- Índices
CREATE INDEX idx_presupuestos_numero ON presupuestos(numero);
CREATE INDEX idx_presupuestos_tipo ON presupuestos(tipo);
CREATE INDEX idx_presupuestos_estado ON presupuestos(estado);
CREATE INDEX idx_presupuestos_fecha ON presupuestos(fecha_emision);
CREATE INDEX idx_presupuestos_usuario ON presupuestos(usuario_id);
CREATE INDEX idx_presupuestos_cliente ON presupuestos(cliente_nombre);

-- Comentarios
COMMENT ON TABLE presupuestos IS 'Presupuestos generados (artículos o cercado)';
COMMENT ON COLUMN presupuestos.numero IS 'Número único del presupuesto (ej: PRES-2024-001)';
COMMENT ON COLUMN presupuestos.tipo IS 'Tipo: articulos o cercado';

-- =====================================================
-- Tabla: presupuestos_items
-- =====================================================
CREATE TABLE IF NOT EXISTS presupuestos_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presupuesto_id UUID REFERENCES presupuestos(id) ON DELETE CASCADE NOT NULL,
  
  -- Item
  articulo_id INTEGER REFERENCES articulos(id),
  tejido_config_id UUID REFERENCES tejidos_configuraciones(id),
  descripcion VARCHAR(500) NOT NULL,
  cantidad DECIMAL(10,2) NOT NULL CHECK (cantidad > 0),
  unidad VARCHAR(20) NOT NULL, -- 'rollo', 'metro', 'unidad', 'kg', etc
  
  -- Precios
  precio_unitario DECIMAL(10,2) NOT NULL,
  precio_total DECIMAL(12,2) NOT NULL,
  
  -- Orden
  orden INTEGER DEFAULT 0,
  
  creado_en TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_presupuestos_items_presupuesto ON presupuestos_items(presupuesto_id);
CREATE INDEX idx_presupuestos_items_articulo ON presupuestos_items(articulo_id);
CREATE INDEX idx_presupuestos_items_tejido ON presupuestos_items(tejido_config_id);
CREATE INDEX idx_presupuestos_items_orden ON presupuestos_items(presupuesto_id, orden);

-- Comentarios
COMMENT ON TABLE presupuestos_items IS 'Items/líneas de cada presupuesto';
COMMENT ON COLUMN presupuestos_items.orden IS 'Orden de aparición en el presupuesto';

-- =====================================================
-- Función: Generar número de presupuesto
-- =====================================================
CREATE OR REPLACE FUNCTION generar_numero_presupuesto(p_tipo VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
  v_prefijo VARCHAR(10);
  v_year VARCHAR(4);
  v_numero INTEGER;
  v_numero_completo VARCHAR(50);
BEGIN
  -- Determinar prefijo según tipo
  v_prefijo := CASE 
    WHEN p_tipo = 'articulos' THEN 'PRES'
    WHEN p_tipo = 'cercado' THEN 'CERC'
    ELSE 'PRES'
  END;
  
  -- Año actual
  v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  -- Obtener último número del año
  SELECT COALESCE(MAX(
    CAST(
      SUBSTRING(numero FROM '\d+$') AS INTEGER
    )
  ), 0) + 1
  INTO v_numero
  FROM presupuestos
  WHERE numero LIKE v_prefijo || '-' || v_year || '-%'
    AND tipo = p_tipo;
  
  -- Generar número completo
  v_numero_completo := v_prefijo || '-' || v_year || '-' || LPAD(v_numero::TEXT, 3, '0');
  
  RETURN v_numero_completo;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generar_numero_presupuesto IS 'Genera número único de presupuesto (PRES-2024-001 o CERC-2024-001)';

-- =====================================================
-- Función: Calcular totales del presupuesto
-- =====================================================
CREATE OR REPLACE FUNCTION calcular_totales_presupuesto(p_presupuesto_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_subtotal DECIMAL;
  v_descuento DECIMAL;
  v_total DECIMAL;
BEGIN
  -- Calcular subtotal de items
  SELECT COALESCE(SUM(precio_total), 0)
  INTO v_subtotal
  FROM presupuestos_items
  WHERE presupuesto_id = p_presupuesto_id;
  
  -- Obtener descuento actual
  SELECT COALESCE(descuento, 0)
  INTO v_descuento
  FROM presupuestos
  WHERE id = p_presupuesto_id;
  
  -- Calcular total
  v_total := v_subtotal - v_descuento;
  
  -- Actualizar presupuesto
  UPDATE presupuestos
  SET 
    subtotal = v_subtotal,
    total = v_total,
    actualizado_en = NOW()
  WHERE id = p_presupuesto_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcular_totales_presupuesto IS 'Recalcula subtotal y total de un presupuesto';

-- =====================================================
-- Trigger: Recalcular totales al modificar items
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_recalcular_totales()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM calcular_totales_presupuesto(OLD.presupuesto_id);
  ELSE
    PERFORM calcular_totales_presupuesto(NEW.presupuesto_id);
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recalcular_totales ON presupuestos_items;
CREATE TRIGGER trg_recalcular_totales
AFTER INSERT OR UPDATE OR DELETE ON presupuestos_items
FOR EACH ROW
EXECUTE FUNCTION trigger_recalcular_totales();

-- =====================================================
-- Trigger: Calcular fecha de vencimiento
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_calcular_vencimiento()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.fecha_vencimiento IS NULL AND NEW.validez_dias IS NOT NULL THEN
    NEW.fecha_vencimiento := NEW.fecha_emision + (NEW.validez_dias || ' days')::INTERVAL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calcular_vencimiento ON presupuestos;
CREATE TRIGGER trg_calcular_vencimiento
BEFORE INSERT OR UPDATE ON presupuestos
FOR EACH ROW
EXECUTE FUNCTION trigger_calcular_vencimiento();

-- =====================================================
-- Trigger: Actualizar timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_presupuestos_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_presupuestos_timestamp ON presupuestos;
CREATE TRIGGER trg_update_presupuestos_timestamp
BEFORE UPDATE ON presupuestos
FOR EACH ROW
EXECUTE FUNCTION update_presupuestos_timestamp();

-- =====================================================
-- RLS Policies - Presupuestos
-- =====================================================

ALTER TABLE presupuestos ENABLE ROW LEVEL SECURITY;

-- Usuarios autenticados pueden ver sus propios presupuestos o todos si son admin
CREATE POLICY "Usuarios pueden ver presupuestos propios o todos si admin"
ON presupuestos
FOR SELECT
TO authenticated
USING (
  usuario_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = auth.uid()
    AND usuarios.rol = 'admin'
  )
);

-- Usuarios autenticados pueden insertar presupuestos
CREATE POLICY "Usuarios autenticados pueden crear presupuestos"
ON presupuestos
FOR INSERT
TO authenticated
WITH CHECK (usuario_id = auth.uid());

-- Usuarios pueden actualizar sus propios presupuestos o todos si son admin
CREATE POLICY "Usuarios pueden actualizar presupuestos propios o todos si admin"
ON presupuestos
FOR UPDATE
TO authenticated
USING (
  usuario_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = auth.uid()
    AND usuarios.rol = 'admin'
  )
);

-- Solo admins pueden eliminar
CREATE POLICY "Solo admins pueden eliminar presupuestos"
ON presupuestos
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = auth.uid()
    AND usuarios.rol = 'admin'
  )
);

-- =====================================================
-- RLS Policies - Presupuestos Items
-- =====================================================

ALTER TABLE presupuestos_items ENABLE ROW LEVEL SECURITY;

-- Usuarios pueden ver items de sus presupuestos
CREATE POLICY "Usuarios pueden ver items de presupuestos accesibles"
ON presupuestos_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM presupuestos p
    WHERE p.id = presupuestos_items.presupuesto_id
    AND (
      p.usuario_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM usuarios
        WHERE usuarios.id = auth.uid()
        AND usuarios.rol = 'admin'
      )
    )
  )
);

-- Usuarios pueden insertar items en sus presupuestos
CREATE POLICY "Usuarios pueden insertar items en presupuestos propios"
ON presupuestos_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM presupuestos p
    WHERE p.id = presupuestos_items.presupuesto_id
    AND (
      p.usuario_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM usuarios
        WHERE usuarios.id = auth.uid()
        AND usuarios.rol = 'admin'
      )
    )
  )
);

-- Usuarios pueden actualizar items de sus presupuestos
CREATE POLICY "Usuarios pueden actualizar items de presupuestos propios"
ON presupuestos_items
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM presupuestos p
    WHERE p.id = presupuestos_items.presupuesto_id
    AND (
      p.usuario_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM usuarios
        WHERE usuarios.id = auth.uid()
        AND usuarios.rol = 'admin'
      )
    )
  )
);

-- Usuarios pueden eliminar items de sus presupuestos
CREATE POLICY "Usuarios pueden eliminar items de presupuestos propios"
ON presupuestos_items
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM presupuestos p
    WHERE p.id = presupuestos_items.presupuesto_id
    AND (
      p.usuario_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM usuarios
        WHERE usuarios.id = auth.uid()
        AND usuarios.rol = 'admin'
      )
    )
  )
);

-- =====================================================
-- Vista: Presupuestos con totales
-- =====================================================
CREATE OR REPLACE VIEW v_presupuestos_completos AS
SELECT 
  p.*,
  u.nombre as usuario_nombre,
  COUNT(pi.id) as cantidad_items,
  CASE 
    WHEN p.fecha_vencimiento < CURRENT_DATE AND p.estado NOT IN ('aprobado', 'rechazado') THEN 'vencido'
    ELSE p.estado
  END as estado_actual
FROM presupuestos p
LEFT JOIN usuarios u ON p.usuario_id = u.id
LEFT JOIN presupuestos_items pi ON pi.presupuesto_id = p.id
GROUP BY p.id, u.nombre;

COMMENT ON VIEW v_presupuestos_completos IS 'Vista con información completa de presupuestos';

-- =====================================================
-- Fin de la migración
-- =====================================================

