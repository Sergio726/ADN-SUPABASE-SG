-- =====================================================
-- Migración: Fix RLS para visitas web
-- Fecha: 2025-02-07
-- Descripción: Función segura para verificar visitas previas sin exponer datos
-- =====================================================

-- Función para verificar si existe una visita previa con un session_id
-- Esta función usa SECURITY DEFINER para poder leer las visitas sin necesidad
-- de permisos RLS para el usuario anónimo. Solo retorna un booleano, no datos sensibles.
CREATE OR REPLACE FUNCTION verificar_visita_previa(p_session_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM visitas_web 
    WHERE session_id = p_session_id
    ORDER BY fecha_visita DESC
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permitir a usuarios anónimos ejecutar esta función
GRANT EXECUTE ON FUNCTION verificar_visita_previa(TEXT) TO anon;

-- Comentario
COMMENT ON FUNCTION verificar_visita_previa IS 
  'Verifica si existe una visita previa con el session_id dado. Retorna true si existe, false si no. Usa SECURITY DEFINER para evitar problemas de RLS.';

