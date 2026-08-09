# Pendientes

Qué falta, ordenado por quién depende de cada cosa.

**Cómo usar este archivo:** fuente de verdad de tareas (sin Issues). Quien cierra un
ítem lo tilda `[x]` en el mismo commit o PR; el documento **se tilda, no se reescribe**.
Roles y forma de trabajo: [`HANDOFF.md`](HANDOFF.md).

Roadmap / ideas (no checklist operativo): [`../app/files/IDEAS_MEJORA.md`](../app/files/IDEAS_MEJORA.md).

> **Estado en una línea:** producto en producción; dashboard `/dashboard/ventas` listo; **tejidos pasan a reventa (Marcelo Rojas) — pendiente de implementar**; falta rotar keys y pulir presupuestos.

---

## Bloquean — no dependen del equipo de código

- [ ] **Rotar keys de Supabase** — las keys viejas (anon + service role) estuvieron en git (`env.local.example`, `CONFIG.txt`). Aunque ya no están en el working tree, **siguen en el historial**. Rotar en el panel (Settings → API), actualizar `.env.local` y Vercel.
- [ ] **Confirmar si hay que importar postes** — hay plantilla + script (`app/files/INSTRUCCIONES_POSTES.md`, `scripts/importar-postes-excel.js`). Si el catálogo de postes ya está cargado en prod, tildar y no rehacer.
- [ ] **Google OAuth (si lo quieren usar)** — login hoy es Supabase Auth; OAuth es opcional y se configura en Google Cloud + Supabase Providers.
- [x] **Confirmar lista Marcelo Rojas** — los $ de la lista manuscrita ¿son **costo de compra** o **precio de venta al público**? Define márgenes. Detalle: [`TEJIDOS_REVENTA_MARCELO_ROJAS.md`](TEJIDOS_REVENTA_MARCELO_ROJAS.md). → **Costo de compra** (2026-08-08).
- [x] **Qué hacer con tejidos fabricados que Marcelo no vende** — cal.12, altura 1.00 m, etc.: ¿desactivar o dejar por si vuelve la fábrica? → **Quedan activos**, con badge “Fabricado” de aviso.
- [x] **Alta de proveedor Marcelo Rojas** — si no existe en `proveedores`, cargarlo (dato de negocio / quien administra el ERP). No existía: lo crea la migración `20260808_tejidos_reventa.sql`.

---

## Necesarios pero no bloquean

- [x] **Sacar secretos del árbol git** — `env.local.example` y `CONFIG.txt` ahora usan placeholders. Falta rotar keys (ítem de arriba) porque el historial de git todavía las tiene.
- [ ] **Alinear `DOCUMENTACION.md` y `README.md` con módulos reales** — faltan o están mal: tareas CRM, visitas, horarios, presupuesto general, incremento, migraciones archived vs vigentes. El HANDOFF ya apunta al estado real. Incluir tejidos reventa cuando se implemente.
- [ ] **Actualizar estados en `IDEAS_MEJORA.md`** — horarios y tareas CRM figuran `[Pendiente]` pero **ya hay UI + migraciones**. No reescribir el archivo: corregir esos encabezados cuando se pase por ahí.

---

## Trabajo del equipo

Prioridad alta / trabajo activo. Lo demás del roadmap no se copia acá hasta que se ponga en marcha.

### Analytics y comercial

- [x] **Completar dashboard de conversión de presupuestos** — `/dashboard/ventas`: tasa vs decididos y vs enviados, pipeline, por vendedor/tipo/forma de pago, tendencia 12 meses, filtros de período, export Excel/CSV.
- [x] **Dashboard de ventas / performance** — misma página: monto aprobado del período vs anterior, top clientes, productos más vendidos (ítems de aprobados). Fuera de alcance: margen, ciclo envío→aprobación, PDF.

### Tejidos — modo reventa (Marcelo Rojas)

Contexto y lista de precios: [`TEJIDOS_REVENTA_MARCELO_ROJAS.md`](TEJIDOS_REVENTA_MARCELO_ROJAS.md).  
**Opción elegida (diseño):** flag `origen` fabricado|reventa en `tejidos_configuraciones`; **no** pasar los rollos a artículos sueltos (el cercado usa `tejido_config_id`).

**Confirmado por negocio (2026-08-08):** la lista de Marcelo es **costo de compra** → venta = compra × (1 + `margen_efectivo`/100), 45% hoy.
Los tejidos que Marcelo no vende (cal.12 y altura 1.00 m) quedan **activos** como fabricados, con badge de aviso.
Código y migración listos en `supabase/migrations/20260808_tejidos_reventa.sql`: **falta aplicarla en el SQL Editor de Supabase.**

- [x] **Schema + trigger** — `origen` / `es_reventa`, `proveedor_id`, `precio_compra`; relajar `alambre_articulo_id` NOT NULL en reventa. Si reventa: `precio_costo` = compra; **saltar** `trigger_actualizar_precio_tejido_completo` y el recálculo desde `precios_venta` (hoy hardcode `articulo_id IN (7, 8)`). Si fabricado: comportamiento actual. Confirmar schema live en Supabase (migraciones de tejidos están en `archived/`).
- [x] **UI tejidos** (listado / nuevo / editar / detalle) — toggle reventa; cargar precio Marcelo; ocultar o bloquear kg, mano de obra y alambre; badge “Reventa”.
- [x] **Cargar las 16 SKUs cal.14 × 10 m** — rombo 3.5/3/2.5/2 × altura 2.00/1.80/1.50/1.20 con la lista de Marcelo (match contra configs existentes por calibre+altura+rombo+largo; no duplicar). Van por `UPDATE` en la migración: las 16 ya existían.
- [x] **Márgenes de venta** — según la confirmación de negocio: o bien venta = costo × márgenes actuales (efectivo/lista/tarjeta/echeq), o bien la lista Marcelo **es** el `precio_venta`. → Es costo de compra; se le aplica el margen vigente.
- [ ] **Cercado** — no cambiar fórmula de metros; sí recálculo de configs que apunten a esos tejidos (`lib/cercado-service.ts`, alta/edición cercado, wizard presupuesto) para que usen el nuevo `precio_venta`. **17 de 18 configs usan tejidos cal.14: recalcular después de aplicar la migración.**
- [x] **Presupuestos artículos** — ítems `tejido_config_id` / `v_tejidos_con_precios` tienen que mostrar el precio de reventa (no el de fábrica). Sin cambios de código: leen `precio_venta`, que ahora trae el valor de reventa.
- [x] **Export PDF/Excel de tejidos** — indicar origen reventa y no mostrar desglose de alambre+MO en esos SKUs.
- [x] **Vista `v_tejidos_con_precios`** — incluir origen / precio_compra si hace falta para combos de cercado y presupuestos.
- [ ] **Copy pública** — `app/page.tsx` y `StructuredData.tsx` dicen que fabrican rollos; alinear con reventa si el negocio lo confirma.
- [x] **No reusar `importar-tejidos.js`** — está desfasado (nombres `peso_kg` / `mano_obra`). Cargar las 16 SKUs por UI/migración ad-hoc.

### Asistente de IA para vendedores

Arquitectura, fases y límites: [`ASISTENTE_IA.md`](ASISTENTE_IA.md). Motor: **OpenRouter** (API compatible con OpenAI).
Requiere `OPENROUTER_API_KEY` en `.env.local` y en Vercel — **key de servidor, nunca con prefijo `NEXT_PUBLIC_`**.

- [x] **Fase 1 — Consultas por texto** — widget flotante en el dashboard; 6 herramientas de solo lectura (artículos con precio vigente, tejidos, configuraciones de cercado, cotización de cerco por metros, clientes, presupuestos). Respeta RLS: consulta con la sesión del vendedor.
- [x] **Fase 2 — Voz e imagen** — grabar audio en el navegador y mandarlo como `input_audio` (base64); adjuntar fotos de listas de precios o del terreno. El ruteo por modalidad ya está en `lib/ai/models.ts`. Incluye conversión a WAV 16 kHz (OpenRouter no acepta el webm que graba Chrome), corte automático a 90 s, redimensionado de imágenes y validación de adjuntos en el servidor.
- [ ] **Fase 3 — Acciones** — crear presupuestos en estado **borrador** desde la conversación, alta de clientes y tareas. Cada acción de escritura tiene que pedir confirmación explícita antes de ejecutarse.
- [ ] **Fase 4 — Contexto y memoria** — que sepa en qué pantalla está el vendedor, historial de conversaciones en Supabase y métricas de uso/costo de tokens.
- [ ] **Nombres duplicados en cercado** — hay dos configuraciones activas llamadas igual (“Cerco Olimpico 2.4 alto - Estandar”) con precios distintos ($49.410 vs $60.068 por metro). El asistente las muestra con precio para poder elegir, pero conviene renombrarlas o dar de baja la que no se use.

### Presupuestos (UX + performance)

- [ ] **Filtros y búsqueda** — implementado: estado, tipo, multi-filtro, buscar por número. Falta: cliente, rango de fechas/montos, forma de pago, vendedor; sync con URL.
- [ ] **Performance y validaciones del módulo** — paginación/virtualización, menos round-trips al descargar/ver, índices/vista `v_presupuestos_completos`, recargas duplicadas. Análisis detallado en `IDEAS_MEJORA.md` (sección “Mejoras de Optimización…”).
- [ ] **Cálculo automático de materiales de cercado (más inteligente)** — el wizard ya calcula proporcional a metros (base 180 m + recargo &lt;50 m). Falta el “pack” de accesorios/postes/púa/ganchos con reglas de negocio explícitas; no inventar factores.

### Visitas web (parcial)

- [ ] **Cerrar el gap de analytics web** — UTM, referrer, eventos de conversión y dashboard de fuentes **ya están**. Falta (si se prioriza): GeoIP, bounce/páginas por sesión, scoring de leads calientes, heatmaps horarios, export Excel con filtros.

### Exportes

- [ ] **Exportación unificada** — precios: Excel/PDF básico **hecho**. Stock: Excel/PDF básico **parcial**. Falta plantillas, programación por mail, más entidades (clientes, tejidos, etc.) si el negocio lo pide.

---

## Ya hecho y verificado — no rehacer

- [x] Web pública + dashboard protegido (middleware)
- [x] CRUD artículos (imágenes Storage, visibilidad, precios)
- [x] Tejidos romboidales + recálculo por precio de alambre
- [x] Configuraciones de cercado (base 180 m) + wizard de presupuesto
- [x] Presupuestos artículos / cercado / **general**, estados, duplicar, PDF
- [x] Incremento/recargo en presupuestos (`20260227_agregar_incremento_presupuestos.sql`)
- [x] Clientes + leads de contacto
- [x] Tareas CRM (tabla/vista + `/dashboard/tareas` + widget en home)
- [x] Horarios de atención (`/dashboard/configuracion/horarios` + `lib/horarios-service.ts`)
- [x] Visitas web + UTM + eventos de conversión (RLS `42501` **resuelto**: API con service role)
- [x] Export lista de precios (Excel/PDF básico)
- [x] Remitos desde presupuestos (hito en `app/files/IMPACTO.md`)
- [x] Recargo cercado terrenos &lt; 50 m (SQL / vista)
- [x] Placeholders en `env.local.example` y `CONFIG.txt` (sin keys en el working tree)
- [x] Dashboard `/dashboard/ventas` (conversión + performance; venta = presupuesto aprobado)

---

## Al publicar / al entregar

- [ ] **`npm run build` sin errores** antes de push (regla del equipo)
- [ ] Variables de entorno en Vercel alineadas (URL, anon, **service role solo server**, `NEXT_PUBLIC_SITE_URL` de prod)
- [ ] Bucket Storage `articulos-images` público si se suben fotos nuevas
- [ ] No subir `.env.local` ni keys en PRs
