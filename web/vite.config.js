import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Política de segurança (CSP) também como <meta>, para alojamentos que não
// permitem cabeçalhos próprios (ex.: GitHub Pages). Só no build — o modo dev
// do Vite precisa de scripts inline.
const SUPABASE = 'https://aokoiqvyqokrsawzyohz.supabase.co'
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data: https://aokoiqvyqokrsawzyohz.supabase.co https://i.ytimg.com",
  "frame-src https://www.youtube-nocookie.com",
  "font-src 'self'",
  `connect-src 'self' ${SUPABASE} wss://aokoiqvyqokrsawzyohz.supabase.co`,
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

const cspMeta = {
  name: 'csp-meta',
  apply: 'build',
  transformIndexHtml: (html) =>
    html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`),
}

// VITE_BASE: "/" (Netlify, Cloudflare, Vercel) ou "/afriquiz/" (GitHub Pages)
// Porta 3000 = o "Site URL" por omissão do Supabase (emails funcionam ao testar localmente).
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react(), cspMeta],
  server: { port: 3000, strictPort: true },
  preview: { port: 3000 },
  build: { sourcemap: false },
})
