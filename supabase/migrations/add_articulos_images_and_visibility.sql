-- ================================
-- MIGRATION: Agregar funcionalidad de imágenes y publicación
-- Fecha: 2024-12-XX
-- Descripción: Agrega control de visibilidad y gestión de imágenes para artículos
-- ================================

-- 1. Agregar nuevas columnas a la tabla articulos
ALTER TABLE articulos 
ADD COLUMN IF NOT EXISTS imagen_url TEXT,
ADD COLUMN IF NOT EXISTS publicado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS mostrar_precio_publico BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMP DEFAULT NOW();

-- 2. Crear índice para mejorar consultas públicas
-- (Solo artículos publicados serán consultados frecuentemente desde la web)
CREATE INDEX IF NOT EXISTS idx_articulos_publicado 
ON articulos(publicado) 
WHERE publicado = true;

-- 3. Crear índice compuesto para la consulta de la página principal
CREATE INDEX IF NOT EXISTS idx_articulos_publico_categoria 
ON articulos(publicado, categoria) 
WHERE publicado = true;

-- 4. Agregar trigger para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_actualizar_articulos ON articulos;
CREATE TRIGGER trigger_actualizar_articulos
BEFORE UPDATE ON articulos
FOR EACH ROW
EXECUTE FUNCTION actualizar_timestamp();

-- 5. Actualizar política de lectura pública de artículos
-- Los usuarios no autenticados solo ven artículos publicados
DROP POLICY IF EXISTS "lectura pública de artículos" ON articulos;

CREATE POLICY "lectura pública de artículos publicados"
ON articulos FOR SELECT 
USING (
  publicado = true OR 
  auth.uid() IS NOT NULL
);

-- 6. Comentarios para documentación
COMMENT ON COLUMN articulos.imagen_url IS 'URL pública de la imagen del artículo desde Supabase Storage';
COMMENT ON COLUMN articulos.publicado IS 'Si es true, el artículo aparece en la web pública';
COMMENT ON COLUMN articulos.mostrar_precio_publico IS 'Si es true, el precio es visible en la web pública (requiere publicado=true)';
COMMENT ON COLUMN articulos.actualizado_en IS 'Timestamp de última modificación del registro';

-- ================================
-- INSTRUCCIONES PARA SUPABASE STORAGE
-- ================================
-- 
-- Crear bucket manualmente en Supabase Dashboard:
-- 1. Ir a Storage → Create bucket
-- 2. Nombre: articulos-images
-- 3. Public: true
-- 4. Aplicar las siguientes políticas SQL:
--
-- CREATE POLICY "public_read_articulos_images"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'articulos-images');
--
-- CREATE POLICY "authenticated_upload_articulos_images"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--   bucket_id = 'articulos-images' AND
--   auth.role() = 'authenticated'
-- );
--
-- CREATE POLICY "authenticated_update_articulos_images"
-- ON storage.objects FOR UPDATE
-- USING (
--   bucket_id = 'articulos-images' AND
--   auth.uid() IS NOT NULL
-- );
--
-- CREATE POLICY "authenticated_delete_articulos_images"
-- ON storage.objects FOR DELETE
-- USING (
--   bucket_id = 'articulos-images' AND
--   auth.uid() IS NOT NULL
-- );
-- ================================

