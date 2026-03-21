import { useRef, useEffect, useState, lazy, Suspense } from 'react'
import { useScrollReveal, animateCount } from '../hooks/useScrollAnimation'
import { useProgress } from '../hooks/useProgress'
import challenges from '../data/challenges.json'

const ChallengeArena = lazy(() => import('./ChallengeArena'))

const PHASE_COLORS = {
  Foundation: { text: 'text-success', bg: 'bg-success', border: 'border-success' },
  'Core Role Skills': { text: 'text-warning', bg: 'bg-warning', border: 'border-warning' },
  'Applied Practice': { text: 'text-accent', bg: 'bg-accent', border: 'border-accent' },
  'Optional Stretch': { text: 'text-text-dim', bg: 'bg-text-dim', border: 'border-text-dim' },
}

const DIFFICULTY_PILL = {
  beginner: 'pill-success',
  intermediate: 'pill-warning',
  advanced: 'pill-error',
}

// Build skill -> challenge ID lookup
const skillToChallengeId = {}
challenges.forEach((ch) => {
  ch.skills.forEach((skill) => {
    if (!skillToChallengeId[skill]) skillToChallengeId[skill] = ch.id
  })
})

export default function RoadmapTimeline({ roadmap, gaps, userId, role }) {
  const sectionRef = useRef()
  const hoursRef = useRef()
  const [activeChallengeId, setActiveChallengeId] = useState(null)
  const { markComplete, isComplete, getCompletionRate } = useProgress(role || '', userId || '')

  useScrollReveal(sectionRef)

  const totalHours = roadmap?.reduce((sum, c) => sum + c.duration_hours, 0) || 0

  useEffect(() => {
    if (totalHours > 0) {
      const timer = setTimeout(() => animateCount(hoursRef.current, totalHours, 'h'), 400)
      return () => clearTimeout(timer)
    }
  }, [totalHours])

  if (!roadmap?.length) return null

  // Set of skills that are missing or partial
  const gapSkills = new Set(
    (gaps || []).filter((g) => g.status === 'missing' || g.status === 'partial').map((g) => g.skill)
  )

  // Group by phase
  const phases = {}
  roadmap.forEach((course) => {
    if (!phases[course.phase]) phases[course.phase] = []
    phases[course.phase].push(course)
  })

  const phaseOrder = ['Foundation', 'Core Role Skills', 'Applied Practice', 'Optional Stretch']

  return (
    <>
      <section ref={sectionRef} className="py-14 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-1">Learning Roadmap</h2>
              <p className="text-sm text-text-muted">Personalized learning path based on your gaps</p>
            </div>
            <div className="flex items-center gap-3">
              {getCompletionRate(roadmap) > 0 && (
                <span className="pill pill-success text-xs">{Math.round(getCompletionRate(roadmap))}% complete</span>
              )}
              <div className="card-static px-4 py-2.5 flex items-center gap-2">
                <span className="text-xs text-text-muted">Total</span>
                <span ref={hoursRef} className="text-base font-bold text-accent">0h</span>
              </div>
            </div>
          </div>

          {/* Vertical timeline layout */}
          <div className="space-y-10">
            {phaseOrder.map((phaseName) => {
              const courses = phases[phaseName]
              if (!courses) return null
              const colors = PHASE_COLORS[phaseName]

              return (
                <div key={phaseName} className="reveal-item">
                  {/* Phase header */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className={`w-2.5 h-2.5 rounded-full ${colors.bg}`} />
                    <h3 className={`text-lg font-semibold ${colors.text}`}>
                      {phaseName}
                    </h3>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  {/* Course cards with left border connector */}
                  <div className={`space-y-3 ml-5 border-l ${colors.border}/30 pl-6`}>
                    {courses.map((course) => {
                      const courseId = course.course_id || course.id
                      const done = isComplete(courseId)
                      const courseSkills = course.skills || course.skills_addressed || []
                      const challengeSkill = courseSkills.find(
                        (s) => skillToChallengeId[s] && gapSkills.has(s)
                      )
                      const challengeId = challengeSkill ? skillToChallengeId[challengeSkill] : null

                      return (
                        <div key={courseId} className={`card p-5 relative transition-opacity duration-300 ${done ? 'opacity-60' : ''}`}>
                          {/* Dot on the connector line */}
                          <div
                            className={`absolute -left-[27px] top-6 w-2.5 h-2.5 rounded-full ${done ? 'bg-success' : colors.bg} ring-2 ring-surface-0 transition-colors`}
                          />

                          <div className="flex items-start justify-between mb-2">
                            <h4 className={`text-base font-medium leading-snug pr-2 ${done ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                              {course.title}
                            </h4>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`pill ${DIFFICULTY_PILL[course.difficulty] || 'pill-neutral'}`}>
                                {course.difficulty}
                              </span>
                              <button
                                onClick={() => markComplete(courseId)}
                                title={done ? 'Mark incomplete' : 'Mark complete'}
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                  done ? 'border-success bg-success/20' : 'border-border hover:border-success'
                                }`}
                              >
                                {done && (
                                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#34D399" strokeWidth="2.5"><polyline points="2,6 5,9 10,3"/></svg>
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-xs text-text-dim">
                              {course.duration_hours}h
                            </span>
                            <span className="text-xs text-text-dim">
                              {course.id || course.course_id}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {courseSkills.map((s) => (
                              <span
                                key={s}
                                className="text-xs px-2.5 py-1 bg-surface-1 border border-border-subtle rounded-md text-text-muted"
                              >
                                {s.replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>

                          {course.prerequisites_needed?.length > 0 && (
                            <p className="mb-2 text-xs text-text-dim">
                              Requires: {course.prerequisites_needed.join(', ')}
                            </p>
                          )}

                          {course.justification && (
                            <p className="mb-4 text-sm text-text-muted leading-relaxed border-l-2 border-border pl-3">
                              {course.justification}
                            </p>
                          )}

                          {challengeId && (
                            <button
                              onClick={() => setActiveChallengeId(challengeId)}
                              className="text-sm font-medium text-accent border border-accent/40 rounded-lg py-2.5 px-4
                                hover:bg-accent/10 hover:border-accent
                                transition-all duration-200"
                            >
                              Test your skills
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {activeChallengeId && (
        <Suspense fallback={<div className="fixed inset-0 bg-surface-0 flex items-center justify-center"><p className="text-text-muted text-sm">Loading editor…</p></div>}>
          <ChallengeArena
            challengeId={activeChallengeId}
            onClose={() => setActiveChallengeId(null)}
          />
        </Suspense>
      )}
    </>
  )
}
