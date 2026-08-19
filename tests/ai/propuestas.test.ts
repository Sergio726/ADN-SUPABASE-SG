import { describe, expect, it } from 'vitest'
import {
  confirmarPropuesta,
  crearPropuesta,
  firmarPropuesta,
  type AlmacenPropuestas,
  type PropuestaPendiente,
  verificarPropuestaFirmada,
} from '../../lib/ai/propuestas'

class AlmacenEnMemoria implements AlmacenPropuestas {
  private propuestas = new Map<string, PropuestaPendiente>()

  async guardar(propuesta: PropuestaPendiente) {
    this.propuestas.set(propuesta.id, propuesta)
    return propuesta
  }

  async consumir(id: string, usuarioId: string, ahora: string) {
    const propuesta = this.propuestas.get(id)
    if (!propuesta || propuesta.usuario_id !== usuarioId || propuesta.consumida_en || propuesta.vence_en <= ahora) {
      return null
    }

    const consumida = { ...propuesta, consumida_en: ahora }
    this.propuestas.set(id, consumida)
    return consumida
  }
}

describe('propuestas de acciones del asistente', () => {
  it('crea una propuesta limitada en el tiempo con el payload canónico', async () => {
    const almacen = new AlmacenEnMemoria()

    const propuesta = await crearPropuesta(
      almacen,
      'usuario-1',
      'crear_tarea',
      { titulo: 'Llamar a Ana', cliente_id: 'cliente-1' },
      new Date('2026-08-19T12:00:00.000Z')
    )

    expect(propuesta.usuario_id).toBe('usuario-1')
    expect(propuesta.accion).toBe('crear_tarea')
    expect(propuesta.datos).toEqual({ titulo: 'Llamar a Ana', cliente_id: 'cliente-1' })
    expect(propuesta.consumida_en).toBeNull()
    expect(propuesta.vence_en).toBe('2026-08-19T12:15:00.000Z')
  })

  it('no permite confirmar dos veces la misma propuesta', async () => {
    const almacen = new AlmacenEnMemoria()
    const propuesta = await crearPropuesta(
      almacen,
      'usuario-1',
      'crear_cliente',
      { nombre_completo: 'Ana Pérez' },
      new Date('2026-08-19T12:00:00.000Z')
    )

    await expect(confirmarPropuesta(almacen, propuesta.id, 'usuario-1', '2026-08-19T12:01:00.000Z')).resolves.toMatchObject({
      accion: 'crear_cliente',
      datos: { nombre_completo: 'Ana Pérez' },
    })
    await expect(confirmarPropuesta(almacen, propuesta.id, 'usuario-1', '2026-08-19T12:02:00.000Z')).rejects.toThrow(
      'La propuesta ya fue confirmada, venció o no te pertenece.'
    )
  })

  it('no permite confirmar la propuesta de otro usuario', async () => {
    const almacen = new AlmacenEnMemoria()
    const propuesta = await crearPropuesta(
      almacen,
      'usuario-1',
      'crear_tarea',
      { titulo: 'Llamar a Ana' },
      new Date('2026-08-19T12:00:00.000Z')
    )

    await expect(confirmarPropuesta(almacen, propuesta.id, 'usuario-2', '2026-08-19T12:01:00.000Z')).rejects.toThrow(
      'La propuesta ya fue confirmada, venció o no te pertenece.'
    )
  })

  it('rechaza un token cuyo payload fue alterado', async () => {
    const almacen = new AlmacenEnMemoria()
    const propuesta = await crearPropuesta(
      almacen,
      'usuario-1',
      'crear_tarea',
      { titulo: 'Llamar a Ana' },
      new Date('2026-08-19T12:00:00.000Z')
    )
    const token = firmarPropuesta(propuesta, 'secreto-de-prueba')
    const [payload, firma] = token.split('.')
    const datosAlterados = {
      ...JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')),
      usuario_id: 'usuario-2',
    }
    const alterado = `${Buffer.from(JSON.stringify(datosAlterados)).toString('base64url')}.${firma}`

    expect(() => verificarPropuestaFirmada(alterado, 'secreto-de-prueba', '2026-08-19T12:01:00.000Z')).toThrow(
      'La confirmación no es válida.'
    )
  })
})
