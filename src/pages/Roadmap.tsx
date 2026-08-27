import { useEffect, useState } from 'react'
import { Map, ChevronDown, Check, Lock, Play, RefreshCw } from 'lucide-react'
import { PageHeader } from '../components/DashboardLayout'
import { supabase, callEdgeFunction } from '../lib/supabase'
import { useAuthStore } from '../lib/authStore'
import { CAREER_PATHS, type Milestone, type ResumeAnalysis, type CareerDNA } from '../lib/types'
import { LoadingState, EmptyState, ErrorState } from '../components/ui'
import { EmptyIllustration } from '../components/EmptyIllustration'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { fadeSlideUp, staggerContainer, fadeOnly } from '../lib/motionVariants'

export default function Roadmap() {
  const { user, profile } = useAuthStore()
  const isFree = profile?.plan === 'FREE'
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [latest, setLatest] = useState<ResumeAnalysis | null>(null)
  const [dna, setDna] = useState<CareerDNA | null>(null)
  const [target, setTarget] = useState<string>(CAREER_PATHS[0])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [generating, setGenerating] = useState(false)

  const load = async () => {
    if (!user) return
    setLoading(true)
    setError('')
    try {
      const [mRes, aRes, dRes] = await Promise.all([
        supabase.from('milestones').select('*').eq('user_id', user.id).order('week', { ascending: true }),
        supabase.from('resume_analyses').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('career_dna').select('*').eq('user_id', user.id).maybeSingle(),
      ])
      if (mRes.error) throw mRes.error
      setMilestones((mRes.data ?? []) as unknown as Milestone[])
      setLatest(aRes.data as unknown as ResumeAnalysis)
      const dnaData = dRes.data as unknown as CareerDNA
      setDna(dnaData)
      if (dnaData?.suggested_careers?.length) setTarget(dnaData.suggested_careers[0])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [user]) // eslint-disable-line

  const updateStatus = async (id: string, status: Milestone['status']) => {
    setMilestones((prev) => prev.map((m) => m.id === id ? { ...m, status } : m))
    const { error } = await supabase.from('milestones').update({ status }).eq('id', id)
    if (error) {
      toast.error('Failed to update milestone.')
      load()
    }
  }

  const generate = async () => {
    setGenerating(true)
    try {
      const res = await callEdgeFunction<{ milestones: Milestone[] }>('generate-roadmap', { targetRole: target })
      setMilestones(res.milestones)
      toast.success('Roadmap generated!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate roadmap.')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) return <LoadingState label="Loading roadmap…" />
  if (error) return <ErrorState message={error} onRetry={load} />

  const hasResume = !!latest

  if (!hasResume) {
    return (
      <EmptyState
        icon={Map}
        title="Analyze your resume first"
        description="We generate your roadmap based on your detected skills and gaps. Upload a resume to get started."
        action={<Link to="/upload" className="btn-primary">Upload your resume</Link>}
      />
    )
  }

  const completedCount = milestones.filter((m) => m.status === 'COMPLETED').length
  const progress = milestones.length ? Math.round((completedCount / milestones.length) * 100) : 0

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeOnly}>
      <PageHeader title="Career Roadmap" subtitle="A week-by-week plan to close your gaps. Progress is saved across devices." icon={Map} />

      {milestones.length > 0 && (
        <motion.div variants={fadeSlideUp} className="card p-5 mb-6 card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-muted">Progress</span>
            <span className="text-sm font-medium">{completedCount} / {milestones.length} milestones</span>
          </div>
          <div className="h-2 rounded-full bg-bg-elev overflow-hidden">
            <div className="h-full bg-success rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </motion.div>
      )}

      <motion.div variants={fadeSlideUp} className="card p-5 mb-6 card-hover">
        <label className="label">Target career</label>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <select value={target} onChange={(e) => setTarget(e.target.value)} className="input appearance-none pr-10">
              {CAREER_PATHS.map((c) => <option key={c} value={c}>{c}</option>)}
              {dna?.suggested_careers?.filter((c) => !CAREER_PATHS.includes(c as any)).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-faint pointer-events-none" />
          </div>
          <button onClick={generate} disabled={generating} className="btn-primary whitespace-nowrap">
            {generating ? <><RefreshCw className="h-4 w-4 animate-spin" /> Generating…</> : milestones.length ? 'Regenerate roadmap' : 'Generate roadmap'}
          </button>
        </div>
      </motion.div>

      {milestones.length === 0 ? (
        <motion.div variants={staggerContainer(80)} initial="hidden" animate="visible" className="max-w-2xl mx-auto text-center py-12">
          <EmptyIllustration maxWidth={360} />
          <motion.div variants={fadeSlideUp} transition={{ delay: 0.25 }} className="mt-8">
            <h2 className="text-2xl font-semibold mb-3">No roadmap yet</h2>
            <p className="text-text-muted mb-6 max-w-md mx-auto">
              Pick a target career and generate your personalized week-by-week plan.
            </p>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div variants={staggerContainer(50)} initial="hidden" animate="visible" className="relative">
          {/* Vertical line */}
          <div className="absolute left-5 top-2 bottom-2 w-px bg-border" />
          <div className="space-y-4">
            {milestones.map((m, idx) => {
              const isCompleted = m.status === 'COMPLETED'
              const isInProgress = m.status === 'IN_PROGRESS'
              const isLocked = m.status === 'LOCKED'
              return (
                <div key={m.id} className="relative pl-14">
                  <div className={`absolute left-0 top-0 h-10 w-10 rounded-full flex items-center justify-center border-2 ${
                    isCompleted ? 'bg-success border-success text-white' :
                    isInProgress ? 'bg-primary border-primary text-white' :
                    'bg-bg-elev border-border text-text-faint'
                  }`}>
                    {isCompleted ? <Check className="h-5 w-5" /> : isLocked ? <Lock className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </div>
                  <motion.div variants={fadeSlideUp} className="card p-5 card-hover">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="badge bg-bg-elev text-text-muted">Week {m.week}</span>
                          {isInProgress && <span className="badge bg-primary/10 text-primary border border-primary/20">In progress</span>}
                          {isCompleted && <span className="badge bg-success/10 text-success border border-success/20">Completed</span>}
                        </div>
                        <h3 className="font-medium mb-1">{m.title}</h3>
                        <p className="text-sm text-text-muted">{m.description}</p>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {!isCompleted && (
                          <button onClick={() => updateStatus(m.id, 'COMPLETED')} className="btn-ghost text-xs px-2.5 py-1.5">
                            <Check className="h-3.5 w-3.5" /> Mark done
                          </button>
                        )}
                        {isCompleted && (
                          <button onClick={() => updateStatus(m.id, 'IN_PROGRESS')} className="btn-ghost text-xs px-2.5 py-1.5">
                            Undo
                          </button>
                        )}
                        {isLocked && (
                          <button onClick={() => updateStatus(m.id, 'IN_PROGRESS')} className="btn-ghost text-xs px-2.5 py-1.5">
                            <Play className="h-3.5 w-3.5" /> Start
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
