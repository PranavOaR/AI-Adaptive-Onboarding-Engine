import { useState, useCallback } from 'react'

function storageKey(userId, role) {
  return `onboard_progress_${userId || 'anon'}_${(role || 'general').replace(/\s+/g, '_').toLowerCase()}`
}

export function useProgress(role, userId) {
  const key = storageKey(userId, role)

  const [completed, setCompleted] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(key) || '[]'))
    } catch {
      return new Set()
    }
  })

  const persist = (set) => {
    try {
      localStorage.setItem(key, JSON.stringify([...set]))
    } catch {}
  }

  const markComplete = useCallback((courseId) => {
    setCompleted(prev => {
      const next = new Set(prev)
      if (next.has(courseId)) {
        next.delete(courseId)
      } else {
        next.add(courseId)
      }
      persist(next)
      return next
    })
  }, [key])

  const isComplete = useCallback((courseId) => completed.has(courseId), [completed])

  const getCompletionRate = useCallback((roadmap) => {
    if (!roadmap?.length) return 0
    const done = roadmap.filter(c => completed.has(c.course_id)).length
    return (done / roadmap.length) * 100
  }, [completed])

  return { markComplete, isComplete, getCompletionRate, completed }
}
