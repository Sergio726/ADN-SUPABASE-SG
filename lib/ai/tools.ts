/**
 * Herramientas que el asistente puede ejecutar contra los datos de la app.
 *
 * FASE 1: todas son de SOLO LECTURA. Ninguna escribe, borra ni modifica nada.
 * Las operaciones de escritura (crear presupuestos, clientes, tareas) llegan
 * en fases posteriores y van a necesitar confirmación explícita del vendedor.
 *
 * Cada herramienta consulta con el cliente de Supabase del usuario logueado,
 * así que respeta las políticas RLS: el asistente no ve nada que el vendedor
 * no pueda ver por su cuenta.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { DefinicionTool } from './openrouter'

/** Reglas de precio del negocio, iguales a las que usa el resto del sistema. */
export const MULTIPLICADORES = {
  efectivo: 1,
  facturaLista: 1.21,
  tarjeta: 1.3,
  echeq45: 1.21,
  echeq60: 1.3,
  echeq90: 1.4,
}

/**
 * Limpia el texto de búsqueda antes de meterlo en un filtro de PostgREST.
 * Las comas y los paréntesis son separadores del lenguaje de filtros: si
 * llegan crudos desde lo que escribió el modelo, rompen la consulta.
 */
function limpiarBusqueda(texto: unknown): string {
  return String(texto ?? '')
    .replace(/[,()%*\\]/g, ' ')
    .trim()
    .slice(0, 80)
}

/**
 * Parte la búsqueda en palabras. Los nombres del catálogo son largos
 * ("Poste de Hormigón con Ménsula 2,8 mt Esquinero Cuadrado"), así que buscar
 * la frase entera casi nunca encuentra nada: hay que exigir que aparezcan
 * todas las palabras, en cualquier orden.
 */
function palabrasDeBusqueda(texto: unknown): string[] {
  return limpiarBusqueda(texto)
    .split(/\s+/)
    .filter((p) => p.length >= 2)
    .slice(0, 6)
}

/**
 * Aplica un AND de palabras sobre un OR de columnas:
 * (col1 ~ palabra1 OR col2 ~ palabra1) AND (col1 ~ palabra2 OR col2 ~ palabra2)...
 */
function filtrarPorPalabras<T>(query: T, palabras: string[], columnas: string[]): T {
  let resultado: any = query
  for (const palabra of palabras) {
    resultado = resultado.or(columnas.map((col) => `${col}.ilike.%${palabra}%`).join(','))
  }
  return resultado
}

function preciosPorFormaDePago(precioBase: number) {
  return {
    efectivo: Math.round(precioBase * MULTIPLICADORES.efectivo * 100) / 100,
    factura_lista: Math.round(precioBase * MULTIPLICADORES.facturaLista * 100) / 100,
    tarjeta: Math.round(precioBase * MULTIPLICADORES.tarjeta * 100) / 100,
    echeq_90_dias: Math.round(precioBase * MULTIPLICADORES.echeq90 * 100) / 100,
  }
}

export const DEFINICIONES_TOOLS: DefinicionTool[] = [
  {
    type: 'function',
    function: {
      name: 'buscar_articulos',
      description:
        'Busca artículos del catálogo por nombre o categoría y devuelve su precio vigente, stock y unidad. Usar para consultas de precio de postes, alambres, accesorios, cemento, etc.',
      parameters: {
        type: 'object',
        properties: {
          busqueda: {
            type: 'string',
            description: 'Texto a buscar en el nombre o la categoría del artículo. Ej: "poste esquinero", "alambre púa".',
          },
          limite: { type: 'number', description: 'Cantidad máxima de resultados (por defecto 15).' },
        },
        required: ['busqueda'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'buscar_tejidos',
      description:
        'Busca configuraciones de tejido romboidal por calibre, altura o tamaño de rombo. Devuelve precio por rollo en cada forma de pago, precio por metro y si el rollo se fabrica o se compra a un proveedor (reventa).',
      parameters: {
        type: 'object',
        properties: {
          calibre: { type: 'number', description: 'Calibre del alambre: 12 o 14.' },
          altura: { type: 'number', description: 'Altura del rollo en metros: 1.0, 1.2, 1.5, 1.8 o 2.0.' },
          tamano_rombo: { type: 'number', description: 'Tamaño del rombo en pulgadas: 2.0, 2.5, 3.0 o 3.5.' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'listar_configuraciones_cercado',
      description:
        'Lista las configuraciones de cercado disponibles con su precio por metro lineal. Usar para saber qué tipos de cerco se ofrecen antes de cotizar.',
      parameters: {
        type: 'object',
        properties: {
          busqueda: {
            type: 'string',
            description: 'Filtro opcional por nombre. Ej: "olímpico", "eucalipto", "diamante".',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'cotizar_cercado',
      description:
        'Calcula el precio de un cerco para una cantidad de metros lineales, usando una configuración existente. Aplica el recargo por terreno chico cuando corresponde. NO guarda nada: solo devuelve el cálculo para que el vendedor lo informe.',
      parameters: {
        type: 'object',
        properties: {
          configuracion: {
            type: 'string',
            description: 'Nombre (o parte del nombre) de la configuración de cercado a usar.',
          },
          metros_lineales: { type: 'number', description: 'Metros lineales de cerco a cotizar.' },
          forma_pago: {
            type: 'string',
            enum: ['efectivo', 'factura_lista', 'tarjeta', 'echeq_90_dias'],
            description: 'Forma de pago para la que se quiere el precio. Por defecto efectivo.',
          },
        },
        required: ['configuracion', 'metros_lineales'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'buscar_clientes',
      description:
        'Busca clientes por nombre, razón social o número de documento (DNI/CUIL/CUIT). Devuelve datos de contacto.',
      parameters: {
        type: 'object',
        properties: {
          busqueda: { type: 'string', description: 'Nombre, razón social o documento del cliente.' },
        },
        required: ['busqueda'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'buscar_presupuestos',
      description:
        'Busca presupuestos por número, nombre de cliente o estado. Devuelve total, estado y fecha. Usar para responder "cómo viene el presupuesto de X" o "qué presupuestos están pendientes".',
      parameters: {
        type: 'object',
        properties: {
          busqueda: { type: 'string', description: 'Número de presupuesto o nombre del cliente.' },
          estado: {
            type: 'string',
            enum: ['borrador', 'enviado', 'aprobado', 'rechazado', 'vencido', 'baja'],
            description: 'Filtrar por estado del presupuesto. Una venta concretada es un presupuesto "aprobado".',
          },
          limite: { type: 'number', description: 'Cantidad máxima de resultados (por defecto 10).' },
        },
        required: [],
      },
    },
  },
]

type Ejecutor = (supabase: SupabaseClient, args: any) => Promise<any>

const ejecutores: Record<string, Ejecutor> = {
  async buscar_articulos(supabase, { busqueda, limite }) {
    const tope = Math.min(Number(limite) || 15, 30)
    const palabras = palabrasDeBusqueda(busqueda)

    if (!palabras.length) return { resultados: [], mensaje: 'Falta indicar qué artículo buscar.' }

    const { data: articulos, error } = await filtrarPorPalabras(
      supabase
        .from('articulos')
        .select('id, nombre, categoria, unidad, stock_actual, stock_minimo'),
      palabras,
      ['nombre', 'categoria']
    ).limit(tope)

    if (error) throw new Error(`No se pudieron buscar artículos: ${error.message}`)
    if (!articulos?.length) return { resultados: [], mensaje: 'No hay artículos que coincidan con la búsqueda.' }

    const { data: precios } = await supabase
      .from('precios_venta')
      .select('articulo_id, precio_venta, precio_costo')
      .in('articulo_id', articulos.map((a) => a.id))
      .eq('vigente', true)

    const precioPorArticulo = new Map((precios || []).map((p) => [p.articulo_id, p]))

    return {
      resultados: articulos.map((a) => {
        const precio = precioPorArticulo.get(a.id)
        const base = Number(precio?.precio_venta || 0)
        return {
          nombre: a.nombre,
          categoria: a.categoria,
          unidad: a.unidad,
          stock_actual: a.stock_actual,
          stock_bajo: a.stock_minimo != null && a.stock_actual != null && a.stock_actual <= a.stock_minimo,
          precio_vigente: base || null,
          precios: base ? preciosPorFormaDePago(base) : null,
        }
      }),
    }
  },

  async buscar_tejidos(supabase, { calibre, altura, tamano_rombo }) {
    let query = supabase
      .from('v_tejidos_con_precios')
      .select('codigo, nombre, calibre, altura, tamano_rombo, largo, precio_venta, origen, proveedor_nombre, activo')
      .eq('activo', true)

    if (calibre != null) query = query.eq('calibre', calibre)
    if (altura != null) query = query.eq('altura', altura)
    if (tamano_rombo != null) query = query.eq('tamano_rombo', tamano_rombo)

    const { data, error } = await query.order('calibre').order('altura').limit(40)

    if (error) throw new Error(`No se pudieron buscar tejidos: ${error.message}`)
    if (!data?.length) return { resultados: [], mensaje: 'No hay tejidos con esas características.' }

    return {
      resultados: data.map((t) => {
        const base = Number(t.precio_venta || 0)
        return {
          codigo: t.codigo,
          calibre: t.calibre,
          altura_m: t.altura,
          rombo_pulgadas: t.tamano_rombo,
          largo_rollo_m: t.largo,
          origen: t.origen === 'reventa' ? `reventa (${t.proveedor_nombre || 'proveedor'})` : 'fabricado',
          precio_rollo: preciosPorFormaDePago(base),
          precio_por_metro_efectivo: t.largo ? Math.round((base / Number(t.largo)) * 100) / 100 : null,
        }
      }),
    }
  },

  async listar_configuraciones_cercado(supabase, { busqueda }) {
    let query: any = supabase
      .from('configuraciones_cercado')
      .select('nombre, descripcion, altura_final_cerco, altura, tipo_poste, hilos_pua, cordon_tipo, precio_por_metro_lineal, precio_por_metro_menor_50m, actualizado_en')
      .eq('activo', true)

    const palabras = palabrasDeBusqueda(busqueda)
    if (palabras.length) query = filtrarPorPalabras(query, palabras, ['nombre', 'descripcion'])

    const { data, error } = await query.order('nombre').limit(30)

    if (error) throw new Error(`No se pudieron listar las configuraciones: ${error.message}`)
    if (!data?.length) return { resultados: [], mensaje: 'No hay configuraciones de cercado que coincidan.' }

    return {
      resultados: data.map((c: any) => ({
        nombre: c.nombre,
        altura_cerco_m: c.altura_final_cerco ?? c.altura,
        tipo_poste: c.tipo_poste,
        hilos_pua: c.hilos_pua,
        cordon: c.cordon_tipo,
        precio_por_metro_efectivo: c.precio_por_metro_lineal,
        precio_por_metro_terreno_menor_50m: c.precio_por_metro_menor_50m,
        precios_actualizados_el: c.actualizado_en?.slice(0, 10),
      })),
    }
  },

  async cotizar_cercado(supabase, { configuracion, metros_lineales, forma_pago }) {
    const metros = Number(metros_lineales)
    if (!Number.isFinite(metros) || metros <= 0) {
      throw new Error('Los metros lineales tienen que ser un número mayor a cero.')
    }

    const palabras = palabrasDeBusqueda(configuracion)
    if (!palabras.length) {
      return { error: 'Falta indicar qué configuración de cercado usar.' }
    }

    const { data, error } = await filtrarPorPalabras(
      supabase
        .from('configuraciones_cercado')
        .select('nombre, altura_final_cerco, altura, precio_por_metro_lineal, precio_por_metro_menor_50m, actualizado_en')
        .eq('activo', true),
      palabras,
      ['nombre']
    ).limit(5)

    if (error) throw new Error(`No se pudo buscar la configuración: ${error.message}`)
    if (!data?.length) {
      return { error: `No encontré ninguna configuración de cercado que coincida con "${configuracion}".` }
    }
    if (data.length > 1) {
      // Ojo: hay configuraciones distintas con el mismo nombre, así que las
      // opciones se muestran con precio y altura para poder diferenciarlas.
      return {
        ambiguo: true,
        mensaje:
          'Hay más de una configuración que coincide. Mostrale las opciones al vendedor con su precio por metro para que elija.',
        opciones: data.map((c) => ({
          nombre: c.nombre,
          altura_cerco_m: c.altura_final_cerco ?? c.altura,
          precio_por_metro_efectivo: c.precio_por_metro_lineal,
          precios_actualizados_el: c.actualizado_en?.slice(0, 10),
        })),
      }
    }

    if (!data[0].precio_por_metro_lineal) {
      return {
        error: `La configuración "${data[0].nombre}" no tiene precio por metro cargado. Hay que recalcularla desde /dashboard/cercado antes de cotizar.`,
      }
    }

    const config = data[0]

    // Se usa el mismo precio por metro que el wizard de presupuestos, para que
    // la cotización coincida con el presupuesto que se genere después.
    const precioMetroBase = Number(config.precio_por_metro_lineal) || 0

    const totalEfectivo = precioMetroBase * metros
    const precios = preciosPorFormaDePago(totalEfectivo)
    const clave = (forma_pago as keyof typeof precios) || 'efectivo'

    // Ojo: existe un precio por metro con recargo para terrenos chicos, pero el
    // wizard de presupuestos no lo aplica. Se informa aparte en vez de mezclarlo,
    // para no cotizar distinto de lo que después queda guardado.
    const terrenoChico = metros < 50
    const precioMetroConRecargo = Number(config.precio_por_metro_menor_50m) || 0

    return {
      configuracion: config.nombre,
      altura_cerco_m: config.altura_final_cerco ?? config.altura,
      metros_lineales: metros,
      precio_por_metro: Math.round(precioMetroBase * 100) / 100,
      total_por_forma_de_pago: precios,
      total_solicitado: { forma_pago: clave, total: precios[clave] ?? precios.efectivo },
      precios_actualizados_el: config.actualizado_en?.slice(0, 10),
      ...(terrenoChico && precioMetroConRecargo
        ? {
            aviso_terreno_menor_50m: {
              mensaje:
                'El terreno tiene menos de 50 m. El sistema guarda un precio por metro con recargo, pero el presupuesto se arma con el precio normal. Confirmá con administración cuál corresponde.',
              precio_por_metro_con_recargo: Math.round(precioMetroConRecargo * 100) / 100,
              total_efectivo_con_recargo: Math.round(precioMetroConRecargo * metros * 100) / 100,
            },
          }
        : {}),
      aclaracion:
        'Cálculo informativo basado en los precios vigentes de la configuración. No genera ningún presupuesto guardado.',
    }
  },

  async buscar_clientes(supabase, { busqueda }) {
    const palabras = palabrasDeBusqueda(busqueda)
    if (!palabras.length) return { resultados: [], mensaje: 'Falta indicar el nombre o documento del cliente.' }

    const { data, error } = await filtrarPorPalabras(
      supabase
        .from('clientes')
        .select('nombre_completo, razon_social, tipo_documento, numero_documento, email, telefono, ciudad, provincia, categoria')
        .eq('activo', true),
      palabras,
      ['nombre_completo', 'razon_social', 'numero_documento']
    ).limit(10)

    if (error) throw new Error(`No se pudieron buscar clientes: ${error.message}`)
    if (!data?.length) return { resultados: [], mensaje: 'No hay clientes que coincidan.' }

    return { resultados: data }
  },

  async buscar_presupuestos(supabase, { busqueda, estado, limite }) {
    let query: any = supabase
      .from('presupuestos')
      .select('numero, tipo, cliente_nombre, estado, total, forma_pago, fecha_emision, fecha_vencimiento, metros_lineales_total')

    const palabras = palabrasDeBusqueda(busqueda)
    if (palabras.length) {
      query = filtrarPorPalabras(query, palabras, ['numero', 'cliente_nombre'])
    }
    if (estado) query = query.eq('estado', estado)

    const { data, error } = await query
      .order('fecha_emision', { ascending: false })
      .limit(Math.min(Number(limite) || 10, 25))

    if (error) throw new Error(`No se pudieron buscar presupuestos: ${error.message}`)
    if (!data?.length) return { resultados: [], mensaje: 'No hay presupuestos que coincidan.' }

    return { resultados: data }
  },
}

/** Ejecuta una herramienta por nombre. Devuelve siempre un objeto serializable. */
export async function ejecutarTool(
  supabase: SupabaseClient,
  nombre: string,
  argumentos: any
): Promise<any> {
  const ejecutor = ejecutores[nombre]

  if (!ejecutor) {
    return { error: `La herramienta "${nombre}" no existe.` }
  }

  try {
    return await ejecutor(supabase, argumentos || {})
  } catch (error: any) {
    console.error(`[asistente] Error ejecutando ${nombre}:`, error)
    return { error: error?.message || 'Error inesperado al consultar los datos.' }
  }
}
