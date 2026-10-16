import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, friendlyError } from '../lib/supabase'
import { formatDate } from '../lib/categories'
import { useAuth } from '../lib/auth'
import { Alert, Page, LoginPrompt, Spinner } from '../components/ui'
import Avatar from '../components/Avatar'
import { useAvatars } from '../lib/avatars'

export function VoteButton({ ideaId, votes, voted, onChange }) {
  const { user } = useAuth()
  const [busy, setBusy] = useState(false)
  async function toggle() {
    if (!user || busy) return
    setBusy(true)
    const q = voted
      ? supabase.from('idea_votes').delete().eq('idea_id', ideaId).eq('user_id', user.id)
      : supabase.from('idea_votes').insert({ idea_id: ideaId })
    const { error } = await q
    setBusy(false)
    if (!error) onChange?.()
  }
  return (
    <button
      className={voted ? 'vote is-on' : 'vote'}
      onClick={toggle}
      disabled={!user || busy}
      aria-pressed={voted}
      title={user ? (voted ? 'Retirar voto' : 'Apoiar') : 'Entre para votar'}
    >
      <span aria-hidden="true">▲</span> {votes}
    </button>
  )
}

function NewIdeaForm({ onCreated }) {
  const [kind, setKind] = useState('ideia')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await supabase.from('ideas').insert({ kind, title: title.trim(), body: body.trim() })
    setBusy(false)
    if (error) return setError(friendlyError(error))
    setTitle('')
    setBody('')
    onCreated()
  }

  return (
    <form className="form new-idea" onSubmit={submit}>
      <div className="row">
        <label className="radio">
          <input type="radio" name="kind" checked={kind === 'ideia'} onChange={() => setKind('ideia')} /> Ideia
        </label>
        <label className="radio">
          <input type="radio" name="kind" checked={kind === 'sugestao'} onChange={() => setKind('sugestao')} /> Sugestão
        </label>
      </div>
      <label>
        Título
        <input required minLength={5} maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label>
        Descrição
        <textarea required minLength={10} maxLength={5000} rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
      </label>
      <Alert>{error}</Alert>
      <button className="btn" disabled={busy}>
        Publicar
      </button>
    </form>
  )
}

export default function Community() {
  const { user, isAdmin } = useAuth()
  const [sort, setSort] = useState('recentes')
  const [ideas, setIdeas] = useState(null)
  const avatars = useAvatars((ideas || []).map((i) => i.author_username))
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(() => {
    supabase.rpc('list_ideas', { p_sort: sort, p_limit: 50 }).then(({ data, error }) => {
      if (error) setError(friendlyError(error))
      setIdeas(data ?? [])
    })
  }, [sort])

  useEffect(load, [load])

  async function setHidden(id, hidden) {
    const { error } = await supabase.rpc('admin_set_idea_hidden', { p_id: id, p_hidden: hidden })
    if (error) setError(friendlyError(error))
    else load()
  }

  return (
    <Page
      title="Comunidade"
      subtitle="Ideias e sugestões para o AfriQuiz e para a valorização do saber africano."
      actions={
        user && (
          <button className="btn btn-yellow" onClick={() => setShowForm((s) => !s)}>
            {showForm ? 'Cancelar' : 'Nova ideia'}
          </button>
        )
      }
    >

      {!user && <LoginPrompt text="Entre para publicar, comentar e votar." />}
      {showForm && (
        <NewIdeaForm
          onCreated={() => {
            setShowForm(false)
            load()
          }}
        />
      )}

      <div className="tabs">
        <button className={sort === 'recentes' ? 'tab is-active' : 'tab'} onClick={() => setSort('recentes')}>
          Recentes
        </button>
        <button className={sort === 'populares' ? 'tab is-active' : 'tab'} onClick={() => setSort('populares')}>
          Mais votadas
        </button>
      </div>

      <Alert>{error}</Alert>
      {!ideas ? (
        <Spinner />
      ) : ideas.length === 0 ? (
        <p className="empty">Ainda não há publicações. Seja o primeiro a partilhar uma ideia!</p>
      ) : (
        <ul className="list">
          {ideas.map((i) => (
            <li key={i.id} className={i.hidden ? 'idea is-hidden' : 'idea'}>
              <VoteButton ideaId={i.id} votes={i.votes} voted={i.voted_by_me} onChange={load} />
              <div className="idea-main">
                <span className={`kind kind-${i.kind}`}>{i.kind === 'sugestao' ? 'Sugestão' : 'Ideia'}</span>
                {i.hidden && <span className="badge badge-rejected">Oculta</span>}
                <h2>
                  <Link to={`/comunidade/${i.id}`}>{i.title}</Link>
                </h2>
                <p className="clamp">{i.body}</p>
                <p className="meta who">
                  <Avatar url={avatars.get(i.author_username)} name={i.author_display_name || i.author_username} size={22} />
                  {i.author_display_name || i.author_username} · {formatDate(i.created_at)} · {i.comments} comentário
                  {i.comments === 1 ? '' : 's'}
                </p>
              </div>
              {isAdmin && (
                <button className="btn btn-sm btn-outline" onClick={() => setHidden(i.id, !i.hidden)}>
                  {i.hidden ? 'Mostrar' : 'Ocultar'}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Page>
  )
}
