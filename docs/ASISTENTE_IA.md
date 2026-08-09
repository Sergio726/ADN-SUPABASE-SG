# Asistente de IA para vendedores

Asistente interno del dashboard: consulta precios, cotiza cercos y busca clientes y presupuestos usando los datos que ya están en la app. Motor: **OpenRouter**.

> **Estado:** Fases 1 y 2 implementadas (consultas por texto, voz e imagen). Fases 3 y 4 pendientes.

---

## Cómo está armado

```
lib/ai/
  models.ts      → qué modelo se usa según la modalidad (texto / audio / imagen)
  openrouter.ts  → cliente HTTP contra OpenRouter (API compatible con OpenAI)
  tools.ts       → herramientas que el modelo puede ejecutar sobre los datos
  prompt.ts      → instrucciones del asistente y reglas del negocio
app/api/asistente/route.ts   → endpoint: corre el loop de tool calling
components/AsistenteWidget.tsx   → widget flotante del dashboard
components/RespuestaAsistente.tsx → render de markdown liviano (tablas incluidas)
```

**El flujo de una consulta:**

1. El vendedor escribe en el widget → `POST /api/asistente`.
2. El endpoint valida que haya sesión (el asistente es interno).
3. Se manda la conversación a OpenRouter junto con la lista de herramientas.
4. El modelo pide datos (`tool_calls`) → el servidor los busca en Supabase → se los devuelve.
5. Se repite hasta que el modelo contesta (máximo 5 vueltas).

### Dos decisiones que importan

- **La API key nunca sale del servidor.** `OPENROUTER_API_KEY` va sin prefijo `NEXT_PUBLIC_`. El browser habla con `/api/asistente`, nunca con OpenRouter.
- **Las consultas usan la sesión del vendedor**, no la service role. El asistente no puede ver nada que el usuario no pueda ver por su cuenta: las políticas RLS siguen valiendo.

---

## Configuración

En `.env.local` (y en Vercel):

```bash
OPENROUTER_API_KEY=sk-or-v1-...
```

Opcionalmente, para cambiar de modelo sin tocar código:

```bash
OPENROUTER_MODEL_TEXTO=google/gemini-2.5-flash
OPENROUTER_MODEL_AUDIO=google/gemini-2.5-flash
OPENROUTER_MODEL_IMAGEN=google/gemini-2.5-flash
```

**Por qué Gemini Flash por defecto:** acepta texto, imagen y audio en el mismo endpoint, soporta tool calling y es barato por consulta. Si el asistente se queda corto razonando cotizaciones complejas, se puede subir solo el de texto (por ejemplo a `anthropic/claude-sonnet-4.5`) sin tocar nada más.

**Audio en OpenRouter:** no hay endpoint de transcripción aparte. El audio se manda como parte del mensaje (`input_audio`, base64) a un modelo multimodal, que transcribe y responde en el mismo paso.

---

## Fase 1 — Consultas (implementada)

Solo lectura: el asistente **no escribe nada** en la base.

| Herramienta | Para qué |
|---|---|
| `buscar_articulos` | Precio vigente, stock y unidad de artículos del catálogo |
| `buscar_tejidos` | Rollos por calibre / altura / rombo, con precio por forma de pago y origen (fabricado o reventa) |
| `listar_configuraciones_cercado` | Qué tipos de cerco hay y a cuánto el metro |
| `cotizar_cercado` | Total para X metros, aplicando el recargo de terrenos < 50 m |
| `buscar_clientes` | Cliente por nombre, razón social o documento |
| `buscar_presupuestos` | Presupuestos por número, cliente o estado |

Las reglas de precio que aplica son las mismas del resto del sistema: base = efectivo, Factura/Lista = × 1,21, Tarjeta = × 1,30, E-cheq 90 = × 1,40, y recargo de cerco para terrenos de menos de 50 m.

---

## Fase 2 — Voz e imagen (implementada)

El vendedor está en la obra o en el mostrador: escribir es incómodo. Ahora puede dictar o mandar una foto.

**Voz.** Se graba con `MediaRecorder` y se manda como `input_audio` en base64. El modelo transcribe y responde en el mismo paso (OpenRouter no tiene endpoint de transcripción aparte).

> **Por qué hay conversión de audio:** Chrome graba en **webm/opus** y Safari en mp4, pero OpenRouter acepta wav, mp3, ogg, flac, m4a y aac — **webm no está en la lista**. Así que `lib/ai/grabacion.ts` decodifica lo grabado con `AudioContext` y lo reescribe como **WAV PCM16 mono a 16 kHz**. Además de ser compatible, pesa mucho menos: ~31 KB por segundo.

- La grabación se corta sola a los **90 segundos** (~2,8 MB), por debajo del tope de 3 MB por adjunto.
- Se muestra un contador mientras se graba y el micrófono se libera al cerrar el widget.

**Imágenes.** Se redimensionan a 1600 px de lado mayor y se pasan a JPEG (calidad 0,82) antes de subirlas: una foto de celular pesa varios MB y en esa resolución no aporta nada.

**Validación (`lib/ai/adjuntos.ts`).** Todo adjunto pasa por el servidor antes de llegar al modelo:

| Regla | Por qué |
|---|---|
| Las imágenes solo pueden ser `data:` URIs | Si se aceptaran URLs, el navegador podría hacer que el servidor salga a buscar direcciones internas (SSRF) |
| Solo formatos de audio soportados | webm o un formato raro haría fallar el pedido después de gastar el upload |
| Máximo 3 MB por adjunto y 4 adjuntos por mensaje | Tope de tamaño del request y control de costo |
| Los mensajes con rol `system` o `tool` que manda el cliente se descartan | El prompt y los resultados de herramientas los pone el servidor, no el browser |
| Los adjuntos de mensajes anteriores se reemplazan por una nota de texto | Reenviar la galería entera en cada pregunta multiplicaría el costo sin aportar: el modelo ya describió el adjunto en su respuesta previa |

**Reglas de negocio para fotos** (en el system prompt): si la foto es una lista de precios de un proveedor, esos precios **no son los del sistema** y no se mezclan ni se usan para cotizar; si es una foto de un terreno, sirve para estimar pero los metros se piden, no se deducen.

## Fase 3 — Acciones

Que además de responder, haga.

- Crear presupuestos en estado **borrador** a partir de la conversación, para que el vendedor revise y confirme. Nunca directo a "enviado".
- Alta rápida de clientes y de tareas de seguimiento.
- Cada herramienta que escriba tiene que devolver un resumen de lo que va a hacer y **pedir confirmación explícita** en la UI antes de ejecutarse.

## Fase 4 — Contexto y memoria

- Que el asistente sepa en qué pantalla está parado el vendedor (si está viendo un presupuesto, que pueda responder sobre ese).
- Historial de conversaciones por usuario, guardado en Supabase.
- Métricas de uso: qué se pregunta más, qué herramientas se usan, cuánto se gasta en tokens.

---

## Límites conocidos

- **No inventa precios, pero puede equivocarse interpretando la pregunta.** Toda cotización es informativa y así lo aclara: para que quede firme hay que cargar el presupuesto en la app.
- El historial vive en memoria del navegador: al recargar la página se pierde (se resuelve en la Fase 4).
- Se mandan hasta 20 mensajes de contexto por consulta; conversaciones muy largas pierden el principio.
- El tope de 5 vueltas de herramientas evita loops, pero una consulta muy compuesta puede quedarse sin cerrar. Conviene preguntar de a una cosa.
