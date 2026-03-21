import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { useAuth } from '../hooks/useAuth'

export default function AuthModal({ initialMode = 'login', onClose }) {
  const [mode, setMode] = useState(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const backdropRef = useRef()
  const cardRef = useRef()

  useEffect(() => {
    setMode(initialMode)
    setError(null)
    setEmail(''); setPassword(''); setName('')
  }, [initialMode])

  useEffect(() => {
    gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.2 })
    gsap.fromTo(cardRef.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' })
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleBackdropClick = (e) => {
    if (e.target === backdropRef.current) close()
  }

  const close = () => {
    gsap.to(cardRef.current, { opacity: 0, y: 8, duration: 0.2, onComplete: onClose })
    gsap.to(backdropRef.current, { opacity: 0, duration: 0.2 })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        if (password.length < 6) { setError('Password must be at least 6 characters'); setLoading(false); return }
        await register(email, password, name)
      }
      onClose()
      navigate('/app')
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={handleBackdropClick}
    >
      <div ref={cardRef} className="w-full max-w-sm">
        <div className="bg-surface-1 border border-border rounded-xl p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-xs text-text-dim block mb-1">AI Adaptive Onboarding Engine</span>
              <h2 className="text-base font-medium text-text-primary">
                {mode === 'login' ? 'Sign in' : 'Create account'}
              </h2>
            </div>
            <button onClick={close} className="text-text-dim hover:text-text-muted transition-colors p-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-border">
            <button
              onClick={() => { setMode('login'); setError(null) }}
              className={`text-sm pb-2 transition-colors ${mode === 'login' ? 'text-text-primary border-b border-text-primary -mb-px' : 'text-text-dim hover:text-text-muted'}`}
            >Sign in</button>
            <button
              onClick={() => { setMode('signup'); setError(null) }}
              className={`text-sm pb-2 transition-colors ${mode === 'signup' ? 'text-text-primary border-b border-text-primary -mb-px' : 'text-text-dim hover:text-text-muted'}`}
            >Sign up</button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="text-xs text-text-dim block mb-1.5">Name</label>
                <input
                  type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full bg-surface-0 border border-border rounded-md px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-dim/60 focus:outline-none focus:border-text-dim transition-colors"
                />
              </div>
            )}
            <div>
              <label className="text-xs text-text-dim block mb-1.5">Email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                placeholder="you@example.com"
                className="w-full bg-surface-0 border border-border rounded-md px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-dim/60 focus:outline-none focus:border-text-dim transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-text-dim block mb-1.5">Password</label>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter password'}
                className="w-full bg-surface-0 border border-border rounded-md px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-dim/60 focus:outline-none focus:border-text-dim transition-colors"
              />
            </div>

            {error && (
              <p className="text-xs text-error bg-error/5 border border-error/10 rounded-md px-3 py-2">{error}</p>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full text-sm py-2.5 rounded-md bg-white/[0.08] hover:bg-white/[0.12] text-text-primary border border-white/[0.06] transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-1"
            >
              {loading ? (mode === 'login' ? 'Signing in...' : 'Creating account...') : (mode === 'login' ? 'Sign in' : 'Create account')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
