import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../lib/authStore'
import { fadeOnly } from '../lib/motionVariants'
import { Helmet } from 'react-helmet-async'
import './Landing.css'

export default function NotFound() {
  const { user } = useAuthStore()

  const destination = user ? '/dashboard' : '/auth?mode=signup'
  const primaryLabel = user ? 'Go to dashboard' : 'Get started free'
  const secondaryDestination = user ? '/' : '/'
  const secondaryLabel = user ? 'Back to home' : 'Back to home'

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeOnly}
      className="landing-page-root nf-page"
    >
      <Helmet>
        <title>Page Not Found — VersaCareer</title>
        <meta name="description" content="The page you're looking for doesn't exist. Let us help you find what you need - resume analyzer, career roadmap, skill gap analysis, or mock interviews." />
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href="https://versacareer.com/404" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://versacareer.com/404" />
        <meta property="og:title" content="Page Not Found — VersaCareer" />
        <meta property="og:description" content="The page you're looking for doesn't exist. Let us help you find what you need." />
        <meta property="og:image" content="https://versacareer.com/assets/brand/og-card.webp" />
        <meta property="og:site_name" content="VersaCareer" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Page Not Found — VersaCareer" />
        <meta name="twitter:description" content="The page you're looking for doesn't exist. Let us help you find what you need." />
        <meta name="twitter:image" content="https://versacareer.com/assets/brand/og-card.webp" />
      </Helmet>
      <div className="bg-grid"></div>

      <header>
        <nav>
          <Link to="/" className="logo" style={{ textDecoration: 'none' }}>
            <img className="logo-mark" alt="VersaCareer" src="/assets/brand/icon-gold.png" />
            <span>VersaCareer</span>
          </Link>
        </nav>
      </header>

      <main className="nf-main">
        <div className="nf-inner">
          {/* Terminal-style 404 card */}
          <div className="nf-code" aria-hidden="true">
            <div className="nf-code-head">
              <div className="nf-dots">
                <span className="nf-dot"></span>
                <span className="nf-dot"></span>
                <span className="nf-dot"></span>
              </div>
              <span className="nf-file">ROUTE.LOG</span>
              <span className="scan-badge">not found</span>
            </div>
            <div className="nf-line">
              <span className="nf-key">"status"</span>: <span className="nf-num">404</span>,
            </div>
            <div className="nf-line">
              <span className="nf-key">"resource"</span>: <span className="nf-null">null</span>,
            </div>
            <div className="nf-line">
              <span className="nf-key">"suggestion"</span>: <span className="nf-str">"this page walked off the roadmap"</span>
              <span className="nf-caret"></span>
            </div>
          </div>

          <h1 className="nf-title">404</h1>
          <h2 className="nf-subtitle">Page not found</h2>
          <p className="nf-desc">
            The link might be broken, or the page may have been removed.
            Let's get you back somewhere useful — your next move is one click away.
          </p>

          <div className="nf-actions">
            <Link to={destination} className="btn btn-primary">
              {primaryLabel} →
            </Link>
            <Link to={secondaryDestination} className="btn btn-ghost">
              {secondaryLabel}
            </Link>
          </div>

          <div className="nf-hint">
            {user ? (
              <>Lost in the app? <Link to="/dashboard">Dashboard</Link> · <Link to="/upload">Resume analyzer</Link></>
            ) : (
              <>New here? <Link to="/auth?mode=signup">Create an account</Link> · <Link to="/pricing">See pricing</Link></>
            )}
          </div>
        </div>
      </main>
    </motion.div>
  )
}
