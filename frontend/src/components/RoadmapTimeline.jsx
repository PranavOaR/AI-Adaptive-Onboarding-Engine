import { useRef, useEffect, useState, lazy, Suspense } from 'react'
import { useProgress } from '../hooks/useProgress'
import challenges from '../data/challenges.json'

const ChallengeArena = lazy(() => import('./ChallengeArena'))

const PHASE_CONFIG = {
  Foundation: { dotColor: 'bg-primary', textColor: 'text-primary', active: true },
  'Core Role Skills': { dotColor: 'bg-secondary', textColor: 'text-secondary', active: false },
  'Applied Practice': { dotColor: 'bg-tertiary', textColor: 'text-tertiary', active: false },
  'Optional Stretch': { dotColor: 'bg-outline', textColor: 'text-outline', active: false },
}

const skillToChallengeId = {}
challenges.forEach((ch) => {
  ch.skills.forEach((skill) => {
    if (!skillToChallengeId[skill]) skillToChallengeId[skill] = ch.id
  })
})

function ProgressRing({ pct }) {
  const r = 20
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <div className="relative w-12 h-12 shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={r} fill="none" stroke="currentColor" strokeWidth="4" className="text-surface-container-highest" />
        <circle
          cx="24" cy="24" r={r} fill="none"
          stroke="currentColor" strokeWidth="4"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          className={pct > 0 ? 'text-primary' : 'text-surface-container-highest'}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[9px] font-bold text-on-surface-variant">{Math.round(pct)}%</span>
      </div>
    </div>
  )
}

export default function RoadmapTimeline({ roadmap, gaps, userId, role }) {
  const [activeChallengeId, setActiveChallengeId] = useState(null)
  const { markComplete, isComplete, getCompletionRate } = useProgress(role || '', userId || '')

  if (!roadmap?.length) return null

  const gapSkills = new Set(
    (gaps || []).filter((g) => g.status === 'missing' || g.status === 'partial').map((g) => g.skill)
  )

  const phases = {}
  roadmap.forEach((course) => {
    if (!phases[course.phase]) phases[course.phase] = []
    phases[course.phase].push(course)
  })

  const phaseOrder = ['Foundation', 'Core Role Skills', 'Applied Practice', 'Optional Stretch']
  const completionRate = getCompletionRate(roadmap)

  return (
    <>
      <section className="max-w-[1200px] mx-auto px-6 pt-10 space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-on-surface font-headline">Curated Learning Roadmap</h2>
          {completionRate > 0 && (
            <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
              {Math.round(completionRate)}% complete
            </span>
          )}
        </div>

        {/* Vertical timeline */}
        <div
          className="relative pl-8 space-y-12"
          style={{
            '--tw-before': 'content: ""',
          }}
        >
          {/* Vertical line */}
          <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-surface-container-highest" />

          {phaseOrder.map((phaseName, phaseIdx) => {
            const courses = phases[phaseName]
            if (!courses) return null
            const config = PHASE_CONFIG[phaseName] || PHASE_CONFIG.Foundation
            const isFirstPhase = phaseIdx === 0

            return (
              <div key={phaseName} className="relative">
                {/* Phase dot */}
                <div className={`absolute -left-[35px] top-1 w-6 h-6 rounded-full ${isFirstPhase ? 'bg-primary' : 'bg-surface-container-highest'} border-4 border-surface flex items-center justify-center`} />

                <div className={`space-y-4 ${!isFirstPhase ? 'opacity-80' : ''}`}>
                  <h3 className={`font-bold text-lg tracking-tight ${isFirstPhase ? config.textColor : 'text-on-surface'}`}>
                    {phaseName}
                  </h3>

                  <div className="grid md:grid-cols-2 gap-4">
                    {courses.map((course) => {
                      const courseId = course.course_id || course.id
                      const done = isComplete(courseId)
                      const courseSkills = course.skills || course.skills_addressed || []
                      const challengeSkill = courseSkills.find(s => skillToChallengeId[s] && gapSkills.has(s))
                      const challengeId = challengeSkill ? skillToChallengeId[challengeSkill] : null
                      const pct = done ? 100 : 0

                      return (
                        <div key={courseId} className="bg-surface-container-low p-5 rounded-xl flex items-center gap-4">
                          <ProgressRing pct={pct} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-bold leading-tight ${done ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>
                              {course.title}
                            </p>
                            <p className="text-xs text-on-surface-variant mt-0.5">
                              {course.duration_hours}h
                              {course.difficulty && ` · ${course.difficulty}`}
                            </p>
                            {challengeId && (
                              <button
                                onClick={() => setActiveChallengeId(challengeId)}
                                className="text-xs text-primary font-bold hover:underline mt-1"
                              >
                                Test your skills →
                              </button>
                            )}
                          </div>
                          <button
                            onClick={() => markComplete(courseId)}
                            title={done ? 'Mark incomplete' : 'Mark complete'}
                            className={`shrink-0 ${done ? 'text-green-500' : 'text-surface-container-highest hover:text-on-surface-variant'} transition-colors`}
                          >
                            {done ? (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                            ) : (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/></svg>
                            )}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {activeChallengeId && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-slate-950 flex items-center justify-center z-50">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          <ChallengeArena challengeId={activeChallengeId} onClose={() => setActiveChallengeId(null)} />
        </Suspense>
      )}
    </>
  )
}
