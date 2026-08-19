-- Corrección 2026-08-19: se había aplicado 30% sobre el COSTO de reventa
-- tres veces (en vez de cambiar el margen a 30%). Se restauran las listas
-- de Marcelo Rojas y se deja margen_efectivo = 30%.
-- El trigger arma: precio_costo = compra, precio_venta = compra × 1.30

UPDATE tejidos_configuraciones tc
SET
  precio_compra = lista.precio_compra,
  margen_efectivo = 30.00,
  actualizado_en = NOW()
FROM (
  VALUES
    ('TR-1.2-3.5-14', 40000.00),
    ('TR-1.5-3.5-14', 45000.00),
    ('TR-1.8-3.5-14', 55000.00),
    ('TR-2.0-3.5-14', 58000.00),
    ('TR-1.2-3.0-14', 45200.00),
    ('TR-1.5-3.0-14', 52800.00),
    ('TR-1.8-3.0-14', 60300.00),
    ('TR-2.0-3.0-14', 65000.00),
    ('TR-1.2-2.5-14', 49500.00),
    ('TR-1.5-2.5-14', 58000.00),
    ('TR-1.8-2.5-14', 68000.00),
    ('TR-1.2-2.0-14', 58500.00),
    ('TR-1.5-2.0-14', 69000.00),
    ('TR-1.8-2.0-14', 79800.00),
    ('TR-2.0-2.0-14', 87000.00),
    ('TR-2.0-2.5-14', 72600.00),
    ('TR-1.0-3.0-12', 50000.00),
    ('TR-1.2-3.0-12', 57000.00),
    ('TR-1.5-3.0-12', 67500.00),
    ('TR-1.8-3.0-12', 78000.00),
    ('TR-2.0-3.0-12', 85000.00),
    ('TR-1.0-2.5-12', 60500.00),
    ('TR-1.2-2.5-12', 71000.00),
    ('TR-1.5-2.5-12', 85000.00),
    ('TR-1.8-2.5-12', 99000.00),
    ('TR-2.0-2.5-12', 106000.00),
    ('TR-1.0-2.0-12', 71000.00),
    ('TR-1.2-2.0-12', 85000.00),
    ('TR-1.5-2.0-12', 99000.00),
    ('TR-1.8-2.0-12', 116500.00),
    ('TR-2.0-2.0-12', 127000.00)
) AS lista(codigo, precio_compra)
WHERE tc.codigo = lista.codigo
  AND tc.origen = 'reventa';
