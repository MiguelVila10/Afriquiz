import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, friendlyError } from '../lib/supabase'
import { useCategories, formatDate } from '../lib/categories'
import { Alert, Page, Paragraphs, Spinner, StatusBadge } from '../components/ui'

const LETTERS = ['A', 'B', 'C', 'D']

function QuestionReview({ q, categories, onChanged }) {
  const [editing, setEditing] = useState(false)
  const [f, setF] = useState({ category: q.category_slug, question: q.question, options: [...q.options], correct: q.correct_index, explanation: q.explanation ?? '' })
  const [note, setNote] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function run(fn) {
    setBusy(true)
    setError(null)
    const { error } = await fn()
    setBusy(false)
    if (error) setError(friendlyError(error))
    else onChanged()
  }

  const save = () =>
    run(() =>
      supabase.rpc('admin_update_question', {
        p_id: q.id,
        p_category: f.category,
        p_question: f.question,
        p_options: f.options,
        p_correct: f.correct,
        p_explanation: f.explanation || null,
      })
    )
  const review = (approve) => run(() => supabase.rpc('admin_review_question', { p_id: q.id, p_approve: approve, p_note: note || null }))

  return (
    <li className="review">
      <div className="row row-between">
        <span className="kind">{categories.find((c) => c.slug === q.category_slug)?.name}</span>
        <span className="meta">
          {q.author_username ? `por @${q.author_username}` : 'projeto original'} · {formatDate(q.created_at)} <StatusBadge status={q.status} />
        </span>
      </div>

      {q.moderation_note && <p className="note">{q.moderation_note}</p>}

      {editing ? (
        <div className="form">
          <label>
            Categoria
            <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
              {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </label>
          <label>
            Pergunta
            <textarea rows={2} value={f.question} onChange={(e) => setF({ ...f, question: e.target.value })} />
          </label>
          {f.options.map((o, i) => (
            <div key={i} className="option-edit">
              <input type="radio" name={`c-${q.id}`} checked={f.correct === i} onChange={() => setF({ ...f, correct: i })} aria-label={`${LETTERS[i]} é a certa`} />
              <span className="letter">{LETTERS[i]}</span>
              <input
                value={o}
                onChange={(e) => {
                  const options = [...f.options]
                  options[i] = e.target.value
                  setF({ ...f, options })
                }}
              />
            </div>
          ))}
          <label>
            Explicação
            <textarea rows={2} value={f.explanation} onChange={(e) => setF({ ...f, explanation: e.target.value })} />
          </label>
          <div className="row">
            <button className="btn" onClick={save} disabled={busy}>Guardar alterações</button>
            <button className="btn btn-outline" onClick={() => setEditing(false)}>Cancelar</button>
          </div>
        </div>
      ) : (
        <>
          <p className="review-q">{q.question}</p>
          <ol className="review-opts" type="A">
            {q.options.map((o, i) => (
              <li key={i} className={i === q.correct_index ? 'is-correct' : ''}>
                {o} {i === q.correct_index && <strong>✓ certa</strong>}
              </li>
            ))}
          </ol>
          {q.explanation && <p className="muted">Explicação: {q.explanation}</p>}
        </>
      )}

      {!editing && (
        <div className="review-actions">
          <input placeholder="Nota para o autor (opcional)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={600} />
          <div className="row">
            {q.status !== 'approved' && <button className="btn btn-sm" onClick={() => review(true)} disabled={busy}>Aprovar</button>}
            {q.status !== 'rejected' && <button className="btn btn-sm btn-danger" onClick={() => review(false)} disabled={busy}>Rejeitar</button>}
            <button className="btn btn-sm btn-outline" onClick={() => setEditing(true)}>Editar</button>
          </div>
        </div>
      )}
      <Alert>{error}</Alert>
    </li>
  )
}

function ArticleReview({ a, onChanged }) {
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const [error, setError] = useState(null)

  async function review(approve) {
    const { error } = await supabase.rpc('admin_review_article', { p_id: a.id, p_approve: approve, p_note: note || null })
    if (error) setError(friendlyError(error))
    else onChanged()
  }

  return (
    <li className="review">
      <div className="row row-between">
        <span className="kind">{a.categories?.name}</span>
        <span className="meta">por @{a.profiles?.username} · {formatDate(a.created_at)} <StatusBadge status={a.status} /></span>
      </div>
      <p className="review-q">{a.title}</p>
      {a.summary && <p className="muted">{a.summary}</p>}
      <button className="link-btn dark" onClick={() => setOpen((o) => !o)}>{open ? 'Esconder texto' : 'Ler texto completo'}</button>
      {open && (
        <div className="prose boxed">
          <Paragraphs text={a.body} />
          {a.sources && (<><h3>Fontes</h3><Paragraphs text={a.sources} /></>)}
        </div>
      )}
      <div className="review-actions">
        <input placeholder="Nota para o autor (opcional)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={600} />
        <div className="row">
          {a.status !== 'approved' && <button className="btn btn-sm" onClick={() => review(true)}>Aprovar</button>}
          {a.status !== 'rejected' && <button className="btn btn-sm btn-danger" onClick={() => review(false)}>Rejeitar</button>}
        </div>
      </div>
      <Alert>{error}</Alert>
    </li>
  )
}

export default function Admin() {
  const { categories } = useCategories()
  const [tab, setTab] = useState('perguntas')
  const [status, setStatus] = useState('pending')
  const [counts, setCounts] = useState(null)
  const [items, setItems] = useState(null)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setItems(null)
    setError(null)
    const { data: c } = await supabase.rpc('admin_counts')
    setCounts(c?.[0] ?? null)
    const res =
      tab === 'perguntas'
        ? await supabase.rpc('admin_list_questions', { p_status: status, p_limit: 100 })
        : await supabase
            .from('articles')
            .select('id, title, summary, body, sources, status, created_at, categories(name), profiles(username)')
            .eq('status', status)
            .order('created_at')
    if (res.error) setError(friendlyError(res.error))
    setItems(res.data ?? [])
  }, [tab, status])

  useEffect(() => {
    load()
  }, [load])

  return (
    <Page title="Gestão" subtitle="Só a sua conta vê esta página. Nada do que é enviado aparece no site sem a sua aprovação.">
        {counts && (
          <div className="stats">
            <div><strong>{counts.pending_questions}</strong><span>perguntas pendentes</span></div>
            <div><strong>{counts.pending_articles}</strong><span>conhecimentos pendentes</span></div>
            <div><strong>{counts.hidden_ideas}</strong><span>ideias ocultas</span></div>
            <div><strong>{counts.users}</strong><span>utilizadores</span></div>
          </div>
        )}
        <p className="hint">Para ocultar ideias ou comentários, use os botões na <Link to="/comunidade">Comunidade</Link>.</p>

        <div className="tabs">
          <button className={tab === 'perguntas' ? 'tab is-active' : 'tab'} onClick={() => setTab('perguntas')}>Perguntas</button>
          <button className={tab === 'conhecimentos' ? 'tab is-active' : 'tab'} onClick={() => setTab('conhecimentos')}>Conhecimentos</button>
          <span className="tabs-sep" />
          {[['pending', 'Pendentes'], ['approved', 'Aprovadas'], ['rejected', 'Rejeitadas']].map(([k, l]) => (
            <button key={k} className={status === k ? 'tab tab-sm is-active' : 'tab tab-sm'} onClick={() => setStatus(k)}>{l}</button>
          ))}
        </div>
        <Alert>{error}</Alert>
        {!items ? (
          <Spinner />
        ) : items.length === 0 ? (
          <p className="empty">Nada aqui. 🎉</p>
        ) : (
          <ul className="list">
            {tab === 'perguntas'
              ? items.map((q) => <QuestionReview key={q.id} q={q} categories={categories} onChanged={load} />)
              : items.map((a) => <ArticleReview key={a.id} a={a} onChanged={load} />)}
          </ul>
        )}
    </Page>
  )
}
