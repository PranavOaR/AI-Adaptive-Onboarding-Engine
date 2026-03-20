import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import LoginPage from './LoginPage'
import SignupPage from './SignupPage'

function Spinner() {
  return (
    <div className="fixed inset-0 bg-surface-0 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 mx-auto mb-4 relative">
          <div className="absolute inset-0 border-2 border-border rounded-full" />
          <div
            className="absolute inset-0 border-2 border-transparent border-t-accent rounded-full"
            style={{ animation: 'spin 1s linear infinite' }}
          />
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p className="text-sm text-text-muted">Loading...</p>
      </div>
    </div>
  )
}

export default function AuthGuard({ children }) {
  const { user, loading } = useAuth()
  const [mode, setMode] = useState('login')

  if (loading) return <Spinner />

  if (!user) {
    return mode === 'login'
      ? <LoginPage onSwitch={() => setMode('signup')} />
      : <SignupPage onSwitch={() => setMode('login')} />
  }

  return children
}
