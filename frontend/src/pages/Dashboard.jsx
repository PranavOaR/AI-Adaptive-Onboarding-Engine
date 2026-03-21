import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import HeroUpload from '../components/HeroUpload'
import AnalysisProgress from '../components/AnalysisProgress'
import SummaryBanner from '../components/SummaryBanner'
import CandidateProfile from '../components/CandidateProfile'
import RequiredProfile from '../components/RequiredProfile'
import GapMatrix from '../components/GapMatrix'
import RoadmapTimeline from '../components/RoadmapTimeline'
import ReasoningPanel from '../components/ReasoningPanel'
import Navbar from '../components/Navbar'
import { runAnalysis, exportPDF } from '../api/analyzeApi'
import { useAuth } from '../hooks/useAuth'
import { useProgress } from '../hooks/useProgress'

const InterviewPrep = lazy(() => import('../components/InterviewPrep'))
const ChatWidget = lazy(() => import('../components/ChatWidget'))

export default function Dashboard() {
  const [state, setState] = useState('idle')
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [exporting, setExporting] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const pageRef = useRef()
  const { getCompletionRate } = useProgress(data?.summary?.role || '', user?.id || '')

  useEffect(() => {
    gsap.fromTo(pageRef.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' })
  }, [])

  const handleSubmit = async ({ resumeFile, jdFile, jdText }) => {
    setState('analyzing')
    setError(null)
    try {
      const result = await runAnalysis(resumeFile, jdFile, jdText)
      setData(result)
      setState('results')
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.detail || err.message || 'Analysis failed')
      setState('idle')
    }
  }

  const handleReset = () => {
    setState('idle')
    setData(null)
    setError(null)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const handleExport = async () => {
    if (!data || exporting) return
    setExporting(true)
    try {
      await exportPDF(data)
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setExporting(false)
    }
  }

  const completionRate = data ? getCompletionRate(data.roadmap || []) : 0

  return (
    <div ref={pageRef} className="min-h-screen bg-surface-0">
      <Navbar
        variant="dashboard"
        user={user}
        onNewAnalysis={handleReset}
        onLogout={handleLogout}
        completionRate={state === 'results' ? completionRate : null}
      />

      {state === 'analyzing' && <AnalysisProgress />}

      {(state === 'idle' || state === 'analyzing') && (
        <div className="pt-16">
          <HeroUpload onSubmit={handleSubmit} />
          {error && <ErrorToast message={error} onDismiss={() => setError(null)} />}
        </div>
      )}

      {state === 'results' && data && (
        <div className="pt-16">
          {/* Results top bar */}
          <div className="sticky top-16 z-30 bg-surface-1/90 backdrop-blur-md border-b border-border">
            <div className="max-w-6xl mx-auto px-6 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs text-text-dim">{data.summary.total_skills_required} skills analyzed</span>
                {completionRate > 0 && (
                  <span className="pill pill-success text-xs">{Math.round(completionRate)}% complete</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="text-xs text-text-muted hover:text-accent transition-colors disabled:opacity-40 flex items-center gap-1.5"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  {exporting ? 'Exporting…' : 'Download PDF'}
                </button>
                <button onClick={handleReset} className="text-xs text-text-muted hover:text-text-primary transition-colors">
                  New analysis
                </button>
              </div>
            </div>
          </div>

          <SummaryBanner summary={data.summary} />
          <CandidateProfile profile={data.candidate_profile} />
          <RequiredProfile profile={data.required_profile} />
          <GapMatrix gaps={data.gaps} />
          <RoadmapTimeline roadmap={data.roadmap} gaps={data.gaps} userId={user?.id} role={data.summary?.detected_role} />

          <Suspense fallback={null}>
            <InterviewPrep role={data.summary?.role_display_name || data.summary?.detected_role} gaps={data.gaps} />
          </Suspense>

          <ReasoningPanel traces={data.reasoning_trace} />

          <footer className="py-10 px-6 border-t border-border">
            <div className="max-w-6xl mx-auto text-center">
              <p className="text-sm text-text-dim">Skilo · Skill gap intelligence</p>
            </div>
          </footer>

          <Suspense fallback={null}>
            <ChatWidget analysisData={data} user={user} />
          </Suspense>
        </div>
      )}
    </div>
  )
}

function ErrorToast({ message, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 6000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-xl bg-surface-2 border border-error/30 shadow-lg"
      style={{ animation: 'slideUp 0.3s ease' }}>
      <style>{`@keyframes slideUp { from { transform: translateX(-50%) translateY(16px); opacity:0 } to { transform: translateX(-50%) translateY(0); opacity:1 } }`}</style>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <p className="text-sm text-error">{message}</p>
      <button onClick={onDismiss} className="text-text-dim hover:text-text-muted ml-1">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  )
}
