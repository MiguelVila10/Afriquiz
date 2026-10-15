import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { prefersReducedMotion, stagger } from '../lib/motion'
import { asset } from '../lib/paths'

const SECTIONS = [
  { to: '/jogar', title: 'Jogar', text: 'Quatro categorias, 15 segundos por pergunta. Teste o que sabe sobre África.' },
  { to: '/aprender', title: 'Aprender', text: 'Fichas e textos sobre reinos, personalidades, ideias e culturas africanas.' },
  { to: '/comunidade', title: 'Comunidade', text: 'Partilhe ideias e sugestões, comente e vote nas melhores.' },
  { to: '/contribuir', title: 'Contribuir', text: 'Proponha novas perguntas e conhecimentos. Tudo é revisto antes de ser publicado.' },
]

const FACTS = [
  'África tem 54 países reconhecidos pela União Africana.',
  'O Nilo é o rio mais longo de África.',
  'Mansa Musa governou o Império do Mali no século XIV.',
  'Tombuctu foi um dos grandes centros de saber da Idade Média.',
  'O Kilimanjaro é a montanha mais alta de África.',
  'No continente africano falam-se mais de 2000 línguas.',
]

function Facts() {
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    if (paused || prefersReducedMotion()) return
    const id = setInterval(() => setI((n) => (n + 1) % FACTS.length), 5000)
    return () => clearInterval(id)
  }, [paused])
  return (
    <div
      className="facts reveal"
      style={stagger(2, 450)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <span className="facts-label">Sabia que…</span>
      <p key={i} className="facts-text" aria-live="polite">{FACTS[i]}</p>
      <button className="facts-next" onClick={() => setI((n) => (n + 1) % FACTS.length)} aria-label="Próximo facto">
        →
      </button>
    </div>
  )
}

export default function Home() {
  const { user } = useAuth()
  return (
    <div className="home">
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-logo-wrap">
            <span className="hero-glow" aria-hidden="true" />
            <img src={asset('images/logo.png')} alt="AfriQuiz" className="hero-logo" />
          </div>
          <p className="hero-lead reveal" style={stagger(0, 450)}>
            Teste o seu conhecimento sobre África, a sua história, cultura e grandes figuras. E ajude a construir o quiz
            com a comunidade.
          </p>
          <div className="row hero-cta reveal" style={stagger(1, 450)}>
            <Link to="/jogar" className="btn btn-lg">
              Começar a jogar
            </Link>
            {!user && (
              <Link to="/registar" className="btn btn-lg btn-ghost">
                Criar conta
              </Link>
            )}
          </div>
          <Facts />
        </div>
      </section>

      <section className="home-sections" aria-label="Secções">
        <div className="container tiles">
          {SECTIONS.map((s, i) => (
            <Link key={s.to} to={s.to} className="tile reveal" style={stagger(i, 750, 90)}>
              <h2>{s.title}</h2>
              <p>{s.text}</p>
              <span className="tile-go" aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
