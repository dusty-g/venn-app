import { useState } from 'react'
import type { Fact, Person } from '../types'

interface Props {
  facts: Fact[]
  allPeople: Person[]
  onAddPerson: (trait: string, personId: number) => void
}

export default function FactList({ facts, allPeople, onAddPerson }: Props) {
  const [expandedId, setExpandedId] = useState<number | null>(null)

  if (facts.length === 0) return null

  return (
    <div className="card">
      <h2>Logged</h2>
      <ul className="fact-list">
        {facts.map(f => {
          const taggedIds = new Set(f.people.map(p => p.id))
          const untagged = allPeople.filter(p => !taggedIds.has(p.id))
          const isExpanded = expandedId === f.id

          return (
            <li key={f.id}>
              <div className="fact-row">
                <span className="trait">{f.trait}</span>
                <span className="people-tags">
                  {f.people.map(p => (
                    <span key={p.id} className="chip small">{p.name}</span>
                  ))}
                </span>
                {untagged.length > 0 && (
                  <button
                    className="fact-add"
                    onClick={() => setExpandedId(isExpanded ? null : f.id)}
                  >+</button>
                )}
              </div>
              {isExpanded && untagged.length > 0 && (
                <div className="fact-add-people">
                  {untagged.map(p => (
                    <button
                      key={p.id}
                      className="chip small"
                      onClick={() => { onAddPerson(f.trait, p.id); setExpandedId(null) }}
                    >
                      + {p.name}
                    </button>
                  ))}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
