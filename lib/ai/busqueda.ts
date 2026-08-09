/**
 * Búsqueda de texto para las herramientas del asistente.
 *
 * Resuelve tres problemas que aparecen al buscar con lo que escribe una
 * persona (o el modelo) contra los nombres cargados en la base:
 *
 * 1. **Caracteres que rompen PostgREST.** Las comas y los paréntesis son
 *    separadores del lenguaje de filtros: si llegan crudos, la consulta falla.
 * 2. **Nombres largos.** "Poste de Hormigón con Ménsula 2,8 mt Esquinero
 *    Cuadrado" no matchea la frase "poste esquinero": hay que exigir que
 *    aparezcan todas las palabras, en cualquier orden.
 * 3. **Acentos.** En la base los nombres están casi siempre sin tildes
 *    ("Cerco Olimpico ... Estandar ... Cordon"), pero el vendedor escribe
 *    "olímpico", "estándar", "cordón". ILIKE no ignora los acentos.
 */

/** Saca los caracteres que rompen el lenguaje de filtros de PostgREST. */
export function limpiarBusqueda(texto: unknown): string {
  return String(texto ?? '')
    .replace(/[,()%*\\]/g, ' ')
    .trim()
    .slice(0, 120)
}

/**
 * Convierte una palabra en un patrón de ILIKE insensible a los acentos.
 *
 * Cada vocal y cada "n" se reemplaza por `_`, que en ILIKE significa "un
 * carácter cualquiera". Así "olímpico" y "olimpico" generan el mismo patrón
 * (`_l_mp_c_`) y se encuentran mutuamente, sin depender de la extensión
 * unaccent de Postgres. La estructura de consonantes mantiene la búsqueda
 * específica: "eucalipto" no trae olímpicos.
 */
export function patronIlike(palabra: string): string {
  return palabra.replace(/[aeiouáéíóúàèìòùäëïöüâêîôûñn]/gi, '_')
}

/** Parte la búsqueda en palabras utilizables. */
export function palabrasDeBusqueda(texto: unknown): string[] {
  return limpiarBusqueda(texto)
    .split(/\s+/)
    .filter((p) => p.length >= 2)
    .slice(0, 6)
}

/**
 * Aplica un AND de palabras sobre un OR de columnas:
 * (col1 ~ palabra1 OR col2 ~ palabra1) AND (col1 ~ palabra2 OR col2 ~ palabra2)…
 */
export function filtrarPorPalabras<T>(query: T, palabras: string[], columnas: string[]): T {
  let resultado: any = query

  for (const palabra of palabras) {
    const patron = patronIlike(palabra)
    resultado = resultado.or(columnas.map((col) => `${col}.ilike.%${patron}%`).join(','))
  }

  return resultado
}
