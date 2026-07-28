import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth'

export function Verify() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { applySession } = useAuth()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = params.get('token')
    if (!token) {
      setError('Missing sign-in token')
      return
    }
    api
      .verify(token)
      .then((res) => {
        applySession(res.access_token, res.user)
        navigate(res.redirect_path || '/', { replace: true })
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Sign-in failed'))
  }, [params, applySession, navigate])

  return (
    <div className="page">
      <h1>Signing you in…</h1>
      {error ? <p className="error">{error}</p> : <p className="muted">One moment.</p>}
    </div>
  )
}
