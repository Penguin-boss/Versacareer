import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from './useReducedMotion'

export function useCountUp(value: number, duration = 0.7, delay = 0): number {
  const reduced = useReducedMotion()
  const [display, setDisplay] = useState(reduced ? value : 0)
  const rafRef = useRef<number>(0)
  const startRef = useRef<number>(0)

  useEffect(() => {
    if (reduced) { setDisplay(value); return }
    setDisplay(0)
    startRef.current = 0
    const timeout = setTimeout(() => {
      const tick = (now: number) => {
        if (!startRef.current) startRef.current = now
        const elapsed = (now - startRef.current) / 1000
        const t = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - t, 3)
        setDisplay(Math.round(value * eased))
        if (t < 1) rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    }, delay)
    return () => {
      clearTimeout(timeout)
      cancelAnimationFrame(rafRef.current)
    }
  }, [value, duration, delay, reduced])

  return display
}
