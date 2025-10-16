-- =====================================================
-- Fix: Política RLS de artículos para usuarios autenticados
-- =====================================================
-- Fecha: 2024-10-16
-- Problema: Usuarios autenticados no ven artículos con publicado=false
-- Solución: Permitir a usuarios autenticados ver TODOS los artículos

-- Eliminar todas las políticas SELECT existentes
DROP POLICY IF EXISTS "lectura pública de artículos publicados" ON articulos;
DROP POLICY IF EXISTS "lectura de articulos" ON articulos;
DROP POLICY IF EXISTS "Articulos publicos visibles" ON articulos;

-- Política para usuarios ANÓNIMOS (web pública)
CREATE POLICY "articulos_select_publico"
ON articulos FOR SELECT
TO anon
USING (publicado = true);

-- Política para usuarios AUTENTICADOS (dashboard)
CREATE POLICY "articulos_select_autenticado"
ON articulos FOR SELECT
TO authenticated
USING (true);  -- Ven TODOS los artículos

COMMENT ON POLICY "articulos_select_publico" ON articulos IS 
'Usuarios no autenticados solo ven artículos publicados';

COMMENT ON POLICY "articulos_select_autenticado" ON articulos IS 
'Usuarios autenticados ven todos los artículos sin restricciones';

-- =====================================================
-- Verificación
-- =====================================================
-- Para verificar que funciona:
-- SELECT id, nombre, publicado FROM articulos WHERE id IN (7, 8);
-- Debería mostrar ambos artículos, aunque tengan publicado = false

-- =====================================================
-- Fin de la migración
-- =====================================================

