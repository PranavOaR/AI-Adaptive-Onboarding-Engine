import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import LoginPage from './LoginPage'
import SignupPage from './SignupPage'

function Spinner() {
  return (
    <div className="fixed inset-0 bg-mc-bg flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 mx-auto mb-4 relative">
          <div className="absolute inset-0 border-2 border-mc-border rounded-full" />
          <div
            className="absolute inset-0 border-2 border-transparent border-t-mc-cyan rounded-full"
            style={{ animation: 'spin 1s linear infinite' }}
          />
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p className="font-mono text-[10px] text-mc-text2 tracking-[0.2em] uppercase">
          Authenticating
        </p>
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
