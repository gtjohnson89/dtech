import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type Suggestion } from '../api'
import { useAuth } from '../auth'

export function Admin() {
  const { user, loading } = useAuth()
  const [items, setItems] = useState<Suggestion[]>([])
  const [error, setError] = useState<string | null>(null)

  async function load() {
    const rows = await api.adminSuggestions()
    setItems(rows)
  }

  useEffect(() => {
    if (user?.role === 'admin') {
      load().catch((e) => setError(e instanceof Error ? e.message : 'Failed'))
    }
  }, [user])

  if (loading) return <p className="muted page-pad">Loading…</p>
  if (!user || user.role !== 'admin') {
    return (
      <div className="page-pad">
        <h1>Admin</h1>
        <p className="error">Sign in with an admin email to moderate suggestions.</p>
      </div>
    )
  }

  async function patch(id: string, status: string) {
    await api.adminPatchSuggestion(id, status)
    await load()
  }

  return (
    <div className="page-pad" style={{ maxWidth: 740 }}>
      <h1>Admin queue</h1>
      <p className="muted">Moderate community ideas. Highest votes first.</p>
      {error && <p className="error">{error}</p>}
      <ul className="admin-list">
        {items.map((s) => (
          <li key={s.id}>
            <div>
              <Link to={`/p/${s.project_id}`}>{s.project_id}</Link>
              <p style={{ margin: '0.35rem 0' }}>{s.body}</p>
              <span className="meta">
                {s.vote_count} votes · {s.status} · {s.author_display_name}
              </span>
            </div>
            <div className="admin-actions">
              <button type="button" className="btn ghost sm" onClick={() => void patch(s.id, 'visible')}>
                Visible
              </button>
              <button type="button" className="btn ghost sm" onClick={() => void patch(s.id, 'hidden')}>
                Hide
              </button>
              <button type="button" className="btn ghost sm" onClick={() => void patch(s.id, 'spam')}>
                Spam
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
