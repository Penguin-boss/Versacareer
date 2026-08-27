import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MapPinOff, ArrowRight } from 'lucide-react'
import { useAuthStore } from '../lib/authStore'
import { fadeSlideUp, fadeOnly } from '../lib/motionVariants'

export default function NotFound() {
  const { user } = useAuthStore()

  const destination = user ? '/dashboard' : '/'
  const label = user ? 'Go to Dashboard' : 'Return Home'

  return (
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={fadeOnly} 
      className="min-h-screen bg-bg flex flex-col items-center justify-center p-6"
    >
      <motion.div variants={fadeSlideUp} className="max-w-md w-full text-center flex flex-col items-center">
        <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-6">
          <MapPinOff className="h-8 w-8" />
        </div>
        
        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-text mb-4">
          404
        </h1>
        
        <h2 className="text-lg sm:text-xl font-medium text-text mb-2">
          Page not found
        </h2>
        
        <p className="text-text-muted mb-8 leading-relaxed max-w-sm">
          We couldn't find the page you're looking for. The link might be broken or the page may have been removed.
        </p>

        <Link to={destination} className="btn-primary inline-flex items-center gap-2">
          {label}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </motion.div>
    </motion.div>
  )
}
