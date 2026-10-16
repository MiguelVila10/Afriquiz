import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { asset } from '../lib/paths'
import Avatar from './Avatar'

const BACKGROUNDS = ['images/bg-1.jpg', 'images/bg-2.jpg', 'images/bg-3.jpg', 'images/bg-4.jpg'].map(asset)

function Background() {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return
    const id = setInterval(() => setIndex((i) => (i + 1) % BACKGROUNDS.length), 6000)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="bg" aria-hidden="true">
      {BACKGROUNDS.map((src, i) => (
        <img key={src} src={src} alt="" className={i === index ? 'bg-img is-on' : 'bg-img'} />
      ))}
      <div className="bg-shade" />
    </div>
  )
}

const LINKS = [
  { to: '/jogar', label: 'Jogar' },
  { to: '/aprender', label: 'Aprender' },
  { to: '/comunidade', label: 'Comunidade' },
  { to: '/ranking', label: 'Ranking' },
  { to: '/contribuir', label: 'Contribuir' },
]

export default function Layout() {
  const { user, profile, isAdmin, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const location = useLocation()

  useEffect(() => setOpen(false), [location.pathname])

  return (
    <>
      <Background />
      <header className="nav">
        <div className="nav-inner">
          <Link to="/" className="brand" aria-label="AfriQuiz — início">
            <img src={asset('images/logo.png')} alt="AfriQuiz" className="brand-logo" />
          </Link>
          <button
            className="nav-toggle"
            aria-expanded={open}
            aria-controls="menu"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? 'Fechar' : 'Menu'}
          </button>
          <nav id="menu" className={open ? 'nav-links is-open' : 'nav-links'}>
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to}>
                {l.label}
              </NavLink>
            ))}
            {isAdmin && (
              <NavLink to="/admin" className="nav-admin">
                Gestão
              </NavLink>
            )}
            <span className="nav-sep" />
            {user ? (
              <>
                <NavLink to="/perfil" className="nav-me">
                  <Avatar url={profile?.avatar_url} name={profile?.display_name || profile?.username} size={28} />
                  {profile?.username ?? 'Perfil'}
                </NavLink>
                <button className="link-btn" onClick={signOut}>
                  Sair
                </button>
              </>
            ) : (
              <>
                <NavLink to="/entrar">Entrar</NavLink>
                <Link to="/registar" className="btn btn-sm btn-yellow">
                  Criar conta
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <footer className="footer">
        AfriQuiz · Conhecimento africano, partilhado por todos.
      </footer>
    </>
  )
}
