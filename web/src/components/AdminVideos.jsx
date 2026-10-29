import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, friendlyError } from '../lib/supabase'
import { formatDate } from '../lib/categories'
import { thumbUrl, youtubeId } from '../lib/youtube'
import { Alert, Spinner } from './ui'

function VideoForm({ categories, initial, onSubmit, onCancel, submitLabel, withLink }) {
  const [f, setF] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const yt = withLink ? youtubeId(f.url) : null

  async function submit(e) {
    e.preventDefault()
    if (withLink && !yt) return setError('Cole o link de um vídeo do YouTube (por exemplo https://www.youtube.com/watch?v=…).')
    if (f.title.trim().length < 3) return setError('Escreva um título com pelo menos 3 letras.')
    setBusy(true)
    setError(null)
    const err = await onSubmit(f)
    setBusy(false)
    if (err) setError(friendlyError(err))
  }

  return (
    <form className="form video-form" onSubmit={submit}>
      {withLink && (
        <div className="video-form-link">
          <label>
            Link do YouTube
            <input
              id="video-url"
              inputMode="url"
              placeholder="https://www.youtube.com/watch?v=…"
              value={f.url}
              onChange={set('url')}
            />
          </label>
          <div className={yt ? 'video-preview is-ok' : 'video-preview'}>
            {yt ? <img src={thumbUrl(yt, 'mqdefault')} alt="Pré-visualização do vídeo" /> : <span>A miniatura aparece aqui</span>}
          </div>
        </div>
      )}
      <label>
        Título
        <input id="video-title" maxLength={150} value={f.title} onChange={set('title')} />
      </label>
      <label>
        <span>Descrição <small>(opcional)</small></span>
        <textarea id="video-desc" rows={4} maxLength={3000} value={f.description} onChange={set('description')} />
      </label>
      <label>
        <span>Categoria <small>(opcional)</small></span>
        <select id="video-cat" value={f.category} onChange={set('category')}>
          <option value="">Sem categoria</option>
          {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
      </label>
      <div className="row">
        <button className="btn btn-sm" disabled={busy}>{busy ? 'A guardar…' : submitLabel}</button>
        {onCancel && <button type="button" className="btn btn-sm btn-outline" onClick={onCancel}>Cancelar</button>}
      </div>
      <Alert>{error}</Alert>
    </form>
  )
}

function VideoRow({ v, categories, onChanged }) {
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState(null)

  async function toggleHidden() {
    const { error } = await supabase.rpc('admin_set_video_hidden', { p_id: v.id, p_hidden: !v.hidden })
    if (error) setError(friendlyError(error))
    else onChanged()
  }

  return (
    <li className={v.hidden ? 'review video-row is-hidden' : 'review video-row'}>
      <img className="video-row-thumb" src={thumbUrl(v.youtube_id, 'mqdefault')} alt="" loading="lazy" />
      <div className="video-row-main">
        {editing ? (
          <VideoForm
            categories={categories}
            initial={{ title: v.title, description: v.description ?? '', category: v.categories?.slug ?? '' }}
            submitLabel="Guardar alterações"
            onCancel={() => setEditing(false)}
            onSubmit={async (f) => {
              const { error } = await supabase.rpc('admin_update_video', {
                p_id: v.id, p_title: f.title, p_description: f.description, p_category: f.category,
              })
              if (error) return error
              setEditing(false)
              onChanged()
            }}
          />
        ) : (
          <>
            <div className="row row-between">
              {v.categories?.name ? <span className="kind">{v.categories.name}</span> : <span />}
              <span className="meta">
                {formatDate(v.created_at)} {v.hidden && <span className="badge badge-rejected">Oculto</span>}
              </span>
            </div>
            <Link to={`/videos/${v.id}`} className="review-q">{v.title}</Link>
            <div className="row">
              <button className="btn btn-sm btn-outline" onClick={() => setEditing(true)}>Editar</button>
              <button className={v.hidden ? 'btn btn-sm' : 'btn btn-sm btn-danger'} onClick={toggleHidden}>
                {v.hidden ? 'Mostrar no site' : 'Ocultar'}
              </button>
            </div>
          </>
        )}
        <Alert>{error}</Alert>
      </div>
    </li>
  )
}

export default function AdminVideos({ categories }) {
  const [videos, setVideos] = useState(null)
  const [error, setError] = useState(null)
  const [formKey, setFormKey] = useState(0)
  const [added, setAdded] = useState(null)

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('videos')
      .select('id, youtube_id, title, description, hidden, created_at, categories(slug, name)')
      .order('created_at', { ascending: false })
    if (error) setError(friendlyError(error))
    setVideos(data ?? [])
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="admin-videos">
      <section className="panel">
        <h2>Publicar um vídeo</h2>
        <p className="muted">Cole o link de um vídeo do YouTube. Aparece logo na página Vídeos.</p>
        <VideoForm
          key={formKey}
          withLink
          categories={categories}
          initial={{ url: '', title: '', description: '', category: '' }}
          submitLabel="Publicar vídeo"
          onSubmit={async (f) => {
            const { data, error } = await supabase.rpc('admin_add_video', {
              p_url: f.url, p_title: f.title, p_description: f.description, p_category: f.category,
            })
            if (error) return error
            setAdded(data)
            setFormKey((k) => k + 1)
            load()
          }}
        />
        {added && (
          <p className="alert alert-success">
            Vídeo publicado. <Link to={`/videos/${added}`}>Ver no site</Link>
          </p>
        )}
      </section>

      <h2 className="section-title">Vídeos publicados{videos ? ` (${videos.length})` : ''}</h2>
      <Alert>{error}</Alert>
      {!videos ? (
        <Spinner />
      ) : videos.length === 0 ? (
        <p className="empty">Ainda não publicou nenhum vídeo.</p>
      ) : (
        <ul className="list">
          {videos.map((v) => <VideoRow key={v.id} v={v} categories={categories} onChanged={load} />)}
        </ul>
      )}
    </div>
  )
}
