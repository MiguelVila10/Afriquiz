import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, friendlyError } from '../lib/supabase'
import { useCategories, formatDate } from '../lib/categories'
import { thumbUrl } from '../lib/youtube'
import { Alert, Page, Spinner } from '../components/ui'

export default function Videos() {
  const { categories } = useCategories()
  const [filter, setFilter] = useState(null)
  const [videos, setVideos] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    setVideos(null)
    let q = supabase
      .from('videos')
      .select('id, youtube_id, title, created_at, hidden, categories(slug, name)')
      .eq('hidden', false)
      .order('created_at', { ascending: false })
    const cat = categories.find((c) => c.slug === filter)
    if (cat) q = q.eq('category_id', cat.id)
    q.then(({ data, error }) => {
      if (error) setError(friendlyError(error))
      setVideos(data ?? [])
    })
  }, [filter, categories])

  return (
    <Page title="Vídeos" subtitle="Vídeos sobre a história, a política e a cultura de África, escolhidos pela equipa do AfriQuiz.">
      <div className="tabs">
        <button className={filter === null ? 'tab is-active' : 'tab'} onClick={() => setFilter(null)}>
          Todos
        </button>
        {categories.map((c) => (
          <button key={c.slug} className={filter === c.slug ? 'tab is-active' : 'tab'} onClick={() => setFilter(c.slug)}>
            {c.name}
          </button>
        ))}
      </div>

      <Alert>{error}</Alert>
      {!videos ? (
        <Spinner />
      ) : videos.length === 0 ? (
        <p className="empty">Ainda não há vídeos aqui.</p>
      ) : (
        <ul className="grid-cards video-grid">
          {videos.map((v) => (
            <li key={v.id}>
              <Link to={`/videos/${v.id}`} className="video-card">
                <span className="video-thumb">
                  <img src={thumbUrl(v.youtube_id, 'mqdefault')} alt="" loading="lazy" />
                  <span className="play-btn small" aria-hidden="true" />
                </span>
                <span className="video-info">
                  {v.categories?.name && <span className="kind">{v.categories.name}</span>}
                  <h2>{v.title}</h2>
                  <span className="meta">{formatDate(v.created_at)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Page>
  )
}
