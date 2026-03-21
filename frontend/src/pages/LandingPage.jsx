import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useLenis } from '../hooks/useLenis'
import Navbar from '../components/Navbar'
import AuthModal from '../components/AuthModal'
import HeroSection from '../components/landing/HeroSection'
import ResumeScrollScene from '../components/landing/ResumeScrollScene'
import FeaturesGrid from '../components/landing/FeaturesGrid'
import HowItWorks from '../components/landing/HowItWorks'
import StatsSection from '../components/landing/StatsSection'
import CTASection from '../components/landing/CTASection'

export default function LandingPage() {
  const [authMode, setAuthMode] = useState(null) // null | 'login' | 'signup'
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, loading } = useAuth()

  useLenis()

  // If already logged in, redirect to app
  useEffect(() => {
    if (!loading && user) navigate('/app', { replace: true })
  }, [user, loading, navigate])

  // Open modal if redirected from ProtectedRoute with ?auth=login
  useEffect(() => {
    const authParam = searchParams.get('auth')
    if (authParam === 'login' || authParam === 'signup') setAuthMode(authParam)
  }, [searchParams])

  const openAuth = (mode) => setAuthMode(mode)
  const closeAuth = () => setAuthMode(null)

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-border border-t-accent rounded-full" style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-0">
      <Navbar variant="landing" onOpenAuth={openAuth} />

      <main>
        <HeroSection onOpenAuth={openAuth} onScrollToFeatures={scrollToFeatures} />
        <ResumeScrollScene />
        <FeaturesGrid id="features" />
        <HowItWorks id="how-it-works" />
        <StatsSection />
        <CTASection onOpenAuth={openAuth} />
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-10 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-text-dim">skilo</span>
          <p className="text-xs text-text-dim">Skill gap intelligence</p>
          <a
            href="https://github.com/PranavOaR/AI-Adaptive-Onboarding-Engine"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-text-dim hover:text-text-muted transition-colors"
          >
            GitHub
          </a>
        </div>
      </footer>

      {/* Auth modal */}
      {authMode && <AuthModal initialMode={authMode} onClose={closeAuth} />}
    </div>
  )
}
