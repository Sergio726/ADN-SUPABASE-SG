'use client'

/**
 * Captura de audio en el navegador para el asistente.
 *
 * Por qué hay conversión: MediaRecorder graba en webm/opus (Chrome) o mp4
 * (Safari), y OpenRouter acepta wav, mp3, ogg, flac, m4a… pero no webm. Así
 * que se decodifica lo grabado con AudioContext y se re-escribe como WAV
 * PCM16 mono a 16 kHz, que es lo que esperan los modelos de voz y además pesa
 * mucho menos que el original.
 */

const FRECUENCIA_DESTINO = 16000 // 16 kHz: suficiente para voz, un tercio del tamaño

export interface AudioGrabado {
  /** Contenido del WAV en base64, sin el prefijo data: */
  base64: string
  formato: 'wav'
  duracionSegundos: number
}

export class GrabadorDeVoz {
  private recorder: MediaRecorder | null = null
  private trozos: Blob[] = []
  private stream: MediaStream | null = null

  get grabando(): boolean {
    return this.recorder?.state === 'recording'
  }

  async iniciar(): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      throw new Error('Este navegador no permite grabar audio.')
    }

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
    })

    this.trozos = []
    this.recorder = new MediaRecorder(this.stream)
    this.recorder.ondataavailable = (evento) => {
      if (evento.data.size > 0) this.trozos.push(evento.data)
    }
    this.recorder.start()
  }

  /** Corta la grabación y devuelve el audio ya convertido a WAV. */
  async detener(): Promise<AudioGrabado> {
    const recorder = this.recorder

    if (!recorder || recorder.state === 'inactive') {
      throw new Error('No hay ninguna grabación en curso.')
    }

    const blob = await new Promise<Blob>((resolve) => {
      recorder.onstop = () => resolve(new Blob(this.trozos, { type: recorder.mimeType }))
      recorder.stop()
    })

    this.liberar()

    return convertirAWav(blob)
  }

  /** Corta la grabación descartando lo capturado. */
  cancelar(): void {
    if (this.recorder && this.recorder.state !== 'inactive') {
      this.recorder.onstop = null
      this.recorder.stop()
    }
    this.liberar()
  }

  private liberar(): void {
    this.stream?.getTracks().forEach((track) => track.stop())
    this.stream = null
    this.recorder = null
    this.trozos = []
  }
}

/** Decodifica lo que grabó el navegador y lo re-escribe como WAV PCM16 mono. */
async function convertirAWav(blob: Blob): Promise<AudioGrabado> {
  const buffer = await blob.arrayBuffer()

  const AudioCtx: typeof AudioContext =
    (window as any).AudioContext || (window as any).webkitAudioContext

  if (!AudioCtx) throw new Error('Este navegador no permite procesar audio.')

  const contexto = new AudioCtx()

  try {
    const decodificado = await contexto.decodeAudioData(buffer)
    const muestras = aMonoResampleado(decodificado, FRECUENCIA_DESTINO)
    const wav = escribirWav(muestras, FRECUENCIA_DESTINO)

    return {
      base64: aBase64(wav),
      formato: 'wav',
      duracionSegundos: Math.round(decodificado.duration * 10) / 10,
    }
  } finally {
    contexto.close().catch(() => {})
  }
}

/** Mezcla los canales a mono y baja la frecuencia de muestreo. */
function aMonoResampleado(buffer: AudioBuffer, frecuenciaDestino: number): Float32Array {
  const canales = buffer.numberOfChannels
  const largoOriginal = buffer.length

  // Mezcla a mono promediando los canales
  const mono = new Float32Array(largoOriginal)
  for (let canal = 0; canal < canales; canal++) {
    const datos = buffer.getChannelData(canal)
    for (let i = 0; i < largoOriginal; i++) mono[i] += datos[i] / canales
  }

  if (buffer.sampleRate === frecuenciaDestino) return mono

  // Remuestreo lineal simple: alcanza de sobra para voz
  const proporcion = buffer.sampleRate / frecuenciaDestino
  const largoDestino = Math.floor(largoOriginal / proporcion)
  const salida = new Float32Array(largoDestino)

  for (let i = 0; i < largoDestino; i++) {
    const posicion = i * proporcion
    const indice = Math.floor(posicion)
    const resto = posicion - indice
    const actual = mono[indice] ?? 0
    const siguiente = mono[indice + 1] ?? actual
    salida[i] = actual + (siguiente - actual) * resto
  }

  return salida
}

/** Arma el archivo WAV (cabecera RIFF de 44 bytes + PCM 16 bits). */
function escribirWav(muestras: Float32Array, frecuencia: number): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + muestras.length * 2)
  const vista = new DataView(buffer)

  const escribirTexto = (offset: number, texto: string) => {
    for (let i = 0; i < texto.length; i++) vista.setUint8(offset + i, texto.charCodeAt(i))
  }

  escribirTexto(0, 'RIFF')
  vista.setUint32(4, 36 + muestras.length * 2, true)
  escribirTexto(8, 'WAVE')
  escribirTexto(12, 'fmt ')
  vista.setUint32(16, 16, true) // tamaño del bloque fmt
  vista.setUint16(20, 1, true) // PCM sin comprimir
  vista.setUint16(22, 1, true) // mono
  vista.setUint32(24, frecuencia, true)
  vista.setUint32(28, frecuencia * 2, true) // bytes por segundo
  vista.setUint16(32, 2, true) // alineación de bloque
  vista.setUint16(34, 16, true) // bits por muestra
  escribirTexto(36, 'data')
  vista.setUint32(40, muestras.length * 2, true)

  let offset = 44
  for (let i = 0; i < muestras.length; i++) {
    const valor = Math.max(-1, Math.min(1, muestras[i]))
    vista.setInt16(offset, valor < 0 ? valor * 0x8000 : valor * 0x7fff, true)
    offset += 2
  }

  return buffer
}

function aBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binario = ''
  const tramo = 0x8000 // de a pedazos para no reventar el stack con audios largos

  for (let i = 0; i < bytes.length; i += tramo) {
    binario += String.fromCharCode(...Array.from(bytes.subarray(i, i + tramo)))
  }

  return btoa(binario)
}

/**
 * Prepara una imagen para mandarla al modelo: la achica y la pasa a JPEG.
 * Una foto de celular puede pesar varios MB y no aporta nada en esa
 * resolución; además el request tiene un tope de tamaño.
 */
export async function prepararImagen(archivo: File, ladoMaximo = 1600): Promise<string> {
  if (!archivo.type.startsWith('image/')) {
    throw new Error('El archivo no es una imagen.')
  }

  const url = URL.createObjectURL(archivo)

  try {
    const imagen = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('No se pudo leer la imagen.'))
      img.src = url
    })

    const escala = Math.min(1, ladoMaximo / Math.max(imagen.width, imagen.height))
    const ancho = Math.round(imagen.width * escala)
    const alto = Math.round(imagen.height * escala)

    const canvas = document.createElement('canvas')
    canvas.width = ancho
    canvas.height = alto

    const contexto = canvas.getContext('2d')
    if (!contexto) throw new Error('No se pudo procesar la imagen.')

    contexto.drawImage(imagen, 0, 0, ancho, alto)

    return canvas.toDataURL('image/jpeg', 0.82)
  } finally {
    URL.revokeObjectURL(url)
  }
}
