import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage({ onSwitch }) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await login(email, password)
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid-bg flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <p className="font-mono text-[10px] text-mc-cyan tracking-[0.4em] uppercase mb-3">
            AI Onboarding Engine
          </p>
          <h1 className="font-mono text-2xl text-mc-text font-bold tracking-wide">
            MISSION CONTROL
          </h1>
          <p className="text-mc-text2 text-xs mt-2 font-body">Sign in to your workspace</p>
        </div>

        <div className="card-glow p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="font-mono text-[10px] text-mc-text2 tracking-wider uppercase block mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-mc-bg border border-mc-border rounded px-3 py-2.5 text-sm text-mc-text font-body focus:outline-none focus:border-mc-cyan transition-colors"
                placeholder="ops@mission.ctrl"
              />
            </div>

            <div>
              <label className="font-mono text-[10px] text-mc-text2 tracking-wider uppercase block mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-mc-bg border border-mc-border rounded px-3 py-2.5 text-sm text-mc-text font-body focus:outline-none focus:border-mc-cyan transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="font-mono text-[11px] text-mc-red border border-mc-red/30 rounded px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full font-mono text-sm tracking-widest py-3 rounded transition-all duration-200 mt-2
                bg-mc-cyan/10 text-mc-cyan border border-mc-cyan
                hover:bg-mc-cyan/20 hover:shadow-[0_0_20px_rgba(0,229,255,0.12)]
                disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'AUTHENTICATING...' : 'SIGN IN →'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="font-mono text-[10px] text-mc-text2">No account? </span>
            <button
              onClick={onSwitch}
              className="font-mono text-[10px] text-mc-cyan hover:underline"
            >
              CREATE ACCOUNT
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
