-- =====================================================
-- Migración: Sistema de Suscriptores Newsletter (Simplificada)
-- Fecha: 2024-10-18
-- Descripción: Tabla básica para gestionar suscriptores
-- =====================================================

-- Crear tabla si no existe
CREATE TABLE IF NOT EXISTS suscriptores_newsletter (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Datos de contacto
  email VARCHAR(255) NOT NULL,
  telefono VARCHAR(50),
  
  -- Tipo de suscripción
  tipo_suscripcion VARCHAR(20) NOT NULL CHECK (tipo_suscripcion IN ('email', 'telefono')),
  
  -- Descuento aplicable
  descuento_porcentaje DECIMAL(5,2) DEFAULT 0.00,
  codigo_descuento VARCHAR(20),
  
  -- Estado
  activo BOOLEAN DEFAULT true,
  
  -- Metadatos
  origen VARCHAR(50) DEFAULT 'web',
  ip_address INET,
  user_agent TEXT,
  
  -- Auditoría
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE UNIQUE INDEX IF NOT EXISTS idx_suscriptores_email ON suscriptores_newsletter(email);
CREATE INDEX IF NOT EXISTS idx_suscriptores_activo ON suscriptores_newsletter(activo);

-- RLS
ALTER TABLE suscriptores_newsletter ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserción pública
DROP POLICY IF EXISTS "Permitir suscripciones públicas" ON suscriptores_newsletter;
CREATE POLICY "Permitir suscripciones públicas" ON suscriptores_newsletter
  FOR INSERT WITH CHECK (true);
