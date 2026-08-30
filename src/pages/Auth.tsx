import { useState } from 'react'
import { Link, useNavigate, useSearchParams, Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { Mail, Lock, User as UserIcon, MailCheck, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'
import { useMotionVariants } from '../lib/motionVariants'
import { useAuthStore } from '../lib/authStore'
import { FullLoader } from '../components/DashboardLayout'

import './Auth.css'

type Mode = 'signin' | 'signup' | 'check-inbox'
type OAuthProvider = 'google' | 'github' | 'linkedin_oidc'

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82z"/>
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.11A12 12 0 0 0 12 24z"/>
      <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.61H1.26A12 12 0 0 0 0 12c0 1.94.46 3.77 1.26 5.39z"/>
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.26 6.61l4.01 3.11C6.22 6.86 8.87 4.75 12 4.75z"/>
    </svg>
  )
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="#8B93A7" aria-hidden="true">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45z"/>
    </svg>
  )
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="#8B93A7" aria-hidden="true">
      <path d="M12 .3a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.03c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.08 1.85 1.24 1.85 1.24 1.07 1.84 2.81 1.31 3.49 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.49 5.93.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0 0 12 .3z"/>
    </svg>
  )
}

const OAUTH_PROVIDERS: { provider: OAuthProvider; label: string; Icon: (p: { className?: string }) => JSX.Element }[] = [
  { provider: 'google', label: 'Continue with Google', Icon: GoogleIcon },
  { provider: 'linkedin_oidc', label: 'Continue with LinkedIn', Icon: LinkedInIcon },
  { provider: 'github', label: 'Continue with GitHub', Icon: GitHubIcon },
]

const RESEND_COOLDOWN_SECONDS = 60

export default function AuthPage() {
  const { user, loading: authLoading } = useAuthStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryMode = searchParams.get('mode')
  const [localMode, setLocalMode] = useState<Mode>(queryMode === 'signin' ? 'signin' : 'signup')
  const mode: Mode = localMode

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')

  const [loading, setLoading] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const [resendCooldown, setResendCooldown] = useState(0)
  const [resending, setResending] = useState(false)

  const navigate = useNavigate()
  const { fadeSlideUp: fsu, fadeOnly: fo } = useMotionVariants()

  if (authLoading) return <FullLoader />
  if (user) return <Navigate to="/dashboard" replace />

  const switchMode = (m: Mode) => {
    setLocalMode(m)
    setErrors({})
    if (m === 'signin' || m === 'signup') {
      setSearchParams({ mode: m })
    }
  }

  const startResendCooldown = () => {
    setResendCooldown(RESEND_COOLDOWN_SECONDS)
    const interval = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const handleOAuthLogin = async (provider: OAuthProvider) => {
    if (oauthLoading) return
    setOauthLoading(provider)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) throw error
    } catch (err: any) {
      toast.error(err.message || 'OAuth sign-in failed.')
      setOauthLoading(null)
    }
  }

  const validate = () => {
    const newErrors: { [key: string]: string } = {}
    if (mode === 'signup' && !name.trim()) newErrors.name = 'Name is required'
    if (!email.trim()) newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Invalid email address'
    if (!password) newErrors.password = 'Password is required'
    else if (mode === 'signup' && password.length < 6) newErrors.password = 'Password must be at least 6 characters'
    if (mode === 'signup' && password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleResetPassword = async () => {
    if (!email.trim()) { setErrors({ email: 'Please enter your email first' }); return }
    setResetting(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      })
      if (error) throw error
      toast.success('Password reset email sent.')
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reset email.')
    } finally {
      setResetting(false)
    }
  }

  const handleResendConfirmation = async () => {
    if (resendCooldown > 0 || resending) return
    setResending(true)
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email: signupEmail })
      if (error) throw error
      toast.success('Confirmation email resent.')
      startResendCooldown()
    } catch (err: any) {
      toast.error(err.message || 'Failed to resend confirmation email.')
    } finally {
      setResending(false)
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    if (loading) return
    setLoading(true)
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name || undefined },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        if (error) throw error
        if (data.user && !data.session) {
          setSignupEmail(email)
          setPassword('')
          setConfirmPassword('')
          startResendCooldown()
          switchMode('check-inbox')
          return
        }
        toast.success('Welcome to VersaCareer!')
        navigate('/dashboard')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          const msg = error.message?.toLowerCase() ?? ''
          if (msg.includes('email not confirmed') || msg.includes('not confirmed')) {
            setErrors({
              password: 'Your email is not yet confirmed. Check your inbox or resend the confirmation email below.',
            })
            setSignupEmail(email)
            return
          }
          throw error
        }
        toast.success('Signed in successfully.')
        navigate('/dashboard')
      }
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed.')
    } finally {
      setLoading(false)
    }
  }

  if (mode === 'check-inbox') {
    return (
      <div className="auth-page-root">
        <div className="bg-grid"></div>
        <button onClick={() => switchMode('signup')} className="back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back
        </button>
        <div className="page" style={{ paddingTop: '160px', textAlign: 'center' }}>
          <motion.div initial="hidden" animate="visible" variants={fo} className="form-card">
            <MailCheck className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>Check your inbox</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
              We've sent a confirmation link to <span style={{ color: 'var(--text)', fontWeight: 500 }}>{signupEmail}</span>. Click it to activate your account.
            </p>
            <button
              onClick={handleResendConfirmation}
              disabled={resendCooldown > 0 || resending}
              className="submit-btn"
              style={{ background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }}
            >
              <RefreshCw className={`h-4 w-4 ${resending ? 'animate-spin' : ''}`} />
              {resending ? 'Sending…' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend confirmation email'}
            </button>
            <div className="switch-row mt-4">
              Wrong email? <button onClick={() => switchMode('signup')}>Go back and try again</button>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page-root">
      <div className="bg-grid"></div>

      <Link className="back-link" to="/">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Back
      </Link>

      <div className="page">
        <motion.div initial="hidden" animate="visible" variants={fo}>
          <div className="brand">
            <img className="brand-mark" src="data:image/png;base64,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" alt="VersaCareer" />
            <div className="brand-name">VersaCareer</div>
          </div>

          <h1>{mode === 'signup' ? 'Create your account' : 'Welcome back'}</h1>

          <div className="oauth-list">
            {OAUTH_PROVIDERS.map(({ provider, label, Icon }) => (
              <button
                key={provider}
                type="button"
                onClick={() => handleOAuthLogin(provider)}
                disabled={oauthLoading !== null}
                className="oauth-btn"
              >
                <Icon />
                {oauthLoading === provider ? 'Redirecting…' : label}
              </button>
            ))}
          </div>

          <div className="divider-row">
            <div className="divider-line"></div>
            <div className="divider-label">OR CONTINUE WITH EMAIL</div>
            <div className="divider-line"></div>
          </div>

          <form onSubmit={submit} className="form-card" noValidate>
            {mode === 'signup' && (
              <div className="field">
                <label htmlFor="auth-name">Full name</label>
                <div className={`field-input ${errors.name ? 'has-error' : ''}`}>
                  <UserIcon />
                  <input
                    id="auth-name"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => { setName(e.target.value); if (errors.name) setErrors(prev => ({ ...prev, name: '' })) }}
                  />
                </div>
                {errors.name && <div className="error-text">{errors.name}</div>}
              </div>
            )}

            <div className="field">
              <label htmlFor="auth-email">Email</label>
              <div className={`field-input ${errors.email ? 'has-error' : ''}`}>
                <Mail />
                <input
                  id="auth-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors(prev => ({ ...prev, email: '' })) }}
                />
              </div>
              {errors.email && <div className="error-text">{errors.email}</div>}
            </div>

            <div className="field">
              <label htmlFor="auth-password">
                Password
                {mode === 'signin' && (
                  <button type="button" onClick={handleResetPassword} disabled={resetting} className="forgot-btn">
                    {resetting ? 'Sending...' : 'Forgot password?'}
                  </button>
                )}
              </label>
              <div className={`field-input ${errors.password ? 'has-error' : ''}`}>
                <Lock />
                <input
                  id="auth-password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors(prev => ({ ...prev, password: '' })) }}
                />
              </div>
              {errors.password && (
                <div className="error-text">
                  {errors.password}
                  {(errors.password.includes('not yet confirmed') || errors.password.includes('not confirmed')) && signupEmail && (
                    <div style={{marginTop: '4px'}}>
                      <button
                        type="button"
                        onClick={handleResendConfirmation}
                        disabled={resendCooldown > 0 || resending}
                        className="resend-btn"
                      >
                        {resending ? 'Sending…' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend confirmation email'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {mode === 'signup' && (
              <div className="field">
                <label htmlFor="auth-confirm">Confirm password</label>
                <div className={`field-input ${errors.confirmPassword ? 'has-error' : ''}`}>
                  <Lock />
                  <input
                    id="auth-confirm"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' })) }}
                  />
                </div>
                {errors.confirmPassword && <div className="error-text">{errors.confirmPassword}</div>}
              </div>
            )}

            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Please wait…
                </>
              ) : mode === 'signup' ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="switch-row">
            {mode === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
            <button onClick={() => switchMode(mode === 'signup' ? 'signin' : 'signup')}>
              {mode === 'signup' ? 'Sign in' : 'Create one'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
