-- =====================================================
-- Migración: Fix Acceso a Configuraciones SMTP
-- Fecha: 2025-01-27
-- Descripción: Permitir acceso a configuraciones SMTP desde APIs del servidor
-- =====================================================

-- Crear una política especial para permitir lectura de configuraciones SMTP activas
-- desde APIs del servidor (sin autenticación de usuario)
DROP POLICY IF EXISTS configuraciones_select_autenticado ON configuraciones;

CREATE POLICY configuraciones_select_autenticado 
  ON configuraciones FOR SELECT 
  TO authenticated 
  USING (true);

-- Nueva política: Permitir lectura de configuraciones SMTP activas desde el servidor
CREATE POLICY configuraciones_smtp_servidor 
  ON configuraciones FOR SELECT 
  TO anon, authenticated
  USING (
    tipo = 'smtp' 
    AND activo = true
  );

-- Política para insertar configuraciones (mantener restricción de usuario)
CREATE POLICY configuraciones_insert_autenticado 
  ON configuraciones FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = usuario_id);

-- Política para actualizar configuraciones (mantener restricción de usuario)
CREATE POLICY configuraciones_update_autenticado 
  ON configuraciones FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);
