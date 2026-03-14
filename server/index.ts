import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { getPeople, addPerson, getFacts, addFact } from './db.js'
import { computeOverlaps, computePredictions } from './analysis.js'

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

app.get('/api/overlaps', (_req, res) => {
  res.json(computeOverlaps())
})

app.get('/api/predictions', (_req, res) => {
  res.json(computePredictions())
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
