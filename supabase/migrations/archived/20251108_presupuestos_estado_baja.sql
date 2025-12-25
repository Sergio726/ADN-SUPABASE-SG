-- Permitir estado "baja" para los presupuestos
-- Fecha: 2025-11-08

ALTER TABLE presupuestos
  DROP CONSTRAINT IF EXISTS presupuestos_estado_check;

ALTER TABLE presupuestos
  ADD CONSTRAINT presupuestos_estado_check
  CHECK (
    estado = ANY (
      ARRAY[
        'borrador'::text,
        'enviado'::text,
        'aprobado'::text,
        'rechazado'::text,
        'vencido'::text,
        'baja'::text
      ]
    )
  );


