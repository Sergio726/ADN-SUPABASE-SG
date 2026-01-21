-- =====================================================
-- MIGRACIÓN: UTM Parameters y Eventos de Conversión
-- Fecha: 2025-01-21
-- Descripción: Agrega soporte para UTM params, categorización de referrer
--              y sistema de eventos de conversión para segmentación de leads
-- =====================================================

-- =====================================================
-- PARTE 1: Agregar campos UTM a visitas_web
-- =====================================================

-- Agregar campos UTM si no existen
ALTER TABLE visitas_web 
ADD COLUMN IF NOT EXISTS utm_source VARCHAR(100),
ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(100),
ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(200),
ADD COLUMN IF NOT EXISTS utm_content VARCHAR(200),
ADD COLUMN IF NOT EXISTS utm_term VARCHAR(200),
ADD COLUMN IF NOT EXISTS fuente_categorizada VARCHAR(50);

-- Comentarios
COMMENT ON COLUMN visitas_web.utm_source IS 'Fuente del tráfico (google, facebook, instagram, etc.)';
COMMENT ON COLUMN visitas_web.utm_medium IS 'Medio de la campaña (cpc, organic, social, email, etc.)';
COMMENT ON COLUMN visitas_web.utm_campaign IS 'Nombre de la campaña';
COMMENT ON COLUMN visitas_web.utm_content IS 'Contenido o variante del anuncio';
COMMENT ON COLUMN visitas_web.utm_term IS 'Palabra clave de búsqueda';
COMMENT ON COLUMN visitas_web.fuente_categorizada IS 'Categoría de fuente: directo, google, facebook, instagram, whatsapp, otro';

-- Índices para búsquedas por UTM
CREATE INDEX IF NOT EXISTS idx_visitas_web_utm_source ON visitas_web(utm_source);
CREATE INDEX IF NOT EXISTS idx_visitas_web_utm_campaign ON visitas_web(utm_campaign);
CREATE INDEX IF NOT EXISTS idx_visitas_web_fuente_categorizada ON visitas_web(fuente_categorizada);

-- =====================================================
-- PARTE 2: Tabla de Eventos de Conversión
-- =====================================================

CREATE TABLE IF NOT EXISTS eventos_conversion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relación con visita (opcional)
  visita_id UUID REFERENCES visitas_web(id) ON DELETE SET NULL,
  session_id TEXT,
  
  -- Tipo de evento
  tipo_evento VARCHAR(50) NOT NULL, -- 'click_whatsapp', 'click_telefono', 'envio_formulario', 'descarga_catalogo', 'click_email'
  
  -- Información del evento
  pagina_origen TEXT, -- URL desde donde se generó el evento
  elemento_id VARCHAR(100), -- ID del elemento clickeado (si aplica)
  elemento_texto TEXT, -- Texto del elemento (ej: número de teléfono, texto del botón)
  
  -- Metadatos adicionales
  metadata JSONB DEFAULT '{}', -- Datos adicionales según tipo de evento
  
  -- Información del dispositivo (heredada de visita o capturada directamente)
  dispositivo VARCHAR(20),
  navegador VARCHAR(50),
  
  -- UTM params (para eventos sin visita asociada)
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(200),
  
  -- Timestamps
  fecha_evento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para eventos
CREATE INDEX IF NOT EXISTS idx_eventos_conversion_tipo ON eventos_conversion(tipo_evento);
CREATE INDEX IF NOT EXISTS idx_eventos_conversion_fecha ON eventos_conversion(fecha_evento DESC);
CREATE INDEX IF NOT EXISTS idx_eventos_conversion_session ON eventos_conversion(session_id);
CREATE INDEX IF NOT EXISTS idx_eventos_conversion_visita ON eventos_conversion(visita_id);

-- Comentarios
COMMENT ON TABLE eventos_conversion IS 'Registro de eventos de conversión (clicks en WhatsApp, teléfono, formularios, etc.)';
COMMENT ON COLUMN eventos_conversion.tipo_evento IS 'Tipo de evento: click_whatsapp, click_telefono, envio_formulario, descarga_catalogo, click_email';
COMMENT ON COLUMN eventos_conversion.metadata IS 'Datos adicionales en formato JSON según tipo de evento';

-- =====================================================
-- PARTE 3: Función para categorizar referrer
-- =====================================================

CREATE OR REPLACE FUNCTION categorizar_referrer(referrer_url TEXT)
RETURNS VARCHAR(50) AS $$
DECLARE
  ref_lower TEXT;
BEGIN
  IF referrer_url IS NULL OR referrer_url = '' THEN
    RETURN 'directo';
  END IF;
  
  ref_lower := LOWER(referrer_url);
  
  -- Google (búsqueda y ads)
  IF ref_lower LIKE '%google.%' OR ref_lower LIKE '%googleapis.%' THEN
    RETURN 'google';
  END IF;
  
  -- Facebook e Instagram (Meta)
  IF ref_lower LIKE '%facebook.%' OR ref_lower LIKE '%fb.%' OR ref_lower LIKE '%fbcdn.%' THEN
    RETURN 'facebook';
  END IF;
  
  IF ref_lower LIKE '%instagram.%' OR ref_lower LIKE '%ig.%' THEN
    RETURN 'instagram';
  END IF;
  
  -- WhatsApp
  IF ref_lower LIKE '%whatsapp.%' OR ref_lower LIKE '%wa.me%' THEN
    RETURN 'whatsapp';
  END IF;
  
  -- Twitter/X
  IF ref_lower LIKE '%twitter.%' OR ref_lower LIKE '%t.co%' OR ref_lower LIKE '%x.com%' THEN
    RETURN 'twitter';
  END IF;
  
  -- LinkedIn
  IF ref_lower LIKE '%linkedin.%' THEN
    RETURN 'linkedin';
  END IF;
  
  -- YouTube
  IF ref_lower LIKE '%youtube.%' OR ref_lower LIKE '%youtu.be%' THEN
    RETURN 'youtube';
  END IF;
  
  -- Bing
  IF ref_lower LIKE '%bing.%' THEN
    RETURN 'bing';
  END IF;
  
  -- Email (servicios comunes)
  IF ref_lower LIKE '%mail.google%' OR ref_lower LIKE '%outlook.%' OR ref_lower LIKE '%yahoo.%' THEN
    RETURN 'email';
  END IF;
  
  -- Mercado Libre (si aplica)
  IF ref_lower LIKE '%mercadolibre.%' OR ref_lower LIKE '%mercadopago.%' THEN
    RETURN 'mercadolibre';
  END IF;
  
  RETURN 'otro';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION categorizar_referrer(TEXT) IS 'Categoriza el referrer en grupos conocidos: google, facebook, instagram, whatsapp, etc.';

-- =====================================================
-- PARTE 4: Función para obtener estadísticas por fuente
-- =====================================================

CREATE OR REPLACE FUNCTION obtener_estadisticas_por_fuente(
  fecha_desde TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
  fecha_hasta TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
  fuente VARCHAR(50),
  total_visitas BIGINT,
  visitas_unicas BIGINT,
  porcentaje NUMERIC
) AS $$
DECLARE
  total_general BIGINT;
BEGIN
  -- Obtener total general
  SELECT COUNT(*) INTO total_general
  FROM visitas_web
  WHERE fecha_visita BETWEEN fecha_desde AND fecha_hasta;
  
  IF total_general = 0 THEN
    total_general := 1; -- Evitar división por cero
  END IF;
  
  RETURN QUERY
  SELECT 
    COALESCE(v.fuente_categorizada, categorizar_referrer(v.referrer)) as fuente,
    COUNT(*)::BIGINT as total_visitas,
    COUNT(DISTINCT v.session_id)::BIGINT as visitas_unicas,
    ROUND((COUNT(*)::NUMERIC / total_general) * 100, 2) as porcentaje
  FROM visitas_web v
  WHERE v.fecha_visita BETWEEN fecha_desde AND fecha_hasta
  GROUP BY COALESCE(v.fuente_categorizada, categorizar_referrer(v.referrer))
  ORDER BY total_visitas DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION obtener_estadisticas_por_fuente IS 'Obtiene estadísticas de visitas agrupadas por fuente de tráfico';

-- =====================================================
-- PARTE 5: Función para obtener estadísticas por UTM Campaign
-- =====================================================

CREATE OR REPLACE FUNCTION obtener_estadisticas_por_campana(
  fecha_desde TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
  fecha_hasta TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
  campana VARCHAR(200),
  fuente VARCHAR(100),
  medio VARCHAR(100),
  total_visitas BIGINT,
  visitas_unicas BIGINT,
  conversiones BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(v.utm_campaign, '(sin campaña)') as campana,
    COALESCE(v.utm_source, '(directo)') as fuente,
    COALESCE(v.utm_medium, '(ninguno)') as medio,
    COUNT(*)::BIGINT as total_visitas,
    COUNT(DISTINCT v.session_id)::BIGINT as visitas_unicas,
    (
      SELECT COUNT(*)::BIGINT 
      FROM eventos_conversion e 
      WHERE e.session_id = v.session_id 
        AND e.fecha_evento BETWEEN fecha_desde AND fecha_hasta
    ) as conversiones
  FROM visitas_web v
  WHERE v.fecha_visita BETWEEN fecha_desde AND fecha_hasta
    AND v.utm_campaign IS NOT NULL
  GROUP BY v.utm_campaign, v.utm_source, v.utm_medium
  ORDER BY total_visitas DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION obtener_estadisticas_por_campana IS 'Obtiene estadísticas de visitas agrupadas por campaña UTM';

-- =====================================================
-- PARTE 6: Función para obtener eventos de conversión
-- =====================================================

CREATE OR REPLACE FUNCTION obtener_estadisticas_conversiones(
  fecha_desde TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
  fecha_hasta TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
  tipo_evento VARCHAR(50),
  total_eventos BIGINT,
  sesiones_unicas BIGINT,
  porcentaje_conversion NUMERIC
) AS $$
DECLARE
  total_sesiones BIGINT;
BEGIN
  -- Obtener total de sesiones únicas en el período
  SELECT COUNT(DISTINCT session_id) INTO total_sesiones
  FROM visitas_web
  WHERE fecha_visita BETWEEN fecha_desde AND fecha_hasta;
  
  IF total_sesiones = 0 THEN
    total_sesiones := 1;
  END IF;
  
  RETURN QUERY
  SELECT 
    e.tipo_evento,
    COUNT(*)::BIGINT as total_eventos,
    COUNT(DISTINCT e.session_id)::BIGINT as sesiones_unicas,
    ROUND((COUNT(DISTINCT e.session_id)::NUMERIC / total_sesiones) * 100, 2) as porcentaje_conversion
  FROM eventos_conversion e
  WHERE e.fecha_evento BETWEEN fecha_desde AND fecha_hasta
  GROUP BY e.tipo_evento
  ORDER BY total_eventos DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION obtener_estadisticas_conversiones IS 'Obtiene estadísticas de eventos de conversión';

-- =====================================================
-- PARTE 7: Función para obtener conversiones por fuente
-- =====================================================

CREATE OR REPLACE FUNCTION obtener_conversiones_por_fuente(
  fecha_desde TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
  fecha_hasta TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
  fuente VARCHAR(50),
  total_visitas BIGINT,
  total_conversiones BIGINT,
  tasa_conversion NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH visitas_por_fuente AS (
    SELECT 
      COALESCE(v.fuente_categorizada, categorizar_referrer(v.referrer)) as fuente,
      v.session_id
    FROM visitas_web v
    WHERE v.fecha_visita BETWEEN fecha_desde AND fecha_hasta
  ),
  conversiones_por_sesion AS (
    SELECT DISTINCT e.session_id
    FROM eventos_conversion e
    WHERE e.fecha_evento BETWEEN fecha_desde AND fecha_hasta
  )
  SELECT 
    vpf.fuente,
    COUNT(DISTINCT vpf.session_id)::BIGINT as total_visitas,
    COUNT(DISTINCT cps.session_id)::BIGINT as total_conversiones,
    CASE 
      WHEN COUNT(DISTINCT vpf.session_id) > 0 
      THEN ROUND((COUNT(DISTINCT cps.session_id)::NUMERIC / COUNT(DISTINCT vpf.session_id)) * 100, 2)
      ELSE 0
    END as tasa_conversion
  FROM visitas_por_fuente vpf
  LEFT JOIN conversiones_por_sesion cps ON vpf.session_id = cps.session_id
  GROUP BY vpf.fuente
  ORDER BY total_conversiones DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION obtener_conversiones_por_fuente IS 'Obtiene tasa de conversión por fuente de tráfico';

-- =====================================================
-- PARTE 8: Políticas RLS para eventos_conversion
-- =====================================================

ALTER TABLE eventos_conversion ENABLE ROW LEVEL SECURITY;

-- Política de lectura para usuarios autenticados
DROP POLICY IF EXISTS "Authenticated users can read eventos" ON eventos_conversion;
CREATE POLICY "Authenticated users can read eventos"
ON eventos_conversion FOR SELECT
TO authenticated
USING (true);

-- Política de inserción pública (para tracking desde frontend)
DROP POLICY IF EXISTS "Public can insert eventos" ON eventos_conversion;
CREATE POLICY "Public can insert eventos"
ON eventos_conversion FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- =====================================================
-- PARTE 9: Actualizar visitas existentes con fuente categorizada
-- =====================================================

UPDATE visitas_web 
SET fuente_categorizada = categorizar_referrer(referrer)
WHERE fuente_categorizada IS NULL;

-- =====================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================
