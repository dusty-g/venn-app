import { useState } from 'react'
import type { Person } from '../types'
import { api } from '../api'

export default function AddFact({ people, onAdded }: { people: Person[]; onAdded: () => void }) {
  const [trait, setTrait] = useState('')
  const [selected, setSelected] = useState<Set<number>>(new Set())

  const toggle = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const submit = async () => {
    if (!trait.trim() || selected.size === 0) return
    await api.addFact(trait.trim(), [...selected])
    setTrait('')
    setSelected(new Set())
    onAdded()
  }

  return (
    <div className="card add-fact">
      <h2>Log a thing</h2>
      <input
        value={trait}
        onChange={e => setTrait(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && submit()}
        placeholder='e.g. "loves shrimp"'
        className="trait-input"
      />
      <div className="chips">
        {people.map(p => (
          <button
            key={p.id}
            className={`chip ${selected.has(p.id) ? 'selected' : ''}`}
            onClick={() => toggle(p.id)}
          >
            {p.name}
          </button>
        ))}
      </div>
      <button
        onClick={submit}
        disabled={!trait.trim() || selected.size === 0}
        className="btn-primary"
      >
        Save
      </button>
    </div>
  )
}
