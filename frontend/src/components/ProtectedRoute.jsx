import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !user) {
      navigate('/?auth=login', { replace: true })
    }
  }, [user, loading, navigate])

  if (loading) {
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
          <p className="text-sm text-text-muted">Loading…</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return children
}
