// Foto de perfil redonda; sem foto mostra a inicial num círculo verde.
export default function Avatar({ url, name = '?', size = 40, className = '' }) {
  const initial = (name || '?').trim().slice(0, 1).toUpperCase()
  const style = { '--av': `${size}px` }
  return url ? (
    <img src={url} alt="" className={`avatar ${className}`} style={style} loading="lazy" decoding="async" />
  ) : (
    <span className={`avatar avatar-empty ${className}`} style={style} aria-hidden="true">
      {initial}
    </span>
  )
}
