-- =====================================================
-- Migración: Agregar columna incremento a presupuestos
-- Fecha: 2026-02-27
-- Descripción: Permite registrar un incremento/recargo adicional en presupuestos
-- =====================================================

ALTER TABLE presupuestos ADD COLUMN IF NOT EXISTS incremento DECIMAL(12,2) DEFAULT 0;

COMMENT ON COLUMN presupuestos.incremento IS 'Incremento o recargo adicional aplicado al presupuesto';
