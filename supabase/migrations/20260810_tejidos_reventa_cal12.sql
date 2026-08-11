-- =====================================================
-- Migración: Tejidos cal.12 reventa (Marcelo Rojas)
-- Fecha: 2026-08-10
-- Depende de: 20260808_tejidos_reventa.sql (origen, precio_compra,
--             proveedor Marcelo Rojas, triggers de reventa)
--
-- Carga las 15 SKUs calibre 12 × rollo 10 m de la lista manuscrita:
--   rombo 3.0 / 2.5 / 2.0 × altura 2.00 / 1.80 / 1.50 / 1.20 / 1.00
--
-- Los importes son COSTO DE COMPRA.
-- El trigger BEFORE UPDATE recalcula:
--   precio_costo = precio_compra
--   precio_venta = precio_compra × (1 + margen_efectivo/100)  [45% → × 1.45]
--
-- Las 15 configuraciones YA EXISTEN: se actualizan por código, no se crean.
-- Idempotente: se puede re-aplicar sin daño.
-- Ver: docs/TEJIDOS_REVENTA_MARCELO_ROJAS.md
-- =====================================================

-- Asegurar proveedor (por si esta migración corre sola en un entorno nuevo)
INSERT INTO proveedores (nombre, contacto, telefono, email, direccion)
SELECT 'Marcelo Rojas', 'Marcelo Rojas', NULL, NULL, 'Salta'
WHERE NOT EXISTS (
  SELECT 1 FROM proveedores WHERE nombre ILIKE 'marcelo rojas'
);

UPDATE tejidos_configuraciones tc
SET
  origen = 'reventa',
  proveedor_id = (SELECT id FROM proveedores WHERE nombre ILIKE 'marcelo rojas' LIMIT 1),
  precio_compra = lista.precio_compra,
  actualizado_en = NOW()
FROM (
  VALUES
    -- Rombo 3" (3.0)
    ('TR-1.0-3.0-12', 50000.00),
    ('TR-1.2-3.0-12', 57000.00),
    ('TR-1.5-3.0-12', 67500.00),
    ('TR-1.8-3.0-12', 78000.00),
    ('TR-2.0-3.0-12', 85000.00),
    -- Rombo 2 1/2" (2.5)
    ('TR-1.0-2.5-12', 60500.00),
    ('TR-1.2-2.5-12', 71000.00),
    ('TR-1.5-2.5-12', 85000.00),
    ('TR-1.8-2.5-12', 99000.00),
    ('TR-2.0-2.5-12', 106000.00),
    -- Rombo 2" (2.0)
    ('TR-1.0-2.0-12', 71000.00),
    ('TR-1.2-2.0-12', 85000.00),
    ('TR-1.5-2.0-12', 99000.00),
    ('TR-1.8-2.0-12', 116500.00),
    ('TR-2.0-2.0-12', 127000.00)
) AS lista(codigo, precio_compra)
WHERE tc.codigo = lista.codigo;

-- =====================================================
-- VERIFICACIÓN (descomentar y revisar)
-- =====================================================

-- Debe devolver 15 filas cal.12 de reventa, ratio ≈ 1.45
-- SELECT codigo, origen, precio_compra, precio_costo, precio_venta,
--        ROUND(precio_venta / NULLIF(precio_compra, 0), 4) AS ratio
-- FROM tejidos_configuraciones
-- WHERE origen = 'reventa' AND calibre = 12
-- ORDER BY tamano_rombo DESC, altura;

-- Total reventa esperado tras cal.14 (16) + cal.12 (15) = 31
-- SELECT origen, calibre, COUNT(*)
-- FROM tejidos_configuraciones
-- GROUP BY origen, calibre
-- ORDER BY origen, calibre;

-- =====================================================
-- Fin de la migración
-- =====================================================
