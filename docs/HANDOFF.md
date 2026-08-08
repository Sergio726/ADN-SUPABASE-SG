# Handoff — Alambres del Norte (ADN ERP + Web)

Documento de relevo. Si acabás de entrar al repo, empezá acá.

> **Estado en una línea:** ERP + web pública en uso; dashboard `/dashboard/ventas` listo; **tejidos van a modo reventa (Marcelo Rojas, no implementado)**; backlog en `PENDIENTES.md`.

---

## Orden de lectura

1. **Este archivo** (`HANDOFF.md`)
2. [`../README.md`](../README.md) — cómo correr el proyecto
3. [`../DOCUMENTACION.md`](../DOCUMENTACION.md) — arquitectura, tablas y cálculos (parcialmente vieja: no lista todos los módulos actuales)
4. [`PENDIENTES.md`](PENDIENTES.md) — qué falta y de quién depende
5. [`TEJIDOS_REVENTA_MARCELO_ROJAS.md`](TEJIDOS_REVENTA_MARCELO_ROJAS.md) — si vas a tocar tejidos/cercado (reventa vs fábrica)
6. [`../app/files/IDEAS_MEJORA.md`](../app/files/IDEAS_MEJORA.md) — roadmap largo / ideas; **no** es la fuente de verdad de tareas activas

---

## Qué es este repo

Sistema de **Alambres del Norte SRL** (Salta): catálogo web + panel interno.

| Cara | Rutas | Para quién |
|---|---|---|
| Web pública | `/`, `/articulos/[id]`, `/contacto`, `/login` | Visitantes y login |
| Dashboard | `/dashboard/*` (middleware exige sesión) | Equipo interno |

Módulos que **hoy están en el sidebar** (más fieles que el README viejo):

- **Catálogo:** artículos, tejidos romboidales, configuraciones de cercado
- **Ventas:** dashboard `/dashboard/ventas`, presupuestos (artículos / cercado / general), clientes, tareas CRM, leads
- **Operaciones:** precios, proveedores
- **Admin:** configuraciones, horarios de atención, visitas web (analytics)

También hay: PDF/remitos, exportes, incremento en presupuestos, tracking UTM + conversiones.

Branding: rojo `#DC2626`. Contacto canónico en código: `lib/logos.ts` (`BRAND`).

---

## Roles

| Quién | Qué hace |
|---|---|
| **Equipo de producto/código** | Ítems internos en `PENDIENTES.md`; PRs; no inventar Issues para lo mismo |
| **Consultor / PM / dueño del negocio** | Decisiones de precio, copy, datos de cliente, rotación de keys en Supabase |
| **Terceros (Supabase / Vercel / DNS)** | Deploy, Auth providers, Storage, rotación de secretos |

---

## Forma de trabajo

No hay Issues ni board para estas tareas. La colaboración es el checklist + el código.

- **Fuente de verdad:** [`PENDIENTES.md`](PENDIENTES.md). Checkboxes `[ ]` / `[x]`.
- **Al cerrar algo:** tildar `[x]` en el mismo commit o PR. Se tilda; **no se reescribe**.
- **Ideas a largo plazo:** `app/files/IDEAS_MEJORA.md`. Si una idea pasa a trabajo activo, copiarla a `PENDIENTES.md` (no trabajar solo desde el roadmap).
- **Sin board:** no crear Issues para trackear lo que ya está en pendientes.

Comandos útiles:

```bash
npm install
npm run dev      # http://localhost:3000
npm run lint
npm run build    # obligatorio antes de push
npm start
```

Scripts puntuales (no son el flujo diario):

```bash
node scripts/crear-bucket-storage.js
node scripts/importar-tejidos.js
node scripts/importar-articulos-excel.js
node scripts/importar-postes-excel.js
```

Env local: copiar `env.local.example` → `.env.local`. Variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (solo servidor; nunca al cliente)
- `NEXT_PUBLIC_SITE_URL`

Migraciones: las vigentes están en `supabase/migrations/`; las históricas en `supabase/migrations/archived/`. El listado del README original **está desfasado** — no lo uses como orden de apply en un proyecto ya existente.

---

## Qué no hacer

1. **No commitear secretos.** `.env.local` está en `.gitignore`. `env.local.example` y `CONFIG.txt` van con placeholders; las keys salen del panel de Supabase. Rotar las que alguna vez estuvieron en git (ver `PENDIENTES.md`).
2. **No cambiar fórmulas de precio ni de cercado/tejido sin confirmación de negocio.** Reglas canónicas en código/SQL:
   - precio base efectivo ≈ costo × **1.56**
   - tejidos: `(peso_kg × precio_alambre) + mano_obra`
   - cercado base en **180 m** lineales; recargo ~**50%** si el terreno es **&lt; 50 m**
3. **No usar `ANON_KEY` en API routes del server** para inserts públicos. Las API de visitas usan `SERVICE_ROLE_KEY` a propósito (bug RLS `42501` ya resuelto).
4. **No reescribir `PENDIENTES.md` ni el roadmap entero** para “ordenarlo”: tildar, agregar, o mover ítems.
5. **No inventar Issues/GitHub** para el mismo trabajo del checklist.
6. **Antes de push:** `npm run build` y verificar que compile.

Zonas frágiles / pesadas si las tocás:

- `app/dashboard/cercado/editar/[id]/page.tsx` (~2800 líneas)
- `app/dashboard/presupuestos/[id]/page.tsx` y wizards de alta
- `lib/pdf-generator.ts`, `lib/cercado-service.ts`, triggers/vistas SQL de tejidos y cercado

---

## Trabajo abierto destacado

Ver [`PENDIENTES.md`](PENDIENTES.md): foco cerca — **tejidos en reventa (Marcelo Rojas)**, rotar keys de Supabase y UX/performance de presupuestos. Diseño: [`TEJIDOS_REVENTA_MARCELO_ROJAS.md`](TEJIDOS_REVENTA_MARCELO_ROJAS.md). Dashboard de ventas: `/dashboard/ventas`.
