-- =====================================================
-- Insertar precios de artículos desde Excel
-- =====================================================
-- Generado automáticamente desde Articulos.xlsx
-- Fecha: 2025-10-17

-- Desactivar todos los precios vigentes actuales
UPDATE precios_venta SET vigente = false WHERE vigente = true;

-- Insertar nuevos precios

-- Alambre Galvanizado Calibre 12
INSERT INTO precios_venta (articulo_id, precio_costo, precio_venta, vigente, fecha_inicio)
SELECT id, 2912, 4538.2937600000005, true, CURRENT_DATE
FROM articulos
WHERE nombre = 'Alambre Galvanizado Calibre 12'
LIMIT 1;

-- Alambre Galvanizado Calibre 13
INSERT INTO precios_venta (articulo_id, precio_costo, precio_venta, vigente, fecha_inicio)
SELECT id, 2912, 4538.2937600000005, true, CURRENT_DATE
FROM articulos
WHERE nombre = 'Alambre Galvanizado Calibre 13'
LIMIT 1;

-- Alambre Galvanizado Calibre 14
INSERT INTO precios_venta (articulo_id, precio_costo, precio_venta, vigente, fecha_inicio)
SELECT id, 3135.77, 4887.034829599999, true, CURRENT_DATE
FROM articulos
WHERE nombre = 'Alambre Galvanizado Calibre 14'
LIMIT 1;

-- Varilla roscada
INSERT INTO precios_venta (articulo_id, precio_costo, precio_venta, vigente, fecha_inicio)
SELECT id, 5785.123966942149, 9016, true, CURRENT_DATE
FROM articulos
WHERE nombre = 'Varilla roscada'
LIMIT 1;

-- Planchuela 7/8 x 3/16"
INSERT INTO precios_venta (articulo_id, precio_costo, precio_venta, vigente, fecha_inicio)
SELECT id, 9663.140495867769, 15059.811199999998, true, CURRENT_DATE
FROM articulos
WHERE nombre = 'Planchuela 7/8 x 3/16"'
LIMIT 1;

-- Planchuela 7/8 x 3/16" 2mt
INSERT INTO precios_venta (articulo_id, precio_costo, precio_venta, vigente, fecha_inicio)
SELECT id, 3221.046831955923, 5019.937066666667, true, CURRENT_DATE
FROM articulos
WHERE nombre = 'Planchuela 7/8 x 3/16" 2mt'
LIMIT 1;

-- Torniqueta Galvanizada Micro
INSERT INTO precios_venta (articulo_id, precio_costo, precio_venta, vigente, fecha_inicio)
SELECT id, 923.9669421487604, 1439.984, true, CURRENT_DATE
FROM articulos
WHERE nombre = 'Torniqueta Galvanizada Micro'
LIMIT 1;

-- Torniqueta Galvanizada Mini N 5
INSERT INTO precios_venta (articulo_id, precio_costo, precio_venta, vigente, fecha_inicio)
SELECT id, 1833.2231404958677, 2857.0415999999996, true, CURRENT_DATE
FROM articulos
WHERE nombre = 'Torniqueta Galvanizada Mini N 5'
LIMIT 1;

-- Torniqueta Galvanizada N 7
INSERT INTO precios_venta (articulo_id, precio_costo, precio_venta, vigente, fecha_inicio)
SELECT id, 2355.3719008264466, 3670.8000000000006, true, CURRENT_DATE
FROM articulos
WHERE nombre = 'Torniqueta Galvanizada N 7'
LIMIT 1;

-- Ganchos Galvanizados 3/8" x 10"
INSERT INTO precios_venta (articulo_id, precio_costo, precio_venta, vigente, fecha_inicio)
SELECT id, 766.1157024793389, 1193.976, true, CURRENT_DATE
FROM articulos
WHERE nombre = 'Ganchos Galvanizados 3/8" x 10"'
LIMIT 1;

-- Ganchos Galvanizados 3/8" x 8''''
INSERT INTO precios_venta (articulo_id, precio_costo, precio_venta, vigente, fecha_inicio)
SELECT id, 498.34710743801656, 776.6640000000001, true, CURRENT_DATE
FROM articulos
WHERE nombre = 'Ganchos Galvanizados 3/8" x 8'''''
LIMIT 1;

-- Ganchos Galvanizados 3/8" x 7''''
INSERT INTO precios_venta (articulo_id, precio_costo, precio_venta, vigente, fecha_inicio)
SELECT id, 517.3553719008264, 806.2879999999999, true, CURRENT_DATE
FROM articulos
WHERE nombre = 'Ganchos Galvanizados 3/8" x 7'''''
LIMIT 1;

-- Esparragos Galvanizados de 3/8" x 10"
INSERT INTO precios_venta (articulo_id, precio_costo, precio_venta, vigente, fecha_inicio)
SELECT id, 785.1239669421487, 1223.6, true, CURRENT_DATE
FROM articulos
WHERE nombre = 'Esparragos Galvanizados de 3/8" x 10"'
LIMIT 1;

-- Alambre de Púas x rollo de 100mts
INSERT INTO precios_venta (articulo_id, precio_costo, precio_venta, vigente, fecha_inicio)
SELECT id, 25867.76859504132, 40314.399999999994, true, CURRENT_DATE
FROM articulos
WHERE nombre = 'Alambre de Púas x rollo de 100mts'
LIMIT 1;

-- Alambre de Púas x rollo de 500mts
INSERT INTO precios_venta (articulo_id, precio_costo, precio_venta, vigente, fecha_inicio)
SELECT id, 97768.59504132232, 152370.4, true, CURRENT_DATE
FROM articulos
WHERE nombre = 'Alambre de Púas x rollo de 500mts'
LIMIT 1;

-- Alambre de Púas x mt
INSERT INTO precios_venta (articulo_id, precio_costo, precio_venta, vigente, fecha_inicio)
SELECT id, 258.6776859504132, 403.14399999999995, true, CURRENT_DATE
FROM articulos
WHERE nombre = 'Alambre de Púas x mt'
LIMIT 1;

-- Alambre Acindar A/R 17/15 x 1000mt
INSERT INTO precios_venta (articulo_id, precio_costo, precio_venta, vigente, fecha_inicio)
SELECT id, 146405.31404958677, 228169.75383999996, true, CURRENT_DATE
FROM articulos
WHERE nombre = 'Alambre Acindar A/R 17/15 x 1000mt'
LIMIT 1;

-- Alambre Acindar A/R 16/14 x 1000mt
INSERT INTO precios_venta (articulo_id, precio_costo, precio_venta, vigente, fecha_inicio)
SELECT id, 135600.826446281, 211331.176, true, CURRENT_DATE
FROM articulos
WHERE nombre = 'Alambre Acindar A/R 16/14 x 1000mt'
LIMIT 1;

-- Alambre Acindar A/R 17/15 x mt
INSERT INTO precios_venta (articulo_id, precio_costo, precio_venta, vigente, fecha_inicio)
SELECT id, 146.4053140495868, 228.16975384000003, true, CURRENT_DATE
FROM articulos
WHERE nombre = 'Alambre Acindar A/R 17/15 x mt'
LIMIT 1;

-- Alambre Acindar A/R 16/14 x mt
INSERT INTO precios_venta (articulo_id, precio_costo, precio_venta, vigente, fecha_inicio)
SELECT id, 135.600826446281, 211.33117599999997, true, CURRENT_DATE
FROM articulos
WHERE nombre = 'Alambre Acindar A/R 16/14 x mt'
LIMIT 1;

-- Alambre Negro 14
INSERT INTO precios_venta (articulo_id, precio_costo, precio_venta, vigente, fecha_inicio)
SELECT id, 2571.5537190082646, 4007.7150399999996, true, CURRENT_DATE
FROM articulos
WHERE nombre = 'Alambre Negro 14'
LIMIT 1;

-- Alambre Negro 16
INSERT INTO precios_venta (articulo_id, precio_costo, precio_venta, vigente, fecha_inicio)
SELECT id, 2637.4297520661157, 4110.38152, true, CURRENT_DATE
FROM articulos
WHERE nombre = 'Alambre Negro 16'
LIMIT 1;

-- Alambre Negro 8
INSERT INTO precios_venta (articulo_id, precio_costo, precio_venta, vigente, fecha_inicio)
SELECT id, 2538.099173553719, 3955.5768000000003, true, CURRENT_DATE
FROM articulos
WHERE nombre = 'Alambre Negro 8'
LIMIT 1;

-- Clavos punta paris 2 1/2"
INSERT INTO precios_venta (articulo_id, precio_costo, precio_venta, vigente, fecha_inicio)
SELECT id, 2829.305785123967, 4409.41648, true, CURRENT_DATE
FROM articulos
WHERE nombre = 'Clavos punta paris 2 1/2"'
LIMIT 1;

-- Arena
INSERT INTO precios_venta (articulo_id, precio_costo, precio_venta, vigente, fecha_inicio)
SELECT id, 17851.239669421488, 27820.8, true, CURRENT_DATE
FROM articulos
WHERE nombre = 'Arena'
LIMIT 1;

-- Ripio
INSERT INTO precios_venta (articulo_id, precio_costo, precio_venta, vigente, fecha_inicio)
SELECT id, 17851.239669421488, 27820.8, true, CURRENT_DATE
FROM articulos
WHERE nombre = 'Ripio'
LIMIT 1;

-- Cemento, bolsa 50 kg
INSERT INTO precios_venta (articulo_id, precio_costo, precio_venta, vigente, fecha_inicio)
SELECT id, 6752.06611570248, 10522.960000000001, true, CURRENT_DATE
FROM articulos
WHERE nombre = 'Cemento, bolsa 50 kg'
LIMIT 1;

-- Travillas Cebil 1.4mt x 12 un
INSERT INTO precios_venta (articulo_id, precio_costo, precio_venta, vigente, fecha_inicio)
SELECT id, 2113.6363636363635, 3294.0599999999995, true, CURRENT_DATE
FROM articulos
WHERE nombre = 'Travillas Cebil 1.4mt x 12 un'
LIMIT 1;

-- Mano de obra x mt s/cordon
INSERT INTO precios_venta (articulo_id, precio_costo, precio_venta, vigente, fecha_inicio)
SELECT id, 10743.801652892562, 16743.999999999996, true, CURRENT_DATE
FROM articulos
WHERE nombre = 'Mano de obra x mt s/cordon'
LIMIT 1;

-- Mano de obra x mt c/cordon
INSERT INTO precios_venta (articulo_id, precio_costo, precio_venta, vigente, fecha_inicio)
SELECT id, 16528.92561983471, 25759.999999999996, true, CURRENT_DATE
FROM articulos
WHERE nombre = 'Mano de obra x mt c/cordon'
LIMIT 1;

-- Transporte x mtl
INSERT INTO precios_venta (articulo_id, precio_costo, precio_venta, vigente, fecha_inicio)
SELECT id, 2684.206611570248, 4183.282319999999, true, CURRENT_DATE
FROM articulos
WHERE nombre = 'Transporte x mtl'
LIMIT 1;

-- Alambre galvanizado Calibre 20
INSERT INTO precios_venta (articulo_id, precio_costo, precio_venta, vigente, fecha_inicio)
SELECT id, 2090.909090909091, 3258.64, true, CURRENT_DATE
FROM articulos
WHERE nombre = 'Alambre galvanizado Calibre 20'
LIMIT 1;

-- Hierro liso 8 mm
INSERT INTO precios_venta (articulo_id, precio_costo, precio_venta, vigente, fecha_inicio)
SELECT id, 7437.190082644628, 11590.712, true, CURRENT_DATE
FROM articulos
WHERE nombre = 'Hierro liso 8 mm'
LIMIT 1;

-- Hierro Torsionado 8 mm
INSERT INTO precios_venta (articulo_id, precio_costo, precio_venta, vigente, fecha_inicio)
SELECT id, 8305.785123966942, 12944.4, true, CURRENT_DATE
FROM articulos
WHERE nombre = 'Hierro Torsionado 8 mm'
LIMIT 1;

-- Hierro Torsionado 6 mm
INSERT INTO precios_venta (articulo_id, precio_costo, precio_venta, vigente, fecha_inicio)
SELECT id, 5004.1322314049585, 7798.84, true, CURRENT_DATE
FROM articulos
WHERE nombre = 'Hierro Torsionado 6 mm'
LIMIT 1;

-- Hierro Torsionado10 mm
INSERT INTO precios_venta (articulo_id, precio_costo, precio_venta, vigente, fecha_inicio)
SELECT id, 13185.950413223141, 20550.039999999997, true, CURRENT_DATE
FROM articulos
WHERE nombre = 'Hierro Torsionado10 mm'
LIMIT 1;

-- Electrodo 2.5 mm
INSERT INTO precios_venta (articulo_id, precio_costo, precio_venta, vigente, fecha_inicio)
SELECT id, 15750.413223140496, 24546.703999999998, true, CURRENT_DATE
FROM articulos
WHERE nombre = 'Electrodo 2.5 mm'
LIMIT 1;

-- Disco corte amoladora chica 4 1.8"
INSERT INTO precios_venta (articulo_id, precio_costo, precio_venta, vigente, fecha_inicio)
SELECT id, 2372.727272727273, 3697.8480000000004, true, CURRENT_DATE
FROM articulos
WHERE nombre = 'Disco corte amoladora chica 4 1.8"'
LIMIT 1;

-- Barra de Hierro Ø 6 mm
INSERT INTO precios_venta (articulo_id, precio_costo, precio_venta, vigente, fecha_inicio)
SELECT id, 5004.1322314049585, 7798.84, true, CURRENT_DATE
FROM articulos
WHERE nombre = 'Barra de Hierro Ø 6 mm'
LIMIT 1;

-- Barra de Hierro Ø 10 mm
INSERT INTO precios_venta (articulo_id, precio_costo, precio_venta, vigente, fecha_inicio)
SELECT id, 13185.950413223141, 20550.039999999997, true, CURRENT_DATE
FROM articulos
WHERE nombre = 'Barra de Hierro Ø 10 mm'
LIMIT 1;

-- Barra de Hierro Ø 12 mm
INSERT INTO precios_venta (articulo_id, precio_costo, precio_venta, vigente, fecha_inicio)
SELECT id, 14521.438016528926, 22631.370719999995, true, CURRENT_DATE
FROM articulos
WHERE nombre = 'Barra de Hierro Ø 12 mm'
LIMIT 1;

-- Concertinas 30cm x 10 mt
INSERT INTO precios_venta (articulo_id, precio_costo, precio_venta, vigente, fecha_inicio)
SELECT id, 40955.95041322314, 63829.029599999994, true, CURRENT_DATE
FROM articulos
WHERE nombre = 'Concertinas 30cm x 10 mt'
LIMIT 1;

-- Verificar
SELECT 
  COUNT(*) as total_precios_creados
FROM precios_venta
WHERE vigente = true;

-- =====================================================
-- Fin del script
-- =====================================================
