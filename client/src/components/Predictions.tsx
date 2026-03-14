import type { Prediction } from '../types'

export default function Predictions({ predictions }: { predictions: Prediction[] }) {
  if (predictions.length === 0) return null

  return (
    <div className="card">
      <h2>Predictions</h2>
      <p className="subtitle">Based on shared traits, we think...</p>
      <ul className="prediction-list">
        {predictions.map((p, i) => (
          <li key={i}>
            <strong>{p.person.name}</strong> might also: <em>{p.trait}</em>
            <span className="prediction-reason">
              (based on {p.basedOn.sharedCount} shared traits with {p.basedOn.person.name})
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
