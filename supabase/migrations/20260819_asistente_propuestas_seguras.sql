-- Propuestas de escritura del asistente: se muestran al vendedor y se consumen
-- una sola vez al confirmar. El token firmado se valida en la API; esta tabla
-- aporta expiración, idempotencia y una auditoría mínima.

CREATE TABLE IF NOT EXISTS asistente_propuestas (
  id UUID PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES auth.users(id),
  accion TEXT NOT NULL CHECK (accion IN ('crear_presupuesto_cercado', 'crear_cliente', 'crear_tarea')),
  datos JSONB NOT NULL,
  creada_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  vence_en TIMESTAMPTZ NOT NULL,
  consumida_en TIMESTAMPTZ NULL,
  CONSTRAINT asistente_propuestas_vencimiento_valido CHECK (vence_en > creada_en)
);

CREATE INDEX IF NOT EXISTS idx_asistente_propuestas_usuario_pendiente
  ON asistente_propuestas (usuario_id, vence_en)
  WHERE consumida_en IS NULL;

ALTER TABLE asistente_propuestas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios gestionan sus propuestas del asistente"
  ON asistente_propuestas
  FOR ALL
  TO authenticated
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);
