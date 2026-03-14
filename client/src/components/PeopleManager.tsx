import { useState } from 'react'
import type { Person } from '../types'
import { api } from '../api'

export default function PeopleManager({ people, onUpdate }: { people: Person[]; onUpdate: () => void }) {
  const [name, setName] = useState('')

  const add = async () => {
    if (!name.trim()) return
    await api.addPerson(name.trim())
    setName('')
    onUpdate()
  }

  return (
    <div className="card">
      <h2>People</h2>
      <div className="input-row">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="Add someone..."
        />
        <button onClick={add}>+</button>
      </div>
      <div className="chips">
        {people.map(p => (
          <span key={p.id} className="chip">{p.name}</span>
        ))}
      </div>
    </div>
  )
}
