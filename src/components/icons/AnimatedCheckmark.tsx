import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '../../lib/useReducedMotion'

export function AnimatedCheckmark({ className = 'h-4 w-4', color = 'currentColor' }: { className?: string; color?: string }) {
  const reduced = useReducedMotion()
  const ref = useRef<SVGPathElement>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (reduced) {
      setDone(true)
      return
    }
    const path = ref.current
    if (!path) return
    const length = path.getTotalLength()
    path.style.strokeDasharray = String(length)
    path.style.strokeDashoffset = String(length)
    path.getBoundingClientRect()
    path.style.transition = 'stroke-dashoffset 0.28s ease-out'
    path.style.strokeDashoffset = '0'
    const t = setTimeout(() => setDone(true), 300)
    return () => clearTimeout(t)
  }, [reduced])

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path ref={ref} d="M5 13l4 4L19 7" style={done && !reduced ? {} : undefined} />
    </svg>
  )
}
