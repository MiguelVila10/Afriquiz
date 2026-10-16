import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, friendlyError } from '../lib/supabase'
import { useCategories, formatDate } from '../lib/categories'
import { Alert, Page, Paragraphs, Spinner, StatusBadge } from '../components/ui'
import Avatar from '../components/Avatar'
import { useAvatars } from '../lib/avatars'

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

function ResetPassword() {
  const [open, setOpen] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState(null)
  const [error, setError] = useState(null)

  async function submit(e) {
    e.preventDefault()
    setMsg(null)
    setError(null)
    const { error } = await supabase.rpc('admin_reset_password', { p_username: username.trim(), p_new_password: password })
    if (error) return setError(friendlyError(error))
    setMsg(`Senha de @${username.trim()} reposta. Envie-lhe a nova senha em privado.`)
    setPassword('')
  }

  return (
    <div className="reset-box">
      <button className="link-btn dark" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {open ? 'Fechar' : 'Repor a senha de um utilizador'}
      </button>
      {open && (
        <form className="form reset-form" onSubmit={submit}>
          <label>
            Nome de utilizador
            <input required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ex.: kandimba_23" />
          </label>
          <label>
            Nova senha (mín. 8)
            <input required minLength={8} maxLength={72} value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <button className="btn btn-sm">Repor senha</button>
          <Alert>{error}</Alert>
          <Alert kind="success">{msg}</Alert>
        </form>
      )}
    </div>
  )
}

function UserRow({ u, avatar }) {
  const [open, setOpen] = useState(false)
  const [games, setGames] = useState(null)

  async function toggle() {
    setOpen((o) => !o)
    if (!games) {
      const { data } = await supabase.rpc('admin_user_games', { p_user_id: u.id, p_limit: 10 })
      setGames(data ?? [])
    }
  }

  return (
    <li className={open ? 'user-row is-open' : 'user-row'}>
      <button className="user-head" onClick={toggle} aria-expanded={open}>
        <Avatar url={avatar} name={u.display_name || u.username} size={44} />
        <span className="user-id">
          <strong>{u.display_name || u.username}</strong>
          <span className="muted">@{u.username}{u.is_admin && ' · administrador'}</span>
        </span>
        <span className="user-mini">
          <span><strong>{u.games}</strong> jogos</span>
          <span><strong>{u.points}</strong> pts</span>
        </span>
        <span className="user-chevron" aria-hidden="true">{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div className="user-detail">
          <dl className="user-facts">
            <div><dt>Email</dt><dd>{u.email}</dd></div>
            <div><dt>Registado</dt><dd>{formatDate(u.created_at)}</dd></div>
            <div><dt>Última entrada</dt><dd>{u.last_sign_in_at ? formatDate(u.last_sign_in_at) : '—'}</dd></div>
            <div><dt>Acerto médio</dt><dd>{u.accuracy ?? 0}%</dd></div>
            <div><dt>Perguntas enviadas</dt><dd>{u.questions_sent}</dd></div>
            <div><dt>Conhecimentos</dt><dd>{u.articles_sent}</dd></div>
            <div><dt>Ideias</dt><dd>{u.ideas}</dd></div>
            <div><dt>Comentários</dt><dd>{u.comments}</dd></div>
          </dl>
          {u.bio && <p className="user-bio">“{u.bio}”</p>}
          <h3>Últimos jogos</h3>
          {!games ? (
            <Spinner />
          ) : games.length === 0 ? (
            <p className="muted">Ainda não terminou nenhum jogo.</p>
          ) : (
            <ul className="user-games">
              {games.map((g, i) => (
                <li key={i}>
                  <span>{g.category_name}</span>
                  <strong>{g.score}/{g.total}</strong>
                  <span className="muted">{formatDate(g.finished_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  )
}

function Users() {
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [rows, setRows] = useState(null)
  const [error, setError] = useState(null)
  const avatars = useAvatars((rows || []).map((u) => u.username))

  useEffect(() => {
    const t = setTimeout(() => setQuery(search), 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    setRows(null)
    supabase.rpc('admin_list_users', { p_search: query || null, p_limit: 200 }).then(({ data, error }) => {
      if (error) setError(friendlyError(error))
      setRows(data ?? [])
    })
  }, [query])

  return (
    <>
      <div className="user-toolbar">
        <input
          type="search"
          placeholder="Procurar por nome, utilizador ou email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Procurar utilizadores"
        />
        {rows && <span className="muted">{rows.length} {rows.length === 1 ? 'pessoa' : 'pessoas'}</span>}
      </div>
      <Alert>{error}</Alert>
      {!rows ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <p className="empty">Ninguém encontrado.</p>
      ) : (
        <ul className="user-list">
          {rows.map((u) => (
            <UserRow key={u.id} u={u} avatar={avatars.get(u.username)} />
          ))}
        </ul>
      )}
    </>
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
    if (tab === 'utilizadores') return
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
            <button className="stat-btn" onClick={() => { setTab('perguntas'); setStatus('pending') }}><strong>{counts.pending_questions}</strong><span>perguntas pendentes</span></button>
            <button className="stat-btn" onClick={() => { setTab('conhecimentos'); setStatus('pending') }}><strong>{counts.pending_articles}</strong><span>conhecimentos pendentes</span></button>
            <Link className="stat-btn" to="/comunidade"><strong>{counts.hidden_ideas}</strong><span>ideias ocultas</span></Link>
            <button className="stat-btn stat-users" onClick={() => setTab('utilizadores')}><strong>{counts.users}</strong><span>pessoas registadas</span></button>
          </div>
        )}
        <p className="hint">Para ocultar ideias ou comentários, use os botões na <Link to="/comunidade">Comunidade</Link>.</p>
        <ResetPassword />

        <div className="tabs">
          <button className={tab === 'perguntas' ? 'tab is-active' : 'tab'} onClick={() => setTab('perguntas')}>Perguntas</button>
          <button className={tab === 'conhecimentos' ? 'tab is-active' : 'tab'} onClick={() => setTab('conhecimentos')}>Conhecimentos</button>
          <button className={tab === 'utilizadores' ? 'tab is-active' : 'tab'} onClick={() => setTab('utilizadores')}>
            Utilizadores{counts ? ` (${counts.users})` : ''}
          </button>
          <span className="tabs-sep" />
          {tab !== 'utilizadores' &&
            [['pending', 'Pendentes'], ['approved', 'Aprovadas'], ['rejected', 'Rejeitadas']].map(([k, l]) => (
              <button key={k} className={status === k ? 'tab tab-sm is-active' : 'tab tab-sm'} onClick={() => setStatus(k)}>{l}</button>
            ))}
        </div>
        <Alert>{error}</Alert>
        {tab === 'utilizadores' ? (
          <Users />
        ) : !items ? (
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
