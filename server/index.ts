import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { getPeople, addPerson, getFacts, addFact, deleteFact, removePersonFromFact, renamePerson, deletePerson, renameFact } from './db.js'
import { computeOverlaps, computePredictions, computePCA } from './analysis.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
app.use(cors())
app.use(express.json())

const PASSPHRASE = process.env.VENN_PASSPHRASE || 'change-me-before-deploying'

app.use('/api', (req, res, next) => {
  const provided = req.headers['x-passphrase']
  if (provided !== PASSPHRASE) {
    return res.status(401).json({ error: 'Invalid passphrase' })
  }
  next()
})

app.get('/api/people', (_req, res) => {
  res.json(getPeople())
})

app.post('/api/people', (req, res) => {
  const { name } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Name required' })
  try {
    res.json(addPerson(name.trim()))
  } catch {
    res.status(409).json({ error: 'Person already exists' })
  }
})

app.get('/api/facts', (_req, res) => {
  res.json(getFacts())
})

app.post('/api/facts', (req, res) => {
  const { trait, personIds } = req.body
  if (!trait?.trim()) return res.status(400).json({ error: 'Trait required' })
  if (!personIds?.length) return res.status(400).json({ error: 'At least one person required' })
  res.json(addFact(trait.trim(), personIds))
})

app.delete('/api/facts/:id', (req, res) => {
  deleteFact(Number(req.params.id))
  res.json({ ok: true })
})

app.delete('/api/facts/:factId/people/:personId', (req, res) => {
  removePersonFromFact(Number(req.params.factId), Number(req.params.personId))
  res.json({ ok: true })
})

app.put('/api/people/:id', (req, res) => {
  const { name } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Name required' })
  try {
    renamePerson(Number(req.params.id), name.trim())
    res.json({ ok: true })
  } catch {
    res.status(409).json({ error: 'Name already taken' })
  }
})

app.delete('/api/people/:id', (req, res) => {
  deletePerson(Number(req.params.id))
  res.json({ ok: true })
})

app.put('/api/facts/:id', (req, res) => {
  const { trait } = req.body
  if (!trait?.trim()) return res.status(400).json({ error: 'Trait required' })
  renameFact(Number(req.params.id), trait.trim())
  res.json({ ok: true })
})

app.get('/api/overlaps', (_req, res) => {
  res.json(computeOverlaps())
})

app.get('/api/predictions', (_req, res) => {
  res.json(computePredictions())
})

app.get('/api/pca', (_req, res) => {
  res.json(computePCA())
})

// In production, serve the built React app
const clientDist = path.join(__dirname, '..', 'client', 'dist')
app.use(express.static(clientDist))
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'))
})

const port = parseInt(process.env.VENN_PORT || '3001')
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
