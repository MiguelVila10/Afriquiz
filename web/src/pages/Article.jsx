import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatDate } from '../lib/categories'
import { Page, Paragraphs, Spinner, StatusBadge } from '../components/ui'

export default function Article() {
  const { id } = useParams()
  const [a, setA] = useState(undefined)

  useEffect(() => {
    supabase
      .from('articles')
      .select('id, title, summary, body, sources, status, created_at, categories(name, slug), profiles(username, display_name)')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => setA(data ?? null))
  }, [id])

  if (a === undefined) return <Page><Spinner /></Page>
  if (a === null)
    return (
      <Page title="Conhecimento não encontrado" back={{ to: '/aprender', label: 'Aprender' }}>
        <Link to="/aprender" className="btn">Voltar a Aprender</Link>
      </Page>
    )

  // ~200 palavras por minuto
  const minutes = Math.max(1, Math.round((a.body || '').split(/\s+/).length / 200))

  return (
    <Page
      back={{ to: '/aprender', label: 'Aprender' }}
      title={a.title}
      subtitle={`${a.categories?.name ?? ''} · ${a.profiles?.display_name || a.profiles?.username || 'AfriQuiz'} · ${formatDate(a.created_at)} · ${minutes} min de leitura`}
      narrow
    >
      <div className="read-progress" aria-hidden="true" />
      {a.status !== 'approved' && <StatusBadge status={a.status} />}
      {a.summary && <p className="lead">{a.summary}</p>}
      <div className="prose article-body">
        <Paragraphs text={a.body} />
      </div>
      {a.sources && (
        <>
          <h2 className="section-title">Fontes</h2>
          <div className="prose sources">
            <Paragraphs text={a.sources} />
          </div>
        </>
      )}
      {a.status === 'approved' && a.categories?.slug && (
        <div className="article-cta">
          <p>Já leu? Teste o que sabe sobre <strong>{a.categories.name}</strong>.</p>
          <Link to={`/jogar?categoria=${a.categories.slug}`} className="btn">Jogar esta categoria</Link>
        </div>
      )}
    </Page>
  )
}
