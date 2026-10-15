import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  throw new Error('Faltam VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no ficheiro .env')
}

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})

// Converte erros técnicos em mensagens em português para o utilizador.
export function friendlyError(err) {
  if (!err) return null
  const msg = err.message || String(err)
  const map = [
    [/Invalid login credentials/i, 'Email ou senha incorretos.'],
    [/Email not confirmed/i, 'Confirme o seu email antes de entrar (veja a caixa de entrada).'],
    [/User already registered/i, 'Já existe uma conta com este email.'],
    [/Password should be at least/i, 'A senha é demasiado curta.'],
    [/email rate limit|over_email_send_rate_limit/i, 'O envio de emails atingiu o limite desta hora. Tente de novo mais tarde — se o problema continuar, contacte o administrador.'],
    [/rate limit|too many requests/i, 'Demasiadas tentativas. Aguarde um pouco e tente de novo.'],
    [/violates check constraint/i, 'Alguns campos não cumprem os requisitos. Verifique o tamanho dos textos e as opções.'],
    [/duplicate key/i, 'Isto já existe.'],
    [/permission denied|row-level security/i, 'Não tem permissão para esta ação.'],
    [/Failed to fetch|NetworkError/i, 'Sem ligação ao servidor. Verifique a internet.'],
  ]
  for (const [re, text] of map) if (re.test(msg)) return text
  return msg
}
