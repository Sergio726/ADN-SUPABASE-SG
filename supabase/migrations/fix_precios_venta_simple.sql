-- =====================================================
-- Fix: Permitir insertar precios_venta sin triggers complejos
-- =====================================================

-- Deshabilitar triggers temporalmente
ALTER TABLE precios_venta DISABLE TRIGGER ALL;

-- Insertar los precios manualmente desde el script

-- Después de insertar, volver a habilitar
-- ALTER TABLE precios_venta ENABLE TRIGGER ALL;

-- =====================================================
-- Nota: Ejecutar este script ANTES de actualizar precios
-- Luego ejecutar: node scripts/actualizar-precios-articulos.js
-- Finalmente ejecutar: ALTER TABLE precios_venta ENABLE TRIGGER ALL;
-- =====================================================

