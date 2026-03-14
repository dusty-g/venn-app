import type { Person, Fact, Overlap, Prediction, PCAPoint } from './types'

const BASE = '/api'

function getPassphrase(): string {
  return localStorage.getItem('venn-passphrase') || ''
}

export function setPassphrase(p: string) {
  localStorage.setItem('venn-passphrase', p)
}

export function clearPassphrase() {
  localStorage.removeItem('venn-passphrase')
}

async function json<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(BASE + url, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'X-Passphrase': getPassphrase(),
      ...opts?.headers,
    },
  })
  if (res.status === 401) {
    clearPassphrase()
    throw new Error('Invalid passphrase')
  }
  return res.json()
}

export const api = {
  getPeople: () => json<Person[]>('/people'),
  addPerson: (name: string) => json<Person>('/people', { method: 'POST', body: JSON.stringify({ name }) }),
  getFacts: () => json<Fact[]>('/facts'),
  addFact: (trait: string, personIds: number[]) =>
    json<Fact>('/facts', { method: 'POST', body: JSON.stringify({ trait, personIds }) }),
  deleteFact: (id: number) => json<{ ok: boolean }>(`/facts/${id}`, { method: 'DELETE' }),
  removePersonFromFact: (factId: number, personId: number) =>
    json<{ ok: boolean }>(`/facts/${factId}/people/${personId}`, { method: 'DELETE' }),
  getOverlaps: () => json<Overlap[]>('/overlaps'),
  getPredictions: () => json<Prediction[]>('/predictions'),
  getPCA: () => json<PCAPoint[]>('/pca'),
}
