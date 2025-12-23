-- =====================================================
-- Migración: Sistema de Analytics de Visitantes Web
-- Fecha: 2025-02-06
-- Descripción: Tabla y funciones para trackear visitas a la página web
-- =====================================================

-- =====================================================
-- Tabla: visitas_web
-- =====================================================
CREATE TABLE IF NOT EXISTS visitas_web (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Información de la visita
  url TEXT NOT NULL,
  pathname TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  
  -- Información del visitante (hasheada para privacidad)
  ip_hash TEXT, -- IP hasheada con SHA256
  session_id TEXT, -- ID de sesión único
  
  -- Información del dispositivo
  dispositivo VARCHAR(20), -- 'mobile', 'desktop', 'tablet'
  navegador VARCHAR(50),
  sistema_operativo VARCHAR(50),
  
  -- Ubicación (opcional, desde IP)
  pais VARCHAR(2), -- Código ISO del país
  region VARCHAR(100),
  
  -- Metadatos
  duracion_segundos INTEGER DEFAULT 0,
  es_nueva_visita BOOLEAN DEFAULT true,
  es_retorno BOOLEAN DEFAULT false,
  
  -- Timestamps
  fecha_visita TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_visitas_web_fecha ON visitas_web(fecha_visita DESC);
CREATE INDEX IF NOT EXISTS idx_visitas_web_pathname ON visitas_web(pathname);
CREATE INDEX IF NOT EXISTS idx_visitas_web_session ON visitas_web(session_id);
CREATE INDEX IF NOT EXISTS idx_visitas_web_ip_hash ON visitas_web(ip_hash);

-- Comentarios
COMMENT ON TABLE visitas_web IS 'Registro de visitas a la página web pública';
COMMENT ON COLUMN visitas_web.ip_hash IS 'IP hasheada con SHA256 para privacidad';
COMMENT ON COLUMN visitas_web.session_id IS 'ID único de sesión del visitante';
COMMENT ON COLUMN visitas_web.duracion_segundos IS 'Tiempo que el visitante permaneció en la página';

-- =====================================================
-- Función: Obtener estadísticas de visitas
-- =====================================================
CREATE OR REPLACE FUNCTION obtener_estadisticas_visitas(
  fecha_desde TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
  fecha_hasta TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
  total_visitas BIGINT,
  visitas_unicas BIGINT,
  paginas_visitadas BIGINT,
  promedio_duracion NUMERIC,
  visitas_moviles BIGINT,
  visitas_desktop BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_visitas,
    COUNT(DISTINCT session_id)::BIGINT as visitas_unicas,
    COUNT(DISTINCT pathname)::BIGINT as paginas_visitadas,
    COALESCE(AVG(duracion_segundos), 0)::NUMERIC(10,2) as promedio_duracion,
    COUNT(*) FILTER (WHERE dispositivo = 'mobile')::BIGINT as visitas_moviles,
    COUNT(*) FILTER (WHERE dispositivo = 'desktop')::BIGINT as visitas_desktop
  FROM visitas_web
  WHERE fecha_visita BETWEEN fecha_desde AND fecha_hasta;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION obtener_estadisticas_visitas IS 'Obtiene estadísticas agregadas de visitas en un rango de fechas';

-- =====================================================
-- Función: Obtener páginas más visitadas
-- =====================================================
CREATE OR REPLACE FUNCTION obtener_paginas_mas_visitadas(
  fecha_desde TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
  fecha_hasta TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  limite INTEGER DEFAULT 10
)
RETURNS TABLE (
  pathname TEXT,
  total_visitas BIGINT,
  visitas_unicas BIGINT,
  promedio_duracion NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.pathname,
    COUNT(*)::BIGINT as total_visitas,
    COUNT(DISTINCT v.session_id)::BIGINT as visitas_unicas,
    COALESCE(AVG(v.duracion_segundos), 0)::NUMERIC(10,2) as promedio_duracion
  FROM visitas_web v
  WHERE v.fecha_visita BETWEEN fecha_desde AND fecha_hasta
  GROUP BY v.pathname
  ORDER BY total_visitas DESC
  LIMIT limite;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION obtener_paginas_mas_visitadas IS 'Obtiene las páginas más visitadas en un rango de fechas';

-- =====================================================
-- Función: Obtener visitas por día
-- =====================================================
CREATE OR REPLACE FUNCTION obtener_visitas_por_dia(
  fecha_desde TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
  fecha_hasta TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
  fecha DATE,
  total_visitas BIGINT,
  visitas_unicas BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(v.fecha_visita) as fecha,
    COUNT(*)::BIGINT as total_visitas,
    COUNT(DISTINCT v.session_id)::BIGINT as visitas_unicas
  FROM visitas_web v
  WHERE v.fecha_visita BETWEEN fecha_desde AND fecha_hasta
  GROUP BY DATE(v.fecha_visita)
  ORDER BY fecha DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION obtener_visitas_por_dia IS 'Obtiene visitas agrupadas por día';

-- =====================================================
-- Función: Obtener dispositivos y navegadores
-- =====================================================
CREATE OR REPLACE FUNCTION obtener_dispositivos_navegadores(
  fecha_desde TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
  fecha_hasta TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
  tipo VARCHAR,
  nombre VARCHAR,
  cantidad BIGINT,
  porcentaje NUMERIC
) AS $$
DECLARE
  total BIGINT;
BEGIN
  -- Obtener total de visitas
  SELECT COUNT(*) INTO total
  FROM visitas_web
  WHERE fecha_visita BETWEEN fecha_desde AND fecha_hasta;
  
  -- Dispositivos
  RETURN QUERY
  SELECT 
    'dispositivo'::VARCHAR as tipo,
    COALESCE(dispositivo, 'unknown')::VARCHAR as nombre,
    COUNT(*)::BIGINT as cantidad,
    ROUND((COUNT(*)::NUMERIC / NULLIF(total, 0) * 100), 2)::NUMERIC as porcentaje
  FROM visitas_web
  WHERE fecha_visita BETWEEN fecha_desde AND fecha_hasta
  GROUP BY dispositivo
  ORDER BY cantidad DESC;
  
  -- Navegadores
  RETURN QUERY
  SELECT 
    'navegador'::VARCHAR as tipo,
    COALESCE(navegador, 'unknown')::VARCHAR as nombre,
    COUNT(*)::BIGINT as cantidad,
    ROUND((COUNT(*)::NUMERIC / NULLIF(total, 0) * 100), 2)::NUMERIC as porcentaje
  FROM visitas_web
  WHERE fecha_visita BETWEEN fecha_desde AND fecha_hasta
  GROUP BY navegador
  ORDER BY cantidad DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION obtener_dispositivos_navegadores IS 'Obtiene distribución de dispositivos y navegadores';

-- =====================================================
-- Políticas RLS (Row Level Security)
-- =====================================================
ALTER TABLE visitas_web ENABLE ROW LEVEL SECURITY;

-- Permitir lectura a usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden leer visitas"
  ON visitas_web
  FOR SELECT
  TO authenticated
  USING (true);

-- Permitir inserción desde API (anon)
CREATE POLICY "API puede insertar visitas"
  ON visitas_web
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- =====================================================
-- Fin de la migración
-- =====================================================

