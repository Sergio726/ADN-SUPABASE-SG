"use client"

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'

interface ImageUploadProps {
  articuloId?: string
  currentImageUrl?: string | null
  onImageUploaded: (url: string) => void
  onImageRemoved: () => void
}

export function ImageUpload({ 
  articuloId, 
  currentImageUrl, 
  onImageUploaded,
  onImageRemoved 
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null)
  const supabase = createClientComponentClient()

  const uploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      
      if (!event.target.files || event.target.files.length === 0) {
        return
      }

      const file = event.target.files[0]
      
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no debe superar 5MB')
        return
      }

      // Validar tipo
      if (!file.type.startsWith('image/')) {
        alert('Solo se permiten imágenes')
        return
      }

      // Generar nombre único
      const fileExt = file.name.split('.').pop()
      const fileName = `${articuloId || Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${fileName}`

      // Subir a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('articulos-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('articulos-images')
        .getPublicUrl(filePath)

      setPreview(publicUrl)
      onImageUploaded(publicUrl)
      
      alert('Imagen subida exitosamente')
      
    } catch (error: any) {
      console.error('Error al subir la imagen:', error)
      alert('Error al subir la imagen: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const removeImage = async () => {
    if (!currentImageUrl) return
    
    try {
      // Extraer el path del archivo de la URL
      const urlParts = currentImageUrl.split('/')
      const path = urlParts[urlParts.length - 1]
      
      if (path && path !== 'undefined') {
        await supabase.storage
          .from('articulos-images')
          .remove([path])
      }
      
      setPreview(null)
      onImageRemoved()
      
    } catch (error: any) {
      console.error('Error al eliminar la imagen:', error)
      alert('Error al eliminar la imagen: ' + error.message)
    }
  }

  return (
    <div className="space-y-4">
      <Label>Imagen del Artículo</Label>
      
      {preview ? (
        <div className="relative w-full h-64 border rounded-lg overflow-hidden bg-muted">
          <Image
            src={preview}
            alt="Preview"
            fill
            className="object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={removeImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
          <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <Label
            htmlFor="image-upload"
            className="cursor-pointer"
          >
            <div className="space-y-2">
              <Button type="button" variant="outline" disabled={uploading} asChild>
                <span>
                  <Upload className="mr-2 h-4 w-4" />
                  {uploading ? 'Subiendo...' : 'Subir Imagen'}
                </span>
              </Button>
              <p className="text-sm text-muted-foreground">
                PNG, JPG, WEBP hasta 5MB
              </p>
            </div>
          </Label>
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={uploadImage}
            disabled={uploading}
            className="hidden"
          />
        </div>
      )}
    </div>
  )
}

