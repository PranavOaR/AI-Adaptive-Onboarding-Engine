import { useRef, useEffect, useState } from 'react'
import { useScrollReveal, animateCount } from '../hooks/useScrollAnimation'
import ChallengeArena from './ChallengeArena'
import challenges from '../data/challenges.json'

const PHASE_COLORS = {
  Foundation: { border: 'border-mc-green', text: 'text-mc-green', bg: 'bg-mc-green', dot: 'bg-mc-green' },
  'Core Role Skills': { border: 'border-mc-amber', text: 'text-mc-amber', bg: 'bg-mc-amber', dot: 'bg-mc-amber' },
  'Applied Practice': { border: 'border-mc-cyan', text: 'text-mc-cyan', bg: 'bg-mc-cyan', dot: 'bg-mc-cyan' },
  'Optional Stretch': { border: 'border-mc-text2', text: 'text-mc-text2', bg: 'bg-mc-text2', dot: 'bg-mc-text2' },
}

const DIFFICULTY_BADGE = {
  beginner: 'badge-matched',
  intermediate: 'badge-partial',
  advanced: 'badge-missing',
}

// Build skill → challenge ID lookup
const skillToChallengeId = {}
challenges.forEach((ch) => {
  ch.skills.forEach((skill) => {
    if (!skillToChallengeId[skill]) skillToChallengeId[skill] = ch.id
  })
})

export default function RoadmapTimeline({ roadmap, gaps }) {
  const sectionRef = useRef()
  const hoursRef = useRef()
  const [activeChallengeId, setActiveChallengeId] = useState(null)

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
      <section ref={sectionRef} className="py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-mc-cyan rounded-full" />
              <h2 className="font-mono text-xs text-mc-cyan tracking-[0.2em] uppercase">
                Learning Roadmap
              </h2>
            </div>
            <div className="card-glow px-4 py-2">
              <span className="font-mono text-[10px] text-mc-text2 mr-2">TOTAL</span>
              <span ref={hoursRef} className="font-mono text-sm text-mc-cyan font-bold">
                0h
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {phaseOrder.map((phaseName) => {
              const courses = phases[phaseName]
              if (!courses) return null
              const colors = PHASE_COLORS[phaseName]

              return (
                <div key={phaseName} className="reveal-item">
                  <div className={`flex items-center gap-2 mb-4 pb-2 border-b ${colors.border}/30`}>
                    <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
                    <h3 className={`font-mono text-xs ${colors.text} tracking-wider uppercase`}>
                      {phaseName}
                    </h3>
                  </div>

                  <div className="relative pl-4">
                    {/* Vertical connector line */}
                    <div className={`absolute left-0 top-0 bottom-0 w-px ${colors.bg}/30`} />

                    <div className="space-y-3">
                      {courses.map((course) => {
                        const courseSkills = course.skills || course.skills_addressed || []
                        // Find a gap skill that has a challenge
                        const challengeSkill = courseSkills.find(
                          (s) => skillToChallengeId[s] && gapSkills.has(s)
                        )
                        const challengeId = challengeSkill ? skillToChallengeId[challengeSkill] : null

                        return (
                          <div key={course.id} className="card-glow p-4 relative">
                            {/* Dot on the line */}
                            <div
                              className={`absolute -left-[17px] top-5 w-2 h-2 rounded-full ${colors.dot} ring-2 ring-mc-bg`}
                            />

                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-mono text-sm text-mc-text font-bold leading-tight pr-2">
                                {course.title}
                              </h4>
                              <span className={`badge ${DIFFICULTY_BADGE[course.difficulty] || ''} shrink-0`}>
                                {course.difficulty}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-mono text-[10px] text-mc-text2">
                                {course.duration_hours}h
                              </span>
                              <span className="font-mono text-[10px] text-mc-text2">
                                {course.id || course.course_id}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-1 mb-3">
                              {courseSkills.map((s) => (
                                <span
                                  key={s}
                                  className="font-mono text-[9px] px-2 py-0.5 bg-mc-bg border border-mc-border rounded text-mc-text2"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>

                            {course.prerequisites_needed?.length > 0 && (
                              <div className="mb-2 font-mono text-[9px] text-mc-text2/50">
                                REQUIRES: {course.prerequisites_needed.join(', ')}
                              </div>
                            )}

                            {course.justification && (
                              <div className="mb-4 text-xs text-mc-text2/80 font-body leading-relaxed border-l border-mc-border pl-2">
                                {course.justification}
                              </div>
                            )}

                            {challengeId && (
                              <button
                                onClick={() => setActiveChallengeId(challengeId)}
                                className="w-full font-mono text-[10px] tracking-wider py-2 px-3
                                  border border-mc-amber/50 text-mc-amber rounded
                                  hover:bg-mc-amber/10 hover:border-mc-amber
                                  transition-all duration-200"
                              >
                                CHALLENGE YOUR SKILLS →
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {activeChallengeId && (
        <ChallengeArena
          challengeId={activeChallengeId}
          onClose={() => setActiveChallengeId(null)}
        />
      )}
    </>
  )
}
