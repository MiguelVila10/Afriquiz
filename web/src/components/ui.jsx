import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'

/* Página em ecrã inteiro: faixa de título sobre o fundo + superfície de conteúdo até ao fundo do ecrã */
export function Page({ title, subtitle, actions, back, narrow = false, children }) {
  return (
    <div className="page">
      {(title || back) && (
        <header className="page-head">
          <div className="container">
            {back && (
              <Link to={back.to} className="page-back">
                ← {back.label}
              </Link>
            )}
            <div className="page-head-row">
              <div>
                {title && <h1>{title}</h1>}
                {subtitle && <p className="page-sub">{subtitle}</p>}
              </div>
              {actions && <div className="page-actions">{actions}</div>}
            </div>
          </div>
        </header>
      )}
      <div className="page-body">
        <div className={narrow ? 'container container-narrow' : 'container'}>{children}</div>
      </div>
    </div>
  )
}

/* Bloco de conteúdo dentro de uma página */
export function Card({ children, className = '' }) {
  return <section className={`panel ${className}`}>{children}</section>
}

export function Alert({ kind = 'error', children }) {
  if (!children) return null
  return (
    <p className={`alert alert-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      {children}
    </p>
  )
}

export function Spinner({ label = 'A carregar…' }) {
  return (
    <p className="spinner" role="status">
      <span className="spinner-dot" aria-hidden="true" />
      {label}
    </p>
  )
}

export function StatusBadge({ status }) {
  const map = { pending: 'Pendente', approved: 'Aprovada', rejected: 'Rejeitada' }
  return <span className={`badge badge-${status}`}>{map[status] ?? status}</span>
}

export function RequireAuth({ children, admin = false }) {
  const { user, isAdmin, ready } = useAuth()
  const location = useLocation()
  if (!ready)
    return (
      <Page>
        <Spinner />
      </Page>
    )
  if (!user) return <Navigate to="/entrar" replace state={{ from: location.pathname }} />
  if (admin && !isAdmin)
    return (
      <Page title="Acesso reservado" subtitle="Esta área é só para o administrador.">
        <Link to="/" className="btn">Voltar ao início</Link>
      </Page>
    )
  return children
}

export function LoginPrompt({ text = 'Precisa de uma conta para participar.' }) {
  return (
    <div className="login-prompt">
      <p>{text}</p>
      <div className="row">
        <Link to="/entrar" className="btn btn-outline">
          Entrar
        </Link>
        <Link to="/registar" className="btn">
          Criar conta
        </Link>
      </div>
    </div>
  )
}

// Mostra texto do utilizador como parágrafos — sempre como TEXTO, nunca HTML.
export function Paragraphs({ text }) {
  return (text || '')
    .split(/\n{2,}/)
    .map((p, i) => <p key={i}>{p}</p>)
}
