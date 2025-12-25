-- =====================================================
-- SCRIPT DE VERIFICACIÓN: Políticas RLS para visitas_web
-- Fecha: 2025-01-XX
-- Descripción: Verifica y muestra el estado actual de RLS
-- =====================================================

-- 1. Verificar que la tabla existe
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_habilitado
FROM pg_tables 
WHERE tablename = 'visitas_web';

-- 2. Ver todas las políticas RLS en la tabla visitas_web
SELECT 
  policyname as nombre_politica,
  cmd as operacion,
  roles as roles_aplicados,
  qual as condicion_using,
  with_check as condicion_check
FROM pg_policies 
WHERE tablename = 'visitas_web'
ORDER BY policyname;

-- 3. Verificar si RLS está habilitado
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ RLS HABILITADO'
    ELSE '❌ RLS DESHABILITADO'
  END as estado_rls
FROM pg_tables 
WHERE tablename = 'visitas_web';

-- 4. Intentar insertar un registro de prueba (esto fallará si RLS no está bien configurado)
-- DESCOMENTA ESTA LÍNEA SOLO PARA PRUEBAS:
-- INSERT INTO visitas_web (url, pathname, session_id) VALUES ('http://test.com', '/test', 'test-session-123');

-- =====================================================
-- Si no ves políticas o RLS está deshabilitado,
-- ejecuta primero: FIX_RLS_VISITAS_SIMPLE.sql
-- =====================================================

