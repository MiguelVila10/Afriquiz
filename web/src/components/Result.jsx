import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { prefersReducedMotion, stagger, useCountUp } from '../lib/motion'
import Podium from './Podium'
import { LearnMorePanel, ReviewPanel } from './ResultExtras'

const STATUS = {
  correct: { label: 'Certa', icon: '✓' },
  wrong: { label: 'Errada', icon: '✗' },
  timeout: { label: 'Tempo esgotado', icon: '⏱' },
}
const CONFETTI_COLORS = ['#12b03f', '#f4c430', '#c31402', '#ffffff']

function message(pct) {
  if (pct === 1) return { title: 'Perfeito!', text: 'Acertou tudo. Domina este tema.' }
  if (pct >= 0.7) return { title: 'Excelente!', text: 'Um resultado de mestre. Continue assim.' }
  if (pct >= 0.4) return { title: 'Bom trabalho!', text: 'Está no bom caminho. Cada jogo ensina algo novo.' }
  return { title: 'Quiz completo', text: 'Cada erro é uma lição. Tente de novo e veja a diferença.' }
}

function Confetti() {
  // peças geradas uma vez; posição/rotação/atraso via variáveis CSS (compatível com a CSP)
  const pieces = useMemo(
    () =>
      Array.from({ length: 48 }, (_, i) => ({
        '--x': `${Math.round(Math.random() * 100)}vw`,
        '--drift': `${Math.round((Math.random() - 0.5) * 160)}px`,
        '--r': `${Math.round(Math.random() * 720 - 360)}deg`,
        '--d': `${Math.round(Math.random() * 600)}ms`,
        '--t': `${2200 + Math.round(Math.random() * 1400)}ms`,
        '--c': CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        '--w': `${6 + Math.round(Math.random() * 6)}px`,
      })),
    []
  )
  if (prefersReducedMotion()) return null
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((s, i) => (
        <span key={i} style={s} />
      ))}
    </div>
  )
}

function ScoreRing({ score, total }) {
  const pct = total ? score / total : 0
  const shown = useCountUp(score, { duration: 1200, delay: 250 })
  const shownPct = useCountUp(Math.round(pct * 100), { duration: 1200, delay: 250 })
  const R = 70
  const C = 2 * Math.PI * R
  return (
    <div className="ring" role="img" aria-label={`${score} de ${total} respostas certas (${Math.round(pct * 100)}%)`}>
      <svg viewBox="0 0 180 180" aria-hidden="true">
        <circle className="ring-track" cx="90" cy="90" r={R} />
        <circle
          className="ring-fill"
          cx="90"
          cy="90"
          r={R}
          strokeDasharray={C}
          style={{ '--len': C, '--off': C * (1 - pct) }}
        />
      </svg>
      <div className="ring-center" aria-hidden="true">
        <strong>
          {shown}
          <small>/{total}</small>
        </strong>
        <span>{shownPct}%</span>
      </div>
    </div>
  )
}

function Stat({ label, value, suffix = '', i, decimals = 0 }) {
  const v = useCountUp(value, { delay: 500 + i * 120, duration: 900, decimals })
  return (
    <div className="r-stat" style={stagger(i, 450, 110)}>
      <strong>
        {v}
        {suffix}
      </strong>
      <span>{label}</span>
    </div>
  )
}

function AnswerChart({ log }) {
  const [showTable, setShowTable] = useState(false)
  const MAX = 15
  return (
    <section className="r-panel chart-panel" style={stagger(0, 600)}>
      <header className="chart-head">
        <div>
          <h2>As suas respostas</h2>
          <p className="muted">Altura = segundos até responder · cor e ícone = resultado</p>
        </div>
        <ul className="legend">
          {Object.entries(STATUS).map(([k, s]) => (
            <li key={k}>
              <span className={`swatch s-${k}`} aria-hidden="true" />
              {s.label}
            </li>
          ))}
        </ul>
      </header>

      <div className="chart" role="img" aria-label="Gráfico do tempo e resultado de cada pergunta (detalhes na tabela abaixo)">
        <div className="chart-axis" aria-hidden="true">
          {[15, 10, 5, 0].map((t) => (
            <span key={t}>{t}s</span>
          ))}
        </div>
        <div className="chart-plot">
          <div className="chart-grid" aria-hidden="true">
            <i /><i /><i /><i />
          </div>
          <ol className="chart-bars">
            {log.map((q, i) => (
              <li key={q.position} className="bar-slot" tabIndex={0} aria-label={`Pergunta ${q.position}: ${STATUS[q.result].label}, ${q.seconds} segundos`}>
                <span className="bar-icon" style={stagger(i, 900, 70)} aria-hidden="true">{STATUS[q.result].icon}</span>
                <span className={`bar s-${q.result}`} style={{ '--h': `${Math.max(4, (q.seconds / MAX) * 100)}%`, ...stagger(i, 700, 70) }} />
                <span className="bar-tip" role="tooltip">
                  <strong>Pergunta {q.position}</strong>
                  <span>{STATUS[q.result].icon} {STATUS[q.result].label} · {q.seconds}s</span>
                  <em>{q.text}</em>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <ol className="chart-x" aria-hidden="true">
        {log.map((q) => (
          <li key={q.position}>{q.position}</li>
        ))}
      </ol>

      <button className="link-btn dark" onClick={() => setShowTable((s) => !s)} aria-expanded={showTable}>
        {showTable ? 'Esconder detalhes' : 'Ver detalhes de cada pergunta'}
      </button>
      {showTable && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>#</th><th>Pergunta</th><th>Resultado</th><th className="num">Tempo</th></tr>
            </thead>
            <tbody>
              {log.map((q) => (
                <tr key={q.position}>
                  <td>{q.position}</td>
                  <td>{q.text}</td>
                  <td>{STATUS[q.result].icon} {STATUS[q.result].label}</td>
                  <td className="num">{q.seconds}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default function Result({ score, total, log, category, categoryName, user, profile, onRestart }) {
  const pct = total ? score / total : 0
  const msg = message(pct)
  const [ranking, setRanking] = useState(null)

  useEffect(() => {
    supabase.rpc('leaderboard', { p_category: category, p_limit: 8 }).then(({ data }) => setRanking(data ?? []))
  }, [category])

  const answered = log.filter((q) => q.result !== 'timeout')
  const avg = answered.length ? answered.reduce((s, q) => s + q.seconds, 0) / answered.length : 0
  const wrong = log.filter((q) => q.result !== 'correct').length
  const fastest = log.filter((q) => q.result === 'correct').reduce((m, q) => Math.min(m, q.seconds), Infinity)

  return (
    <div className="result">
      {pct >= 0.6 && <Confetti />}
      <div className="container result-grid">
        <section className="result-hero">
          <ScoreRing score={score} total={total} />
          <div className="result-info">
          <p className="result-kicker">{categoryName}</p>
          <h1 className="result-title">{msg.title}</h1>
          <p className="result-text">{msg.text}</p>
          <div className="r-stats">
            <Stat i={0} label="certas" value={score} />
            <Stat i={1} label="erradas" value={wrong} />
            <Stat i={2} label="tempo médio" value={Math.round(avg * 10) / 10} decimals={1} suffix="s" />
            <Stat i={3} label="mais rápida" value={Number.isFinite(fastest) ? fastest : 0} decimals={1} suffix="s" />
          </div>
          <div className="row result-actions">
            <button className="btn btn-lg" onClick={onRestart}>Jogar novamente</button>
            <Link to="/ranking" className="btn btn-lg btn-ghost">Ranking completo</Link>
          </div>
          </div>
        </section>

        <AnswerChart log={log} />

        <section className="r-panel rank-panel" style={stagger(0, 800)}>
          <h2>Ranking · {categoryName}</h2>
          {!user && (
            <p className="note">
              Jogou como visitante, por isso este resultado não conta. <Link to="/registar">Crie uma conta</Link> para aparecer aqui.
            </p>
          )}
          {ranking === null ? null : ranking.length === 0 ? (
            <p className="empty">Ainda não há ninguém no ranking desta categoria.</p>
          ) : (
            <Podium rows={ranking} me={profile?.username} baseDelay={1000} />
          )}
        </section>

        <ReviewPanel log={log} />
        <LearnMorePanel category={category} categoryName={categoryName} />
      </div>
    </div>
  )
}
