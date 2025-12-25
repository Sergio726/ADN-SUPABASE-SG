-- =====================================================
-- MIGRACIÓN: Agregar columna 'valor' a configuraciones
-- Fecha: 2025-01-27
-- Descripción: Agrega columna genérica 'valor' para almacenar cualquier tipo de configuración
-- =====================================================

-- Agregar columna 'valor' a la tabla configuraciones
ALTER TABLE configuraciones 
ADD COLUMN IF NOT EXISTS valor TEXT;

-- Actualizar registros existentes de portada_imagen
-- Si tienen email_from con una URL, moverla a valor
UPDATE configuraciones
SET valor = email_from
WHERE tipo = 'portada_imagen' 
  AND clave = 'hero_background' 
  AND email_from IS NOT NULL 
  AND email_from LIKE 'http%';

-- Crear índice para búsquedas por valor
CREATE INDEX IF NOT EXISTS idx_configuraciones_valor ON configuraciones(valor) WHERE valor IS NOT NULL;

-- Comentario en la columna
COMMENT ON COLUMN configuraciones.valor IS 'Valor genérico para configuraciones (URLs, texto, JSON, etc.)';

