import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const db = new Database(path.join(__dirname, '..', 'venn.db'))

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS people (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE COLLATE NOCASE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS facts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trait TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS fact_people (
    fact_id INTEGER REFERENCES facts(id) ON DELETE CASCADE,
    person_id INTEGER REFERENCES people(id) ON DELETE CASCADE,
    PRIMARY KEY (fact_id, person_id)
  );
`)

export function getPeople() {
  return db.prepare('SELECT id, name FROM people ORDER BY name').all()
}

function normalizeName(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
}

export function addPerson(name: string) {
  const normalized = normalizeName(name)
  const result = db.prepare('INSERT INTO people (name) VALUES (?)').run(normalized)
  return { id: result.lastInsertRowid, name: normalized }
}

export function getFacts() {
  const facts = db.prepare('SELECT id, trait, created_at FROM facts ORDER BY created_at DESC').all() as any[]
  const stmtPeople = db.prepare(`
    SELECT p.id, p.name FROM people p
    JOIN fact_people fp ON fp.person_id = p.id
    WHERE fp.fact_id = ?
  `)
  return facts.map(f => ({ ...f, people: stmtPeople.all(f.id) }))
}

export function addFact(trait: string, personIds: number[]) {
  const insertFact = db.prepare('INSERT INTO facts (trait) VALUES (?)')
  const insertLink = db.prepare('INSERT OR IGNORE INTO fact_people (fact_id, person_id) VALUES (?, ?)')
  const findExisting = db.prepare('SELECT id FROM facts WHERE LOWER(trait) = LOWER(?)')

  const factId = db.transaction(() => {
    const existing = findExisting.get(trait) as { id: number } | undefined
    const id = existing ? existing.id : (insertFact.run(trait).lastInsertRowid as number)
    for (const pid of personIds) {
      insertLink.run(id, pid)
    }
    return id
  })()

  const stmtPeople = db.prepare(`
    SELECT p.id, p.name FROM people p
    JOIN fact_people fp ON fp.person_id = p.id
    WHERE fp.fact_id = ?
  `)
  return { id: factId, trait, people: stmtPeople.all(factId) }
}

export function deleteFact(id: number) {
  db.prepare('DELETE FROM facts WHERE id = ?').run(id)
}

export function removePersonFromFact(factId: number, personId: number) {
  db.prepare('DELETE FROM fact_people WHERE fact_id = ? AND person_id = ?').run(factId, personId)
  const remaining = db.prepare('SELECT COUNT(*) as cnt FROM fact_people WHERE fact_id = ?').get(factId) as { cnt: number }
  if (remaining.cnt === 0) {
    db.prepare('DELETE FROM facts WHERE id = ?').run(factId)
  }
}

export function renamePerson(id: number, name: string) {
  const normalized = normalizeName(name)
  db.prepare('UPDATE people SET name = ? WHERE id = ?').run(normalized, id)
}

export function deletePerson(id: number) {
  db.prepare('DELETE FROM people WHERE id = ?').run(id)
}

export function renameFact(id: number, trait: string) {
  db.prepare('UPDATE facts SET trait = ? WHERE id = ?').run(trait, id)
}

export function getFactPeopleMatrix() {
  const people = getPeople() as { id: number; name: string }[]
  const facts = db.prepare('SELECT id, trait FROM facts').all() as { id: number; trait: string }[]
  const links = db.prepare('SELECT fact_id, person_id FROM fact_people').all() as { fact_id: number; person_id: number }[]

  const linkSet = new Set(links.map(l => `${l.fact_id}-${l.person_id}`))

  return { people, facts, has: (factId: number, personId: number) => linkSet.has(`${factId}-${personId}`) }
}

export default db
