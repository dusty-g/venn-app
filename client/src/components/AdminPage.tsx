import { useEffect, useState, useCallback } from 'react'
import type { Person, Fact } from '../types'
import { api } from '../api'

export default function AdminPage() {
  const [people, setPeople] = useState<Person[]>([])
  const [facts, setFacts] = useState<Fact[]>([])
  const [editingPerson, setEditingPerson] = useState<number | null>(null)
  const [editingFact, setEditingFact] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')

  const refresh = useCallback(async () => {
    const [p, f] = await Promise.all([api.getPeople(), api.getFacts()])
    setPeople(p)
    setFacts(f)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const startEditPerson = (p: Person) => {
    setEditingPerson(p.id)
    setEditingFact(null)
    setEditValue(p.name)
  }

  const startEditFact = (f: Fact) => {
    setEditingFact(f.id)
    setEditingPerson(null)
    setEditValue(f.trait)
  }

  const savePersonName = async (id: number) => {
    if (editValue.trim()) {
      await api.renamePerson(id, editValue.trim())
      setEditingPerson(null)
      refresh()
    }
  }

  const saveFactTrait = async (id: number) => {
    if (editValue.trim()) {
      await api.renameFact(id, editValue.trim())
      setEditingFact(null)
      refresh()
    }
  }

  return (
    <>
      <div className="card">
        <h2>People</h2>
        <ul className="admin-list">
          {people.map(p => (
            <li key={p.id} className="admin-item">
              {editingPerson === p.id ? (
                <div className="admin-edit-row">
                  <input
                    className="admin-input"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && savePersonName(p.id)}
                    autoFocus
                  />
                  <button className="admin-save" onClick={() => savePersonName(p.id)}>Save</button>
                  <button className="admin-cancel" onClick={() => setEditingPerson(null)}>Cancel</button>
                </div>
              ) : (
                <div className="admin-row">
                  <span className="admin-name">{p.name}</span>
                  <div className="admin-actions">
                    <button className="admin-btn" onClick={() => startEditPerson(p)}>Edit</button>
                    <button className="admin-btn danger" onClick={async () => { await api.deletePerson(p.id); refresh() }}>Delete</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h2>Facts</h2>
        <ul className="admin-list">
          {facts.map(f => (
            <li key={f.id} className="admin-item">
              {editingFact === f.id ? (
                <div className="admin-edit-row">
                  <input
                    className="admin-input"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveFactTrait(f.id)}
                    autoFocus
                  />
                  <button className="admin-save" onClick={() => saveFactTrait(f.id)}>Save</button>
                  <button className="admin-cancel" onClick={() => setEditingFact(null)}>Cancel</button>
                </div>
              ) : (
                <div className="admin-row">
                  <span className="admin-name">{f.trait}</span>
                  <div className="admin-actions">
                    <button className="admin-btn" onClick={() => startEditFact(f)}>Edit</button>
                    <button className="admin-btn danger" onClick={async () => { await api.deleteFact(f.id); refresh() }}>Delete</button>
                  </div>
                </div>
              )}
              <div className="admin-chips">
                {f.people.map(p => (
                  <span key={p.id} className="chip small removable">
                    {p.name}
                    <button className="chip-remove" onClick={async () => { await api.removePersonFromFact(f.id, p.id); refresh() }}>&times;</button>
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
