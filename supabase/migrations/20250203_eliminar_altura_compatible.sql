-- =====================================================
-- Migración: Eliminar campo altura_compatible de artículos
-- =====================================================
-- Fecha: 2025-02-03
-- Descripción: Elimina la funcionalidad de compatibilidad de altura de cerco
--              que ya no es necesaria en el sistema

-- =====================================================
-- 1. Eliminar función helper
-- =====================================================
DROP FUNCTION IF EXISTS es_articulo_compatible_con_altura(TEXT, NUMERIC);

-- =====================================================
-- 2. Eliminar índice
-- =====================================================
DROP INDEX IF EXISTS idx_articulos_altura_compatible;

-- =====================================================
-- 3. Eliminar columna altura_compatible
-- =====================================================
ALTER TABLE articulos
DROP COLUMN IF EXISTS altura_compatible;

-- =====================================================
-- Fin de la migración
-- =====================================================

