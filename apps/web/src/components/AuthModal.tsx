import { useState, type FormEvent } from 'react'
import { api } from '../api'
import { useAuth } from '../auth'

export function AuthModal() {
  const { authOpen, setAuthOpen, authRedirect, applySession } = useAuth()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [devUrl, setDevUrl] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!authOpen) return null

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setStatus('idle')
    setMessage('')
    setDevUrl(null)
    try {
      const res = await api.magicLink(email.trim(), authRedirect || undefined)
      setStatus('sent')
      setMessage(res.message)
      if (res.dev_verify_url) setDevUrl(res.dev_verify_url)
      if (res.dev_token) {
        // Local convenience: auto-verify in dev when API returns token
        const verified = await api.verify(res.dev_token)
        applySession(verified.access_token, verified.user)
        setAuthOpen(false)
        setStatus('idle')
        setEmail('')
      }
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'Could not send link')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={() => setAuthOpen(false)}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" type="button" onClick={() => setAuthOpen(false)} aria-label="Close">
          ×
        </button>
        <p className="eyebrow">Sign in</p>
        <h2 id="auth-title">Join the co-design lab</h2>
        <p className="muted">
          Email a one-tap link — no password. Facebook Login is coming soon for group members.
        </p>
        <form onSubmit={onSubmit} className="stack">
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>
          <button className="btn primary" type="submit" disabled={busy}>
            {busy ? 'Sending…' : 'Email me a sign-in link'}
          </button>
        </form>
        {message && <p className={status === 'error' ? 'error' : 'ok'}>{message}</p>}
        {devUrl && (
          <p className="dev-hint">
            Dev link: <a href={devUrl}>{devUrl}</a>
          </p>
        )}
        <button type="button" className="btn ghost fb-soon" disabled title="Coming soon">
          Continue with Facebook (soon)
        </button>
      </div>
    </div>
  )
}
