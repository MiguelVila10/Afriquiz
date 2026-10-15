import { useEffect, useState } from 'react'
import { supabase, friendlyError } from '../lib/supabase'
import { useCategories } from '../lib/categories'
import { useAuth } from '../lib/auth'
import { Alert, Page, Spinner } from '../components/ui'
import Podium from '../components/Podium'

export default function Ranking() {
  const { categories } = useCategories()
  const { profile } = useAuth()
  const [filter, setFilter] = useState(null)
  const [rows, setRows] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    setRows(null)
    supabase.rpc('leaderboard', { p_category: filter, p_limit: 50 }).then(({ data, error }) => {
      if (error) setError(friendlyError(error))
      setRows(data ?? [])
    })
  }, [filter])

  return (
    <Page title="Ranking" subtitle="Pontos = respostas certas em jogos terminados. Só contam jogadores com conta.">

      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={filter === null} className={filter === null ? 'tab is-active' : 'tab'} onClick={() => setFilter(null)}>
          Geral
        </button>
        {categories.map((c) => (
          <button key={c.slug} role="tab" aria-selected={filter === c.slug} className={filter === c.slug ? 'tab is-active' : 'tab'} onClick={() => setFilter(c.slug)}>
            {c.name}
          </button>
        ))}
      </div>

      <Alert>{error}</Alert>
      {!rows ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <p className="empty">Ainda ninguém jogou nesta categoria. Seja o primeiro!</p>
      ) : (
        <>
        <div className="ranking-podium">
          <Podium rows={rows.slice(0, 3)} me={profile?.username} />
        </div>
        <h2 className="section-title">Classificação completa</h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Jogador</th>
                <th scope="col" className="num">Pontos</th>
                <th scope="col" className="num">Jogos</th>
                <th scope="col" className="num">Acerto</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.username} className={profile?.username === r.username ? 'is-me' : ''}>
                  <td>{r.pos}</td>
                  <td>
                    <strong>{r.display_name || r.username}</strong>
                    {r.display_name && <span className="muted"> @{r.username}</span>}
                  </td>
                  <td className="num">{r.points}</td>
                  <td className="num">{r.games}</td>
                  <td className="num">{r.accuracy ?? 0}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </Page>
  )
}
