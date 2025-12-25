-- =====================================================
-- MIGRACIÓN COMPLETA: Sistema de Analytics de Visitantes Web
-- Fecha: 2025-01-XX
-- Descripción: Asegura que todas las funciones SQL y políticas RLS estén creadas
-- =====================================================
-- 
-- INSTRUCCIONES:
-- 1. Ve a Supabase Dashboard: https://supabase.com/dashboard/project/vgsnfshbirzucddwbdpt
-- 2. Click en "SQL Editor" en el menú lateral
-- 3. Click en "New query"
-- 4. Copia y pega TODO este contenido
-- 5. Click en "Run" (o presiona Ctrl+Enter)
-- =====================================================

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
-- Políticas RLS actualizadas
-- =====================================================
ALTER TABLE visitas_web ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen (para evitar conflictos)
DROP POLICY IF EXISTS "API puede insertar visitas" ON visitas_web;
DROP POLICY IF EXISTS "API puede actualizar visitas" ON visitas_web;
DROP POLICY IF EXISTS "Usuarios autenticados pueden leer visitas" ON visitas_web;

-- Crear política para permitir inserción desde usuarios anónimos
CREATE POLICY "API puede insertar visitas"
  ON visitas_web
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Crear política para permitir actualización desde usuarios anónimos
CREATE POLICY "API puede actualizar visitas"
  ON visitas_web
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Crear política para permitir lectura a usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden leer visitas"
  ON visitas_web
  FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- Fin de la migración
-- =====================================================

