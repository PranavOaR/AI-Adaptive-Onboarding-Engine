import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { gsap } from 'gsap'

export default function Navbar({ variant = 'landing', onOpenAuth, user, onNewAnalysis, onLogout, completionRate }) {
  const [scrolled, setScrolled] = useState(false)
  const navRef = useRef()
  const navigate = useNavigate()

  useEffect(() => {
    gsap.fromTo(navRef.current, { opacity: 0 }, { opacity: 1, duration: 0.8, delay: 0.1 })
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <nav
      ref={navRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'bg-surface-0/80 backdrop-blur-md' : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link to="/" className="text-sm font-semibold text-text-primary tracking-tight hover:opacity-70 transition-opacity">
          AI Adaptive Onboarding Engine
        </Link>

        {variant === 'landing' && (
          <div className="flex items-center gap-6">
            <button onClick={() => scrollTo('features')} className="text-[13px] text-text-dim hover:text-text-primary transition-colors hidden sm:block">Features</button>
            <button onClick={() => scrollTo('how-it-works')} className="text-[13px] text-text-dim hover:text-text-primary transition-colors hidden sm:block">How it works</button>
            <div className="w-px h-4 bg-border hidden sm:block" />
            <button onClick={() => onOpenAuth?.('login')} className="text-[13px] text-text-dim hover:text-text-primary transition-colors">Log in</button>
            <button
              onClick={() => onOpenAuth?.('signup')}
              className="text-[13px] text-text-primary bg-white/[0.08] hover:bg-white/[0.12] px-3.5 py-1.5 rounded-md transition-colors"
            >
              Get started
            </button>
          </div>
        )}

        {variant === 'dashboard' && (
          <div className="flex items-center gap-5">
            {user && <span className="text-[12px] text-text-dim hidden sm:inline">{user.email}</span>}
            {completionRate !== null && completionRate > 0 && (
              <span className="text-[12px] text-text-dim">{Math.round(completionRate)}%</span>
            )}
            <button onClick={onNewAnalysis} className="text-[13px] text-text-dim hover:text-text-primary transition-colors">New analysis</button>
            <button onClick={onLogout} className="text-[13px] text-text-dim hover:text-error transition-colors">Log out</button>
          </div>
        )}
      </div>
    </nav>
  )
}
