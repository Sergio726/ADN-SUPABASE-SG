-- =====================================================
-- FIX: Política RLS para visitas_web
-- Fecha: 2025-12-25
-- Descripción: Asegurar que usuarios anónimos puedan insertar visitas
-- =====================================================
-- 
-- INSTRUCCIONES:
-- 1. Ve a Supabase Dashboard: https://supabase.com/dashboard/project/vgsnfshbirzucddwbdpt
-- 2. Click en "SQL Editor" en el menú lateral
-- 3. Click en "New query"
-- 4. Copia y pega TODO este contenido
-- 5. Click en "Run" (o presiona Ctrl+Enter)
-- =====================================================

-- Asegurar que RLS esté habilitado
ALTER TABLE visitas_web ENABLE ROW LEVEL SECURITY;

-- Eliminar política existente si existe (para evitar conflictos)
DROP POLICY IF EXISTS "API puede insertar visitas" ON visitas_web;
DROP POLICY IF EXISTS "Usuarios autenticados pueden leer visitas" ON visitas_web;

-- Crear política para permitir inserción desde usuarios anónimos
CREATE POLICY "API puede insertar visitas"
  ON visitas_web
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Crear política para permitir lectura a usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden leer visitas"
  ON visitas_web
  FOR SELECT
  TO authenticated
  USING (true);

-- Verificar que las políticas se crearon correctamente
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'visitas_web';

-- =====================================================
-- Fin del fix
-- =====================================================

