import axios from 'axios'

const AUTH_BASE = '/auth'
const TOKEN_KEY = 'mc_token'

// Axios interceptor — attach stored JWT as Bearer header
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

function storeToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export async function signIn(email, password) {
  const res = await axios.post(`${AUTH_BASE}/login`, { email, password }, { withCredentials: true })
  storeToken(res.data.token)
  return res.data
}

export async function signUp(email, password, name) {
  const res = await axios.post(`${AUTH_BASE}/signup`, { email, password, name }, { withCredentials: true })
  storeToken(res.data.token)
  return res.data
}

export async function signOut() {
  clearToken()
  await axios.post(`${AUTH_BASE}/logout`, {}, { withCredentials: true })
}

export async function getSession() {
  try {
    // If we have a stored token, verify it's still valid
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return null
    const res = await axios.get(`${AUTH_BASE}/me`, {
      withCredentials: true,
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.data
  } catch {
    clearToken()
    return null
  }
}
