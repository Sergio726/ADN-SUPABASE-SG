-- Ajustar zona horaria para fecha_emision de presupuestos
-- Fecha: 2025-11-08

ALTER TABLE presupuestos
  ALTER COLUMN fecha_emision SET DEFAULT (timezone('America/Argentina/Buenos_Aires', now())::date);

COMMENT ON COLUMN presupuestos.fecha_emision IS 'Fecha de emisión del presupuesto (zona horaria America/Argentina/Buenos_Aires)';


