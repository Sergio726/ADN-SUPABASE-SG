-- =====================================================
-- Fix: Política RLS de artículos para usuarios autenticados
-- =====================================================
-- Fecha: 2024-10-16
-- Problema: Usuarios autenticados no ven artículos con publicado=false
-- Solución: Permitir a usuarios autenticados ver TODOS los artículos

-- Eliminar política actual
DROP POLICY IF EXISTS "lectura pública de artículos publicados" ON articulos;
DROP POLICY IF EXISTS "lectura de articulos" ON articulos;

-- Crear nueva política que distingue entre autenticados y anónimos
CREATE POLICY "lectura de articulos"
ON articulos FOR SELECT 
USING (
  -- Usuarios NO autenticados (web pública): solo ven publicados
  (auth.uid() IS NULL AND publicado = true) OR
  -- Usuarios autenticados (dashboard): ven TODOS
  (auth.uid() IS NOT NULL)
);

COMMENT ON POLICY "lectura de articulos" ON articulos IS 
'Usuarios autenticados ven todos los artículos, usuarios anónimos solo los publicados';

-- =====================================================
-- Verificación
-- =====================================================
-- Para verificar que funciona:
-- SELECT id, nombre, publicado FROM articulos WHERE id IN (7, 8);
-- Debería mostrar ambos artículos, aunque tengan publicado = false

-- =====================================================
-- Fin de la migración
-- =====================================================

