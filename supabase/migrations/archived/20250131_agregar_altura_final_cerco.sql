-- =====================================================
-- Migración: Agregar altura final del cerco
-- Fecha: 2025-01-31
-- Descripción: Agrega el campo altura_final_cerco a la tabla configuraciones_cercado
--              para almacenar la altura final del cerco instalado
-- =====================================================

-- Agregar columna altura_final_cerco
ALTER TABLE configuraciones_cercado
ADD COLUMN IF NOT EXISTS altura_final_cerco DECIMAL(3,2);

-- Agregar comentario
COMMENT ON COLUMN configuraciones_cercado.altura_final_cerco IS 'Altura final del cerco instalado en metros (ej: 1.3, 1.5, 1.8, 2.3, 2.5, 3.0, 3.5)';

-- =====================================================
-- Fin de la migración
-- =====================================================

