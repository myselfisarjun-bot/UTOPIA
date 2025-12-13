import * as FileSystem from 'expo-file-system'
import { decode } from 'base64-arraybuffer'
import { v4 as uuidv4 } from 'uuid'

import { supabase } from '@/lib/supabase'
import type { Photo } from '@/types/models'
import { getFileExtension, getMimeTypeFromExtension } from '@/utils/files'

const bucket =
  process.env.EXPO_PUBLIC_SUPABASE_PHOTO_BUCKET?.trim() || 'profile-photos'

export const photoService = {
  async listPhotos(userId: string): Promise<Photo[]> {
    const { data, error } = await supabase
      .from('photos')
      .select('id,user_id,path,sort_order')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true })

    if (error) throw error

    const rows = ((data as Photo[]) ?? []).map((p) => ({ ...p, status: 'ready' as const }))

    const withUrls = await Promise.all(
      rows.map(async (p) => {
        if (!p.path) return p

        const { data: signed } = await supabase.storage
          .from(bucket)
          .createSignedUrl(p.path, 60 * 60)

        return { ...p, localUri: signed?.signedUrl }
      })
    )

    return withUrls
  },

  async uploadLocalPhoto(params: {
    userId: string
    localUri: string
    sortOrder: number
  }): Promise<Photo> {
    const { userId, localUri, sortOrder } = params

    const ext = getFileExtension(localUri) ?? 'jpg'
    const mimeType = getMimeTypeFromExtension(ext)

    const storagePath = `${userId}/${uuidv4()}.${ext}`

    const { data: signed, error: signedError } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(storagePath)

    if (signedError) throw signedError

    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    })

    const body = decode(base64)

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .uploadToSignedUrl(signed.path, signed.token, body, {
        contentType: mimeType,
      })

    if (uploadError) throw uploadError

    const { data: inserted, error: insertError } = await supabase
      .from('photos')
      .insert({
        user_id: userId,
        path: storagePath,
        sort_order: sortOrder,
      })
      .select('id,user_id,path,sort_order')
      .single()

    if (insertError) throw insertError
    return inserted as Photo
  },

  async updatePhotoOrders(
    orders: Array<{ id: string; sort_order: number }>
  ): Promise<void> {
    if (orders.length === 0) return

    const { error } = await supabase.from('photos').upsert(orders, {
      onConflict: 'id',
    })

    if (error) throw error
  },

  async deletePhoto(params: { photoId: string; path: string }): Promise<void> {
    const { photoId, path } = params

    const { error: dbError } = await supabase.from('photos').delete().eq('id', photoId)
    if (dbError) throw dbError

    if (path) {
      await supabase.storage.from(bucket).remove([path])
    }
  },
}
