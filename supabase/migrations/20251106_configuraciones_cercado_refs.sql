-- =============================================
-- Migración: Agregar referencias de artículos a configuraciones_cercado
-- Fecha: 2025-11-06
-- Descripción: agrega columnas para IDs de artículos (postes, accesorios,
-- cordón, servicios) para permitir recálculo dinámico con precios vigentes.
-- =============================================

-- Postes
ALTER TABLE configuraciones_cercado
  ADD COLUMN IF NOT EXISTS poste_esquinero_id BIGINT REFERENCES articulos(id),
  ADD COLUMN IF NOT EXISTS poste_refuerzo_id BIGINT REFERENCES articulos(id),
  ADD COLUMN IF NOT EXISTS poste_intermedio_id BIGINT REFERENCES articulos(id),
  ADD COLUMN IF NOT EXISTS poste_puntal_id BIGINT REFERENCES articulos(id);

-- Púa y accesorios varios
ALTER TABLE configuraciones_cercado
  ADD COLUMN IF NOT EXISTS pua_id BIGINT REFERENCES articulos(id),
  ADD COLUMN IF NOT EXISTS alambre_ar_id BIGINT REFERENCES articulos(id),
  ADD COLUMN IF NOT EXISTS clavos_id BIGINT REFERENCES articulos(id),
  ADD COLUMN IF NOT EXISTS alambre_negro_id BIGINT REFERENCES articulos(id),
  ADD COLUMN IF NOT EXISTS ganchos_id BIGINT REFERENCES articulos(id),
  ADD COLUMN IF NOT EXISTS planchuelas_id BIGINT REFERENCES articulos(id),
  ADD COLUMN IF NOT EXISTS torniquetes_id BIGINT REFERENCES articulos(id),
  ADD COLUMN IF NOT EXISTS esparragos_id BIGINT REFERENCES articulos(id);

-- Cordón (materiales y cantidades)
ALTER TABLE configuraciones_cercado
  ADD COLUMN IF NOT EXISTS cordon_arena_id BIGINT REFERENCES articulos(id),
  ADD COLUMN IF NOT EXISTS cordon_ripio_id BIGINT REFERENCES articulos(id),
  ADD COLUMN IF NOT EXISTS cordon_cemento_id BIGINT REFERENCES articulos(id),
  ADD COLUMN IF NOT EXISTS cordon_arena_m3 NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS cordon_ripio_m3 NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS cordon_cemento_bolsas NUMERIC(10,2);

-- Servicios
ALTER TABLE configuraciones_cercado
  ADD COLUMN IF NOT EXISTS mano_obra_id BIGINT REFERENCES articulos(id),
  ADD COLUMN IF NOT EXISTS transporte_id BIGINT REFERENCES articulos(id);

-- Comentarios
COMMENT ON COLUMN configuraciones_cercado.poste_esquinero_id IS 'Artículo poste esquinero (precio vigente)';
COMMENT ON COLUMN configuraciones_cercado.poste_refuerzo_id IS 'Artículo poste refuerzo (precio vigente)';
COMMENT ON COLUMN configuraciones_cercado.poste_intermedio_id IS 'Artículo poste intermedio (precio vigente)';
COMMENT ON COLUMN configuraciones_cercado.poste_puntal_id IS 'Artículo puntal (precio vigente)';
COMMENT ON COLUMN configuraciones_cercado.pua_id IS 'Artículo alambre de púa (precio por metro vigente)';
COMMENT ON COLUMN configuraciones_cercado.alambre_ar_id IS 'Artículo alambre A/R (se deduce precio por metro)';
COMMENT ON COLUMN configuraciones_cercado.clavos_id IS 'Artículo clavos (precio por kg vigente)';
COMMENT ON COLUMN configuraciones_cercado.alambre_negro_id IS 'Artículo alambre negro (precio por kg vigente)';
COMMENT ON COLUMN configuraciones_cercado.ganchos_id IS 'Artículo ganchos';
COMMENT ON COLUMN configuraciones_cercado.planchuelas_id IS 'Artículo planchuelas';
COMMENT ON COLUMN configuraciones_cercado.torniquetes_id IS 'Artículo torniquetes';
COMMENT ON COLUMN configuraciones_cercado.esparragos_id IS 'Artículo esparragos';
COMMENT ON COLUMN configuraciones_cercado.cordon_arena_id IS 'Artículo arena (m3)';
COMMENT ON COLUMN configuraciones_cercado.cordon_ripio_id IS 'Artículo ripio (m3)';
COMMENT ON COLUMN configuraciones_cercado.cordon_cemento_id IS 'Artículo cemento (bolsas)';
COMMENT ON COLUMN configuraciones_cercado.cordon_arena_m3 IS 'Cantidad de arena (m3) para 180m';
COMMENT ON COLUMN configuraciones_cercado.cordon_ripio_m3 IS 'Cantidad de ripio (m3) para 180m';
COMMENT ON COLUMN configuraciones_cercado.cordon_cemento_bolsas IS 'Cantidad de cemento (bolsas) para 180m';
COMMENT ON COLUMN configuraciones_cercado.mano_obra_id IS 'Artículo servicio mano de obra ($/m)';
COMMENT ON COLUMN configuraciones_cercado.transporte_id IS 'Artículo servicio transporte ($/m)';


