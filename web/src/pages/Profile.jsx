import { useEffect, useState } from 'react'
import { supabase, friendlyError } from '../lib/supabase'
import { formatDate } from '../lib/categories'
import { useAuth } from '../lib/auth'
import { Alert, Card, Page, Spinner } from '../components/ui'
import Avatar from '../components/Avatar'
import { removeAvatar, uploadAvatar } from '../lib/avatars'

function AvatarEditor({ profile, userId, onChanged }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function onFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      await uploadAvatar(file, userId)
      await onChanged()
    } catch (err) {
      setError(friendlyError(err))
    }
    setBusy(false)
  }

  async function onRemove() {
    setBusy(true)
    setError(null)
    try {
      await removeAvatar(userId)
      await onChanged()
    } catch (err) {
      setError(friendlyError(err))
    }
    setBusy(false)
  }

  return (
    <div className="avatar-editor">
      <Avatar url={profile.avatar_url} name={profile.display_name || profile.username} size={96} />
      <div className="avatar-actions">
        <label className={busy ? 'btn btn-sm is-busy' : 'btn btn-sm'}>
          {busy ? 'A enviar…' : profile.avatar_url ? 'Mudar foto' : 'Carregar foto'}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} disabled={busy} hidden />
        </label>
        {profile.avatar_url && (
          <button type="button" className="link-btn dark" onClick={onRemove} disabled={busy}>
            Remover foto
          </button>
        )}
        <small className="muted">JPG, PNG ou WebP. A foto é recortada em quadrado e reduzida automaticamente.</small>
        <Alert>{error}</Alert>
      </div>
    </div>
  )
}

export default function Profile() {
  const { profile, user, refreshProfile } = useAuth()
  const [form, setForm] = useState({ display_name: '', bio: '' })
  const [history, setHistory] = useState(null)
  const [msg, setMsg] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (profile) setForm({ display_name: profile.display_name ?? '', bio: profile.bio ?? '' })
  }, [profile])

  useEffect(() => {
    supabase.rpc('my_history', { p_limit: 30 }).then(({ data }) => setHistory(data ?? []))
  }, [])

  async function save(e) {
    e.preventDefault()
    setMsg(null)
    setError(null)
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: form.display_name.trim() || null, bio: form.bio.trim() || null })
      .eq('id', user.id)
    if (error) return setError(friendlyError(error))
    setMsg('Perfil guardado.')
    refreshProfile()
  }

  if (!profile) return <Page><Spinner /></Page>

  const games = history?.length ?? 0
  const points = history?.reduce((s, h) => s + h.score, 0) ?? 0

  return (
    <Page
      title={profile.display_name || `@${profile.username}`}
      subtitle={`@${profile.username} · membro desde ${formatDate(profile.created_at)} · ${user.email} (privado)`}
    >
    <div className="split">
      <Card>
        <h2>O meu perfil</h2>
        <AvatarEditor profile={profile} userId={user.id} onChanged={refreshProfile} />
        <div className="stats">
          <div><strong>{games}</strong><span>jogos</span></div>
          <div><strong>{points}</strong><span>pontos</span></div>
        </div>
        <form className="form" onSubmit={save}>
          <label>
            Nome a mostrar
            <input maxLength={50} value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
          </label>
          <label>
            Sobre mim
            <textarea maxLength={280} rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          </label>
          <Alert>{error}</Alert>
          <Alert kind="success">{msg}</Alert>
          <button className="btn">Guardar</button>
        </form>
      </Card>

      <Card>
        <h2>Últimos jogos</h2>
        {!history ? (
          <Spinner />
        ) : history.length === 0 ? (
          <p className="empty">Ainda não terminou nenhum jogo.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Categoria</th><th className="num">Resultado</th><th className="num">Data</th></tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.session_id}>
                    <td>{h.category_name}</td>
                    <td className="num">{h.score} / {h.total}</td>
                    <td className="num">{formatDate(h.finished_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
    </Page>
  )
}
