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
    name TEXT NOT NULL UNIQUE,
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

export function addPerson(name: string) {
  const result = db.prepare('INSERT INTO people (name) VALUES (?)').run(name)
  return { id: result.lastInsertRowid, name }
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
  const insertLink = db.prepare('INSERT INTO fact_people (fact_id, person_id) VALUES (?, ?)')

  const result = db.transaction(() => {
    const { lastInsertRowid } = insertFact.run(trait)
    for (const pid of personIds) {
      insertLink.run(lastInsertRowid, pid)
    }
    return lastInsertRowid
  })()

  const factId = result as number
  const stmtPeople = db.prepare(`
    SELECT p.id, p.name FROM people p
    JOIN fact_people fp ON fp.person_id = p.id
    WHERE fp.fact_id = ?
  `)
  return { id: factId, trait, people: stmtPeople.all(factId) }
}

export function getFactPeopleMatrix() {
  const people = getPeople() as { id: number; name: string }[]
  const facts = db.prepare('SELECT id, trait FROM facts').all() as { id: number; trait: string }[]
  const links = db.prepare('SELECT fact_id, person_id FROM fact_people').all() as { fact_id: number; person_id: number }[]

  const linkSet = new Set(links.map(l => `${l.fact_id}-${l.person_id}`))

  return { people, facts, has: (factId: number, personId: number) => linkSet.has(`${factId}-${personId}`) }
}

export default db
