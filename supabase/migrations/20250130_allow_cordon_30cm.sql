-- Permitir tipo de cordón "30cm" en configuraciones_cercado
-- El formulario ya ofrece esta opción; el check constraint solo permitía 10cm, 15cm, 20cm y Sin cordón.

ALTER TABLE configuraciones_cercado
  DROP CONSTRAINT IF EXISTS configuraciones_cercado_cordon_tipo_check;

ALTER TABLE configuraciones_cercado
  ADD CONSTRAINT configuraciones_cercado_cordon_tipo_check
  CHECK (cordon_tipo IN ('10cm', '15cm', '20cm', '30cm', 'Sin cordón'));
