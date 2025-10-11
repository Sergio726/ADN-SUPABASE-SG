-- ================================
-- 🌱 DATOS DE PRUEBA
-- Proyecto: Alambres del Norte SRL
-- ================================

-- PROVEEDORES DE EJEMPLO
insert into proveedores (nombre, contacto, telefono, email, direccion) values
  ('Alambrec SA', 'Juan Pérez', '11-1234-5678', 'ventas@alambrec.com', 'Av. Industrial 123, CABA'),
  ('Cercos del Sur', 'María González', '11-8765-4321', 'info@cercosdelsur.com', 'Ruta 3 Km 45, Buenos Aires'),
  ('Hierros del Norte', 'Carlos Rodríguez', '351-234-5678', 'carlos@hierrosdelnorte.com', 'Córdoba Capital');

-- ARTICULOS DE EJEMPLO
insert into articulos (nombre, descripcion, categoria, unidad, stock_actual, stock_minimo, proveedor_id) values
  ('Alambre de Púas 2.5mm', 'Rollo de 500m de alambre de púas galvanizado', 'Alambres', 'rollo', 50, 10, 1),
  ('Poste de Cemento 2.5m', 'Poste de cemento armado para cerco perimetral', 'Postes', 'unidad', 120, 30, 2),
  ('Tejido Romboidal 2"', 'Rollo de 25m de tejido romboidal galvanizado', 'Tejidos', 'rollo', 35, 8, 1),
  ('Grampas Galvanizadas', 'Paquete de 100 unidades de grampas para alambre', 'Accesorios', 'paquete', 200, 50, 3),
  ('Alambre Liso 17/15', 'Rollo de 1000m de alambre liso galvanizado', 'Alambres', 'rollo', 80, 15, 1),
  ('Tensor para Alambre', 'Tensor metálico galvanizado para cercos', 'Accesorios', 'unidad', 150, 40, 3);

-- PRECIOS DE VENTA
insert into precios_venta (articulo_id, precio_costo, precio_venta, vigente) values
  (1, 25000, 35000, true),
  (2, 8500, 12000, true),
  (3, 18000, 25000, true),
  (4, 1500, 2200, true),
  (5, 30000, 42000, true),
  (6, 450, 650, true);

