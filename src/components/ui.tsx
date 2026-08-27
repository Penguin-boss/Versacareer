import { Loader as Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '../lib/useReducedMotion'

export function Spinner({ className = '' }: { className?: string }) {
  return <Loader2 className={`h-4 w-4 animate-spin ${className}`} />
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Spinner className="h-6 w-6 text-primary" />
      <p className="text-text-muted text-sm">{label}</p>
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, action }: { icon: any; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="h-14 w-14 rounded-full bg-bg-elev flex items-center justify-center mb-4 relative">
        <Icon className="h-7 w-7 text-text-faint" />
        <span className="diamond-accent absolute -top-1 -right-1" />
      </div>
      <h3 className="text-base font-medium mb-1.5">{title}</h3>
      <p className="text-text-muted text-sm max-w-sm mb-5">{description}</p>
      {action}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="card p-6 border-error/30 bg-error/5">
      <h3 className="font-medium text-error mb-1">Something went wrong</h3>
      <p className="text-sm text-text-muted mb-4">{message}</p>
      {onRetry && <button onClick={onRetry} className="btn-secondary">Try again</button>}
    </div>
  )
}

export function ScoreRing({ score, size = 120, label }: { score: number; size?: number; label?: string }) {
  const r = (size - 12) / 2
  const c = 2 * Math.PI * r
  const offset = c - (score / 100) * c
  const color = score >= 75 ? 'rgb(var(--color-success))' : score >= 50 ? 'rgb(var(--color-warning))' : 'rgb(var(--color-error))'
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={r} stroke="rgb(var(--color-border))" strokeWidth="6" fill="none" />
          <circle
            cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth="6" fill="none"
            strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-display font-bold" style={{ color }}>{score}</span>
          <span className="text-[10px] text-text-faint">/ 100</span>
        </div>
      </div>
      {label && <span className="text-xs text-text-muted mt-2">{label}</span>}
    </div>
  )
}

export function CountUp({ value, duration = 0.6, className }: { value: number; duration?: number; className?: string }) {
  const reduced = useReducedMotion()
  const [display, setDisplay] = useState(reduced ? value : 0)
  const rafRef = useRef<number>(0)
  const startRef = useRef<number>(0)
  useEffect(() => {
    if (reduced) { setDisplay(value); return }
    startRef.current = 0
    const tick = (now: number) => {
      if (!startRef.current) startRef.current = now
      const elapsed = (now - startRef.current) / 1000
      const t = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(value * eased))
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value, duration, reduced])
  return <span className={className}>{display}</span>
}

export function AnimatedProgress({ value, className = '', barClassName = '' }: { value: number; className?: string; barClassName?: string }) {
  const reduced = useReducedMotion()
  const [width, setWidth] = useState(reduced ? value : 0)
 useEffect(() => {
    if (reduced) { setWidth(value); return }
    const t = setTimeout(() => setWidth(value), 100)
    return () => clearTimeout(t)
  }, [value, reduced])
  return (
    <div className={`h-2.5 rounded-[2px] bg-bg-elev overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-[2px] ${barClassName}`}
        style={{ width: `${width}%`, background: 'linear-gradient(90deg, rgb(var(--color-primary)), rgb(var(--color-accent)))', transition: 'width 0.7s cubic-bezier(0.22, 1, 0.36, 1)' }}
      />
    </div>
  )
}

export function ScoreBar({ label, score }: { label: string; score: number }) {
  const color = score >= 75 ? 'bg-success' : score >= 50 ? 'bg-warning' : 'bg-error'
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-text-muted">{label}</span>
        <span className="font-medium font-mono">{score}/100</span>
      </div>
      <div className="h-2 rounded-[2px] bg-bg-elev overflow-hidden">
        <div className={`h-full ${color} rounded-[2px] transition-all duration-700`} style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}
