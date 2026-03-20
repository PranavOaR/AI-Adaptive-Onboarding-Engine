import { createContext, useContext, useState, useEffect } from 'react'
import { signIn, signUp, signOut, getSession } from '../api/authClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined) // undefined = loading, null = unauthed
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSession()
      .then((data) => setUser(data?.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const data = await signIn(email, password)
    setUser(data.user)
    return data
  }

  const register = async (email, password, name) => {
    const data = await signUp(email, password, name)
    setUser(data.user)
    return data
  }

  const logout = async () => {
    await signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
