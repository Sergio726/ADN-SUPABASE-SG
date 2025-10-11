-- ================================
-- 🔹 ESTRUCTURA INICIAL DE BASE DE DATOS
-- Proyecto: Alambres del Norte SRL
-- ================================

-- USUARIOS (referencia al auth.users)
create table usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text,
  rol text check (rol in ('admin', 'vendedor', 'cliente')) default 'vendedor',
  creado_en timestamp default now()
);

-- PROVEEDORES
create table proveedores (
  id bigserial primary key,
  nombre text not null,
  contacto text,
  telefono text,
  email text,
  direccion text,
  creado_en timestamp default now()
);

-- ARTICULOS
create table articulos (
  id bigserial primary key,
  nombre text not null,
  descripcion text,
  categoria text,
  unidad text default 'unidad',
  stock_actual numeric default 0,
  stock_minimo numeric default 0,
  proveedor_id bigint references proveedores(id) on delete set null,
  usuario_id uuid references usuarios(id),
  creado_en timestamp default now()
);

-- PRECIOS DE VENTA
create table precios_venta (
  id bigserial primary key,
  articulo_id bigint references articulos(id) on delete cascade,
  precio_costo numeric not null,
  precio_venta numeric not null,
  margen numeric generated always as ((precio_venta - precio_costo) / precio_costo * 100) stored,
  vigente boolean default true,
  fecha_inicio date default current_date,
  fecha_fin date
);

-- LEADS (para capturar clientes desde la web)
create table leads (
  id bigserial primary key,
  nombre text not null,
  email text,
  telefono text,
  mensaje text,
  origen text default 'web',
  creado_en timestamp default now()
);

-- ================================
-- 🔒 POLÍTICAS DE SEGURIDAD (RLS)
-- ================================

alter table usuarios enable row level security;
alter table proveedores enable row level security;
alter table articulos enable row level security;
alter table precios_venta enable row level security;
alter table leads enable row level security;

-- POLICIES
create policy "usuarios pueden ver sus datos" on usuarios
for select using (auth.uid() = id);

create policy "lectura pública de artículos"
on articulos for select using (true);

create policy "solo admin puede modificar artículos"
on articulos for all using (
  exists(
    select 1 from usuarios 
    where id = auth.uid() and rol = 'admin'
  )
);

create policy "lectura pública de precios"
on precios_venta for select using (vigente = true);

create policy "solo admin puede modificar precios"
on precios_venta for all using (
  exists(
    select 1 from usuarios 
    where id = auth.uid() and rol = 'admin'
  )
);

create policy "cualquier usuario puede crear lead"
on leads for insert with check (true);

create policy "solo admin puede ver leads"
on leads for select using (
  exists(
    select 1 from usuarios 
    where id = auth.uid() and rol = 'admin'
  )
);

-- Políticas para proveedores
create policy "lectura pública de proveedores"
on proveedores for select using (true);

create policy "solo admin puede modificar proveedores"
on proveedores for all using (
  exists(
    select 1 from usuarios 
    where id = auth.uid() and rol = 'admin'
  )
);

