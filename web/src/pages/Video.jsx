import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatDate } from '../lib/categories'
import { thumbUrl, watchUrl } from '../lib/youtube'
import { Page, Paragraphs, Spinner } from '../components/ui'
import VideoPlayer from '../components/VideoPlayer'

export default function Video() {
  const { id } = useParams()
  const [v, setV] = useState(undefined)
  const [more, setMore] = useState([])

  useEffect(() => {
    setV(undefined)
    supabase
      .from('videos')
      .select('id, youtube_id, title, description, hidden, created_at, category_id, categories(name, slug)')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => setV(data ?? null))
    supabase
      .from('videos')
      .select('id, youtube_id, title')
      .eq('hidden', false)
      .neq('id', id)
      .order('created_at', { ascending: false })
      .limit(4)
      .then(({ data }) => setMore(data ?? []))
  }, [id])

  if (v === undefined) return <Page><Spinner /></Page>
  if (v === null)
    return (
      <Page title="Vídeo não encontrado" back={{ to: '/videos', label: 'Vídeos' }}>
        <Link to="/videos" className="btn">Voltar aos vídeos</Link>
      </Page>
    )

  return (
    <Page
      back={{ to: '/videos', label: 'Vídeos' }}
      title={v.title}
      subtitle={[v.categories?.name, formatDate(v.created_at)].filter(Boolean).join(' · ')}
      narrow
    >
      {v.hidden && <p className="alert alert-info">Este vídeo está oculto: só a gestão o vê.</p>}
      <VideoPlayer id={v.youtube_id} title={v.title} />
      <p className="video-source">
        <a href={watchUrl(v.youtube_id)} target="_blank" rel="noopener noreferrer">Ver no YouTube ↗</a>
      </p>
      {v.description && (
        <div className="prose article-body">
          <Paragraphs text={v.description} />
        </div>
      )}
      {v.categories?.slug && (
        <div className="article-cta">
          <p>Já viu? Teste o que sabe sobre <strong>{v.categories.name}</strong>.</p>
          <Link to={`/jogar?categoria=${v.categories.slug}`} className="btn">Jogar esta categoria</Link>
        </div>
      )}
      {more.length > 0 && (
        <>
          <h2 className="section-title">Mais vídeos</h2>
          <ul className="more-videos">
            {more.map((m) => (
              <li key={m.id}>
                <Link to={`/videos/${m.id}`} className="more-video">
                  <img src={thumbUrl(m.youtube_id, 'mqdefault')} alt="" loading="lazy" />
                  <span>{m.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </Page>
  )
}
