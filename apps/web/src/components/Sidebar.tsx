import { Link } from 'react-router-dom'
import type { Problem } from '../api'

type Props = {
  topProblems?: Problem[]
}

export function Sidebar({ topProblems = [] }: Props) {
  return (
    <aside className="sidebar" aria-label="About">
      <section className="side-card">
        <h2>About d-Tech</h2>
        <p>
          A co-design lab for simpler dementia tech. Research finds caregiver pain; you upvote what
          should get built and leave short ideas.
        </p>
        <ul className="side-list">
          <li>▲ upvote products &amp; problems</li>
          <li>Comment with tweaks that matter</li>
          <li>Strong ideas steer the build queue</li>
        </ul>
      </section>

      {topProblems.length > 0 && (
        <section className="side-card">
          <h2>Top problems</h2>
          <ul className="side-links">
            {topProblems.slice(0, 5).map((p) => (
              <li key={p.id}>
                <Link to={`/problem/${p.id}`}>{p.title}</Link>
              </li>
            ))}
          </ul>
          <Link className="side-more" to="/problems">
            All problems →
          </Link>
        </section>
      )}

      <section className="side-card side-note">
        <p>Not medical advice. Consumer aids under exploration — not certified medical devices.</p>
      </section>
    </aside>
  )
}
