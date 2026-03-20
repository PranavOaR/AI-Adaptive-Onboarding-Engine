import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function useScrollReveal(ref, options = {}) {
  useEffect(() => {
    if (!ref.current) return
    const el = ref.current
    const children = el.querySelectorAll('.reveal-item')
    const targets = children.length > 0 ? children : [el]

    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.08,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            toggleActions: 'play none none none',
            ...options,
          },
        }
      )
    })

    return () => ctx.revert()
  }, [ref, options])
}

export function animateCount(el, to, suffix = '') {
  if (!el) return
  const obj = { val: 0 }
  gsap.to(obj, {
    val: to,
    duration: 1.2,
    ease: 'power2.out',
    onUpdate: () => {
      el.textContent = Math.round(obj.val) + suffix
    },
  })
}

export function animateBars(container) {
  if (!container) return
  const bars = container.querySelectorAll('.bar-fill')
  bars.forEach((bar, i) => {
    const width = bar.dataset.width || 0
    gsap.to(bar, {
      width: width + '%',
      duration: 0.9,
      delay: i * 0.08,
      ease: 'power2.out',
    })
  })
}
