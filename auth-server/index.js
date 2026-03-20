import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { createHash } from 'crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
const JWT_SECRET = process.env.JWT_SECRET || 'mc_jwt_secret_mission_control_2026'
const AUTH_SECRET = process.env.AUTH_SECRET || 'mc_auth_secret_mission_control_2026'

// --- SQLite setup ---
const db = new Database(join(__dirname, 'auth.db'))
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )
`)

function hashPassword(password) {
  return createHash('sha256').update(password + AUTH_SECRET).digest('hex')
}

function generateId() {
  return createHash('sha256').update(Math.random().toString() + Date.now()).digest('hex').slice(0, 24)
}

// --- Express app ---
const app = express()

// Cookie parser (must be before routes)
app.use((req, _res, next) => {
  req.cookies = {}
  const header = req.headers.cookie || ''
  header.split(';').forEach(part => {
    const [k, ...v] = part.trim().split('=')
    if (k) req.cookies[k.trim()] = decodeURIComponent(v.join('=').trim())
  })
  next()
})

app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
app.use(express.json())

function issueJwt(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

function setCookie(res, token) {
  res.setHeader('Set-Cookie',
    `mc_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 3600}`
  )
}

// POST /auth/signup
app.post('/auth/signup', (req, res) => {
  const { email, password, name } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase())
  if (existing) return res.status(400).json({ error: 'Email already registered' })

  const user = {
    id: generateId(),
    email: email.toLowerCase(),
    name: name || email.split('@')[0],
    password_hash: hashPassword(password),
    created_at: Date.now(),
  }
  db.prepare('INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)').run(
    user.id, user.email, user.name, user.password_hash, user.created_at
  )

  const token = issueJwt(user)
  setCookie(res, token)
  res.json({ user: { id: user.id, email: user.email, name: user.name }, token })
})

// POST /auth/login
app.post('/auth/login', (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase())
  if (!user || user.password_hash !== hashPassword(password)) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  const token = issueJwt(user)
  setCookie(res, token)
  res.json({ user: { id: user.id, email: user.email, name: user.name }, token })
})

// GET /auth/me — check session from cookie or Authorization header
app.get('/auth/me', (req, res) => {
  const token = req.cookies?.mc_token || (req.headers.authorization || '').replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Not authenticated' })

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    res.json({ user: { id: payload.sub, email: payload.email, name: payload.name } })
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
})

// POST /auth/logout
app.post('/auth/logout', (_req, res) => {
  res.setHeader('Set-Cookie', 'mc_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0')
  res.json({ success: true })
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`[Auth Server] Running on http://localhost:${PORT}`)
  console.log(`[Auth Server] SQLite DB: auth.db`)
})
