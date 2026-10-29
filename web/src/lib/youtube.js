// Ajudas para vídeos do YouTube (o servidor volta a validar o código)

const PATTERN = /(?:v=|youtu\.be\/|\/shorts\/|\/embed\/|\/live\/)([A-Za-z0-9_-]{11})/

export function youtubeId(input) {
  const s = (input || '').trim()
  const m = s.match(PATTERN)
  if (m) return m[1]
  return /^[A-Za-z0-9_-]{11}$/.test(s) ? s : null
}

export const thumbUrl = (id, quality = 'hqdefault') => `https://i.ytimg.com/vi/${id}/${quality}.jpg`

// youtube-nocookie: o YouTube só guarda cookies quando a pessoa carrega no play
export const embedUrl = (id) => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`

export const watchUrl = (id) => `https://www.youtube.com/watch?v=${id}`
