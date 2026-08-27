import { MessageSquare } from 'lucide-react'
import { useReducedMotion } from '../../lib/useReducedMotion'

export function PulsingMentorIcon({ className = 'h-7 w-7' }: { className?: string }) {
  const reduced = useReducedMotion()
  return (
    <div
      className="relative flex items-center justify-center"
      style={{
        animation: reduced ? undefined : 'pulseSoft 2.5s ease-in-out infinite',
      }}
    >
      <MessageSquare className={className} />
    </div>
  )
}
