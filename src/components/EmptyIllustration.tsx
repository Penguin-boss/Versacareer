import { motion } from 'framer-motion'
import { useReducedMotion } from '../lib/useReducedMotion'
import emptyTray from '../assets/empty-state-tray.png'

const floatTransition = {
  duration: 4.5,
  ease: 'easeInOut' as const,
  repeat: Infinity,
  repeatType: 'reverse' as const,
}

export function EmptyIllustration({ maxWidth = 360 }: { maxWidth?: number }) {
  const reduced = useReducedMotion()

  if (reduced) {
    return (
      <img
        src={emptyTray}
        alt=""
        style={{ maxWidth }}
        className="mx-auto w-full h-auto select-none pointer-events-none"
      />
    )
  }

  return (
    <motion.img
      src={emptyTray}
      alt=""
      style={{ maxWidth }}
      className="mx-auto w-full h-auto select-none pointer-events-none"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1, y: [0, -4, 0] }}
      transition={{
        opacity: { duration: 0.4, ease: 'easeOut' },
        scale: { duration: 0.4, ease: 'easeOut' },
        y: { ...floatTransition, delay: 0.45 },
      }}
    />
  )
}
