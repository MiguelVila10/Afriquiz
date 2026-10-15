import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase, friendlyError } from '../lib/supabase'
import { formatDate } from '../lib/categories'
import { useAuth } from '../lib/auth'
import { Alert, Page, LoginPrompt, Paragraphs, Spinner } from '../components/ui'
import { VoteButton } from './Community'

export default function IdeaDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()
  const [idea, setIdea] = useState(undefined)
  const [votes, setVotes] = useState({ count: 0, mine: false })
  const [comments, setComments] = useState([])
  const [text, setText] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const [{ data: i, error: e1 }, { data: c }, { count }, mine] = await Promise.all([
      supabase.from('ideas').select('id, kind, title, body, hidden, created_at, author_id, profiles(username, display_name)').eq('id', id).maybeSingle(),
      supabase.from('idea_comments').select('id, body, hidden, created_at, author_id, profiles(username, display_name)').eq('idea_id', id).order('created_at'),
      supabase.from('idea_votes').select('idea_id', { count: 'exact', head: true }).eq('idea_id', id),
      user ? supabase.from('idea_votes').select('idea_id').eq('idea_id', id).eq('user_id', user.id).maybeSingle() : Promise.resolve({ data: null }),
    ])
    if (e1) setError(friendlyError(e1))
    setIdea(i ?? null)
    setComments(c ?? [])
    setVotes({ count: count ?? 0, mine: !!mine.data })
  }, [id, user])

  useEffect(() => {
    load()
  }, [load])

  async function addComment(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await supabase.from('idea_comments').insert({ idea_id: id, body: text.trim() })
    setBusy(false)
    if (error) return setError(friendlyError(error))
    setText('')
    load()
  }

  async function removeIdea() {
    if (!window.confirm('Apagar esta publicação?')) return
    const { error } = await supabase.from('ideas').delete().eq('id', id)
    if (error) setError(friendlyError(error))
    else navigate('/comunidade')
  }

  async function removeComment(cid) {
    const { error } = await supabase.from('idea_comments').delete().eq('id', cid)
    if (error) setError(friendlyError(error))
    else load()
  }

  async function hideComment(cid, hidden) {
    const { error } = await supabase.rpc('admin_set_comment_hidden', { p_id: cid, p_hidden: hidden })
    if (error) setError(friendlyError(error))
    else load()
  }

  if (idea === undefined) return <Page><Spinner /></Page>
  if (idea === null)
    return (
      <Page title="Publicação não encontrada" back={{ to: '/comunidade', label: 'Comunidade' }}>
        <Link to="/comunidade" className="btn">Voltar à Comunidade</Link>
      </Page>
    )

  const author = idea.profiles?.display_name || idea.profiles?.username
  return (
    <Page
      back={{ to: '/comunidade', label: 'Comunidade' }}
      title={idea.title}
      subtitle={`${idea.kind === 'sugestao' ? 'Sugestão' : 'Ideia'} de ${author} · ${formatDate(idea.created_at)}${idea.hidden ? ' · oculta pela moderação' : ''}`}
      narrow
    >
      <div className="idea-head">
        <VoteButton ideaId={idea.id} votes={votes.count} voted={votes.mine} onChange={load} />
        <span className="muted">{votes.mine ? 'Apoia esta publicação' : 'Apoiar esta publicação'}</span>
      </div>
      <div className="prose">
        <Paragraphs text={idea.body} />
      </div>
      {(user?.id === idea.author_id || isAdmin) && (
        <button className="btn btn-sm btn-danger" onClick={removeIdea}>
          Apagar publicação
        </button>
      )}

      <h2 className="section-title">Comentários ({comments.filter((c) => !c.hidden).length})</h2>
      <Alert>{error}</Alert>
      <ul className="comments">
        {comments.map((c) => (
          <li key={c.id} className={c.hidden ? 'comment is-hidden' : 'comment'}>
            <p className="meta">
              <strong>{c.profiles?.display_name || c.profiles?.username}</strong> · {formatDate(c.created_at)}
              {c.hidden && ' · oculto'}
            </p>
            <p>{c.body}</p>
            <div className="row">
              {user?.id === c.author_id && (
                <button className="link-btn dark" onClick={() => removeComment(c.id)}>Apagar</button>
              )}
              {isAdmin && (
                <button className="link-btn dark" onClick={() => hideComment(c.id, !c.hidden)}>
                  {c.hidden ? 'Mostrar' : 'Ocultar'}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {user ? (
        !idea.hidden && (
          <form className="form" onSubmit={addComment}>
            <label>
              Escrever comentário
              <textarea required maxLength={2000} rows={3} value={text} onChange={(e) => setText(e.target.value)} />
            </label>
            <button className="btn" disabled={busy || !text.trim()}>
              Comentar
            </button>
          </form>
        )
      ) : (
        <LoginPrompt text="Entre para comentar e votar." />
      )}
    </Page>
  )
}
