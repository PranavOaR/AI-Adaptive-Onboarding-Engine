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

  const progress = ((currentStep + 1) / STEPS.length) * 100

  return (
    <div className="fixed inset-0 z-50 bg-surface-0/95 backdrop-blur-sm flex items-center justify-center">
      <div className="max-w-md w-full px-6">
        <div className="text-center mb-8">
          {/* Spinner */}
          <div className="w-10 h-10 mx-auto mb-6 relative">
            <div className="absolute inset-0 border-2 border-border rounded-full" />
            <div
              className="absolute inset-0 border-2 border-transparent border-t-accent rounded-full"
              style={{ animation: 'spin 1s linear infinite' }}
            />
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

          <p className="text-sm font-medium text-text-muted mb-4">
            Analyzing
          </p>

          <p className="text-base text-text-primary h-6">
            {STEPS[currentStep]}
          </p>
        </div>

        {/* Progress bar */}
        <div className="bar-track mb-4">
          <div
            className="bar-fill bg-accent"
            style={{ width: `${progress}%`, transition: 'width 0.5s ease-out' }}
          />
        </div>

        <div className="flex justify-between text-xs text-text-dim">
          <span>
            Step {currentStep + 1}/{STEPS.length}
          </span>
          <span>{(elapsed / 1000).toFixed(1)}s</span>
        </div>

        {/* Step history */}
        <div className="mt-6 space-y-1.5">
          {STEPS.slice(0, currentStep + 1).map((step, i) => (
            <div
              key={i}
              className={`text-sm flex items-center gap-2.5 ${
                i < currentStep
                  ? 'text-success/70'
                  : i === currentStep
                    ? 'text-accent'
                    : 'text-text-dim/30'
              }`}
            >
              <span className="w-4 text-center">{i < currentStep ? '\u2713' : i === currentStep ? '\u25B8' : '\u00B7'}</span>
              {step}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
