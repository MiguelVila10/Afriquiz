import { useEffect, useState } from 'react'
import { supabase } from './supabase'

const SIZE = 256 // a foto é reduzida para 256×256 antes de enviar (rápido mesmo com dados móveis)
const MAX_INPUT = 15 * 1024 * 1024

// Recorta ao centro, reduz e converte para WebP (ou JPEG se o navegador não suportar)
async function shrink(file) {
  const bitmap = await createImageBitmap(file)
  const side = Math.min(bitmap.width, bitmap.height)
  const sx = (bitmap.width - side) / 2
  const sy = (bitmap.height - side) / 2
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  canvas.getContext('2d').drawImage(bitmap, sx, sy, side, side, 0, 0, SIZE, SIZE)
  bitmap.close?.()
  const toBlob = (type, q) => new Promise((res) => canvas.toBlob(res, type, q))
  let blob = await toBlob('image/webp', 0.85)
  if (!blob || blob.type !== 'image/webp') blob = await toBlob('image/jpeg', 0.85)
  return blob
}

export async function uploadAvatar(file, userId) {
  if (!file || !file.type.startsWith('image/')) throw new Error('Escolha um ficheiro de imagem (JPG, PNG ou WebP).')
  if (file.size > MAX_INPUT) throw new Error('A imagem é demasiado grande (máximo 15 MB).')
  const blob = await shrink(file)
  const ext = blob.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${userId}/avatar.${ext}`
  const { error: upErr } = await supabase.storage.from('avatars').upload(path, blob, { upsert: true, contentType: blob.type, cacheControl: '3600' })
  if (upErr) throw upErr
  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  const url = `${data.publicUrl}?v=${Date.now()}` // força o navegador a mostrar a foto nova
  const { error } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', userId)
  if (error) throw error
  forget(userId)
  return url
}

export async function removeAvatar(userId) {
  const { error } = await supabase.from('profiles').update({ avatar_url: null }).eq('id', userId)
  if (error) throw error
}

// Cache simples username -> url para mostrar fotos em listas (ranking, comunidade…)
const cache = new Map()
function forget() {
  cache.clear()
}

export function useAvatars(usernames) {
  const key = [...new Set((usernames || []).filter(Boolean))].sort().join(',')
  const [map, setMap] = useState(() => new Map(cache))

  useEffect(() => {
    const wanted = key ? key.split(',') : []
    const missing = wanted.filter((u) => !cache.has(u))
    if (!missing.length) {
      setMap(new Map(cache))
      return
    }
    supabase
      .from('profiles')
      .select('username, avatar_url')
      .in('username', missing)
      .then(({ data }) => {
        missing.forEach((u) => cache.set(u, null))
        ;(data || []).forEach((r) => cache.set(r.username, r.avatar_url))
        setMap(new Map(cache))
      })
  }, [key])

  return map
}
