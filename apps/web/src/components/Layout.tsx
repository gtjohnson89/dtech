import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth'
import { AuthModal } from './AuthModal'

export function Layout() {
  const { user, signOut, setAuthOpen, loading } = useAuth()

  return (
    <div className="app-shell">
      <header className="topbar sticky">
        <div className="topbar-inner">
          <Link to="/" className="brand">
            <span className="brand-mark">D</span>
            <span className="brand-text">
              <b>d-Tech</b>
            </span>
          </Link>
          <nav className="nav" aria-label="Main">
            <NavLink to="/" end>
              Hot
            </NavLink>
            <NavLink to="/projects">Projects</NavLink>
            <NavLink to="/problems">Problems</NavLink>
            {user?.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
          </nav>
          <div className="top-actions">
            {loading ? null : user ? (
              <>
                <span className="who">{user.display_name || user.email}</span>
                <button type="button" className="btn ghost sm" onClick={() => void signOut()}>
                  Sign out
                </button>
              </>
            ) : (
              <button type="button" className="btn primary sm" onClick={() => setAuthOpen(true)}>
                Sign in
              </button>
            )}
          </div>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <footer className="footer">
        <p>
          Community co-design for practical dementia tech — not medical advice, not a medical device
          marketplace.
        </p>
      </footer>
      <AuthModal />
    </div>
  )
}
