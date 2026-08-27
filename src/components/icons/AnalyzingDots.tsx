import { useReducedMotion } from '../../lib/useReducedMotion'

export function AnalyzingDots({ className = '' }: { className?: string }) {
  const reduced = useReducedMotion()
  if (reduced) {
    return (
      <div className={`flex gap-1.5 ${className}`}>
        <span className="h-2 w-2 rounded-full bg-text-faint" />
        <span className="h-2 w-2 rounded-full bg-text-faint" />
        <span className="h-2 w-2 rounded-full bg-text-faint" />
      </div>
    )
  }
  return (
    <div className={`flex gap-1.5 ${className}`}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 rounded-full bg-primary"
          style={{
            animation: 'dotPulse 1s ease-in-out infinite',
            animationDelay: `${i * 0.16}s`,
          }}
        />
      ))}
    </div>
  )
}
