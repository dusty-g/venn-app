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
