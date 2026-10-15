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
      .select('id, title, summary, body, sources, status, created_at, categories(name), profiles(username, display_name)')
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

  return (
    <Page
      back={{ to: '/aprender', label: 'Aprender' }}
      title={a.title}
      subtitle={`${a.categories?.name ?? ''} · ${a.profiles?.display_name || a.profiles?.username || 'AfriQuiz'} · ${formatDate(a.created_at)}`}
      narrow
    >
      {a.status !== 'approved' && <StatusBadge status={a.status} />}
      {a.summary && <p className="lead">{a.summary}</p>}
      <div className="prose">
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
    </Page>
  )
}
