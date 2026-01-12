-- =====================================================
-- FIX: Políticas RLS para configuracion_horarios y dias_especiales
-- Fecha: 2025-02-07
-- Descripción: Corregir políticas RLS para permitir modificación a usuarios autenticados
-- =====================================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Solo administradores pueden modificar horarios" ON configuracion_horarios;
DROP POLICY IF EXISTS "Solo administradores pueden modificar dias_especiales" ON dias_especiales;

-- Política: Usuarios autenticados pueden modificar horarios
CREATE POLICY "Usuarios autenticados pueden modificar horarios"
  ON configuracion_horarios
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Política: Usuarios autenticados pueden modificar días especiales
CREATE POLICY "Usuarios autenticados pueden modificar dias_especiales"
  ON dias_especiales
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

