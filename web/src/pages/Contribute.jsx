import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase, friendlyError } from '../lib/supabase'
import { useCategories, formatDate } from '../lib/categories'
import { useAuth } from '../lib/auth'
import { Alert, Page, LoginPrompt, Spinner, StatusBadge } from '../components/ui'

const LETTERS = ['A', 'B', 'C', 'D']

function QuestionForm({ categories, onDone }) {
  const empty = { category: 'africa', question: '', options: ['', '', '', ''], correct: null, explanation: '' }
  const [f, setF] = useState(empty)
  const [error, setError] = useState(null)
  const [ok, setOk] = useState(null)
  const [busy, setBusy] = useState(false)

  function setOption(i, v) {
    const options = [...f.options]
    options[i] = v
    setF({ ...f, options })
  }

  async function submit(e) {
    e.preventDefault()
    setError(null)
    setOk(null)
    const opts = f.options.map((o) => o.trim())
    if (opts.some((o) => !o)) return setError('Preencha as 4 alternativas.')
    if (new Set(opts.map((o) => o.toLowerCase())).size !== 4) return setError('As 4 alternativas têm de ser diferentes.')
    if (f.correct === null) return setError('Marque qual é a alternativa certa.')
    setBusy(true)
    const { error } = await supabase.rpc('submit_question', {
      p_category: f.category,
      p_question: f.question.trim(),
      p_options: opts,
      p_correct: f.correct,
      p_explanation: f.explanation.trim() || null,
    })
    setBusy(false)
    if (error) return setError(friendlyError(error))
    setF({ ...empty, category: f.category })
    setOk('Pergunta enviada! Fica pendente até ser revista pela moderação.')
    onDone()
  }

  return (
    <form className="form" onSubmit={submit}>
      <label>
        Categoria
        <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </label>
      <label>
        Pergunta
        <textarea required minLength={10} maxLength={300} rows={2} value={f.question} onChange={(e) => setF({ ...f, question: e.target.value })} />
      </label>
      <fieldset className="options-edit">
        <legend>Alternativas — marque a certa</legend>
        {f.options.map((o, i) => (
          <div key={i} className="option-edit">
            <input
              type="radio"
              name="correct"
              aria-label={`Alternativa ${LETTERS[i]} é a certa`}
              checked={f.correct === i}
              onChange={() => setF({ ...f, correct: i })}
            />
            <span className="letter">{LETTERS[i]}</span>
            <input required maxLength={120} value={o} onChange={(e) => setOption(i, e.target.value)} aria-label={`Alternativa ${LETTERS[i]}`} />
          </div>
        ))}
      </fieldset>
      <label>
        <span>Explicação <span className="muted">(opcional — aparece depois de o jogador responder)</span></span>
        <textarea maxLength={600} rows={2} value={f.explanation} onChange={(e) => setF({ ...f, explanation: e.target.value })} />
      </label>
      <Alert>{error}</Alert>
      <Alert kind="success">{ok}</Alert>
      <button className="btn" disabled={busy}>Enviar para revisão</button>
    </form>
  )
}

function ArticleForm({ categories, onDone }) {
  const empty = { category: 'africa', title: '', summary: '', body: '', sources: '' }
  const [f, setF] = useState(empty)
  const [error, setError] = useState(null)
  const [ok, setOk] = useState(null)
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setError(null)
    setOk(null)
    if (f.body.trim().length < 50) return setError('O texto deve ter pelo menos 50 caracteres.')
    setBusy(true)
    const { error } = await supabase.rpc('submit_article', {
      p_category: f.category,
      p_title: f.title.trim(),
      p_summary: f.summary.trim() || null,
      p_body: f.body.trim(),
      p_sources: f.sources.trim() || null,
    })
    setBusy(false)
    if (error) return setError(friendlyError(error))
    setF({ ...empty, category: f.category })
    setOk('Conhecimento enviado! Fica pendente até ser revisto pela moderação.')
    onDone()
  }

  return (
    <form className="form" onSubmit={submit}>
      <label>
        Categoria
        <select value={f.category} onChange={set('category')}>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </label>
      <label>
        Título
        <input required minLength={5} maxLength={120} value={f.title} onChange={set('title')} />
      </label>
      <label>
        <span>Resumo <span className="muted">(uma ou duas frases)</span></span>
        <textarea maxLength={300} rows={2} value={f.summary} onChange={set('summary')} />
      </label>
      <label>
        Texto
        <textarea required maxLength={20000} rows={10} value={f.body} onChange={set('body')} />
        <small>Deixe uma linha em branco entre parágrafos.</small>
      </label>
      <label>
        <span>Fontes <span className="muted">(livros, artigos, links — ajudam na aprovação)</span></span>
        <textarea maxLength={1000} rows={3} value={f.sources} onChange={set('sources')} />
      </label>
      <Alert>{error}</Alert>
      <Alert kind="success">{ok}</Alert>
      <button className="btn" disabled={busy}>Enviar para revisão</button>
    </form>
  )
}

function MySubmissions({ version }) {
  const { user } = useAuth()
  const [qs, setQs] = useState(null)
  const [arts, setArts] = useState(null)

  useEffect(() => {
    supabase.rpc('my_questions').then(({ data }) => setQs(data ?? []))
    supabase
      .from('articles')
      .select('id, title, status, moderation_note, created_at')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setArts(data ?? []))
  }, [user.id, version])

  if (!qs || !arts) return <Spinner />
  if (!qs.length && !arts.length) return <p className="empty">Ainda não enviou nada.</p>

  return (
    <ul className="list">
      {qs.map((q) => (
        <li key={q.id} className="submission">
          <div className="row row-between">
            <span className="kind">Pergunta</span>
            <StatusBadge status={q.status} />
          </div>
          <p><strong>{q.question}</strong></p>
          <p className="meta">Resposta certa: {q.options[q.correct_index]} · {formatDate(q.created_at)}</p>
          {q.moderation_note && <p className="note">Nota da moderação: {q.moderation_note}</p>}
        </li>
      ))}
      {arts.map((a) => (
        <li key={a.id} className="submission">
          <div className="row row-between">
            <span className="kind">Conhecimento</span>
            <StatusBadge status={a.status} />
          </div>
          <p><Link to={`/aprender/${a.id}`}><strong>{a.title}</strong></Link></p>
          <p className="meta">{formatDate(a.created_at)}</p>
          {a.moderation_note && <p className="note">Nota da moderação: {a.moderation_note}</p>}
        </li>
      ))}
    </ul>
  )
}

export default function Contribute() {
  const { user, ready } = useAuth()
  const { categories } = useCategories()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tipo') || 'pergunta'
  const [version, setVersion] = useState(0)
  const bump = useCallback(() => setVersion((v) => v + 1), [])

  return (
    <Page
      title="Contribuir"
      subtitle="Proponha novas perguntas para o quiz ou partilhe conhecimento. Tudo é revisto pela moderação antes de ser publicado."
    >
      {!ready ? (
        <Spinner />
      ) : !user ? (
        <LoginPrompt text="Precisa de uma conta para contribuir." />
      ) : (
        <>
          <div className="tabs">
            {[
              ['pergunta', 'Nova pergunta'],
              ['conhecimento', 'Novo conhecimento'],
              ['minhas', 'As minhas submissões'],
            ].map(([k, label]) => (
              <button key={k} className={tab === k ? 'tab is-active' : 'tab'} onClick={() => setParams({ tipo: k })}>
                {label}
              </button>
            ))}
          </div>
          {tab === 'pergunta' && <QuestionForm categories={categories} onDone={bump} />}
          {tab === 'conhecimento' && <ArticleForm categories={categories} onDone={bump} />}
          {tab === 'minhas' && <MySubmissions version={version} />}
        </>
      )}
    </Page>
  )
}
