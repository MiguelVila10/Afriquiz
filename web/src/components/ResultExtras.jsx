import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useCategories } from '../lib/categories'
import { thumbUrl } from '../lib/youtube'
import { stagger } from '../lib/motion'

const LETTERS = 'ABCD'

// Revisão: as perguntas falhadas, com a resposta dada, a certa e a explicação
export function ReviewPanel({ log }) {
  const [all, setAll] = useState(false)
  const reviewable = log.filter((q) => Array.isArray(q.options) && q.correctIndex != null)
  if (!reviewable.length) return null
  const missed = reviewable.filter((q) => q.result !== 'correct')
  const shown = all ? reviewable : missed

  return (
    <section className="r-panel review-panel" style={stagger(0, 1200)}>
      <div className="row row-between">
        <h2>Rever respostas</h2>
        {missed.length > 0 && missed.length < reviewable.length && (
          <button className="link-btn dark" onClick={() => setAll((v) => !v)}>
            {all ? 'Mostrar só as falhadas' : `Ver todas (${reviewable.length})`}
          </button>
        )}
      </div>
      {missed.length === 0 && !all ? (
        <p className="review-perfect">
          Acertou todas as perguntas. <button className="link-btn dark" onClick={() => setAll(true)}>Rever mesmo assim</button>
        </p>
      ) : (
        <ol className="review-list">
          {shown.map((q) => (
            <li key={q.position} className={`review-item is-${q.result}`}>
              <p className="review-qtext">
                <span className="review-num">{q.position}</span>
                {q.text}
              </p>
              <div className="review-answers">
                {q.result !== 'correct' && (
                  <p className="review-yours">
                    <span className="review-tag">A sua resposta</span>
                    {q.chosen == null ? (
                      <span>⏱ Tempo esgotado, sem resposta</span>
                    ) : (
                      <span>✗ {LETTERS[q.chosen]}. {q.options[q.chosen]}</span>
                    )}
                  </p>
                )}
                <p className="review-right">
                  <span className="review-tag">Resposta certa</span>
                  <span>✓ {LETTERS[q.correctIndex]}. {q.options[q.correctIndex]}</span>
                </p>
              </div>
              {q.explanation && <p className="review-expl">{q.explanation}</p>}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

// Continue a aprender: conhecimentos e vídeos da mesma categoria
export function LearnMorePanel({ category, categoryName }) {
  const { categories } = useCategories()
  const [items, setItems] = useState(null)

  useEffect(() => {
    const cat = categories.find((c) => c.slug === category)
    if (!cat) return
    Promise.all([
      supabase
        .from('articles')
        .select('id, title, summary')
        .eq('status', 'approved')
        .eq('category_id', cat.id)
        .order('created_at', { ascending: false })
        .limit(3),
      supabase
        .from('videos')
        .select('id, youtube_id, title')
        .eq('hidden', false)
        .eq('category_id', cat.id)
        .order('created_at', { ascending: false })
        .limit(2),
    ]).then(([a, v]) => setItems({ articles: a.data ?? [], videos: v.data ?? [] }))
  }, [categories, category])

  if (!items || (!items.articles.length && !items.videos.length)) return null

  return (
    <section className="r-panel learn-panel" style={stagger(0, 1400)}>
      <h2>Continue a aprender sobre {categoryName}</h2>
      <p className="muted">Leia ou veja antes de jogar outra vez.</p>
      <ul className="learn-list">
        {items.videos.map((v) => (
          <li key={v.id}>
            <Link to={`/videos/${v.id}`} className="learn-item is-video">
              <span className="learn-thumb">
                <img src={thumbUrl(v.youtube_id, 'mqdefault')} alt="" loading="lazy" />
                <span className="play-btn small" aria-hidden="true" />
              </span>
              <span className="learn-text">
                <span className="kind">Vídeo</span>
                <strong>{v.title}</strong>
              </span>
            </Link>
          </li>
        ))}
        {items.articles.map((a) => (
          <li key={a.id}>
            <Link to={`/aprender/${a.id}`} className="learn-item">
              <span className="learn-icon" aria-hidden="true">📖</span>
              <span className="learn-text">
                <span className="kind">Ler</span>
                <strong>{a.title}</strong>
                {a.summary && <span className="learn-summary">{a.summary}</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
