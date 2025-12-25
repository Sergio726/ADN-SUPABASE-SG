-- =====================================================
-- Migración: Agregar forma_pago a presupuestos
-- Fecha: 2025-01-30
-- Descripción: Agrega columna forma_pago para identificar el tipo de pago seleccionado
-- =====================================================

-- Agregar columna forma_pago a la tabla presupuestos
ALTER TABLE presupuestos
ADD COLUMN IF NOT EXISTS forma_pago VARCHAR(20);

-- Agregar comentario
COMMENT ON COLUMN presupuestos.forma_pago IS 'Forma de pago seleccionada: efectivo, lista, tarjeta, echeq45, echeq60, echeq90';

-- =====================================================
-- Fin de la migración
-- =====================================================

