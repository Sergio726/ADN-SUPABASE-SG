-- =====================================================
-- Migración: Agregar campo altura_compatible a artículos
-- =====================================================
-- Fecha: 2024-10-16
-- Descripción: Permite indicar para qué alturas de cercado es compatible un artículo

-- =====================================================
-- 1. Agregar columna altura_compatible
-- =====================================================
ALTER TABLE articulos
ADD COLUMN IF NOT EXISTS altura_compatible TEXT;

COMMENT ON COLUMN articulos.altura_compatible IS 
'Alturas de cercado compatibles (opcional). 
Valores posibles:
- NULL: No aplica (artículo general)
- "todas": Compatible con todas las alturas
- "1.2": Solo compatible con 1.2m
- "1.5,1.8,2.0": Compatible con múltiples alturas (separadas por coma)
Valores válidos: 1.0, 1.2, 1.5, 1.8, 2.0';

-- =====================================================
-- 2. Crear índice para búsquedas rápidas
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_articulos_altura_compatible 
ON articulos USING gin (to_tsvector('simple', altura_compatible));

COMMENT ON INDEX idx_articulos_altura_compatible IS 
'Índice para búsquedas eficientes de artículos por altura compatible';

-- =====================================================
-- 3. Función helper para verificar compatibilidad
-- =====================================================
CREATE OR REPLACE FUNCTION es_articulo_compatible_con_altura(
  p_altura_compatible TEXT,
  p_altura_cercado NUMERIC
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Si es NULL, el artículo no tiene restricción (compatible con todo)
  IF p_altura_compatible IS NULL THEN
    RETURN true;
  END IF;
  
  -- Si dice "todas", es compatible
  IF p_altura_compatible = 'todas' THEN
    RETURN true;
  END IF;
  
  -- Verificar si la altura está en la lista
  RETURN p_altura_compatible LIKE '%' || p_altura_cercado::text || '%';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION es_articulo_compatible_con_altura IS 
'Verifica si un artículo es compatible con una altura de cercado específica';

-- =====================================================
-- 4. Ejemplos de uso (solo comentarios)
-- =====================================================
/*
-- Marcar postes como compatibles con todas las alturas
UPDATE articulos 
SET altura_compatible = 'todas'
WHERE nombre ILIKE '%poste%';

-- Marcar grapas pequeñas solo para alturas bajas
UPDATE articulos 
SET altura_compatible = '1.0,1.2'
WHERE nombre ILIKE '%grapa%pequeña%';

-- Marcar torniquetes reforzados para alturas grandes
UPDATE articulos 
SET altura_compatible = '1.8,2.0'
WHERE nombre ILIKE '%torniquete%reforzado%';

-- Buscar artículos compatibles con altura 2.0m
SELECT * FROM articulos
WHERE es_articulo_compatible_con_altura(altura_compatible, 2.0);
*/

-- =====================================================
-- Fin de la migración
-- =====================================================

