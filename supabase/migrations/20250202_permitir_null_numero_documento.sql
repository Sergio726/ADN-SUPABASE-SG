-- =====================================================
-- Migración: Permitir NULL en numero_documento de clientes
-- Fecha: 2025-02-02
-- Descripción: Modifica la columna numero_documento para permitir valores NULL
--              Esto permite crear clientes rápidos sin documento
-- =====================================================

-- Eliminar el índice único existente (necesario para modificar la columna)
DROP INDEX IF EXISTS idx_clientes_documento;

-- Modificar la columna para permitir NULL
ALTER TABLE clientes 
ALTER COLUMN numero_documento DROP NOT NULL;

-- Recrear el índice único
-- PostgreSQL permite múltiples NULL en índices únicos, así que solo
-- las combinaciones (tipo_documento, numero_documento) no-nulas deben ser únicas
CREATE UNIQUE INDEX idx_clientes_documento 
ON clientes(tipo_documento, numero_documento)
WHERE numero_documento IS NOT NULL;

-- Comentario actualizado
COMMENT ON COLUMN clientes.numero_documento IS 'Número sin guiones ni espacios. Puede ser NULL para clientes creados sin documento (registro rápido)';

-- =====================================================
-- Fin de la migración
-- =====================================================

