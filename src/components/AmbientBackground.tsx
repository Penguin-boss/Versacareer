import { useReducedMotion } from '../lib/useReducedMotion'

const DOTS = [
  { left: '8%', top: '15%', size: 4, duration: '5s', delay: '0s' },
  { left: '22%', top: '60%', size: 3, duration: '7s', delay: '1s' },
  { left: '45%', top: '25%', size: 5, duration: '6s', delay: '2s' },
  { left: '62%', top: '70%', size: 3, duration: '8s', delay: '0.5s' },
  { left: '78%', top: '20%', size: 4, duration: '5.5s', delay: '1.5s' },
  { left: '88%', top: '55%', size: 3, duration: '7.5s', delay: '2.5s' },
  { left: '35%', top: '85%', size: 4, duration: '6.5s', delay: '3s' },
  { left: '70%', top: '40%', size: 3, duration: '4.5s', delay: '0.8s' },
]

export function AmbientBackground() {
  const reduced = useReducedMotion()
  if (reduced) return null

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* Slow gradient mesh — brand palette: cool blue + lavender */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          background:
            'radial-gradient(ellipse at 20% 30%, rgb(91 127 204) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgb(155 142 196) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, rgb(70 106 180) 0%, transparent 60%)',
          backgroundSize: '200% 200%',
          animation: 'ambientGradient 25s ease-in-out infinite',
        }}
      />
      {/* Floating dots */}
      {DOTS.map((d, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: d.left,
            top: d.top,
            width: d.size,
            height: d.size,
            opacity: 0.08,
            background: i % 2 === 0
              ? 'rgb(var(--color-primary))'
              : 'rgb(var(--color-accent))',
            animation: `ambientFloat ${d.duration} ease-in-out infinite`,
            animationDelay: d.delay,
          }}
        />
      ))}
    </div>
  )
}
