-- =====================================================
-- Migración: Sistema de Configuraciones de Cercado
-- Fecha: 2024-10-15
-- Descripción: Tabla para gestionar configuraciones de cercado perimetral
-- =====================================================

-- =====================================================
-- Tabla: configuraciones_cercado
-- =====================================================
CREATE TABLE IF NOT EXISTS configuraciones_cercado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT,
  
  -- Altura del cerco
  altura DECIMAL(3,2) NOT NULL CHECK (altura IN (1.20, 1.50, 1.80, 2.00)),
  
  -- Tejido romboidal (referencia)
  tejido_config_id UUID REFERENCES tejidos_configuraciones(id) NOT NULL,
  
  -- Tipo de postes
  tipo_poste VARCHAR(50) NOT NULL CHECK (tipo_poste IN ('Olimp', 'Punta Diamante', 'Eucalipto')),
  
  -- Cantidades para 180m base
  cantidad_postes_esquineros INTEGER DEFAULT 4,
  cantidad_postes_refuerzos INTEGER DEFAULT 2,
  cantidad_postes_intermedios INTEGER DEFAULT 34,
  cantidad_puntales INTEGER DEFAULT 12,
  
  -- Precios de postes
  precio_poste_esquinero DECIMAL(10,2) NOT NULL,
  precio_poste_refuerzo DECIMAL(10,2) NOT NULL,
  precio_poste_intermedio DECIMAL(10,2) NOT NULL,
  precio_puntal DECIMAL(10,2) NOT NULL,
  
  -- Cordón de hormigón
  cordon_tipo VARCHAR(20) NOT NULL CHECK (cordon_tipo IN ('10cm', '15cm', '20cm', 'Sin cordón')),
  cordon_bolsas_ripio INTEGER DEFAULT 0,
  cordon_bolsas_cemento DECIMAL(5,1) DEFAULT 0,
  cordon_precio_total DECIMAL(10,2) DEFAULT 0,
  
  -- Alambre de púa
  hilos_pua INTEGER DEFAULT 0 CHECK (hilos_pua BETWEEN 0 AND 4),
  precio_pua_por_metro DECIMAL(10,2) DEFAULT 1168.02,
  
  -- Accesorios (para 180m)
  cantidad_ganchos INTEGER DEFAULT 48,
  precio_unitario_ganchos DECIMAL(10,2) DEFAULT 12337.50,
  cantidad_planchuelas INTEGER DEFAULT 12,
  precio_unitario_planchuelas DECIMAL(10,2) DEFAULT 5456.45,
  cantidad_torniquetes INTEGER DEFAULT 6,
  precio_unitario_torniquetes DECIMAL(10,2) DEFAULT 12337.50,
  cantidad_esparragos INTEGER DEFAULT 6,
  precio_unitario_esparragos DECIMAL(10,2) DEFAULT 1330.00,
  metros_alambre_ar INTEGER DEFAULT 720,
  precio_metro_alambre_ar DECIMAL(10,2) DEFAULT 3105.48,
  kg_clavos INTEGER DEFAULT 2,
  precio_kg_clavos DECIMAL(10,2) DEFAULT 1330.00,
  kg_alambre_negro INTEGER DEFAULT 8,
  precio_kg_alambre_negro DECIMAL(10,2) DEFAULT 844.20,
  
  -- Precios calculados de accesorios
  precio_total_accesorios DECIMAL(12,2),
  
  -- Mano de obra y transporte
  precio_mano_obra_por_metro DECIMAL(10,2) DEFAULT 11438.00,
  precio_transporte_por_metro DECIMAL(10,2) DEFAULT 3580.50,
  
  -- Precio total para 180m base
  precio_base_180m DECIMAL(12,2),
  precio_por_metro_lineal DECIMAL(10,2),
  precio_por_metro_menor_50m DECIMAL(10,2), -- Con recargo 30%
  
  -- Control
  activo BOOLEAN DEFAULT true,
  usuario_id UUID REFERENCES auth.users(id),
  creado_en TIMESTAMP DEFAULT NOW(),
  actualizado_en TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_configuraciones_cercado_altura ON configuraciones_cercado(altura);
CREATE INDEX idx_configuraciones_cercado_tipo_poste ON configuraciones_cercado(tipo_poste);
CREATE INDEX idx_configuraciones_cercado_activo ON configuraciones_cercado(activo);
CREATE INDEX idx_configuraciones_cercado_tejido ON configuraciones_cercado(tejido_config_id);

-- Comentarios
COMMENT ON TABLE configuraciones_cercado IS 'Configuraciones predefinidas de cercado perimetral';
COMMENT ON COLUMN configuraciones_cercado.altura IS 'Altura del tejido en metros';
COMMENT ON COLUMN configuraciones_cercado.precio_base_180m IS 'Precio total para un terreno de 180 metros lineales';

-- =====================================================
-- Función: Calcular precio de accesorios
-- =====================================================
CREATE OR REPLACE FUNCTION calcular_precio_accesorios_cercado(config_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_config RECORD;
  v_total DECIMAL := 0;
BEGIN
  SELECT * INTO v_config
  FROM configuraciones_cercado
  WHERE id = config_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Sumar todos los accesorios
  v_total := 
    (v_config.cantidad_ganchos * v_config.precio_unitario_ganchos) +
    (v_config.cantidad_planchuelas * v_config.precio_unitario_planchuelas) +
    (v_config.cantidad_torniquetes * v_config.precio_unitario_torniquetes) +
    (v_config.cantidad_esparragos * v_config.precio_unitario_esparragos) +
    (v_config.metros_alambre_ar * v_config.precio_metro_alambre_ar) +
    (v_config.kg_clavos * v_config.precio_kg_clavos) +
    (v_config.kg_alambre_negro * v_config.precio_kg_alambre_negro);
  
  RETURN v_total;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcular_precio_accesorios_cercado IS 'Calcula el precio total de accesorios para una configuración';

-- =====================================================
-- Función: Calcular precio total de configuración
-- =====================================================
CREATE OR REPLACE FUNCTION calcular_precio_total_cercado(config_id UUID)
RETURNS TABLE(
  costo_tejido DECIMAL,
  costo_postes DECIMAL,
  costo_cordon DECIMAL,
  costo_pua DECIMAL,
  costo_accesorios DECIMAL,
  costo_mano_obra DECIMAL,
  costo_transporte DECIMAL,
  total_180m DECIMAL,
  precio_por_metro DECIMAL,
  precio_por_metro_menor_50m DECIMAL
) AS $$
DECLARE
  v_config RECORD;
  v_tejido RECORD;
  v_metros_base DECIMAL := 180;
  v_rollos_necesarios INTEGER;
  v_costo_tejido DECIMAL;
  v_costo_postes DECIMAL;
  v_costo_pua DECIMAL;
  v_costo_accesorios DECIMAL;
  v_costo_mano_obra DECIMAL;
  v_costo_transporte DECIMAL;
  v_total DECIMAL;
BEGIN
  -- Obtener configuración
  SELECT * INTO v_config
  FROM configuraciones_cercado
  WHERE id = config_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Configuración de cercado no encontrada: %', config_id;
  END IF;
  
  -- Obtener datos del tejido
  SELECT * INTO v_tejido
  FROM tejidos_configuraciones
  WHERE id = v_config.tejido_config_id;
  
  -- Calcular rollos necesarios (10m por rollo)
  v_rollos_necesarios := CEIL(v_metros_base / 10);
  
  -- Costo del tejido
  v_costo_tejido := v_rollos_necesarios * v_tejido.precio_venta;
  
  -- Costo de postes
  v_costo_postes := 
    (v_config.cantidad_postes_esquineros * v_config.precio_poste_esquinero) +
    (v_config.cantidad_postes_refuerzos * v_config.precio_poste_refuerzo) +
    (v_config.cantidad_postes_intermedios * v_config.precio_poste_intermedio) +
    (v_config.cantidad_puntales * v_config.precio_puntal);
  
  -- Costo de púa
  v_costo_pua := v_metros_base * v_config.hilos_pua * v_config.precio_pua_por_metro;
  
  -- Costo de accesorios
  v_costo_accesorios := calcular_precio_accesorios_cercado(config_id);
  
  -- Mano de obra
  v_costo_mano_obra := v_metros_base * v_config.precio_mano_obra_por_metro;
  
  -- Transporte
  v_costo_transporte := v_metros_base * v_config.precio_transporte_por_metro;
  
  -- Total
  v_total := v_costo_tejido + v_costo_postes + v_config.cordon_precio_total + 
             v_costo_pua + v_costo_accesorios + v_costo_mano_obra + v_costo_transporte;
  
  RETURN QUERY SELECT
    v_costo_tejido,
    v_costo_postes,
    v_config.cordon_precio_total,
    v_costo_pua,
    v_costo_accesorios,
    v_costo_mano_obra,
    v_costo_transporte,
    v_total,
    (v_total / v_metros_base) as precio_metro,
    (v_total / v_metros_base * 1.30) as precio_metro_menor_50;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcular_precio_total_cercado IS 'Calcula todos los costos de una configuración de cercado para 180m';

-- =====================================================
-- Función: Calcular cercado para terreno específico
-- =====================================================
CREATE OR REPLACE FUNCTION calcular_cercado_para_terreno(
  p_config_id UUID,
  p_metros_lineales DECIMAL
)
RETURNS TABLE(
  costo_tejido DECIMAL,
  costo_postes DECIMAL,
  costo_cordon DECIMAL,
  costo_pua DECIMAL,
  costo_accesorios DECIMAL,
  costo_mano_obra DECIMAL,
  costo_transporte DECIMAL,
  total DECIMAL,
  precio_por_metro DECIMAL
) AS $$
DECLARE
  v_config RECORD;
  v_tejido RECORD;
  v_factor DECIMAL;
  v_recargo DECIMAL := 1.0;
  v_rollos INTEGER;
  v_costo_tejido DECIMAL;
  v_costo_postes DECIMAL;
  v_costo_cordon DECIMAL;
  v_costo_pua DECIMAL;
  v_costo_accesorios DECIMAL;
  v_costo_mano_obra DECIMAL;
  v_costo_transporte DECIMAL;
  v_total DECIMAL;
BEGIN
  -- Obtener configuración
  SELECT * INTO v_config
  FROM configuraciones_cercado
  WHERE id = p_config_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Configuración no encontrada';
  END IF;
  
  -- Obtener tejido
  SELECT * INTO v_tejido
  FROM tejidos_configuraciones
  WHERE id = v_config.tejido_config_id;
  
  -- Factor de proporción vs base de 180m
  v_factor := p_metros_lineales / 180.0;
  
  -- Recargo para terrenos pequeños
  IF p_metros_lineales < 50 THEN
    v_recargo := 1.30;
  END IF;
  
  -- Calcular rollos necesarios
  v_rollos := CEIL(p_metros_lineales / 10.0);
  
  -- Calcular costos
  v_costo_tejido := v_rollos * v_tejido.precio_venta;
  
  v_costo_postes := (
    (v_config.cantidad_postes_esquineros * v_config.precio_poste_esquinero) +
    (v_config.cantidad_postes_refuerzos * v_config.precio_poste_refuerzo) +
    (v_config.cantidad_postes_intermedios * v_config.precio_poste_intermedio * v_factor) +
    (v_config.cantidad_puntales * v_config.precio_puntal * v_factor)
  );
  
  v_costo_cordon := v_config.cordon_precio_total * v_factor;
  
  v_costo_pua := p_metros_lineales * v_config.hilos_pua * v_config.precio_pua_por_metro;
  
  v_costo_accesorios := calcular_precio_accesorios_cercado(p_config_id) * v_factor;
  
  v_costo_mano_obra := p_metros_lineales * v_config.precio_mano_obra_por_metro;
  
  v_costo_transporte := p_metros_lineales * v_config.precio_transporte_por_metro;
  
  v_total := (v_costo_tejido + v_costo_postes + v_costo_cordon + 
              v_costo_pua + v_costo_accesorios + v_costo_mano_obra + 
              v_costo_transporte) * v_recargo;
  
  RETURN QUERY SELECT
    v_costo_tejido,
    v_costo_postes,
    v_costo_cordon,
    v_costo_pua,
    v_costo_accesorios,
    v_costo_mano_obra,
    v_costo_transporte,
    v_total,
    (v_total / p_metros_lineales) as precio_metro;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcular_cercado_para_terreno IS 'Calcula el costo de cercado para un terreno específico';

-- =====================================================
-- Trigger: Actualizar precios calculados
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_actualizar_precios_cercado()
RETURNS TRIGGER AS $$
DECLARE
  v_precios RECORD;
BEGIN
  -- Calcular accesorios
  NEW.precio_total_accesorios := calcular_precio_accesorios_cercado(NEW.id);
  
  -- Calcular totales
  SELECT * INTO v_precios
  FROM calcular_precio_total_cercado(NEW.id);
  
  NEW.precio_base_180m := v_precios.total_180m;
  NEW.precio_por_metro_lineal := v_precios.precio_por_metro;
  NEW.precio_por_metro_menor_50m := v_precios.precio_por_metro_menor_50m;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_actualizar_precios_cercado ON configuraciones_cercado;
CREATE TRIGGER trg_actualizar_precios_cercado
BEFORE INSERT OR UPDATE ON configuraciones_cercado
FOR EACH ROW
EXECUTE FUNCTION trigger_actualizar_precios_cercado();

-- =====================================================
-- Trigger: Actualizar timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_configuraciones_cercado_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_configuraciones_cercado_timestamp ON configuraciones_cercado;
CREATE TRIGGER trg_update_configuraciones_cercado_timestamp
BEFORE UPDATE ON configuraciones_cercado
FOR EACH ROW
EXECUTE FUNCTION update_configuraciones_cercado_timestamp();

-- =====================================================
-- RLS Policies
-- =====================================================

ALTER TABLE configuraciones_cercado ENABLE ROW LEVEL SECURITY;

-- Lectura pública para configuraciones activas
CREATE POLICY "Configuraciones activas son visibles para todos"
ON configuraciones_cercado
FOR SELECT
USING (activo = true);

-- Usuarios autenticados pueden ver todas
CREATE POLICY "Usuarios autenticados pueden ver todas las configuraciones"
ON configuraciones_cercado
FOR SELECT
TO authenticated
USING (true);

-- Solo admins pueden insertar
CREATE POLICY "Solo admins pueden insertar configuraciones"
ON configuraciones_cercado
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = auth.uid()
    AND usuarios.rol = 'admin'
  )
);

-- Solo admins pueden actualizar
CREATE POLICY "Solo admins pueden actualizar configuraciones"
ON configuraciones_cercado
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = auth.uid()
    AND usuarios.rol = 'admin'
  )
);

-- Solo admins pueden eliminar
CREATE POLICY "Solo admins pueden eliminar configuraciones"
ON configuraciones_cercado
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = auth.uid()
    AND usuarios.rol = 'admin'
  )
);

-- =====================================================
-- Vista: Configuraciones con detalles completos
-- =====================================================
CREATE OR REPLACE VIEW v_configuraciones_cercado_completas AS
SELECT 
  cc.*,
  tc.nombre as tejido_nombre,
  tc.codigo as tejido_codigo,
  tc.calibre,
  tc.tamano_rombo,
  tc.precio_venta as tejido_precio_venta
FROM configuraciones_cercado cc
LEFT JOIN tejidos_configuraciones tc ON cc.tejido_config_id = tc.id
WHERE cc.activo = true;

COMMENT ON VIEW v_configuraciones_cercado_completas IS 'Vista con información completa de configuraciones de cercado';

-- =====================================================
-- Añadir referencia en presupuestos
-- =====================================================
ALTER TABLE presupuestos 
ADD CONSTRAINT fk_cercado_config 
FOREIGN KEY (cercado_config_id) 
REFERENCES configuraciones_cercado(id);

-- =====================================================
-- Fin de la migración
-- =====================================================

