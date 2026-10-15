// O site pode estar na raiz (Netlify/Cloudflare: "/") ou numa subpasta (GitHub Pages: "/afriquiz/").
const BASE = import.meta.env.BASE_URL // termina sempre em "/"

// Caminho para ficheiros da pasta public/ (imagens, fontes)
export const asset = (path) => BASE + path.replace(/^\//, '')

// URL completo de uma página do site (para links em emails)
export const siteUrl = (path = '') => window.location.origin + BASE + path.replace(/^\//, '')

// Para o React Router
export const routerBase = BASE.replace(/\/$/, '') || '/'
