-- =====================================================
-- FIX SIMPLE: Políticas RLS para visitas_web
-- Fecha: 2025-01-XX
-- Descripción: Solo corrige las políticas RLS necesarias
-- =====================================================
-- 
-- INSTRUCCIONES:
-- 1. Ve a Supabase Dashboard: https://supabase.com/dashboard/project/vgsnfshbirzucddwbdpt
-- 2. Click en "SQL Editor" en el menú lateral
-- 3. Click en "New query"
-- 4. Copia y pega TODO este contenido
-- 5. Click en "Run" (o presiona Ctrl+Enter)
-- 6. Deberías ver: "Success. No rows returned"
-- =====================================================

-- Asegurar que RLS esté habilitado
ALTER TABLE IF EXISTS visitas_web ENABLE ROW LEVEL SECURITY;

-- Eliminar TODAS las políticas existentes (para empezar limpio)
DROP POLICY IF EXISTS "API puede insertar visitas" ON visitas_web;
DROP POLICY IF EXISTS "API puede actualizar visitas" ON visitas_web;
DROP POLICY IF EXISTS "Usuarios autenticados pueden leer visitas" ON visitas_web;
DROP POLICY IF EXISTS "anon_insert_visitas" ON visitas_web;
DROP POLICY IF EXISTS "authenticated_read_visitas" ON visitas_web;

-- Crear política para permitir inserción desde usuarios anónimos
-- IMPORTANTE: Esto permite que cualquier usuario anónimo inserte visitas
CREATE POLICY "API puede insertar visitas"
  ON visitas_web
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Crear política para permitir actualización desde usuarios anónimos
CREATE POLICY "API puede actualizar visitas"
  ON visitas_web
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Crear política para permitir lectura a usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden leer visitas"
  ON visitas_web
  FOR SELECT
  TO authenticated
  USING (true);

-- Verificar que las políticas se crearon correctamente
SELECT 
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'visitas_web'
ORDER BY policyname;

-- =====================================================
-- IMPORTANTE: Si sigues teniendo errores después de esto,
-- verifica que:
-- 1. La tabla visitas_web existe
-- 2. RLS está habilitado: SELECT * FROM pg_tables WHERE tablename = 'visitas_web';
-- 3. Las políticas aparecen en la consulta de arriba
-- =====================================================

