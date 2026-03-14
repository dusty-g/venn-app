import type { Fact } from '../types'

interface Props {
  facts: Fact[]
  onDelete: (id: number) => void
  onRemovePerson: (factId: number, personId: number) => void
}

export default function FactList({ facts, onDelete, onRemovePerson }: Props) {
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
                <span key={p.id} className="chip small removable">
                  {p.name}
                  <button className="chip-remove" onClick={() => onRemovePerson(f.id, p.id)}>&times;</button>
                </span>
              ))}
            </span>
            <button className="fact-delete" onClick={() => onDelete(f.id)}>&times;</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
