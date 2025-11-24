# Ideas de Mejora y Roadmap

Este archivo contiene ideas y mejoras futuras para el sistema, organizadas por categorías y prioridad.

## Cómo usar este archivo
- **Fecha:** anota la fecha en que surgió la idea.
- **Categoría:** agrupa ideas relacionadas (Analytics, CRM, Integraciones, etc.).
- **Prioridad:** usa etiquetas como `[Alta]`, `[Media]`, `[Baja]` o `[Futuro]`.
- **Estado:** marca como `[Pendiente]`, `[En evaluación]`, `[En desarrollo]`, `[Completado]`.

---

## 📊 Analytics y Métricas

### Tasa de Conversión de Presupuestos
- **Fecha:** 2025-02-01
- **Prioridad:** [Alta]
- **Estado:** [En desarrollo - Parcial] ✅ Métricas básicas implementadas (2025-02-05)
- **Descripción:** 
  - Visualizar el nivel de conversión entre cantidad de presupuestos enviados y cantidad de presupuestos aceptados.
  - Dashboard con métricas: tasa de conversión, presupuestos por estado, tendencias temporales.
  - Gráficos y reportes para análisis de efectividad comercial.
- **Mejoras adicionales sugeridas (2025-02-04):**
  - Gráficos visuales simples (barras, líneas de tendencia) para mejor comprensión de métricas
  - Filtros por rango de fechas, vendedor, tipo de presupuesto
  - Comparativa mes actual vs mes anterior de forma visual
  - Exportación de datos del dashboard a Excel/PDF
- **Funcionalidades específicas:**
  - **Dashboard de conversión:** Panel principal con KPI de tasa de conversión global y por período.
  - **Análisis por vendedor:** Comparativa de tasas de conversión por vendedor para identificar mejores prácticas.
  - **Análisis por tipo de presupuesto:** Conversión de artículos vs cercado vs general.
  - **Análisis por forma de pago:** Ver qué formas de pago tienen mayor tasa de aceptación.
  - **Análisis temporal:** Gráficos de líneas mostrando evolución mensual/trimestral.
  - **Filtros avanzados:** Por rango de fechas, vendedor, tipo, cliente, monto.
  - **Exportación de reportes:** PDF y Excel para análisis externo.
- **Métricas a mostrar:**
  - ✅ Tasa de conversión del mes: `(Aprobados del mes / Total del mes) × 100` - **IMPLEMENTADO**
  - ✅ Suma de montos aprobados del mes - **IMPLEMENTADO**
  - ✅ Ordenamiento de presupuestos por estado - **IMPLEMENTADO**
  - Tasa de conversión global: `(Aprobados / Enviados) × 100`
  - Tasa de conversión por vendedor
  - Tiempo promedio desde envío hasta aprobación
  - Valor promedio de presupuestos aprobados vs rechazados
  - Tasa de conversión por tipo de presupuesto
  - Pipeline de ventas: distribución por estado (borrador, enviado, aprobado, rechazado, vencido)
- **Beneficios esperados:**
  - Identificar qué estrategias de presupuestación funcionan mejor
  - Mejorar la efectividad del equipo comercial
  - Optimizar tiempos de respuesta y seguimiento
  - Detectar oportunidades de mejora en el proceso

### Dashboard de Ventas y Performance
- **Fecha:** 2025-02-01
- **Prioridad:** [Alta]
- **Estado:** [Pendiente]
- **Descripción:**
  - Dashboard ejecutivo con métricas clave de negocio.
- **Funcionalidades:**
  - **Ventas del mes:** Total facturado, comparativa con mes anterior, proyección mensual.
  - **Top clientes:** Clientes que más compran, frecuencia de compra, valor promedio.
  - **Productos más vendidos:** Artículos y tejidos más cotizados y vendidos.
  - **Estacionalidad:** Identificar patrones de demanda por temporada.
  - **Margen de ganancia:** Análisis de rentabilidad por producto y por presupuesto.
  - **Tiempo de ciclo de venta:** Desde primer contacto hasta cierre.

### Reportes Personalizados
- **Fecha:** 2025-02-01
- **Prioridad:** [Media]
- **Estado:** [Pendiente]
- **Descripción:**
  - Sistema de reportes configurables por el usuario.
- **Funcionalidades:**
  - Constructor de reportes con drag & drop
  - Plantillas predefinidas (ventas mensuales, análisis de clientes, etc.)
  - Programación de reportes automáticos por email
  - Comparativas entre períodos
  - Análisis de tendencias y proyecciones

### Exportación de Datos y Listas
- **Fecha:** 2025-02-01
- **Prioridad:** [Alta]
- **Estado:** [Pendiente]
- **Descripción:**
  - Sistema unificado para exportar diferentes tipos de listas y datos del sistema.
- **Funcionalidades generales:**
  - **Múltiples formatos:**
    - Excel (.xlsx) con formato profesional
    - PDF con diseño para impresión
    - CSV para importación
    - JSON para integraciones
  - **Plantillas personalizables:**
    - Diseños predefinidos para cada tipo de lista
    - Personalización de encabezados y pies de página
    - Logo y branding de la empresa
    - Formato de moneda y fechas configurable
  - **Programación automática:**
    - Generación automática diaria/semanal/mensual
    - Envío automático por email a destinatarios configurados
    - Almacenamiento en cloud storage (opcional)
  - **Historial de exportaciones:**
    - Registro de todas las exportaciones realizadas
    - Descarga de versiones anteriores
    - Comparativa entre versiones
- **Tipos de listas exportables:**
  - Lista de precios (ver sección específica)
  - Lista de stock (ver sección específica)
  - Lista de clientes
  - Lista de presupuestos (ver sección específica)
  - Lista de productos/artículos
  - Lista de tejidos
  - Lista de vendedores
  - Lista de proveedores

### Exportación de Lista de Presupuestos
- **Fecha:** 2025-02-04
- **Prioridad:** [Media]
- **Estado:** [Pendiente]
- **Descripción:**
  - Sistema para exportar la lista completa de presupuestos desde el dashboard a Excel/CSV para análisis y reportes.
- **Funcionalidades específicas:**
  - **Formatos de exportación:**
    - Excel (.xlsx) con formato profesional
    - CSV para importación en otros sistemas
    - PDF con diseño para impresión (opcional)
  - **Columnas disponibles:**
    - Número de presupuesto
    - Fecha de emisión
    - Fecha de vencimiento
    - Cliente (nombre/razón social)
    - Tipo de presupuesto (artículos, cercado, general)
    - Estado actual (borrador, enviado, aprobado, rechazado, vencido)
    - Subtotal
    - Descuento
    - Total
    - Forma de pago
    - Vendedor (si aplica)
    - Observaciones
  - **Respetar filtros aplicados:**
    - Exportar solo los presupuestos que están visibles en el dashboard
    - Respetar búsquedas y filtros por estado, fecha, cliente, etc.
  - **Formato de Excel:**
    - Formato de moneda para columnas de montos
    - Formato de fecha para columnas de fechas
    - Encabezados con formato destacado
    - Filtros automáticos en Excel
    - Tabla formateada para fácil análisis
  - **Nombre de archivo:**
    - Con timestamp: `Presupuestos_2025-02-04_14-30.xlsx`
    - Incluir rango de fechas si hay filtros aplicados
- **Casos de uso:**
  - Análisis de presupuestos en Excel
  - Reportes gerenciales mensuales
  - Compartir listado de presupuestos con otros departamentos
  - Auditoría y seguimiento de presupuestos
  - Análisis de tendencias y patrones de ventas

---

## 🤝 CRM (Customer Relationship Management)

### Funcionalidades CRM Básicas
- **Fecha:** 2025-02-01
- **Prioridad:** [Media]
- **Estado:** [Pendiente]
- **Descripción:** 
  - Implementar funciones de CRM para gestión de relaciones con clientes.
  - Historial de interacciones, seguimiento de oportunidades, pipeline de ventas.
  - Recordatorios y tareas relacionadas con clientes.
- **Funcionalidades específicas:**
  - **Perfil 360 del cliente:**
    - Historial completo de presupuestos (enviados, aprobados, rechazados)
    - Historial de compras y entregas
    - Notas y observaciones del equipo
    - Documentos adjuntos (contratos, facturas, etc.)
    - Línea de tiempo de interacciones
  - **Pipeline de ventas:**
    - Etapas personalizables (Contacto inicial, Presupuesto enviado, Negociación, Aprobado, Cerrado)
    - Visualización tipo Kanban
    - Probabilidad de cierre por etapa
    - Valor estimado de cada oportunidad
  - **Seguimiento de oportunidades:**
    - Alertas de seguimiento (cuándo contactar nuevamente)
    - Recordatorios automáticos
    - Notas de cada interacción
    - Próximos pasos definidos
  - **Segmentación de clientes:**
    - Clientes activos, inactivos, potenciales
    - Scoring de clientes (valor, frecuencia, antigüedad)
    - Etiquetas y categorías personalizables
  - **Tareas y recordatorios:**
    - Tareas asignadas a vendedores
    - Recordatorios de seguimiento de presupuestos
    - Notificaciones de vencimientos
    - Calendario de actividades

### Automatización de Seguimiento
- **Fecha:** 2025-02-01
- **Prioridad:** [Media]
- **Estado:** [Pendiente]
- **Descripción:**
  - Automatizar el seguimiento de presupuestos y clientes.
- **Funcionalidades:**
  - Recordatorios automáticos para presupuestos sin respuesta después de X días
  - Seguimiento automático post-entrega para satisfacción del cliente
  - Alertas de clientes inactivos (sin compras en X meses)
  - Notificaciones de presupuestos próximos a vencer
  - Workflows personalizables según tipo de cliente

### Gestión de Leads y Prospectos
- **Fecha:** 2025-02-01
- **Prioridad:** [Baja]
- **Estado:** [Pendiente]
- **Descripción:**
  - Sistema para gestionar leads que aún no son clientes.
- **Funcionalidades:**
  - Formulario de captura de leads en el sitio web
  - Scoring de leads (calificación automática)
  - Asignación automática de leads a vendedores
  - Seguimiento de origen del lead (web, referido, publicidad, etc.)
  - Conversión de lead a cliente

---

## 🔗 Integraciones y Automatizaciones

### Integración con WhatsApp Business API
- **Fecha:** 2025-02-01
- **Prioridad:** [Media]
- **Estado:** [Pendiente]
- **Descripción:** 
  - Integración con WhatsApp para envío automático de presupuestos y comunicación con clientes.
- **Funcionalidades específicas:**
  - **Envío automático de presupuestos:**
    - Envío inmediato al crear/actualizar presupuesto
    - Formato optimizado para WhatsApp (texto + PDF adjunto)
    - Confirmación de lectura y entrega
  - **Notificaciones automáticas:**
    - Recordatorios de presupuestos pendientes
    - Notificaciones de cambios de estado
    - Alertas de vencimiento
    - Confirmación de entregas
  - **Chat integrado:**
    - Panel de conversaciones dentro del sistema
    - Historial de mensajes con cada cliente
    - Respuestas rápidas predefinidas
    - Plantillas de mensajes personalizables
  - **Respuestas automáticas (Chatbot básico):**
    - Respuestas a consultas frecuentes
    - Información de productos y precios
    - Estado de presupuestos
    - Horarios de atención
  - **Botones de acción rápida:**
    - "Ver presupuesto" (link directo)
    - "Aprobar presupuesto" (confirmación rápida)
    - "Solicitar modificación"
    - "Contactar vendedor"
- **Consideraciones técnicas:**
  - Usar WhatsApp Business API oficial o servicios como Twilio, MessageBird
  - Cumplir con políticas de privacidad y consentimiento
  - Manejar límites de rate limiting de WhatsApp
  - Implementar cola de mensajes para alto volumen

### Automatizaciones con n8n
- **Fecha:** 2025-02-01
- **Prioridad:** [Media]
- **Estado:** [Pendiente]
- **Descripción:** 
  - Integración con n8n para automatizar flujos de trabajo complejos.
- **Casos de uso específicos:**
  - **Flujo: Nuevo presupuesto creado**
    - Enviar email al cliente
    - Enviar WhatsApp con resumen
    - Crear tarea de seguimiento en CRM
    - Notificar al vendedor
  - **Flujo: Presupuesto aprobado**
    - Generar orden de compra automática
    - Notificar a logística/almacén
    - Actualizar inventario
    - Enviar confirmación al cliente
  - **Flujo: Cliente inactivo**
    - Detectar cliente sin compras en 3 meses
    - Enviar oferta especial personalizada
    - Crear tarea de seguimiento
  - **Flujo: Stock bajo**
    - Detectar artículos con stock bajo
    - Notificar a compras
    - Generar orden de compra sugerida
  - **Flujo: Sincronización con contabilidad**
    - Exportar presupuestos aprobados a sistema contable
    - Sincronizar clientes y productos
    - Actualizar estados de facturación
- **Integraciones potenciales:**
  - Google Sheets (exportación de datos)
  - Google Calendar (recordatorios)
  - Slack/Teams (notificaciones internas)
  - Email marketing (Mailchimp, SendGrid)
  - Sistemas de facturación electrónica
  - Plataformas de e-commerce (si aplica)

### Integración con Sistemas de Facturación
- **Fecha:** 2025-02-01
- **Prioridad:** [Media]
- **Estado:** [Pendiente]
- **Descripción:**
  - Integración con sistemas de facturación electrónica (AFIP, sistemas contables).
- **Funcionalidades:**
  - Generación automática de facturas desde presupuestos aprobados
  - Sincronización de clientes y productos
  - Actualización de estados de pago
  - Reportes fiscales y contables

### API Pública y Webhooks
- **Fecha:** 2025-02-01
- **Prioridad:** [Baja]
- **Estado:** [Pendiente]
- **Descripción:**
  - Exponer API para integraciones personalizadas.
- **Funcionalidades:**
  - REST API documentada
  - Webhooks para eventos (presupuesto creado, aprobado, etc.)
  - Autenticación por API keys
  - Rate limiting y seguridad

---

## 📱 Experiencia de Usuario y Frontend

### App Móvil (PWA o Nativa)
- **Fecha:** 2025-02-01
- **Prioridad:** [Baja]
- **Estado:** [Pendiente]
- **Descripción:**
  - Aplicación móvil para acceso desde celulares y tablets.
- **Funcionalidades:**
  - Acceso offline básico
  - Notificaciones push
  - Cámara para escanear códigos de productos
  - Firma digital en remitos
  - Geolocalización para entregas

### Mejoras de UX/UI
- **Fecha:** 2025-02-01
- **Prioridad:** [Media]
- **Estado:** [Pendiente]
- **Descripción:**
  - Mejoras continuas en la experiencia de usuario.
- **Ideas:**
  - Modo oscuro
  - Atajos de teclado avanzados
  - Búsqueda global mejorada
  - Drag & drop en listas
  - Vista previa mejorada de PDFs
  - Tutoriales interactivos para nuevos usuarios
  - Filtros y búsqueda avanzada en módulos principales (ver sección específica)

### Filtros y Búsqueda Avanzada en Presupuestos
- **Fecha:** 2025-02-04
- **Prioridad:** [Media]
- **Estado:** [En desarrollo - Parcial] ✅ Filtros básicos implementados (2025-02-05)
- **Descripción:**
  - Sistema de filtros y búsqueda mejorado para el módulo de presupuestos que permita encontrar rápidamente presupuestos específicos.
- **Funcionalidades específicas:**
  - **Filtros por:**
    - ✅ Estado (borrador, enviado, aprobado, rechazado, vencido) - **IMPLEMENTADO**
    - ✅ Tipo de presupuesto (artículos, cercado, general) - **IMPLEMENTADO**
    - ✅ Múltiples filtros simultáneos - **IMPLEMENTADO**
    - Cliente (búsqueda por nombre/razón social)
    - Rango de fechas (emisión o vencimiento)
    - Rango de montos (subtotal, total)
    - Forma de pago
    - Vendedor (si aplica)
  - **Búsqueda rápida:**
    - ✅ Buscar por número de presupuesto - **IMPLEMENTADO (búsqueda básica en tabla)**
    - Buscar por nombre/razón social del cliente
    - Buscar por observaciones/contenido del presupuesto
    - Búsqueda en tiempo real (as you type)
  - **Interfaz de usuario:**
    - ✅ Panel de filtros colapsable/expandible - **IMPLEMENTADO**
    - ✅ Indicador visual de filtros activos - **IMPLEMENTADO**
    - ✅ Botón de "Limpiar filtros" - **IMPLEMENTADO**
    - ✅ Contador de resultados filtrados - **IMPLEMENTADO**
    - Guardar filtros favoritos (opcional)
  - **URL params:**
    - Sincronizar filtros con URL para compartir vistas filtradas
    - Permalink para vistas específicas
- **Beneficios esperados:**
  - Reducción de tiempo en búsqueda de presupuestos
  - Mejor organización y navegación
  - Análisis más eficiente de datos
  - Mejor experiencia de usuario
- **Casos de uso:**
  - Encontrar todos los presupuestos aprobados del mes
  - Buscar presupuestos de un cliente específico
  - Filtrar presupuestos próximos a vencer
  - Analizar presupuestos por rango de montos
  - Ver historial completo de un cliente

---

## 🏭 Operaciones y Logística

### Cálculo Automático de Materiales para Cercados
- **Fecha:** 2025-02-01
- **Prioridad:** [Alta]
- **Estado:** [Pendiente]
- **Descripción:**
  - Sistema inteligente que calcula automáticamente la cantidad de accesorios, tejidos y materiales necesarios para cualquier tipo de cercado basándose en las dimensiones del terreno y características del cerco.
- **Funcionalidades específicas:**
  - **Cálculo automático de tejido romboidal:**
    - Basado en metros lineales del perímetro del terreno
    - Considerar altura del tejido seleccionado
    - Calcular rollos necesarios según largo del rollo (10m, 20m, etc.)
    - Considerar desperdicios y solapes (margen de seguridad configurable, ej: 5-10%)
    - Ajuste automático según tipo de terreno (rectangular, irregular, con curvas)
  - **Cálculo automático de postes:**
    - **Postes esquineros:** 
      - 4 postes para terreno rectangular estándar
      - Ajuste según número de esquinas del terreno
      - Considerar refuerzos en esquinas según altura del cerco
    - **Postes intermedios:**
      - Cálculo basado en separación estándar (ej: cada 2.5m o 3m)
      - Fórmula: `Cantidad = (Metros lineales / Separación) - Postes esquineros`
      - Ajuste según altura del cerco (mayor altura = menor separación)
    - **Postes de refuerzo:**
      - En portones y entradas principales
      - En tramos largos (>50m) cada X metros
      - En terrenos con pendiente pronunciada
    - **Puntales:**
      - Cálculo según altura del cerco y tipo de terreno
      - Mayor cantidad en terrenos con vientos fuertes
      - Considerar normativas locales si aplica
  - **Cálculo automático de púa:**
    - Basado en metros lineales del perímetro
    - Considerar número de hilos de púa configurado
    - Fórmula: `Metros de púa = Metros lineales × Número de hilos`
    - Ajuste por desperdicios en instalación
  - **Cálculo automático de accesorios:**
    - **Ganchos:**
      - Basado en separación estándar (ej: cada 50cm o 1m)
      - Fórmula: `Cantidad = (Metros lineales / Separación) × Factor de seguridad`
      - Considerar tipo de tejido (mayor cantidad para tejidos más pesados)
    - **Planchuelas:**
      - En uniones de postes y tejido
      - En esquinas y refuerzos
      - Cálculo: `Cantidad = (Postes totales × Factor) + (Esquinas × 2)`
    - **Torniquetes/Tensores:**
      - Para tensar el tejido en tramos largos
      - Cálculo: `Cantidad = (Metros lineales / Longitud de tramo) × Factor`
      - Mayor cantidad en terrenos irregulares
    - **Espárragos:**
      - Para fijación de postes
      - Cálculo: `Cantidad = Postes totales × Espárragos por poste (típicamente 4)`
      - Ajuste según tipo de suelo (mayor cantidad en suelos blandos)
    - **Alambre A/R (Alambre Recocido):**
      - Para atar tejido a postes
      - Cálculo: `Metros = (Metros lineales × Factor de atado) + Desperdicios`
      - Factor típico: 1.5x a 2x los metros lineales
    - **Clavos:**
      - Para fijación de accesorios
      - Cálculo basado en tipo y cantidad de accesorios
      - Estimación: `Kg = (Cantidad accesorios × Factor) / Clavos por kg`
    - **Alambre negro:**
      - Para refuerzos y ataduras adicionales
      - Cálculo complementario al alambre A/R
  - **Cálculo automático de materiales de construcción (cordón):**
    - **Arena:**
      - Basado en volumen de zanja para postes
      - Cálculo: `m³ = (Postes × Volumen zanja por poste) × Factor`
      - Considerar tipo de suelo (mayor volumen en suelos blandos)
    - **Ripio:**
      - Similar a arena, para base de postes
      - Ajuste según especificaciones técnicas
    - **Cemento:**
      - Para hormigón de postes
      - Cálculo: `Bolsas = (Postes × Volumen hormigón por poste) / Rendimiento por bolsa`
      - Considerar tipo de poste (mayor cantidad para postes más pesados)
  - **Parámetros configurables:**
    - Separación estándar entre postes (2m, 2.5m, 3m, etc.)
    - Factor de desperdicio por tipo de material (5%, 10%, 15%)
    - Separación de ganchos (50cm, 75cm, 1m)
    - Longitud de tramo para torniquetes
    - Volumen de zanja por poste
    - Rendimiento de materiales de construcción
  - **Ajustes según tipo de terreno:**
    - **Terreno rectangular estándar:**
      - Cálculos lineales simples
      - Postes esquineros = 4
    - **Terreno irregular:**
      - Factor de corrección para perímetro real
      - Mayor cantidad de postes intermedios
      - Más accesorios para adaptación
    - **Terreno con curvas:**
      - Postes adicionales en curvas
      - Ajuste de separación en tramos curvos
    - **Terreno con pendiente:**
      - Postes de refuerzo adicionales
      - Ajuste de materiales de construcción
  - **Ajustes según altura del cerco:**
    - Mayor altura = menor separación entre postes
    - Mayor cantidad de refuerzos
    - Más materiales de construcción (postes más profundos)
    - Mayor cantidad de accesorios de fijación
  - **Validaciones y alertas:**
    - Alertar si las cantidades calculadas parecen incorrectas
    - Sugerir ajustes manuales cuando sea necesario
    - Validar que todos los materiales estén disponibles en stock
    - Mostrar advertencias para terrenos muy grandes o muy pequeños
  - **Visualización de cálculo:**
    - Mostrar desglose detallado de cómo se calculó cada cantidad
    - Explicar fórmulas y factores aplicados
    - Permitir ajuste manual de cantidades calculadas
    - Guardar ajustes como "sobrescritura" para casos especiales
  - **Exportación de lista de materiales:**
    - Generar lista completa de materiales calculados
    - Incluir cantidades, unidades, y referencias
    - Formato para enviar a proveedores
    - Integración con sistema de compras
- **Beneficios esperados:**
  - Reducción de errores en cálculo de materiales
  - Ahorro de tiempo en presupuestación
  - Optimización de compras (evitar exceso o falta de materiales)
  - Mayor precisión en costos estimados
  - Estandarización de cálculos entre vendedores
  - Mejor planificación de proyectos
- **Casos de uso:**
  - Presupuesto rápido para terreno rectangular estándar
  - Presupuesto para terreno irregular con múltiples lados
  - Presupuesto para cerco de gran altura (mayor a 2.5m)
  - Presupuesto para terrenos con pendiente
  - Validación de presupuestos manuales existentes
  - Generación de órdenes de compra automáticas

### Gestión de Inventario Avanzada
- **Fecha:** 2025-02-01
- **Prioridad:** [Media]
- **Estado:** [Pendiente]
- **Descripción:**
  - Sistema completo de gestión de inventario.
- **Funcionalidades:**
  - Control de stock en tiempo real
  - Alertas de stock mínimo
  - Historial de movimientos
  - Ajustes de inventario
  - Múltiples almacenes/depósitos
  - Reservas de stock para presupuestos

### Exportación de Lista de Precios
- **Fecha:** 2025-02-01
- **Prioridad:** [Alta]
- **Estado:** [Completado - Básico] ✅ Exportación a Excel y PDF implementada (2025-02-05)
- **Descripción:**
  - Sistema para descargar listas de precios actualizadas en diferentes formatos.
- **Funcionalidades específicas:**
  - **Formatos de exportación:**
    - ✅ Excel (.xlsx) con formato profesional - **IMPLEMENTADO**
    - ✅ PDF con diseño para impresión - **IMPLEMENTADO**
    - CSV para importación en otros sistemas
    - JSON para integraciones técnicas
  - **Filtros y personalización:**
    - Filtrar por categoría de productos (artículos, tejidos, servicios)
    - Filtrar por estado (activos, inactivos, todos)
    - Filtrar por rango de precios
    - Incluir/excluir columnas específicas
    - Ordenar por código, nombre, precio, categoría
  - **Columnas disponibles:**
    - Código del producto
    - Nombre/Descripción
    - Categoría
    - Unidad de medida
    - Precio de costo
    - Precio de venta (efectivo/base)
    - Precio factura/lista (con IVA)
    - Precio tarjeta (con IVA)
    - Precios E-cheq (45, 60, 90 días)
    - Margen de ganancia (%)
    - Estado (activo/inactivo)
    - Última actualización
  - **Múltiples listas de precios:**
    - Lista general (todos los productos)
    - Lista para clientes (solo precios de venta, sin costos)
    - Lista para vendedores (con márgenes y costos)
    - Lista por forma de pago (solo precios relevantes)
  - **Personalización visual:**
    - Logo de la empresa en PDF
    - Encabezados personalizables
    - Formato de moneda configurable
    - Fecha de emisión y validez
    - Notas y condiciones comerciales
  - **Actualización automática:**
    - Generar lista actualizada al momento de descarga
    - Versión con timestamp (ej: "Lista_Precios_2025-02-01_14-30.xlsx")
    - Historial de versiones de listas generadas
  - **Distribución:**
    - Envío automático por email a clientes/vendedores
    - Compartir link de descarga temporal
    - Publicación automática en sitio web (si aplica)
- **Casos de uso:**
  - Envío de lista de precios a clientes por email
  - Impresión de catálogo de precios para ferias/eventos
  - Actualización de precios en sitio web
  - Análisis de precios en Excel
  - Comparativa de precios entre períodos

### Exportación de Lista de Stock
- **Fecha:** 2025-02-01
- **Prioridad:** [Alta]
- **Estado:** [En desarrollo - Parcial] ✅ Exportación básica a Excel y PDF implementada (2025-02-05)
- **Descripción:**
  - Sistema para descargar listas de stock con valores actuales y sugeridos.
- **Funcionalidades específicas:**
  - **Formatos de exportación:**
    - ✅ Excel (.xlsx) con formato profesional y fórmulas - **IMPLEMENTADO**
    - ✅ PDF con diseño para impresión - **IMPLEMENTADO**
    - ✅ Filtros: Todos los artículos / Solo stock bajo - **IMPLEMENTADO**
    - CSV para importación en otros sistemas
    - JSON para integraciones técnicas
  - **Valores actuales:**
    - Stock disponible actual
    - Stock reservado (para presupuestos pendientes)
    - Stock disponible real (disponible - reservado)
    - Stock mínimo configurado
    - Stock máximo configurado
    - Estado de stock (normal, bajo, crítico, sin stock)
    - Última actualización de stock
  - **Valores sugeridos:**
    - **Stock sugerido basado en ventas:**
      - Promedio de ventas mensuales
      - Stock sugerido = (Promedio mensual × 2) - Stock actual
      - Considerar estacionalidad
    - **Stock sugerido basado en tendencias:**
      - Análisis de tendencias de ventas
      - Proyección de demanda futura
      - Stock sugerido para próximos 30/60/90 días
    - **Stock sugerido basado en punto de reorden:**
      - Tiempo de reposición del proveedor
      - Stock sugerido = (Demanda promedio × Tiempo reposición) + Stock seguridad
    - **Alertas de reposición:**
      - Productos que requieren compra urgente
      - Productos próximos a stock mínimo
      - Productos con exceso de stock (oportunidad de liquidación)
  - **Filtros y personalización:**
    - Filtrar por categoría de productos
    - Filtrar por estado de stock (normal, bajo, crítico, sin stock)
    - Filtrar por ubicación/almacén (si aplica)
    - Filtrar por proveedor
    - Incluir/excluir columnas específicas
    - Ordenar por stock actual, stock sugerido, categoría, nombre
  - **Columnas disponibles:**
    - ✅ Nombre/Descripción - **IMPLEMENTADO**
    - ✅ Categoría - **IMPLEMENTADO**
    - ✅ Unidad de medida - **IMPLEMENTADO**
    - ✅ Stock actual - **IMPLEMENTADO**
    - ✅ Stock mínimo - **IMPLEMENTADO**
    - ✅ Estado de stock (BAJO/OK con indicadores visuales) - **IMPLEMENTADO**
    - ✅ Diferencia (Actual - Mínimo) en Excel - **IMPLEMENTADO**
    - Código del producto
    - Stock reservado
    - Stock disponible real
    - Stock máximo
    - Stock sugerido (cálculo automático)
    - Precio de costo
    - Valor de inventario (Stock × Precio costo)
    - Valor sugerido de compra (Stock sugerido × Precio costo)
    - Última venta
    - Última compra
    - Proveedor principal
  - **Análisis y recomendaciones:**
    - Productos con stock crítico (requieren compra inmediata)
    - Productos con exceso de stock (oportunidad de promoción)
    - Productos sin movimiento (candidatos a descuento)
    - Productos con alta rotación (priorizar reposición)
    - Valor total de inventario
    - Valor sugerido de inversión en reposición
  - **Reportes complementarios:**
    - Reporte de productos sin stock
    - Reporte de productos bajo stock mínimo
    - Reporte de productos con exceso de stock
    - Reporte de rotación de inventario
    - Análisis ABC de productos (80/20)
  - **Integración con compras:**
    - Generar orden de compra sugerida desde la lista
    - Exportar lista para enviar a proveedores
    - Comparar stock sugerido con órdenes de compra pendientes
  - **Actualización automática:**
    - Generar lista actualizada al momento de descarga
    - Versión con timestamp
    - Programar generación automática diaria/semanal
    - Envío automático por email a responsables de compras
- **Casos de uso:**
  - Planificación de compras a proveedores
  - Análisis de inventario para toma de decisiones
  - Reporte para gerencia sobre estado de stock
  - Optimización de capital de trabajo
  - Identificación de productos obsoletos o con exceso de stock
  - Control de rotación de inventario

### Gestión de Entregas y Logística
- **Fecha:** 2025-02-01
- **Prioridad:** [Baja]
- **Estado:** [Pendiente]
- **Descripción:**
  - Seguimiento de entregas y gestión logística.
- **Funcionalidades:**
  - Planificación de rutas de entrega
  - Asignación de vehículos y choferes
  - Tracking de entregas en tiempo real
  - Firmas digitales en remitos
  - Notificaciones al cliente sobre estado de entrega

### Órdenes de Compra y Proveedores
- **Fecha:** 2025-02-01
- **Prioridad:** [Baja]
- **Estado:** [Pendiente]
- **Descripción:**
  - Gestión de compras a proveedores.
- **Funcionalidades:**
  - Creación de órdenes de compra
  - Seguimiento de recepciones
  - Gestión de proveedores
  - Comparación de precios
  - Historial de compras

---

## 💰 Gestión Financiera y Contabilidad

### Registro y Control de Pagos Recibidos
- **Fecha:** 2025-02-01
- **Prioridad:** [Alta]
- **Estado:** [Pendiente]
- **Descripción:**
  - Sistema completo para registrar, controlar y analizar los pagos recibidos de clientes.
- **Funcionalidades específicas:**
  - **Registro de pagos:**
    - Registrar pagos parciales o totales de presupuestos aprobados
    - Múltiples métodos de pago (efectivo, transferencia, tarjeta, cheque, e-cheq)
    - Asociar pagos a presupuestos específicos
    - Fecha de pago, monto, método, referencia/comprobante
    - Adjuntar comprobantes (imágenes, PDFs)
    - Notas y observaciones por pago
  - **Control de cuentas por cobrar:**
    - Listado de presupuestos con saldo pendiente
    - Estado de cada presupuesto (pagado, parcial, pendiente, vencido)
    - Alertas de pagos vencidos o próximos a vencer
    - Historial completo de pagos por presupuesto
    - Seguimiento de pagos parciales y saldos pendientes
  - **Dashboard de pagos:**
    - Total de pagos recibidos (día, semana, mes, año)
    - Pagos pendientes vs recibidos
    - Distribución de pagos por método
    - Gráficos de flujo de caja
    - Comparativa con períodos anteriores
  - **Conciliación bancaria:**
    - Importar movimientos bancarios
    - Conciliar pagos con movimientos bancarios
    - Identificar pagos no registrados
    - Reportes de diferencias
  - **Reportes financieros:**
    - Estado de cuentas por cobrar
    - Reporte de pagos recibidos (por período, cliente, vendedor)
    - Análisis de morosidad
    - Proyección de cobranzas
    - Exportación a Excel/PDF

### Cálculo y Análisis de Ganancias
- **Fecha:** 2025-02-01
- **Prioridad:** [Alta]
- **Estado:** [Pendiente]
- **Descripción:**
  - Sistema para calcular y analizar las ganancias obtenidas en cada venta y en general.
- **Funcionalidades específicas:**
  - **Cálculo de ganancia por presupuesto:**
    - Ganancia = Precio de venta - Costo total
    - Desglose de costos (materia prima, mano de obra, transporte, etc.)
    - Margen de ganancia porcentual: `(Ganancia / Precio de venta) × 100`
    - Margen de ganancia sobre costo: `(Ganancia / Costo) × 100`
    - Cálculo automático basado en precios de costo registrados
  - **Análisis de rentabilidad:**
    - Ganancia total por período (día, semana, mes, año)
    - Ganancia promedio por presupuesto
    - Top presupuestos más rentables
    - Presupuestos con menor margen (identificar oportunidades de mejora)
    - Análisis de rentabilidad por tipo de presupuesto (artículos, cercado, general)
    - Análisis de rentabilidad por forma de pago
  - **Análisis de rentabilidad por producto:**
    - Ganancia generada por cada artículo/tejido vendido
    - Margen promedio por categoría de producto
    - Productos más rentables vs menos rentables
    - Análisis de mix de productos (qué productos generan más ganancia)
  - **Análisis de rentabilidad por cliente:**
    - Ganancia total generada por cada cliente
    - Margen promedio por cliente
    - Clientes más rentables
    - Frecuencia de compra vs rentabilidad
  - **Análisis de rentabilidad por vendedor:**
    - Ganancia total generada por cada vendedor
    - Margen promedio de presupuestos por vendedor
    - Comparativa de efectividad comercial
    - Comisiones calculadas automáticamente (si aplica)
  - **Dashboard de ganancias:**
    - Ganancia total del mes/trimestre/año
    - Comparativa con períodos anteriores
    - Proyección de ganancias basada en tendencias
    - Gráficos de evolución de ganancias
    - Distribución de ganancias por categoría
  - **Reportes de rentabilidad:**
    - Reporte de ganancias por período
    - Análisis de márgenes por producto/cliente/vendedor
    - Reporte de rentabilidad consolidado
    - Exportación a Excel para análisis externo
- **Métricas clave a mostrar:**
  - Ganancia bruta total
  - Margen de ganancia promedio
  - ROI (Return on Investment) por presupuesto
  - Tasa de conversión de presupuestos a ganancias
  - Días promedio de cobro
  - Rotación de inventario (si aplica)

### Gestión de Facturación
- **Fecha:** 2025-02-01
- **Prioridad:** [Media]
- **Estado:** [Pendiente]
- **Descripción:**
  - Integración entre pagos, facturación y contabilidad.
- **Funcionalidades:**
  - Generar facturas desde presupuestos aprobados
  - Asociar pagos a facturas específicas
  - Control de facturas pendientes de pago
  - Estados de facturación (pendiente, parcial, pagada, vencida)
  - Notas de crédito y débito
  - Historial de facturación por cliente

### Flujo de Caja (Cash Flow)
- **Fecha:** 2025-02-01
- **Prioridad:** [Media]
- **Estado:** [Pendiente]
- **Descripción:**
  - Visualización y proyección del flujo de caja.
- **Funcionalidades:**
  - Entradas de dinero (pagos recibidos)
  - Salidas de dinero (pagos a proveedores, gastos operativos)
  - Saldo disponible en tiempo real
  - Proyección de flujo de caja (basada en presupuestos aprobados pendientes de pago)
  - Alertas de flujo de caja negativo proyectado
  - Gráficos de flujo de caja mensual/anual

### Análisis de Costos y Gastos
- **Fecha:** 2025-02-01
- **Prioridad:** [Media]
- **Estado:** [Pendiente]
- **Descripción:**
  - Control y análisis de costos operativos y gastos.
- **Funcionalidades:**
  - Registro de gastos operativos (alquiler, servicios, salarios, etc.)
  - Categorización de gastos
  - Análisis de costos fijos vs variables
  - Punto de equilibrio
  - Análisis de costos por presupuesto (materia prima, mano de obra, transporte)
  - Comparativa de costos entre períodos

### Integración Contable
- **Fecha:** 2025-02-01
- **Prioridad:** [Media]
- **Estado:** [Pendiente]
- **Descripción:**
  - Exportación y sincronización con sistemas contables.
- **Funcionalidades:**
  - Exportar asientos contables (pagos, facturas, gastos)
  - Sincronización con sistemas contables (Tango, Bejerman, etc.)
  - Plan de cuentas configurable
  - Generación de reportes contables (Balance, Estado de Resultados)
  - Cumplimiento de normativas fiscales

---

## 🔐 Seguridad y Permisos

### Sistema de Roles y Permisos Avanzado
- **Fecha:** 2025-02-01
- **Prioridad:** [Media]
- **Estado:** [Pendiente]
- **Descripción:**
  - Control granular de acceso y permisos.
- **Funcionalidades:**
  - Roles personalizables (Admin, Vendedor, Logística, Contador, etc.)
  - Permisos por módulo y acción
  - Restricción de acceso a datos sensibles (precios de costo, márgenes)
  - Auditoría de acciones (log de quién hizo qué y cuándo)
  - Aprobaciones requeridas para acciones críticas

### Autenticación Mejorada
- **Fecha:** 2025-02-01
- **Prioridad:** [Baja]
- **Estado:** [Pendiente]
- **Descripción:**
  - Mejoras en seguridad de acceso.
- **Funcionalidades:**
  - Autenticación de dos factores (2FA)
  - SSO (Single Sign-On) si aplica
  - Sesiones concurrentes controladas
  - Políticas de contraseñas

---

## 📈 Escalabilidad y Performance

### Optimizaciones de Performance
- **Fecha:** 2025-02-01
- **Prioridad:** [Media]
- **Estado:** [Pendiente]
- **Descripción:**
  - Mejoras para manejar mayor volumen de datos.
- **Acciones:**
  - Caché de consultas frecuentes
  - Paginación optimizada
  - Lazy loading de componentes
  - Optimización de imágenes
  - CDN para assets estáticos
  - Indexación de base de datos

### Mantenimiento de Índices de Base de Datos
- **Fecha:** 2025-02-03
- **Prioridad:** [Alta]
- **Estado:** [Pendiente]
- **Descripción:**
  - Sistema de mantenimiento y monitoreo de índices de base de datos para optimizar el rendimiento de consultas y prevenir degradación del sistema.
- **Funcionalidades:**
  - **Análisis de índices existentes:**
    - Auditoría periódica de todos los índices en la base de datos
    - Identificación de índices no utilizados o redundantes
    - Detección de índices fragmentados o con alto porcentaje de bloat
    - Análisis de uso de índices mediante estadísticas de PostgreSQL
  - **Optimización automática:**
    - Scripts de mantenimiento para REINDEX periódico
    - VACUUM ANALYZE programado para mantener estadísticas actualizadas
    - Limpieza de índices huérfanos o sin uso
    - Reorganización de índices fragmentados
  - **Monitoreo y alertas:**
    - Dashboard de salud de índices (tamaño, fragmentación, uso)
    - Alertas cuando un índice supera umbrales de fragmentación
    - Métricas de rendimiento de consultas antes/después de optimización
    - Reportes de impacto de índices en tiempo de ejecución de queries
  - **Índices faltantes:**
    - Análisis de consultas lentas (slow queries)
    - Sugerencias automáticas de índices faltantes basadas en patrones de consulta
    - Implementación de índices compuestos para queries complejas
    - Índices parciales para filtros frecuentes
  - **Mantenimiento programado:**
    - Tareas cron para REINDEX en horarios de bajo tráfico
    - VACUUM FULL periódico para tablas con alta actividad de UPDATE/DELETE
    - Actualización de estadísticas de planificador (ANALYZE)
    - Limpieza de índices GIN/GiST para búsquedas de texto completo
- **Beneficios esperados:**
  - Reducción significativa en tiempos de respuesta de consultas
  - Prevención de degradación gradual del rendimiento
  - Optimización del uso de espacio en disco
  - Mejor planificación de queries por el optimizador de PostgreSQL
  - Identificación proactiva de problemas de performance
- **Implementación técnica:**
  - Scripts SQL para análisis de índices (usando `pg_stat_user_indexes`, `pg_indexes`)
  - Funciones PL/pgSQL para detección de índices problemáticos
  - Jobs programados con pg_cron o herramientas externas
  - Dashboard en el sistema para visualización de métricas
  - Logging de operaciones de mantenimiento para auditoría
- **Métricas a monitorear:**
  - Tamaño total de índices vs tamaño de tablas
  - Porcentaje de fragmentación por índice
  - Frecuencia de uso de cada índice (idx_scan)
  - Tiempo promedio de ejecución de queries críticas
  - Espacio desperdiciado por bloat en índices
  - Estadísticas de VACUUM y ANALYZE

### Backup y Recuperación
- **Fecha:** 2025-02-01
- **Prioridad:** [Alta]
- **Estado:** [Pendiente]
- **Descripción:**
  - Sistema robusto de respaldos.
- **Funcionalidades:**
  - Backups automáticos diarios
  - Retención configurable
  - Restauración rápida
  - Backup en múltiples ubicaciones
  - Pruebas periódicas de recuperación

---

## 🎯 Roadmap Sugerido

### Fase 1: Fundamentos (Q1 2025)
- ✅ Sistema de presupuestos funcional
- ✅ Generación de PDFs y remitos
- 🔄 Dashboard de conversión de presupuestos (Parcial: métricas básicas implementadas)
- 🔄 Sistema de roles y permisos básico
- ✅ Exportación de lista de precios (Básico: Excel y PDF implementados)
- 🔄 Exportación de lista de stock (Parcial: Excel y PDF básicos implementados, faltan funcionalidades avanzadas)
- 🔄 Filtros en presupuestos (Parcial: filtros básicos por estado y tipo implementados)
- 🔄 Cálculo automático de materiales para cercados

### Fase 2: CRM, Analytics y Finanzas (Q2 2025)
- 🔄 Funcionalidades CRM básicas
- 🔄 Dashboard de ventas y performance
- 🔄 Reportes personalizados
- 🔄 Automatización de seguimiento
- 🔄 Registro y control de pagos recibidos
- 🔄 Cálculo y análisis de ganancias
- 🔄 Dashboard de ganancias y rentabilidad

### Fase 3: Integraciones (Q3 2025)
- 🔄 Integración con WhatsApp
- 🔄 Automatizaciones con n8n
- 🔄 Integración con sistemas de facturación

### Fase 4: Escalabilidad (Q4 2025)
- 🔄 Gestión de inventario avanzada
- 🔄 Optimizaciones de performance
- 🔄 API pública y webhooks
- 🔄 App móvil (PWA)

---

## 📝 Notas Adicionales

- Las ideas se irán priorizando según las necesidades del negocio y la evolución de la empresa.
- Este roadmap es dinámico y se actualizará conforme el sistema y la empresa evolucionen.
- Las dependencias entre funcionalidades deben considerarse al planificar implementaciones.
- Es importante validar cada funcionalidad con usuarios reales antes de escalar.

---

## 💡 Ideas Futuras (Sin Categorizar)

*Agrega aquí nuevas ideas a medida que surjan...*

- Sistema de puntos/recompensas para clientes frecuentes
- Marketplace B2B para clientes mayoristas
- Integración con Google Maps para visualización de entregas
- Sistema de encuestas de satisfacción post-venta
- Chat en vivo en el sitio web
- Calculadora de presupuestos pública en el sitio web
- Sistema de cupones y descuentos promocionales
- Integración con redes sociales para publicaciones automáticas
- Sistema de referidos (clientes que traen nuevos clientes)
- Análisis predictivo con IA para predecir ventas

