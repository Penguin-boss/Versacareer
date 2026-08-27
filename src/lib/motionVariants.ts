import type { Variants } from 'framer-motion'
import { useReducedMotion } from './useReducedMotion'

export const fadeSlideUp: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
}

export const staggerContainer = (staggerMs = 70): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: staggerMs / 1000 } },
})

export const fadeOnly: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
}

const noMotion: Variants = {
  hidden: { opacity: 1, y: 0 },
  visible: { opacity: 1, y: 0, transition: { duration: 0 } },
}

export function useMotionVariants() {
  const reduced = useReducedMotion()
  if (reduced) {
    return {
      fadeSlideUp: noMotion,
      staggerContainer: () => noMotion,
      fadeOnly: noMotion,
    }
  }
  return { fadeSlideUp, staggerContainer, fadeOnly }
}

export function usePageFade() {
  const reduced = useReducedMotion()
  if (reduced) {
    return {
      initial: { opacity: 1 } as const,
      animate: { opacity: 1 } as const,
      exit: { opacity: 1 } as const,
    }
  }
  return {
    initial: { opacity: 0 } as const,
    animate: { opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } } as const,
    exit: { opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } } as const,
  }
}
