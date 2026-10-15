import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase, friendlyError } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { Alert } from '../components/ui'
import { asset, siteUrl } from '../lib/paths'

// Ecrã dividido: marca à esquerda (sobre o fundo), formulário à direita. Em telemóvel fica empilhado.
function AuthShell({ children }) {
  return (
    <div className="auth">
      <aside className="auth-brand">
        <img src={asset('images/logo.png')} alt="AfriQuiz" />
        <p>Aprenda sobre África a jogar, partilhe ideias e ajude a construir o conhecimento da comunidade.</p>
        <ul>
          <li>Entre no ranking</li>
          <li>Comente e vote nas ideias</li>
          <li>Proponha perguntas e conhecimentos</li>
        </ul>
      </aside>
      <section className="auth-form">
        <div className="auth-form-inner">{children}</div>
      </section>
    </div>
  )
}

const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/

export function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (user) navigate(location.state?.from || '/', { replace: true })
  }, [user, navigate, location.state])

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    if (error) setError(friendlyError(error))
  }

  async function forgot() {
    setError(null)
    if (!email.trim()) return setError('Escreva o seu email primeiro.')
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: siteUrl('nova-senha'),
    })
    if (error) setError(friendlyError(error))
    else setInfo('Se existir uma conta com este email, vai receber um link para criar nova senha.')
  }

  return (
    <AuthShell>
      <h1>Entrar</h1>
      <form onSubmit={submit} className="form">
        <label>
          Email
          <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Senha
          <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <Alert>{error}</Alert>
        <Alert kind="info">{info}</Alert>
        <button className="btn btn-block" disabled={busy}>
          {busy ? 'A entrar…' : 'Entrar'}
        </button>
      </form>
      <p className="row row-between hint">
        <button type="button" className="link-btn dark" onClick={forgot}>
          Esqueci-me da senha
        </button>
        <Link to="/registar">Criar conta</Link>
      </p>
    </AuthShell>
  )
}

export function Register() {
  const [form, setForm] = useState({ username: '', display_name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setError(null)
    const username = form.username.trim()
    if (!USERNAME_RE.test(username)) return setError('O nome de utilizador deve ter 3 a 20 caracteres: letras, números ou _.')
    if (form.password.length < 8) return setError('A senha deve ter pelo menos 8 caracteres.')
    if (form.password !== form.confirm) return setError('As senhas não coincidem.')

    setBusy(true)
    const { data: free } = await supabase.rpc('username_available', { p_username: username })
    if (free === false) {
      setBusy(false)
      return setError('Este nome de utilizador já está a ser usado.')
    }
    const { error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        data: { username, display_name: form.display_name.trim() || null },
        emailRedirectTo: siteUrl(),
      },
    })
    setBusy(false)
    if (error) return setError(friendlyError(error))
    setDone(true)
  }

  if (done) {
    return (
      <AuthShell>
        <h1>Quase lá!</h1>
        <p>
          Enviámos um email para <strong>{form.email}</strong>. Abra o link de confirmação para ativar a conta e depois
          entre.
        </p>
        <Link to="/entrar" className="btn">
          Ir para Entrar
        </Link>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <h1>Criar conta</h1>
      <form onSubmit={submit} className="form">
        <label>
          Nome de utilizador
          <input required minLength={3} maxLength={20} autoComplete="username" value={form.username} onChange={set('username')} placeholder="ex.: kandimba_23" />
          <small>Público. Letras, números e _ (3 a 20).</small>
        </label>
        <label>
          <span>Nome a mostrar <span className="muted">(opcional)</span></span>
          <input maxLength={50} value={form.display_name} onChange={set('display_name')} />
        </label>
        <label>
          Email
          <input type="email" required autoComplete="email" value={form.email} onChange={set('email')} />
          <small>Nunca é mostrado a outras pessoas.</small>
        </label>
        <label>
          Senha
          <input type="password" required minLength={8} autoComplete="new-password" value={form.password} onChange={set('password')} />
        </label>
        <label>
          Repetir senha
          <input type="password" required minLength={8} autoComplete="new-password" value={form.confirm} onChange={set('confirm')} />
        </label>
        <Alert>{error}</Alert>
        <button className="btn btn-block" disabled={busy}>
          {busy ? 'A criar…' : 'Criar conta'}
        </button>
      </form>
      <p className="hint">
        Já tem conta? <Link to="/entrar">Entrar</Link>
      </p>
    </AuthShell>
  )
}

export function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (password.length < 8) return setError('A senha deve ter pelo menos 8 caracteres.')
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) return setError(friendlyError(error))
    navigate('/perfil')
  }

  return (
    <AuthShell>
      <h1>Nova senha</h1>
      <form onSubmit={submit} className="form">
        <label>
          Nova senha
          <input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <Alert>{error}</Alert>
        <button className="btn btn-block" disabled={busy}>
          Guardar
        </button>
      </form>
    </AuthShell>
  )
}
