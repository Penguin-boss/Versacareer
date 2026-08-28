import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { motion } from 'framer-motion'
import { fadeSlideUp, fadeOnly } from '../lib/motionVariants'
import { CheckCircle, XCircle, Loader } from 'lucide-react'
import { Link } from 'react-router-dom'

type State = 'loading' | 'success' | 'error'

export default function AuthCallback() {
  const [state, setState] = useState<State>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    // supabase-js v2 automatically exchanges the code in the URL for a session
    // via onAuthStateChange. We just need to detect when it resolves.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setState('success')
        // Give the user a moment to see the success state, then redirect
        setTimeout(() => navigate('/dashboard', { replace: true }), 1500)
      } else if (event === 'TOKEN_REFRESHED') {
        // already confirmed, send to dashboard
        setState('success')
        setTimeout(() => navigate('/dashboard', { replace: true }), 1500)
      }
    })

    // Also handle the case where the URL has an error (e.g. expired link)
    const errorCode = searchParams.get('error_code')
    const errorDescription = searchParams.get('error_description')
    if (errorCode) {
      setState('error')
      setErrorMsg(
        errorDescription
          ? decodeURIComponent(errorDescription.replace(/\+/g, ' '))
          : 'The confirmation link is invalid or has expired.'
      )
    }

    // Timeout fallback — if nothing resolves in 10s, show error
    const timeout = setTimeout(() => {
      setState(prev => {
        if (prev === 'loading') {
          setErrorMsg('The confirmation link may have expired. Please request a new one.')
          return 'error'
        }
        return prev
      })
    }, 10000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [navigate, searchParams])

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeOnly}
        className="w-full max-w-sm text-center"
      >
        {state === 'loading' && (
          <motion.div variants={fadeSlideUp} className="flex flex-col items-center gap-4">
            <Loader className="h-10 w-10 text-primary animate-spin" />
            <h1 className="text-xl font-semibold">Confirming your account…</h1>
            <p className="text-text-muted text-sm">Hang tight, this only takes a moment.</p>
          </motion.div>
        )}

        {state === 'success' && (
          <motion.div variants={fadeSlideUp} className="flex flex-col items-center gap-4">
            <CheckCircle className="h-12 w-12 text-success" />
            <h1 className="text-xl font-semibold">Email confirmed!</h1>
            <p className="text-text-muted text-sm">Taking you to your dashboard…</p>
          </motion.div>
        )}

        {state === 'error' && (
          <motion.div variants={fadeSlideUp} className="flex flex-col items-center gap-5">
            <XCircle className="h-12 w-12 text-error" />
            <h1 className="text-xl font-semibold">Confirmation failed</h1>
            <p className="text-text-muted text-sm">{errorMsg}</p>
            <Link to="/auth?mode=signup" className="btn-primary">
              Request a new confirmation email
            </Link>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
