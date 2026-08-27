import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../lib/useTheme'
import { motion, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from '../lib/useReducedMotion'

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()
  const reduced = useReducedMotion()

  return (
    <button
      onClick={toggleTheme}
      className={`btn-ghost p-2 h-9 w-9 rounded-full flex items-center justify-center overflow-hidden relative ${className}`}
      aria-label="Toggle theme"
    >
      <AnimatePresence mode="wait" initial={false}>
        {theme === 'dark' ? (
          <motion.div
            key="moon"
            initial={reduced ? { opacity: 1 } : { opacity: 0, rotate: -90, scale: 0.5 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, rotate: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, rotate: 90, scale: 0.5 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Moon className="h-4 w-4" />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={reduced ? { opacity: 1 } : { opacity: 0, rotate: 90, scale: 0.5 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, rotate: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, rotate: -90, scale: 0.5 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Sun className="h-4 w-4" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  )
}
