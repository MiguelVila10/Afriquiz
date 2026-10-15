import { stagger } from '../lib/motion'

const MEDALS = ['🥇', '🥈', '🥉']

// Pódio (2.º · 1.º · 3.º) + lista do 4.º em diante. `me` = username do jogador atual.
export default function Podium({ rows, me, baseDelay = 0, compact = false }) {
  if (!rows?.length) return null
  const top = rows.slice(0, 3)
  const rest = rows.slice(3)
  const order = [top[1], top[0], top[2]].filter(Boolean)
  const place = (r) => top.indexOf(r)

  return (
    <div className={compact ? 'podium-wrap is-compact' : 'podium-wrap'}>
      <ol className="podium" aria-label="Pódio">
        {order.map((r, i) => {
          const p = place(r)
          return (
            <li key={r.username} className={`podium-col place-${p + 1} ${r.username === me ? 'is-me' : ''}`} style={stagger(i, baseDelay, 140)}>
              <span className="podium-medal" aria-hidden="true">{MEDALS[p]}</span>
              <span className="podium-name">{r.display_name || r.username}</span>
              <span className="podium-points">{r.points} pts</span>
              <div className="podium-block">
                <span className="podium-pos">{p + 1}</span>
              </div>
            </li>
          )
        })}
      </ol>

      {rest.length > 0 && (
        <ol className="rank-list" start={4}>
          {rest.map((r, i) => (
            <li key={r.username} className={r.username === me ? 'rank-row is-me' : 'rank-row'} style={stagger(i, baseDelay + 450, 60)}>
              <span className="rank-pos">{r.pos}</span>
              <span className="rank-name">
                {r.display_name || r.username}
                {r.username === me && <span className="you-tag">você</span>}
              </span>
              <span className="rank-acc">{r.accuracy ?? 0}%</span>
              <span className="rank-pts">{r.points} pts</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
