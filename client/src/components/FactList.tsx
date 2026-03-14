import type { Fact } from '../types'

export default function FactList({ facts }: { facts: Fact[] }) {
  if (facts.length === 0) return null

  return (
    <div className="card">
      <h2>Logged</h2>
      <ul className="fact-list">
        {facts.map(f => (
          <li key={f.id}>
            <span className="trait">{f.trait}</span>
            <span className="people-tags">
              {f.people.map(p => (
                <span key={p.id} className="chip small">{p.name}</span>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
