import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, friendlyError } from '../lib/supabase'
import { useCategories, formatDate } from '../lib/categories'
import { Alert, Page, Spinner } from '../components/ui'

export default function Learn() {
  const { categories } = useCategories()
  const [filter, setFilter] = useState(null)
  const [articles, setArticles] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    setArticles(null)
    let q = supabase
      .from('articles')
      .select('id, title, summary, created_at, category_id, categories(slug, name), profiles(username, display_name)')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(60)
    const cat = categories.find((c) => c.slug === filter)
    if (cat) q = q.eq('category_id', cat.id)
    q.then(({ data, error }) => {
      if (error) setError(friendlyError(error))
      setArticles(data ?? [])
    })
  }, [filter, categories])

  return (
    <Page
      title="Aprender"
      subtitle="Textos escritos pela comunidade e revistos antes de publicados."
      actions={
        <Link to="/contribuir?tipo=conhecimento" className="btn btn-yellow">
          Partilhar conhecimento
        </Link>
      }
    >

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
      {!articles ? (
        <Spinner />
      ) : articles.length === 0 ? (
        <p className="empty">
          Ainda não há conhecimentos publicados aqui. <Link to="/contribuir?tipo=conhecimento">Escreva o primeiro.</Link>
        </p>
      ) : (
        <ul className="grid-cards">
          {articles.map((a) => (
            <li key={a.id}>
              <Link to={`/aprender/${a.id}`} className={`article-card cat-${a.categories?.slug ?? 'x'}`}>
                <span className="kind">{a.categories?.name}</span>
                <h2>{a.title}</h2>
                {a.summary && <p className="clamp">{a.summary}</p>}
                <p className="meta article-foot">
                  <span>{a.profiles?.display_name || a.profiles?.username || 'AfriQuiz'} · {formatDate(a.created_at)}</span>
                  <span className="read-more" aria-hidden="true">Ler →</span>
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Page>
  )
}
