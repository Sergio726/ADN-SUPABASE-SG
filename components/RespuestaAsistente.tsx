'use client'

/**
 * Renderiza la respuesta del asistente.
 *
 * El modelo contesta en markdown liviano (párrafos, listas, negritas y tablas).
 * En vez de sumar una dependencia de markdown para eso, se interpretan acá los
 * pocos casos que el asistente usa. Todo se renderiza como JSX: nunca se
 * inyecta HTML crudo.
 */
import React from 'react'

/** Convierte **negrita** en <strong> dentro de una línea de texto. */
function conNegritas(texto: string, keyBase: string) {
  const partes = texto.split(/(\*\*[^*]+\*\*)/g)
  return partes.map((parte, i) =>
    parte.startsWith('**') && parte.endsWith('**') && parte.length > 4 ? (
      <strong key={`${keyBase}-${i}`}>{parte.slice(2, -2)}</strong>
    ) : (
      <React.Fragment key={`${keyBase}-${i}`}>{parte}</React.Fragment>
    )
  )
}

const esFilaDeTabla = (linea: string) => linea.trim().startsWith('|') && linea.trim().endsWith('|')
const esSeparadorDeTabla = (linea: string) => /^\s*\|[\s:|-]+\|\s*$/.test(linea)

const celdas = (linea: string) =>
  linea
    .trim()
    .slice(1, -1)
    .split('|')
    .map((c) => c.trim())

export function RespuestaAsistente({ texto }: { texto: string }) {
  const lineas = texto.split('\n')
  const bloques: React.ReactNode[] = []

  let i = 0
  let parrafo: string[] = []
  let lista: string[] = []

  const cerrarParrafo = () => {
    if (!parrafo.length) return
    const contenido = parrafo.join(' ')
    bloques.push(
      <p key={`p-${bloques.length}`} className="leading-relaxed">
        {conNegritas(contenido, `p-${bloques.length}`)}
      </p>
    )
    parrafo = []
  }

  const cerrarLista = () => {
    if (!lista.length) return
    const items = [...lista]
    bloques.push(
      <ul key={`ul-${bloques.length}`} className="list-disc space-y-1 pl-5">
        {items.map((item, idx) => (
          <li key={idx}>{conNegritas(item, `li-${idx}`)}</li>
        ))}
      </ul>
    )
    lista = []
  }

  while (i < lineas.length) {
    const linea = lineas[i]

    // Tabla: encabezado + separador + filas
    if (esFilaDeTabla(linea) && i + 1 < lineas.length && esSeparadorDeTabla(lineas[i + 1])) {
      cerrarParrafo()
      cerrarLista()

      const encabezados = celdas(linea)
      const filas: string[][] = []
      i += 2

      while (i < lineas.length && esFilaDeTabla(lineas[i])) {
        filas.push(celdas(lineas[i]))
        i++
      }

      bloques.push(
        <div key={`t-${bloques.length}`} className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-border">
                {encabezados.map((h, idx) => (
                  <th key={idx} className="px-2 py-1.5 text-left font-semibold whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.map((fila, idxFila) => (
                <tr key={idxFila} className="border-b border-border/50 last:border-0">
                  {fila.map((celda, idxCelda) => (
                    <td key={idxCelda} className="px-2 py-1.5 align-top whitespace-nowrap">
                      {conNegritas(celda, `td-${idxFila}-${idxCelda}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
      continue
    }

    // Ítem de lista
    if (/^\s*[-*]\s+/.test(linea)) {
      cerrarParrafo()
      lista.push(linea.replace(/^\s*[-*]\s+/, ''))
      i++
      continue
    }

    // Línea en blanco: cierra lo que venía
    if (!linea.trim()) {
      cerrarParrafo()
      cerrarLista()
      i++
      continue
    }

    cerrarLista()
    parrafo.push(linea.trim())
    i++
  }

  cerrarParrafo()
  cerrarLista()

  return <div className="space-y-2 text-sm">{bloques}</div>
}
