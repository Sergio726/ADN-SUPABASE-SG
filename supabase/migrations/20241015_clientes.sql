-- =====================================================
-- Migración: Sistema de Clientes
-- Fecha: 2024-10-15
-- Descripción: Tabla para gestionar clientes y sus datos fiscales
-- =====================================================

-- =====================================================
-- Tabla: clientes
-- =====================================================
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificación fiscal
  tipo_documento VARCHAR(20) NOT NULL CHECK (tipo_documento IN ('DNI', 'CUIL', 'CUIT')),
  numero_documento VARCHAR(20) NOT NULL,
  
  -- Datos personales/empresa
  nombre_completo VARCHAR(200) NOT NULL,
  razon_social VARCHAR(200), -- Para CUIT (empresas)
  
  -- Contacto
  email VARCHAR(200),
  telefono VARCHAR(50),
  telefono_alternativo VARCHAR(50),
  
  -- Dirección
  direccion TEXT,
  ciudad VARCHAR(100),
  provincia VARCHAR(100),
  codigo_postal VARCHAR(10),
  
  -- Información adicional
  notas TEXT,
  
  -- Categoría de cliente
  categoria VARCHAR(50) CHECK (categoria IN ('Particular', 'Empresa', 'Gobierno', 'Revendedor')),
  
  -- Control
  activo BOOLEAN DEFAULT true,
  usuario_id UUID REFERENCES auth.users(id),
  creado_en TIMESTAMP DEFAULT NOW(),
  actualizado_en TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE UNIQUE INDEX idx_clientes_documento ON clientes(tipo_documento, numero_documento);
CREATE INDEX idx_clientes_nombre ON clientes(nombre_completo);
CREATE INDEX idx_clientes_email ON clientes(email);
CREATE INDEX idx_clientes_activo ON clientes(activo);
CREATE INDEX idx_clientes_categoria ON clientes(categoria);

-- Trigger para actualizar timestamp
CREATE OR REPLACE FUNCTION update_clientes_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_clientes_timestamp ON clientes;
CREATE TRIGGER trg_update_clientes_timestamp
BEFORE UPDATE ON clientes
FOR EACH ROW
EXECUTE FUNCTION update_clientes_timestamp();

-- Comentarios
COMMENT ON TABLE clientes IS 'Clientes con datos fiscales y de contacto';
COMMENT ON COLUMN clientes.tipo_documento IS 'DNI (particular), CUIL (monotributista), CUIT (empresa)';
COMMENT ON COLUMN clientes.numero_documento IS 'Número sin guiones ni espacios';

-- =====================================================
-- RLS Policies
-- =====================================================

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Usuarios autenticados pueden ver todos los clientes
CREATE POLICY "Usuarios autenticados pueden ver clientes"
ON clientes
FOR SELECT
TO authenticated
USING (true);

-- Usuarios autenticados pueden insertar clientes
CREATE POLICY "Usuarios autenticados pueden crear clientes"
ON clientes
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Usuarios pueden actualizar clientes
CREATE POLICY "Usuarios autenticados pueden actualizar clientes"
ON clientes
FOR UPDATE
TO authenticated
USING (true);

-- Solo admins pueden eliminar
CREATE POLICY "Solo admins pueden eliminar clientes"
ON clientes
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
-- Actualizar tabla presupuestos
-- =====================================================

-- Agregar referencia a cliente
ALTER TABLE presupuestos 
ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES clientes(id);

-- Índice para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_presupuestos_cliente ON presupuestos(cliente_id);

-- Comentario
COMMENT ON COLUMN presupuestos.cliente_id IS 'Referencia al cliente (nuevo sistema)';

-- =====================================================
-- Vista: Clientes con estadísticas
-- =====================================================
CREATE OR REPLACE VIEW v_clientes_con_stats AS
SELECT 
  c.*,
  COUNT(DISTINCT p.id) as total_presupuestos,
  COALESCE(SUM(p.total), 0) as monto_total_presupuestado,
  MAX(p.fecha_emision) as ultimo_presupuesto
FROM clientes c
LEFT JOIN presupuestos p ON p.cliente_id = c.id
GROUP BY c.id;

COMMENT ON VIEW v_clientes_con_stats IS 'Clientes con estadísticas de presupuestos';

-- =====================================================
-- Función: Buscar cliente por documento
-- =====================================================
CREATE OR REPLACE FUNCTION buscar_cliente_por_documento(
  p_numero_documento VARCHAR
)
RETURNS TABLE(
  id UUID,
  tipo_documento VARCHAR,
  numero_documento VARCHAR,
  nombre_completo VARCHAR,
  razon_social VARCHAR,
  email VARCHAR,
  telefono VARCHAR,
  direccion TEXT,
  ciudad VARCHAR,
  provincia VARCHAR,
  activo BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.tipo_documento,
    c.numero_documento,
    c.nombre_completo,
    c.razon_social,
    c.email,
    c.telefono,
    c.direccion,
    c.ciudad,
    c.provincia,
    c.activo
  FROM clientes c
  WHERE c.numero_documento = p_numero_documento
    AND c.activo = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION buscar_cliente_por_documento IS 'Busca un cliente por su número de documento';

-- =====================================================
-- Fin de la migración
-- =====================================================

