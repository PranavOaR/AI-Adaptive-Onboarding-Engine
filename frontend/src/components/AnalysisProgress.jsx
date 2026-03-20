import { useState, useEffect } from 'react'

const STEPS = [
  'Parsing documents...',
  'Extracting skills...',
  'Normalizing taxonomy...',
  'Estimating proficiency...',
  'Computing skill gaps...',
  'Mapping course catalog...',
  'Building roadmap...',
  'Generating reasoning trace...',
  'Done',
]

export default function AnalysisProgress() {
  const [currentStep, setCurrentStep] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [displayText, setDisplayText] = useState('')

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((e) => e + 100)
    }, 100)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setCurrentStep((s) => {
        if (s < STEPS.length - 1) return s + 1
        return s
      })
    }, 800)
    return () => clearInterval(stepTimer)
  }, [])

  // Typewriter effect for current step
  useEffect(() => {
    const text = STEPS[currentStep]
    setDisplayText('')
    let i = 0
    const typer = setInterval(() => {
      if (i <= text.length) {
        setDisplayText(text.slice(0, i))
        i++
      } else {
        clearInterval(typer)
      }
    }, 25)
    return () => clearInterval(typer)
  }, [currentStep])

  const progress = ((currentStep + 1) / STEPS.length) * 100

  return (
    <div className="fixed inset-0 z-50 bg-mc-bg/95 backdrop-blur-sm flex items-center justify-center">
      <div className="max-w-md w-full px-6">
        <div className="text-center mb-8">
          {/* Spinner */}
          <div className="w-12 h-12 mx-auto mb-6 relative">
            <div className="absolute inset-0 border-2 border-mc-border rounded-full" />
            <div
              className="absolute inset-0 border-2 border-transparent border-t-mc-cyan rounded-full"
              style={{ animation: 'spin 1s linear infinite' }}
            />
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

          <p className="font-mono text-mc-cyan text-xs tracking-[0.2em] uppercase mb-4">
            Analyzing
          </p>

          <p className="font-mono text-sm text-mc-text h-6">
            {displayText}
            <span className="cursor-blink" />
          </p>
        </div>

        {/* Progress bar */}
        <div className="skill-bar-track mb-4">
          <div
            className="skill-bar-fill bg-mc-cyan progress-glow"
            style={{ width: `${progress}%`, transition: 'width 0.5s ease-out' }}
          />
        </div>

        <div className="flex justify-between font-mono text-[10px] text-mc-text2">
          <span>
            STEP {currentStep + 1}/{STEPS.length}
          </span>
          <span>{(elapsed / 1000).toFixed(1)}s</span>
        </div>

        {/* Step history */}
        <div className="mt-6 space-y-1">
          {STEPS.slice(0, currentStep + 1).map((step, i) => (
            <div
              key={i}
              className={`font-mono text-[11px] flex items-center gap-2 ${
                i < currentStep
                  ? 'text-mc-green/70'
                  : i === currentStep
                    ? 'text-mc-cyan'
                    : 'text-mc-text2/30'
              }`}
            >
              <span className="w-3">{i < currentStep ? '\u2713' : i === currentStep ? '\u25B8' : '\u00B7'}</span>
              {step}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
