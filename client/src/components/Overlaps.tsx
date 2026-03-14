import { useState } from 'react'
import type { Overlap } from '../types'

export default function Overlaps({ overlaps }: { overlaps: Overlap[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (overlaps.length === 0) return null

  return (
    <div className="card">
      <h2>Overlaps</h2>
      <ul className="overlap-list">
        {overlaps.map(o => {
          const key = `${o.person1.id}-${o.person2.id}`
          const isOpen = expanded === key
          return (
            <li key={key} onClick={() => setExpanded(isOpen ? null : key)} className="overlap-item">
              <div className="overlap-header">
                <span>{o.person1.name} & {o.person2.name}</span>
                <span className="badge">{o.count}</span>
              </div>
              {isOpen && (
                <ul className="shared-traits">
                  {o.sharedTraits.map(t => <li key={t}>{t}</li>)}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
