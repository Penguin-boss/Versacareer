import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { AmbientBackground } from '../components/AmbientBackground'

export default function Blog() {
  return (
    <div className="min-h-screen bg-bg relative overflow-hidden">
      <Helmet>
        <title>Blog & Career Resources — VersaCareer</title>
        <meta name="description" content="Read the latest tips on resume building, skill gaps, and interview prep." />
        <link rel="canonical" href="https://versacareer.com/blog" />
      </Helmet>
      <AmbientBackground />
      <header className="border-b border-border relative z-10 bg-bg/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="font-semibold text-text">VersaCareer</Link>
          <div className="flex gap-4">
             <Link to="/auth?mode=signin" className="text-text-muted hover:text-text transition-colors">Sign in</Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-16 relative z-10">
        <h1 className="text-4xl font-bold mb-8">Career Resources</h1>
        <div className="grid gap-6">
          <article className="p-6 border border-border rounded-xl bg-surface-1">
            <h2 className="text-2xl font-semibold mb-2">How to Format Your Resume for ATS</h2>
            <p className="text-text-muted mb-4">Learn the secrets to getting past Applicant Tracking Systems and landing interviews.</p>
            <span className="text-primary text-sm font-medium">Read more →</span>
          </article>
          <article className="p-6 border border-border rounded-xl bg-surface-1">
            <h2 className="text-2xl font-semibold mb-2">Top 5 Technical Skills in 2026</h2>
            <p className="text-text-muted mb-4">See which skills are trending and how to quickly close your knowledge gaps.</p>
            <span className="text-primary text-sm font-medium">Read more →</span>
          </article>
        </div>
      </main>
    </div>
  )
}
