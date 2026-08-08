# Tejidos romboidales — reventa (Marcelo Rojas)

Contexto de negocio y diseño propuesto. **No implementado todavía.** Checklist operativo: [`PENDIENTES.md`](PENDIENTES.md).

> **Estado:** ADN **no fabrica** rollos de tejido romboidal en este momento. Los **compra** al proveedor **Marcelo Rojas**. El sistema hoy asume fabricación: costo = `(kg alambre × precio alambre) + mano de obra`.

---

## Lista de precios (fuente: papel de Marcelo)

Transcripción de la lista manuscrita. Todos los ítems: **calibre 14**, **rollo 10 m**. Alturas 180/150/120 = cm → metros.

**A confirmar con el negocio:** ¿estos importes son **costo de compra** (lo que ADN le paga a Marcelo) o **precio de lista / reventa al público**?

| Rombo (malla) | Altura | Largo | Calibre | Precio lista Marcelo |
|---|---|---|---|---|
| 3 1/2" (3.5) | 2.00 m | 10 m | 14 | $ 58.000 |
| 3 1/2" (3.5) | 1.80 m | 10 m | 14 | $ 55.000 |
| 3 1/2" (3.5) | 1.50 m | 10 m | 14 | $ 45.000 |
| 3 1/2" (3.5) | 1.20 m | 10 m | 14 | $ 40.000 |
| 3" (3.0) | 2.00 m | 10 m | 14 | $ 65.000 |
| 3" (3.0) | 1.80 m | 10 m | 14 | $ 60.300 |
| 3" (3.0) | 1.50 m | 10 m | 14 | $ 52.800 |
| 3" (3.0) | 1.20 m | 10 m | 14 | $ 45.200 |
| 2 1/2" (2.5) | 2.00 m | 10 m | 14 | $ 72.600 |
| 2 1/2" (2.5) | 1.80 m | 10 m | 14 | $ 68.000 |
| 2 1/2" (2.5) | 1.50 m | 10 m | 14 | $ 58.000 |
| 2 1/2" (2.5) | 1.20 m | 10 m | 14 | $ 49.500 |
| 2" (2.0) | 2.00 m | 10 m | 14 | $ 87.000 |
| 2" (2.0) | 1.80 m | 10 m | 14 | $ 79.800 |
| 2" (2.0) | 1.50 m | 10 m | 14 | $ 69.000 |
| 2" (2.0) | 1.20 m | 10 m | 14 | $ 58.500 |

Lógica de la lista: malla más chica → más caro; más altura → más caro. Encaja 1:1 con el catálogo del sistema (`tamano_rombo` 2.0/2.5/3.0/3.5 × `altura` 1.20/1.50/1.80/2.00 × `calibre` 14 × `largo` 10).

Códigos actuales: `TR-{altura}-{rombo}-14` (ej. `TR-2.0-3.5-14`). Nomenclatura vieja: `RC14x3,5x2`. Match 1:1 con configs existentes; **no duplicar filas**.

**No vienen en la lista de Marcelo:** calibre 12, altura 1.00 m, ni otras combinaciones fabricadas. Decidir si se **desactivan** o se dejan por si vuelve la fábrica.

---

## Cómo infiere el sistema hoy

El tejido **no es un artículo**. Es `tejidos_configuraciones` (identidad: calibre + altura + rombo + largo). `precio_venta` alimenta cerco y presupuestos de artículos. `proveedor_id` hoy solo existe en `articulos`.

Columnas post-migración (no usar nombres viejos): `cantidad_alambre` (ex `peso_kg`), `costo_mano_obra` (ex `mano_obra`), `margen_efectivo`. `alambre_articulo_id` es **NOT NULL** hoy: en reventa hay que relajarlo.

Triggers que pisan precio:

1. `trigger_actualizar_precio_tejido_completo` — **BEFORE INSERT OR UPDATE** en tejidos: siempre recalcula costo/venta con alambre+MO.
2. Trigger en `precios_venta` — si `articulo_id IN (7, 8)` y vigente: recálcula tejidos de ese alambre. IDs hardcodeados: verificar en prod si siguen siendo 7/8.

Cerco (base 180 m): `rollos = ceil(180 / largo)` → 18 si largo=10; `costo_tejido = precio_venta × rollos`. Vista SQL histórica usa `× 18` fijo. Recargo &lt;50 m en editor (~×1.50).

Presupuestos: ítems de **artículos** guardan snapshot (`precio_unitario`); **no** se recálculan solos. Configs de **cercado** sí se recálculan al cambiar el tejido.

### Puntos de inferencia (no romper / hay que tocar)

| Zona | Archivos / objetos | Qué usa |
|---|---|---|
| BD + triggers | `tejidos_configuraciones`, `calcular_precios_tejido_desde_alambre`, triggers, `v_tejidos_con_precios` | Fórmula fábrica; pisan `precio_costo` / `precio_venta` |
| UI tejidos | `app/dashboard/tejidos/**` | Solo fórmula; copy “fabricados”; no hay input de precio compra/venta |
| Export | `lib/excel-generator.ts`, `lib/pdf-generator.ts` (`generarPDFListaTejidos`) | Lista de precios |
| Import | `scripts/importar-tejidos.js` | **Desfasado** (columnas viejas); no reutilizar tal cual |
| Cercado | `configuraciones_cercado.tejido_config_id`, `lib/cercado-service.ts`, nuevo/editar/[id] | `precio_venta` × rollos |
| Wizard cerco | `app/dashboard/presupuestos/nuevo/cercado` | Snapshot del $/m de la config; no guarda `tejido_config_id` en ítems |
| Presupuesto artículos | `presupuestos_items.tejido_config_id`, `nuevo/articulos`, `[id]` | `v_tejidos_con_precios` × factor forma de pago |
| Espejo artículo | `tejidos_configuraciones.articulo_id` | Opcional; la UI **no** lo crea |
| Copy pública | `app/page.tsx`, `components/StructuredData.tsx` | Siguen diciendo que **fabrican** rollos |

**Riesgo principal:** cargar a mano el precio de Marcelo en `precio_venta` **sin apagar los triggers**. Al guardar el tejido o al tocar alambre (si IDs 7/8), el sistema **vuelve a calcular como fábrica** y pisa la lista.

---

## Opciones

### A — Override manual del `precio_venta` (sin modelo nuevo)

Pros: rápido. Contras: el trigger lo destruye; la UI sigue pidiendo kg/MO/alambre; no queda rastro de proveedor ni de “esto es reventa”. **No recomendado.**

### B — Pasar los rollos a `articulos` y desacoplar tejidos

Pros: reventa ya existe en artículos + `precios_venta` + proveedores. Contras: el **cercado entero** está atado a `tejido_config_id` (rollos, wizard, recálculo, PDF). Habría que reescribir cerco o duplicar 16 SKUs en dos mundos. **Alto riesgo, no vale la pena.**

### C — Modo reventa **en la misma entidad tejidos** (recomendado)

Un flag `origen` = `fabricado` | `reventa` (o `es_reventa`) en `tejidos_configuraciones`:

- **Reventa:** `precio_costo` = precio de compra a Marcelo; `precio_venta` = costo × márgenes de siempre (o la lista Marcelo si esa lista **ya es** precio de venta — a confirmar). Triggers de alambre **no corren**. `alambre_articulo_id` nullable. UI muestra proveedor + precio compra; oculta/bloquea kg, MO, alambre.
- **Fabricado:** comportamiento actual, por si vuelven a producir (cal.12 u otras).
- Cercado, wizard y presupuestos **siguen leyendo `precio_venta` + `largo`**: no se toca la fórmula de metros ni el recargo &lt;50 m.
- Alta de proveedor **Marcelo Rojas** en `proveedores` + `proveedor_id` en el tejido (o en el artículo espejo).

Pros: un solo catálogo de rollos; cerco intacto; se puede volver a fabricar por SKU. Contras: hay que tocar trigger SQL + UI tejidos + recálculo al cambiar lista Marcelo (no al cambiar alambre).

### D — Solo proveedor + `precio_compra`, sin flag

Insuficiente: sin desactivar el trigger de fábrica, D es A con otro nombre.

---

## Decisión de diseño (propuesta)

**Ir por C.** No inventar un módulo paralelo. No convertir rollos en artículos sueltos para el cerco.

Márgenes (pendiente de confirmar con negocio):

- Si la lista Marcelo es **costo:** aplicar la política comercial vigente de tejidos (efectivo / lista / tarjeta / echeq) sobre ese costo.
- Si la lista Marcelo es **precio de venta al público:** cargar ese valor como `precio_venta` y derivar costo con un margen interno (o costo = venta si no quieren margen ADN).

Cercado: al actualizar precios de reventa, correr recálculo de configs que usen ese `tejido_config_id` (`lib/cercado-service.ts`), igual que hoy cuando cambia el tejido fabricado.

---

## Qué no hacer

- No cambiar fórmulas de metros de cercado ni recargo &lt;50 m.
- No pisear presupuestos ya emitidos (ítems históricos quedan con el precio de entonces).
- No borrar configs cal.12 sin confirmar; como máximo `activo = false`.
- No reutilizar `scripts/importar-tejidos.js` tal cual (columnas viejas).
- No “arreglar” de yapa el CHECK de altura 2.5/3.0 ni el hardcode `articulo_id IN (7, 8)` salvo que bloquee reventa.
- No dejar copy pública “fabricamos rollos” si el negocio ya no fabrica (legal/marketing).
