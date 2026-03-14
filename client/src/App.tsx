import { useEffect, useState, useCallback } from 'react'
import type { Person, Fact, Overlap, Prediction } from './types'
import { api, setPassphrase } from './api'
import PeopleManager from './components/PeopleManager'
import AddFact from './components/AddFact'
import FactList from './components/FactList'
import Overlaps from './components/Overlaps'
import Predictions from './components/Predictions'
import SimilarityMap from './components/SimilarityMap'
import './App.css'

type Tab = 'log' | 'overlaps' | 'predictions'

const isPCARoute = window.location.pathname === '/pca'

export default function App() {
  const [authed, setAuthed] = useState(!!localStorage.getItem('venn-passphrase'))
  const [phrase, setPhrase] = useState('')
  const [error, setError] = useState('')
  const [people, setPeople] = useState<Person[]>([])
  const [facts, setFacts] = useState<Fact[]>([])
  const [overlaps, setOverlaps] = useState<Overlap[]>([])
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [tab, setTab] = useState<Tab>('log')

  const refresh = useCallback(async () => {
    try {
      const [p, f, o, pr] = await Promise.all([
        api.getPeople(),
        api.getFacts(),
        api.getOverlaps(),
        api.getPredictions(),
      ])
      setPeople(p)
      setFacts(f)
      setOverlaps(o)
      setPredictions(pr)
    } catch {
      setAuthed(false)
    }
  }, [])

  useEffect(() => { if (authed) refresh() }, [authed, refresh])

  const handleLogin = async () => {
    setPassphrase(phrase)
    try {
      await api.getPeople()
      setAuthed(true)
      setError('')
    } catch {
      setError('Wrong passphrase')
    }
  }

  if (!authed) {
    return (
      <div className="app">
        <header>
          <h1>Venn</h1>
          <p className="tagline">find the overlaps</p>
        </header>
        <div className="card">
          <h2>Enter passphrase</h2>
          <div className="input-row">
            <input
              type="password"
              value={phrase}
              onChange={e => setPhrase(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="passphrase..."
            />
            <button onClick={handleLogin}>Go</button>
          </div>
          {error && <p className="error">{error}</p>}
        </div>
      </div>
    )
  }

  if (isPCARoute) {
    return (
      <div className="app">
        <header>
          <h1>Venn</h1>
          <p className="tagline">similarity map</p>
        </header>
        <SimilarityMap />
      </div>
    )
  }

  return (
    <div className="app">
      <header>
        <h1>Venn</h1>
        <p className="tagline">find the overlaps</p>
      </header>

      <PeopleManager people={people} onUpdate={refresh} />

      <nav className="tabs">
        <button className={tab === 'log' ? 'active' : ''} onClick={() => setTab('log')}>Log</button>
        <button className={tab === 'overlaps' ? 'active' : ''} onClick={() => setTab('overlaps')}>
          Overlaps {overlaps.length > 0 && <span className="badge">{overlaps.length}</span>}
        </button>
        <button className={tab === 'predictions' ? 'active' : ''} onClick={() => setTab('predictions')}>
          Predictions {predictions.length > 0 && <span className="badge">{predictions.length}</span>}
        </button>
      </nav>

      {tab === 'log' && (
        <>
          <AddFact people={people} onAdded={refresh} />
          <FactList
            facts={facts}
            onDelete={async (id) => { await api.deleteFact(id); refresh() }}
            onRemovePerson={async (factId, personId) => { await api.removePersonFromFact(factId, personId); refresh() }}
          />
        </>
      )}
      {tab === 'overlaps' && <Overlaps overlaps={overlaps} />}
      {tab === 'predictions' && <Predictions predictions={predictions} />}
    </div>
  )
}
