export interface Person {
  id: number
  name: string
}

export interface Fact {
  id: number
  trait: string
  people: Person[]
  created_at: string
}

export interface Overlap {
  person1: Person
  person2: Person
  sharedTraits: string[]
  count: number
}

export interface Prediction {
  person: Person
  trait: string
  confidence: number
  basedOn: { person: Person; sharedCount: number }
}

export interface PCAPoint {
  name: string
  x: number
  y: number
}
