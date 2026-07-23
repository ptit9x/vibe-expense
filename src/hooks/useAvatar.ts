import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured, requireAuth } from '@/lib/supabase'

/**
 * Convert HEIC/HEIF to a canvas, then resize to maxPx x maxPx.
 * Returns a JPEG Blob for maximum compatibility across browsers/devices.
 */
function resizeImage(file: File, maxPx = 512): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const processImage = (imgOrBlob: HTMLImageElement | Blob) => {
      const img = imgOrBlob instanceof HTMLImageElement
        ? imgOrBlob
        : (() => {
            const i = new Image()
            const innerUrl = URL.createObjectURL(imgOrBlob)
            i.src = innerUrl
            return i
          })()

      img.onload = () => {
        if (img.src.startsWith('blob:')) URL.revokeObjectURL(img.src)

        const { width, height } = img

        // Skip resize if already small enough
        if (width <= maxPx && height <= maxPx) {
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          canvas.getContext('2d')?.drawImage(img, 0, 0)
          canvas.toBlob(
            (blob) => { if (blob) resolve(blob); else reject(new Error('Failed to create blob')) },
            'image/jpeg',
            0.85,
          )
          return
        }

        const scale = maxPx / Math.max(width, height)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(width * scale)
        canvas.height = Math.round(height * scale)

        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('Canvas not supported')); return }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        canvas.toBlob(
          (blob) => { if (blob) resolve(blob); else reject(new Error('Failed to create blob')) },
          'image/jpeg',
          0.85,
        )
      }
      img.onerror = () => {
        if (img.src.startsWith('blob:')) URL.revokeObjectURL(img.src)
        reject(new Error('Failed to load image'))
      }
    }

    // Detect HEIC / HEIF (iPhone default format)
    if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic')) {
      // Dynamically import heic2any to avoid bloating the initial bundle
      import('heic2any').then(({ default: heic2any }) => {
        heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 })
          .then((converted) => {
            if (!converted) {
              reject(new Error('HEIC conversion returned empty'))
              return
            }
            const blob = Array.isArray(converted) ? converted[0] : converted
            const img = new Image()
            const url = URL.createObjectURL(blob)
            img.src = url
            processImage(img)
          })
          .catch(() => reject(new Error('HEIC conversion failed')))
      }).catch(() => reject(new Error('HEIC library not loaded')))
    } else {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.src = url
      processImage(img)
    }
  })
}

export function useUploadAvatar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase not configured')
      }

      // Early client-side validation before loading the file into memory.
      // Prevents memory exhaustion from very large / non-image selections.
      const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error('Unsupported file type. Please use JPG, PNG, WebP, or HEIC.')
      }
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File too large. Maximum 10MB.')
      }

      const user = await requireAuth()

      // Resize image client-side before upload
      const resized = await resizeImage(file, 512)

      // Determine file extension
      const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
      const filePath = `${user.id}/avatar.${ext}`

      // Upload to Supabase Storage (upsert)
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, resized, {
          upsert: true,
          contentType: 'image/jpeg',
        })

      if (uploadError) throw uploadError

      // Get the public URL
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath)

      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}` // bust cache

      // Update avatar_url in profiles table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
        .eq('id', user.id)

      if (updateError) throw updateError

      return avatarUrl
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] })
    },
  })
}
