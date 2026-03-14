import { getFactPeopleMatrix } from './db.js'

export function computeOverlaps() {
  const { people, facts, has } = getFactPeopleMatrix()
  const overlaps: {
    person1: { id: number; name: string }
    person2: { id: number; name: string }
    sharedTraits: string[]
    count: number
  }[] = []

  for (let i = 0; i < people.length; i++) {
    for (let j = i + 1; j < people.length; j++) {
      const shared = facts.filter(f => has(f.id, people[i].id) && has(f.id, people[j].id))
      if (shared.length > 0) {
        overlaps.push({
          person1: people[i],
          person2: people[j],
          sharedTraits: shared.map(f => f.trait),
          count: shared.length,
        })
      }
    }
  }

  return overlaps.sort((a, b) => b.count - a.count)
}

export function computePredictions() {
  const { people, facts, has } = getFactPeopleMatrix()

  // Build trait vectors per person
  const vectors = new Map<number, Set<number>>()
  for (const p of people) {
    vectors.set(p.id, new Set(facts.filter(f => has(f.id, p.id)).map(f => f.id)))
  }

  // Cosine similarity between two people
  function similarity(a: number, b: number): number {
    const va = vectors.get(a)!
    const vb = vectors.get(b)!
    if (va.size === 0 || vb.size === 0) return 0
    let shared = 0
    for (const id of va) if (vb.has(id)) shared++
    return shared / Math.sqrt(va.size * vb.size)
  }

  const predictions: {
    person: { id: number; name: string }
    trait: string
    confidence: number
    basedOn: { person: { id: number; name: string }; sharedCount: number }
  }[] = []

  for (const target of people) {
    const targetTraits = vectors.get(target.id)!

    for (const other of people) {
      if (other.id === target.id) continue
      const sim = similarity(target.id, other.id)
      if (sim < 0.3) continue // need meaningful similarity

      const otherTraits = vectors.get(other.id)!
      let sharedCount = 0
      for (const id of targetTraits) if (otherTraits.has(id)) sharedCount++

      // Find traits other has that target doesn't
      for (const factId of otherTraits) {
        if (!targetTraits.has(factId)) {
          const fact = facts.find(f => f.id === factId)!
          // Avoid duplicate predictions
          if (!predictions.some(p => p.person.id === target.id && p.trait === fact.trait)) {
            predictions.push({
              person: target,
              trait: fact.trait,
              confidence: sim,
              basedOn: { person: other, sharedCount },
            })
          }
        }
      }
    }
  }

  return predictions.sort((a, b) => b.confidence - a.confidence).slice(0, 20)
}

export function computePCA() {
  const { people, facts, has } = getFactPeopleMatrix()
  if (people.length < 2 || facts.length === 0) return []

  const n = people.length
  const d = facts.length

  // Build binary matrix: people x traits
  const matrix: number[][] = people.map(p =>
    facts.map(f => has(f.id, p.id) ? 1 : 0)
  )

  // Center columns (subtract mean of each trait)
  const means = Array.from({ length: d }, (_, j) =>
    matrix.reduce((sum, row) => sum + row[j], 0) / n
  )
  const centered = matrix.map(row => row.map((v, j) => v - means[j]))

  // Compute covariance matrix (d x d) then extract top 2 eigenvectors
  // For efficiency, compute X^T X (n x n) instead since n << d typically
  // Eigenvectors of (1/n) X X^T give us the projection directly
  const gram: number[][] = Array.from({ length: n }, () => Array(n).fill(0))
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      let dot = 0
      for (let k = 0; k < d; k++) dot += centered[i][k] * centered[j][k]
      gram[i][j] = dot / n
      gram[j][i] = dot / n
    }
  }

  // Power iteration for top 2 eigenvectors of the gram matrix
  function powerIteration(mat: number[][], deflated?: number[]): { vec: number[]; val: number } {
    let v = Array.from({ length: n }, () => Math.random() - 0.5)
    // Normalize
    let norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0))
    v = v.map(x => x / norm)

    for (let iter = 0; iter < 100; iter++) {
      // Multiply mat * v
      let mv = mat.map((row, i) => row.reduce((s, val, j) => s + val * v[j], 0))

      // If deflating, remove component along previous eigenvector
      if (deflated) {
        const proj = mv.reduce((s, x, i) => s + x * deflated[i], 0)
        mv = mv.map((x, i) => x - proj * deflated[i])
      }

      norm = Math.sqrt(mv.reduce((s, x) => s + x * x, 0))
      if (norm === 0) return { vec: v, val: 0 }
      v = mv.map(x => x / norm)
    }

    const eigenval = v.map((_, i) =>
      mat[i].reduce((s, val, j) => s + val * v[j], 0)
    ).reduce((s, x, i) => s + x * v[i], 0)

    return { vec: v, val: eigenval }
  }

  const { vec: e1 } = powerIteration(gram)
  const { vec: e2 } = powerIteration(gram, e1)

  return people.map((p, i) => ({
    name: p.name,
    x: e1[i],
    y: e2[i],
  }))
}
