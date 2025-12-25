-- =====================================================
-- Migración: Actualizar nomenclatura de códigos de tejidos
-- Fecha: 2025-01-29
-- Descripción: Cambiar formato de RC{calibre}x{rombo}x{altura} 
--              a TR-{altura}-{rombo}-{calibre}
-- =====================================================

-- Función para convertir código antiguo a nuevo formato
CREATE OR REPLACE FUNCTION convertir_codigo_tejido(codigo_viejo TEXT)
RETURNS TEXT AS $$
DECLARE
  partes TEXT[];
  calibre TEXT;
  rombo TEXT;
  altura TEXT;
  codigo_nuevo TEXT;
BEGIN
  -- Extraer partes del código antiguo: RC14x3,5x2 o RC12x3x1,8
  -- Eliminar el prefijo "RC"
  codigo_viejo := REPLACE(codigo_viejo, 'RC', '');
  
  -- Dividir por 'x'
  partes := string_to_array(codigo_viejo, 'x');
  
  IF array_length(partes, 1) = 3 THEN
    -- Orden antiguo: calibre, rombo, altura
    calibre := partes[1];
    rombo := REPLACE(partes[2], ',', '.');  -- Convertir coma a punto
    altura := REPLACE(partes[3], ',', '.'); -- Convertir coma a punto
    
    -- Nuevo formato: TR-{altura}-{rombo}-{calibre}
    -- Normalizar a 1 decimal
    altura := ROUND(altura::NUMERIC, 1)::TEXT;
    rombo := ROUND(rombo::NUMERIC, 1)::TEXT;
    
    codigo_nuevo := 'TR-' || altura || '-' || rombo || '-' || calibre;
    
    RETURN codigo_nuevo;
  ELSE
    -- Si no se puede parsear, devolver el código original
    RETURN codigo_viejo;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Actualizar todos los códigos existentes
UPDATE tejidos_configuraciones
SET codigo = convertir_codigo_tejido(codigo)
WHERE codigo LIKE 'RC%x%x%'
  AND codigo NOT LIKE 'TR-%';

-- Ejemplos de conversión:
-- RC14x3,5x2     -> TR-2.0-3.5-14
-- RC14x3,5x1,8   -> TR-1.8-3.5-14
-- RC12x3x2       -> TR-2.0-3.0-12
-- RC12x2,5x1,5   -> TR-1.5-2.5-12

-- Verificar conversiones (comentario informativo)
COMMENT ON FUNCTION convertir_codigo_tejido IS 'Convierte códigos antiguos RC{calibre}x{rombo}x{altura} a nuevo formato TR-{altura}-{rombo}-{calibre}';

-- Limpiar función temporal (opcional, puedes dejarla si quieres usarla en el futuro)
-- DROP FUNCTION IF EXISTS convertir_codigo_tejido;

