import { motion } from 'framer-motion'
import { useReducedMotion } from '../../lib/useReducedMotion'

export function SettlingIcon({ icon: Icon, className = 'h-5 w-5' }: { icon: any; className?: string }) {
  const reduced = useReducedMotion()
  if (reduced) return <Icon className={className} />
  return (
    <motion.div
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
    >
      <Icon className={className} />
    </motion.div>
  )
}
