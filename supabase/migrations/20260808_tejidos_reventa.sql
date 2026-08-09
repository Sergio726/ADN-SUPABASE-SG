-- =====================================================
-- Migración: Tejidos romboidales en modo REVENTA
-- Fecha: 2026-08-08
-- Contexto: ADN dejó de fabricar rollos de tejido romboidal y ahora los
--           compra al proveedor Marcelo Rojas. El sistema asumía fabricación
--           en todos los casos: costo = (kg alambre × precio alambre) + mano de obra.
--
-- Decisiones de negocio confirmadas:
--   1) La lista de precios de Marcelo Rojas es COSTO DE COMPRA.
--      El precio de venta se deriva aplicando el margen vigente (45% efectivo).
--   2) Los tejidos que Marcelo no vende (calibre 12 y alturas de 1.00 m)
--      siguen ACTIVOS con la lógica de fabricación intacta.
--
-- Esta migración es idempotente: se puede re-aplicar sin daño.
-- Ver: docs/TEJIDOS_REVENTA_MARCELO_ROJAS.md
-- =====================================================

-- =====================================================
-- 1. SCHEMA
-- =====================================================

ALTER TABLE tejidos_configuraciones
  ADD COLUMN IF NOT EXISTS origen VARCHAR(20) NOT NULL DEFAULT 'fabricado',
  ADD COLUMN IF NOT EXISTS proveedor_id INTEGER REFERENCES proveedores(id),
  ADD COLUMN IF NOT EXISTS precio_compra DECIMAL(10,2);

-- CHECK del origen (separado para poder re-aplicar la migración)
ALTER TABLE tejidos_configuraciones DROP CONSTRAINT IF EXISTS chk_tejidos_origen;
ALTER TABLE tejidos_configuraciones
  ADD CONSTRAINT chk_tejidos_origen CHECK (origen IN ('fabricado', 'reventa'));

-- En reventa no hay alambre de materia prima: la columna deja de ser obligatoria
ALTER TABLE tejidos_configuraciones ALTER COLUMN alambre_articulo_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tejidos_origen ON tejidos_configuraciones(origen);

COMMENT ON COLUMN tejidos_configuraciones.origen IS
  'fabricado = costo calculado desde alambre + mano de obra | reventa = costo tomado de precio_compra del proveedor';
COMMENT ON COLUMN tejidos_configuraciones.proveedor_id IS
  'Proveedor al que se compra el rollo. Solo aplica cuando origen = reventa';
COMMENT ON COLUMN tejidos_configuraciones.precio_compra IS
  'Costo de compra del rollo al proveedor. Solo aplica cuando origen = reventa';

-- =====================================================
-- 2. TRIGGERS — bifurcar el cálculo según el origen
-- =====================================================

-- 2.1 Trigger BEFORE INSERT/UPDATE sobre tejidos_configuraciones.
--     La rama 'fabricado' queda idéntica al comportamiento actual.
CREATE OR REPLACE FUNCTION actualizar_precios_tejido_completo()
RETURNS TRIGGER AS $$
DECLARE
  v_precios RECORD;
BEGIN
  IF NEW.origen = 'reventa' THEN
    -- Reventa: el costo es lo que se le paga al proveedor.
    -- No se toca el alambre ni la mano de obra.
    NEW.precio_costo := COALESCE(NEW.precio_compra, 0);
    NEW.precio_venta := ROUND(
      COALESCE(NEW.precio_compra, 0) * (100 + COALESCE(NEW.margen_efectivo, 45.00)) / 100,
      2
    );
  ELSE
    -- Fabricado: comportamiento histórico
    SELECT * INTO v_precios
    FROM calcular_precios_tejido_desde_alambre(
      NEW.cantidad_alambre,
      NEW.alambre_articulo_id,
      NEW.costo_mano_obra,
      COALESCE(NEW.margen_efectivo, 45.00)
    );

    NEW.precio_costo := v_precios.precio_costo;
    NEW.precio_venta := v_precios.precio_venta;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION actualizar_precios_tejido_completo IS
  'Calcula precio_costo y precio_venta. En reventa usa precio_compra; en fabricado usa alambre + mano de obra';

-- 2.2 Trigger AFTER sobre precios_venta: al cambiar el precio del alambre
--     NO debe pisar los precios de los tejidos de reventa.
CREATE OR REPLACE FUNCTION trigger_actualizar_precios_tejidos()
RETURNS TRIGGER AS $$
DECLARE
  v_tejido RECORD;
  v_precios RECORD;
BEGIN
  -- Solo si el artículo es un alambre galvanizado usado en tejidos
  IF NEW.articulo_id IN (7, 8) AND NEW.vigente = true THEN
    FOR v_tejido IN
      SELECT * FROM tejidos_configuraciones
      WHERE alambre_articulo_id = NEW.articulo_id
        AND activo = true
        AND origen = 'fabricado'   -- <-- los de reventa no dependen del alambre
    LOOP
      SELECT * INTO v_precios
      FROM calcular_precios_tejido_desde_alambre(
        v_tejido.cantidad_alambre,
        v_tejido.alambre_articulo_id,
        v_tejido.costo_mano_obra,
        COALESCE(v_tejido.margen_efectivo, 45.00)
      );

      UPDATE tejidos_configuraciones
      SET
        precio_costo = v_precios.precio_costo,
        precio_venta = v_precios.precio_venta,
        actualizado_en = NOW()
      WHERE id = v_tejido.id;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION trigger_actualizar_precios_tejidos IS
  'Actualiza precios de tejidos FABRICADOS cuando cambia el precio del alambre galvanizado. Ignora los de reventa';

-- 2.3 Recálculo masivo: también debe saltear los de reventa
CREATE OR REPLACE FUNCTION actualizar_todos_precios_tejidos()
RETURNS INTEGER AS $$
DECLARE
  v_tejido RECORD;
  v_precios RECORD;
  v_actualizados INTEGER := 0;
BEGIN
  FOR v_tejido IN
    SELECT id, cantidad_alambre, alambre_articulo_id, costo_mano_obra, margen_efectivo
    FROM tejidos_configuraciones
    WHERE activo = true
      AND origen = 'fabricado'   -- <-- los de reventa conservan su precio de compra
  LOOP
    SELECT * INTO v_precios
    FROM calcular_precios_tejido_desde_alambre(
      v_tejido.cantidad_alambre,
      v_tejido.alambre_articulo_id,
      v_tejido.costo_mano_obra,
      COALESCE(v_tejido.margen_efectivo, 45.00)
    );

    UPDATE tejidos_configuraciones
    SET
      precio_costo = v_precios.precio_costo,
      precio_venta = v_precios.precio_venta
    WHERE id = v_tejido.id;

    v_actualizados := v_actualizados + 1;
  END LOOP;

  RETURN v_actualizados;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION actualizar_todos_precios_tejidos IS
  'Recalcula precio_costo y precio_venta de los tejidos FABRICADOS activos';

-- =====================================================
-- 3. VISTA v_tejidos_con_precios
--    Misma definición vigente + origen / proveedor / precio_compra
-- =====================================================

DROP VIEW IF EXISTS v_tejidos_con_precios CASCADE;

CREATE VIEW v_tejidos_con_precios AS
SELECT
  tc.id,
  tc.codigo,
  tc.nombre,
  tc.descripcion,
  tc.calibre,
  tc.altura,
  tc.tamano_rombo,
  tc.largo,
  tc.cantidad_alambre,
  tc.costo_mano_obra,
  tc.precio_costo,
  tc.precio_venta, -- Precio base (efectivo)
  tc.margen_efectivo,
  tc.horas_fabricacion,
  tc.alambre_articulo_id,
  tc.categoria_calidad,
  tc.activo,
  tc.creado_en,
  tc.actualizado_en,
  -- Origen y datos de reventa
  tc.origen,
  tc.proveedor_id,
  tc.precio_compra,
  prov.nombre AS proveedor_nombre,
  pv.precio_costo AS alambre_precio_kg,
  -- Precios calculados dinámicamente (no guardados)
  (tc.precio_venta * 1.21) as precio_lista, -- Factura/Lista = precio_base * 1.21
  (tc.precio_venta / tc.largo) as precio_por_metro_efectivo,
  ((tc.precio_venta * 1.21) / tc.largo) as precio_por_metro_lista
FROM tejidos_configuraciones tc
LEFT JOIN precios_venta pv
  ON pv.articulo_id = tc.alambre_articulo_id
  AND pv.vigente = true
LEFT JOIN proveedores prov
  ON prov.id = tc.proveedor_id;

COMMENT ON VIEW v_tejidos_con_precios IS
  'Vista de tejidos con precios calculados dinámicamente. precio_venta es el precio base (efectivo). Incluye origen fabricado/reventa';

GRANT SELECT ON v_tejidos_con_precios TO authenticated;
GRANT SELECT ON v_tejidos_con_precios TO anon;

-- =====================================================
-- 4. PROVEEDOR MARCELO ROJAS
-- =====================================================

INSERT INTO proveedores (nombre, contacto, telefono, email, direccion)
SELECT 'Marcelo Rojas', 'Marcelo Rojas', NULL, NULL, 'Salta'
WHERE NOT EXISTS (
  SELECT 1 FROM proveedores WHERE nombre ILIKE 'marcelo rojas'
);

-- =====================================================
-- 5. CARGA DE LAS 16 SKUs DE REVENTA (calibre 14, rollo 10 m)
--
--    Los importes son COSTO DE COMPRA (lista manuscrita de Marcelo).
--    El trigger BEFORE UPDATE recalcula precio_costo y precio_venta:
--      precio_costo = precio_compra
--      precio_venta = precio_compra × (1 + margen_efectivo/100)   [45% → × 1.45]
--
--    Las 16 configuraciones YA EXISTEN: se actualizan por código, no se crean.
-- =====================================================

UPDATE tejidos_configuraciones tc
SET
  origen = 'reventa',
  proveedor_id = (SELECT id FROM proveedores WHERE nombre ILIKE 'marcelo rojas' LIMIT 1),
  precio_compra = lista.precio_compra,
  actualizado_en = NOW()
FROM (
  VALUES
    -- Rombo 3 1/2"
    ('TR-1.2-3.5-14', 40000.00),
    ('TR-1.5-3.5-14', 45000.00),
    ('TR-1.8-3.5-14', 55000.00),
    ('TR-2.0-3.5-14', 58000.00),
    -- Rombo 3"
    ('TR-1.2-3.0-14', 45200.00),
    ('TR-1.5-3.0-14', 52800.00),
    ('TR-1.8-3.0-14', 60300.00),
    ('TR-2.0-3.0-14', 65000.00),
    -- Rombo 2 1/2"
    ('TR-1.2-2.5-14', 49500.00),
    ('TR-1.5-2.5-14', 58000.00),
    ('TR-1.8-2.5-14', 68000.00),
    ('TR-2.0-2.5-14', 72600.00),
    -- Rombo 2"
    ('TR-1.2-2.0-14', 58500.00),
    ('TR-1.5-2.0-14', 69000.00),
    ('TR-1.8-2.0-14', 79800.00),
    ('TR-2.0-2.0-14', 87000.00)
) AS lista(codigo, precio_compra)
WHERE tc.codigo = lista.codigo;

-- =====================================================
-- 6. VERIFICACIÓN (ejecutar y revisar el resultado)
-- =====================================================

-- Debe devolver 16 filas de reventa, con precio_costo = compra y precio_venta = compra × 1.45
-- SELECT codigo, origen, precio_compra, precio_costo, precio_venta,
--        ROUND(precio_venta / NULLIF(precio_compra, 0), 4) AS ratio
-- FROM tejidos_configuraciones
-- WHERE origen = 'reventa'
-- ORDER BY tamano_rombo DESC, altura;

-- Debe devolver 24 filas fabricadas, sin cambios respecto a antes de la migración
-- SELECT COUNT(*) FROM tejidos_configuraciones WHERE origen = 'fabricado';

-- =====================================================
-- Fin de la migración
-- =====================================================
