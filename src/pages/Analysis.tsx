import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { FileText, CircleCheck as CheckCircle2, TriangleAlert as AlertTriangle, Lightbulb, History } from 'lucide-react'
import { PageHeader } from '../components/DashboardLayout'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../lib/authStore'
import type { ResumeAnalysis } from '../lib/types'
import { LoadingState, EmptyState, ErrorState, ScoreRing, ScoreBar } from '../components/ui'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { fadeSlideUp, staggerContainer, fadeOnly } from '../lib/motionVariants'
import { useCountUp } from '../lib/useCountUp'
import { useReducedMotion } from '../lib/useReducedMotion'
import analysisBanner from '../assets/analysis-header-banner.png'

export default function Analysis() {
  const { user } = useAuthStore()
  const location = useLocation()
  const newId = (location.state as any)?.newId
  const [latest, setLatest] = useState<ResumeAnalysis | null>(null)
  const [history, setHistory] = useState<ResumeAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const load = async () => {
    if (!user) return
    setLoading(true)
    setError('')
    try {
      const { data, error } = await supabase
        .from('resume_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      const rows = (data ?? []) as unknown as ResumeAnalysis[]
      setHistory(rows)
      const target = rows.find((r) => r.id === newId) ?? rows[0] ?? null
      setLatest(target)
      setSelectedId(target?.id ?? null)
    } catch (err: any) {
      setError(err.message || 'Failed to load analyses.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [user, newId]) // eslint-disable-line

  if (loading) return <LoadingState label="Loading your analyses…" />
  if (error) return <ErrorState message={error} onRetry={load} />
  if (!latest) {
    return (
      <EmptyState
        icon={FileText}
        title="No analyses yet"
        description="Upload your resume to get an AI-powered breakdown of your ATS, technical, market, and project scores."
        action={<Link to="/upload" className="btn-primary">Upload your resume</Link>}
      />
    )
  }

  const current = history.find((h) => h.id === selectedId) ?? latest

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeOnly}>
      <PageHeader
        title="Resume Analysis"
        subtitle="Your latest AI analysis. Scores are 0-100; higher is better."
        icon={FileText}
      />

      {/* Header banner — fades in first, no loop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full rounded-[3px] overflow-hidden mb-6"
        style={{ maxHeight: 220 }}
      >
        <img
          src={analysisBanner}
          alt=""
          className="w-full h-full object-cover select-none pointer-events-none"
          style={{ maxHeight: 220 }}
        />
      </motion.div>

      <motion.div variants={staggerContainer(60)} initial="hidden" animate="visible" className="grid lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Score gauges — stagger starts ~150ms after banner begins */}
          <motion.div variants={fadeSlideUp} className="card p-6 card-hover">
            <ScoreGauges current={current} />
            {current.suitable_roles_text && (
              <div className="rounded-[2px] bg-bg-soft border border-border p-4 mt-6">
                <div className="text-xs text-text-faint mb-1">SUITABLE ROLES</div>
                <p className="text-sm">{current.suitable_roles_text}</p>
              </div>
            )}
          </motion.div>

          {/* Detail lists — fade in after gauges */}
          <motion.div
            variants={staggerContainer(90)}
            initial="hidden"
            animate="visible"
            transition={{ delayChildren: 0.7 }}
            className="grid md:grid-cols-2 gap-6"
          >
            <motion.div variants={fadeSlideUp} className="card p-6 card-hover">
              <h3 className="flex items-center gap-2 font-medium mb-3 text-success">
                <CheckCircle2 className="h-4 w-4" /> Strengths
              </h3>
              <ul className="space-y-2">
                {current.strengths?.length ? current.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-text-muted flex gap-2">
                    <span className="text-success mt-0.5">•</span> {s}
                  </li>
                )) : <li className="text-sm text-text-faint">None detected.</li>}
              </ul>
            </motion.div>
            <motion.div variants={fadeSlideUp} className="card p-6 card-hover">
              <h3 className="flex items-center gap-2 font-medium mb-3 text-warning">
                <AlertTriangle className="h-4 w-4" /> Weaknesses
              </h3>
              <ul className="space-y-2">
                {current.weaknesses?.length ? current.weaknesses.map((s, i) => (
                  <li key={i} className="text-sm text-text-muted flex gap-2">
                    <span className="text-warning mt-0.5">•</span> {s}
                  </li>
                )) : <li className="text-sm text-text-faint">None detected.</li>}
              </ul>
            </motion.div>
          </motion.div>

          <motion.div variants={fadeSlideUp} className="card p-6 card-hover">
            <h3 className="flex items-center gap-2 font-medium mb-3 text-primary">
              <Lightbulb className="h-4 w-4" /> Suggestions
            </h3>
            <ol className="space-y-2">
              {current.suggestions?.length ? current.suggestions.map((s, i) => (
                <li key={i} className="text-sm text-text-muted flex gap-2">
                  <span className="text-primary font-medium">{i + 1}.</span> {s}
                </li>
              )) : <li className="text-sm text-text-faint">None.</li>}
            </ol>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            <motion.div variants={fadeSlideUp} className="card p-6 card-hover">
              <h3 className="font-medium mb-3">Detected Skills</h3>
              <div className="flex flex-wrap gap-2">
                {current.current_skills?.length ? current.current_skills.map((s, i) => (
                  <span key={i} className="badge bg-primary/10 text-primary border border-primary/20">{s}</span>
                )) : <span className="text-sm text-text-faint">None detected.</span>}
              </div>
            </motion.div>
            <motion.div variants={fadeSlideUp} className="card p-6 card-hover">
              <h3 className="font-medium mb-3">Missing Skills</h3>
              <div className="flex flex-wrap gap-2">
                {current.missing_skills?.length ? current.missing_skills.map((s, i) => (
                  <span key={i} className="badge bg-error/10 text-error border border-error/20">{s}</span>
                )) : <span className="text-sm text-text-faint">None detected.</span>}
              </div>
            </motion.div>
          </div>

          {current.ats_report?.length > 0 && (
            <motion.div variants={fadeSlideUp} className="card p-6 card-hover">
              <h3 className="font-medium mb-4">ATS Report</h3>
              <div className="space-y-2">
                {current.ats_report.map((item, i) => {
                  const sevColor = item.severity === 'high' ? 'text-error' : item.severity === 'medium' ? 'text-warning' : 'text-text-muted'
                  const sevBg = item.severity === 'high' ? 'bg-error/10 border-error/20' : item.severity === 'medium' ? 'bg-warning/10 border-warning/20' : 'bg-bg-elev border-border'
                  return (
                    <div key={i} className={`rounded-[2px] border p-3 ${sevBg}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs uppercase tracking-wide text-text-faint">{item.type}</span>
                        <span className={`text-xs font-medium ${sevColor}`}>{item.severity}</span>
                      </div>
                      <p className="text-sm">{item.message}</p>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </div>

        {/* History sidebar */}
        <div>
          <motion.div variants={fadeSlideUp} className="card p-5 card-hover">
            <h3 className="flex items-center gap-2 font-medium mb-4 text-sm">
              <History className="h-4 w-4" /> History
            </h3>
            {history.length === 0 ? (
              <p className="text-sm text-text-faint">No past analyses.</p>
            ) : (
              <div className="space-y-2">
                {history.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => setSelectedId(h.id)}
                    className={`w-full text-left rounded-[2px] p-3 border transition-colors ${
                      h.id === selectedId ? 'bg-primary-soft border-primary/30' : 'bg-bg-soft border-border hover:border-border-soft'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate flex-1">{h.file_name}</span>
                      <span className={`text-sm font-semibold ml-2 ${scoreColor(h.overall_score)}`}>{h.overall_score}</span>
                    </div>
                    <div className="text-xs text-text-faint mt-1">
                      {new Date(h.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </button>
                ))}
              </div>
            )}
            <Link to="/upload" className="btn-secondary w-full mt-4 justify-center text-sm">
              Analyze another resume
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Scores are driven by useCountUp so each gauge counts up independently
// with a staggered delay: ATS at 150ms, Technical at 250ms, etc.
function ScoreGauges({ current }: { current: ResumeAnalysis }) {
  const reduced = useReducedMotion()
  const gaugeDelay = (i: number) => reduced ? 0 : 150 + i * 100

  const ats       = useCountUp(current.ats_score,        0.6, gaugeDelay(0))
  const technical = useCountUp(current.technical_score,  0.6, gaugeDelay(1))
  const market    = useCountUp(current.experience_score, 0.6, gaugeDelay(2))
  const project   = useCountUp(current.project_score,    0.6, gaugeDelay(3))
  const overall   = useCountUp(current.overall_score,    0.7, gaugeDelay(4))

  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      <ScoreRing score={overall} size={140} label="Overall" />
      <div className="flex-1 w-full space-y-3">
        <ScoreBar label="ATS Compatibility"     score={ats} />
        <ScoreBar label="Technical Depth"       score={technical} />
        <ScoreBar label="Market / Experience"   score={market} />
        <ScoreBar label="Project Quality"       score={project} />
      </div>
    </div>
  )
}

function scoreColor(s: number) {
  return s >= 75 ? 'text-success' : s >= 50 ? 'text-warning' : 'text-error'
}
