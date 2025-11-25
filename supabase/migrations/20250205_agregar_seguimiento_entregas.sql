-- =====================================================
-- Migración: Sistema de Seguimiento de Entregas (Incluye Parciales)
-- Fecha: 2025-02-05
-- Descripción: Sistema completo de seguimiento de entregas que permite entregas parciales
-- =====================================================

-- =====================================================
-- Tabla: entregas
-- =====================================================
-- Registra cada entrega realizada (puede haber múltiples por presupuesto)
CREATE TABLE IF NOT EXISTS entregas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presupuesto_id UUID REFERENCES presupuestos(id) ON DELETE CASCADE NOT NULL,
  
  -- Datos de la entrega
  fecha_entrega DATE NOT NULL DEFAULT CURRENT_DATE,
  observaciones TEXT,
  
  -- Auditoría
  usuario_id UUID REFERENCES auth.users(id),
  creado_en TIMESTAMP DEFAULT NOW(),
  actualizado_en TIMESTAMP DEFAULT NOW()
);

-- Índices para entregas
CREATE INDEX IF NOT EXISTS idx_entregas_presupuesto ON entregas(presupuesto_id);
CREATE INDEX IF NOT EXISTS idx_entregas_fecha ON entregas(fecha_entrega);
CREATE INDEX IF NOT EXISTS idx_entregas_usuario ON entregas(usuario_id);

-- Comentarios
COMMENT ON TABLE entregas IS 'Registra cada entrega realizada de un presupuesto (permite entregas parciales)';
COMMENT ON COLUMN entregas.presupuesto_id IS 'Presupuesto al que pertenece la entrega';
COMMENT ON COLUMN entregas.fecha_entrega IS 'Fecha en que se efectuó la entrega';
COMMENT ON COLUMN entregas.observaciones IS 'Notas adicionales sobre la entrega';

-- =====================================================
-- Tabla: entregas_items
-- =====================================================
-- Registra qué items y cantidades se entregaron en cada entrega
CREATE TABLE IF NOT EXISTS entregas_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entrega_id UUID REFERENCES entregas(id) ON DELETE CASCADE NOT NULL,
  presupuesto_item_id UUID REFERENCES presupuestos_items(id) ON DELETE CASCADE NOT NULL,
  
  -- Cantidad entregada en esta entrega
  cantidad_entregada DECIMAL(10,2) NOT NULL CHECK (cantidad_entregada > 0),
  
  creado_en TIMESTAMP DEFAULT NOW(),
  
  -- Evitar duplicados: misma entrega + mismo item
  UNIQUE(entrega_id, presupuesto_item_id)
);

-- Índices para entregas_items
CREATE INDEX IF NOT EXISTS idx_entregas_items_entrega ON entregas_items(entrega_id);
CREATE INDEX IF NOT EXISTS idx_entregas_items_presupuesto_item ON entregas_items(presupuesto_item_id);

-- Comentarios
COMMENT ON TABLE entregas_items IS 'Items entregados en cada entrega con sus cantidades';
COMMENT ON COLUMN entregas_items.cantidad_entregada IS 'Cantidad del item entregada en esta entrega específica';

-- =====================================================
-- Vista: v_presupuestos_entregas_resumen
-- =====================================================
-- Calcula el estado de entrega por presupuesto y por item
CREATE OR REPLACE VIEW v_presupuestos_entregas_resumen AS
SELECT 
  p.id as presupuesto_id,
  p.numero,
  p.estado,
  p.cliente_nombre,
  p.total,
  
  -- Items del presupuesto con cantidades entregadas
  pi.id as presupuesto_item_id,
  pi.descripcion,
  pi.cantidad as cantidad_total,
  pi.unidad,
  COALESCE(SUM(ei.cantidad_entregada), 0) as cantidad_entregada,
  GREATEST(0, pi.cantidad - COALESCE(SUM(ei.cantidad_entregada), 0)) as cantidad_pendiente,
  pi.orden,
  
  -- Estado de entrega del item
  CASE 
    WHEN COALESCE(SUM(ei.cantidad_entregada), 0) = 0 THEN 'pendiente'
    WHEN COALESCE(SUM(ei.cantidad_entregada), 0) < pi.cantidad THEN 'parcial'
    ELSE 'completo'
  END as estado_item
  
FROM presupuestos p
INNER JOIN presupuestos_items pi ON pi.presupuesto_id = p.id
LEFT JOIN entregas e ON e.presupuesto_id = p.id
LEFT JOIN entregas_items ei ON ei.entrega_id = e.id AND ei.presupuesto_item_id = pi.id
WHERE p.estado = 'aprobado'
GROUP BY p.id, p.numero, p.estado, p.cliente_nombre, p.total, 
         pi.id, pi.descripcion, pi.cantidad, pi.unidad, pi.orden;

-- Comentario de la vista
COMMENT ON VIEW v_presupuestos_entregas_resumen IS 'Resumen del estado de entrega por presupuesto y por item';

-- =====================================================
-- Vista: v_presupuestos_estado_entrega
-- =====================================================
-- Estado general de entrega por presupuesto
CREATE OR REPLACE VIEW v_presupuestos_estado_entrega AS
WITH entregas_por_item AS (
  SELECT 
    pi.presupuesto_id,
    pi.id as item_id,
    pi.cantidad as cantidad_total,
    COALESCE(SUM(ei.cantidad_entregada), 0) as cantidad_entregada
  FROM presupuestos_items pi
  LEFT JOIN entregas e ON e.presupuesto_id = pi.presupuesto_id
  LEFT JOIN entregas_items ei ON ei.entrega_id = e.id AND ei.presupuesto_item_id = pi.id
  GROUP BY pi.presupuesto_id, pi.id, pi.cantidad
)
SELECT 
  p.id,
  p.numero,
  p.estado,
  p.cliente_nombre,
  p.total,
  p.fecha_emision,
  
  -- Conteo de items
  COUNT(DISTINCT epi.item_id) as total_items,
  
  -- Items completos
  COUNT(DISTINCT CASE 
    WHEN epi.cantidad_entregada >= epi.cantidad_total THEN epi.item_id 
  END) as items_completos,
  
  -- Estado general
  CASE
    WHEN NOT EXISTS (SELECT 1 FROM entregas WHERE presupuesto_id = p.id) THEN 'pendiente'
    WHEN EXISTS (
      SELECT 1 FROM entregas_por_item epi2
      WHERE epi2.presupuesto_id = p.id
        AND epi2.cantidad_entregada < epi2.cantidad_total
    ) THEN 'parcial'
    ELSE 'completo'
  END as estado_entrega,
  
  -- Fecha de última entrega
  MAX(e.fecha_entrega) as fecha_ultima_entrega,
  
  -- Total de entregas
  COUNT(DISTINCT e.id) as total_entregas
  
FROM presupuestos p
LEFT JOIN entregas_por_item epi ON epi.presupuesto_id = p.id
LEFT JOIN entregas e ON e.presupuesto_id = p.id
WHERE p.estado = 'aprobado'
GROUP BY p.id, p.numero, p.estado, p.cliente_nombre, p.total, p.fecha_emision;

-- Comentario de la vista
COMMENT ON VIEW v_presupuestos_estado_entrega IS 'Estado general de entrega por presupuesto aprobado';

-- =====================================================
-- Función: Validar cantidad entregada
-- =====================================================
-- Valida que la cantidad entregada no exceda la cantidad pendiente
CREATE OR REPLACE FUNCTION validar_cantidad_entrega(
  p_presupuesto_item_id UUID,
  p_cantidad_a_entregar DECIMAL
) RETURNS BOOLEAN AS $$
DECLARE
  v_cantidad_total DECIMAL;
  v_cantidad_entregada DECIMAL;
  v_cantidad_pendiente DECIMAL;
BEGIN
  -- Obtener cantidad total del item
  SELECT cantidad INTO v_cantidad_total
  FROM presupuestos_items
  WHERE id = p_presupuesto_item_id;
  
  -- Obtener cantidad ya entregada
  SELECT COALESCE(SUM(ei.cantidad_entregada), 0) INTO v_cantidad_entregada
  FROM entregas_items ei
  INNER JOIN entregas e ON e.id = ei.entrega_id
  INNER JOIN presupuestos_items pi ON pi.id = ei.presupuesto_item_id
  WHERE pi.id = p_presupuesto_item_id;
  
  -- Calcular pendiente
  v_cantidad_pendiente := v_cantidad_total - v_cantidad_entregada;
  
  -- Validar
  RETURN p_cantidad_a_entregar <= v_cantidad_pendiente AND p_cantidad_a_entregar > 0;
END;
$$ LANGUAGE plpgsql;

-- Comentario
COMMENT ON FUNCTION validar_cantidad_entrega IS 'Valida que la cantidad a entregar no exceda la cantidad pendiente del item';

