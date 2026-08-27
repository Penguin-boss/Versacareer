import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { LayoutDashboard, FileText, Target, Map, ArrowRight, MessageSquare, Dna, Upload } from 'lucide-react'
import { PageHeader } from '../components/DashboardLayout'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../lib/authStore'
import { useTheme } from '../lib/useTheme'
import type { ResumeAnalysis, Milestone } from '../lib/types'
import { LoadingState, ScoreRing, CountUp, AnimatedProgress } from '../components/ui'
import { Link } from 'react-router-dom'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'
import { fadeSlideUp, staggerContainer, fadeOnly } from '../lib/motionVariants'
import { EmptyIllustration } from '../components/EmptyIllustration'

export default function Dashboard() {
  const { user, profile } = useAuthStore()
  const { theme } = useTheme()
  const [latest, setLatest] = useState<ResumeAnalysis | null>(null)
  const [history, setHistory] = useState<ResumeAnalysis[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    if (!user) return
    setLoading(true)
    try {
      const [aRes, mRes] = await Promise.all([
        supabase.from('resume_analyses').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(6),
        supabase.from('milestones').select('*').eq('user_id', user.id).order('week', { ascending: true }),
      ])
      const rows = (aRes.data ?? []) as unknown as ResumeAnalysis[]
      setHistory(rows)
      setLatest(rows[0] ?? null)
      setMilestones((mRes.data ?? []) as unknown as Milestone[])
    } catch (err) {
      // ignore
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [user]) // eslint-disable-line

  if (loading) return <LoadingState label="Loading dashboard…" />

  const greeting = profile?.name ? `Welcome back, ${profile.name.split(' ')[0]}` : 'Welcome'

  const totalMilestones = milestones.length
  const completedMilestones = milestones.filter((m) => m.status === 'COMPLETED').length
  const roadmapProgress = totalMilestones ? Math.round((completedMilestones / totalMilestones) * 100) : 0

  const currentCount = (latest?.current_skills ?? []).length
  const missingCount = (latest?.missing_skills ?? []).length
  const skillCoverage = (currentCount + missingCount) > 0 ? Math.round((currentCount / (currentCount + missingCount)) * 100) : 0
  const radarData = [
    { category: 'ATS', value: latest?.ats_score ?? 0 },
    { category: 'Technical', value: latest?.technical_score ?? 0 },
    { category: 'Experience', value: latest?.experience_score ?? 0 },
    { category: 'Projects', value: latest?.project_score ?? 0 },
  ]

  const quickLinks = [
    { to: '/upload', label: 'Analyze Resume', icon: FileText, desc: 'Get AI scores' },
    { to: '/career-dna', label: 'Career DNA', icon: Dna, desc: 'Assess your fit' },
    { to: '/skill-gap', label: 'Skill Gap', icon: Target, desc: 'See what to learn' },
    { to: '/roadmap', label: 'Roadmap', icon: Map, desc: 'Week-by-week plan' },
    { to: '/mentor', label: 'AI Mentor', icon: MessageSquare, desc: 'Ask anything' },
  ]

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeOnly}>
      <PageHeader title={greeting} subtitle="Here's your career intelligence overview." icon={LayoutDashboard} />

      {!latest ? (
        <motion.div variants={staggerContainer(80)} initial="hidden" animate="visible" className="max-w-2xl mx-auto text-center py-12">
          <EmptyIllustration maxWidth={360} />
          <motion.div variants={fadeSlideUp} transition={{ delay: 0.25 }} className="mt-8">
            <h2 className="text-2xl font-semibold mb-3">Let's get started</h2>
            <p className="text-text-muted mb-6 max-w-md mx-auto">
              Upload your resume to unlock your AI analysis, skill gaps, and roadmap.
            </p>
            <Link to="/upload" className="btn-primary inline-flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Analyze your first resume
            </Link>
          </motion.div>
        </motion.div>
      ) : (
        <>
          {/* Score cards */}
          <motion.div variants={staggerContainer(80)} initial="hidden" animate="visible" className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <motion.div variants={fadeSlideUp} className="card p-5 card-hover">
              <div className="text-xs text-text-faint mb-2">RESUME SCORE</div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold"><CountUp value={latest.overall_score} /></span>
                <span className="text-text-faint text-sm">/100</span>
              </div>
              <div className="text-xs text-text-muted mt-1">Latest analysis</div>
            </motion.div>
            <motion.div variants={fadeSlideUp} className="card p-5 card-hover">
              <div className="text-xs text-text-faint mb-2">SKILL COVERAGE</div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold"><CountUp value={skillCoverage} /></span>
                <span className="text-text-faint text-sm">%</span>
              </div>
              <div className="text-xs text-text-muted mt-1">{currentCount} skills detected</div>
            </motion.div>
            <motion.div variants={fadeSlideUp} className="card p-5 card-hover">
              <div className="text-xs text-text-faint mb-2">ROADMAP</div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold"><CountUp value={roadmapProgress} /></span>
                <span className="text-text-faint text-sm">%</span>
              </div>
              <div className="text-xs text-text-muted mt-1">{completedMilestones}/{totalMilestones} milestones</div>
            </motion.div>
          </motion.div>

          <motion.div variants={staggerContainer(80)} initial="hidden" animate="visible" className="grid lg:grid-cols-3 gap-6 mb-6">
            {/* Radar */}
            <motion.div variants={fadeSlideUp} className="card p-6 card-hover">
              <h3 className="font-medium mb-4">Score Breakdown</h3>
              <div style={{ width: '100%', height: 240 }}>
                <ResponsiveContainer>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgb(var(--color-border))" />
                    <PolarAngleAxis dataKey="category" tick={{ fill: 'rgb(var(--color-text-muted))', fontSize: 11 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fill: 'rgb(var(--color-text-faint))', fontSize: 10 }} stroke="rgb(var(--color-border))" />
                    <Radar dataKey="value" stroke="rgb(var(--color-primary))" fill="rgb(var(--color-primary))" fillOpacity={0.35} animationDuration={600} animationBegin={200} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Roadmap progress */}
            <motion.div variants={fadeSlideUp} className="card p-6 card-hover">
              <h3 className="font-medium mb-4">Roadmap Progress</h3>
              {totalMilestones === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-text-muted mb-4">No roadmap yet.</p>
                  <Link to="/roadmap" className="btn-secondary text-sm">Generate roadmap</Link>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-text-muted">{completedMilestones} of {totalMilestones} done</span>
                    <span className="text-sm font-medium"><CountUp value={roadmapProgress} />%</span>
                  </div>
                  <AnimatedProgress value={roadmapProgress} className="mb-4" />
                  <div className="space-y-2">
                    {milestones.slice(0, 3).map((m) => (
                      <div key={m.id} className="flex items-center gap-2 text-sm">
                        <span className={`h-2 w-2 rounded-full ${m.status === 'COMPLETED' ? 'bg-success' : m.status === 'IN_PROGRESS' ? 'bg-primary' : 'bg-text-faint'}`} />
                        <span className="text-text-muted truncate">{m.title}</span>
                      </div>
                    ))}
                  </div>
                  <Link to="/roadmap" className="btn-ghost text-xs mt-3 px-0">View all <ArrowRight className="h-3 w-3" /></Link>
                </>
              )}
            </motion.div>

            {/* Latest score ring */}
            <motion.div variants={fadeSlideUp} className="card p-6 flex flex-col items-center justify-center card-hover">
              <h3 className="font-medium mb-4 self-start">Latest Analysis</h3>
              <ScoreRing score={latest.overall_score} size={130} />
              <div className="text-xs text-text-muted mt-3">{latest.file_name}</div>
              <Link to="/analysis" className="btn-ghost text-xs mt-2 px-0">View details <ArrowRight className="h-3 w-3" /></Link>
            </motion.div>
          </motion.div>

          {/* History */}
          <motion.div variants={fadeSlideUp} className="card p-6 mb-6">
            <h3 className="font-medium mb-4">Recent Analyses</h3>
            {history.length === 0 ? (
              <p className="text-sm text-text-faint">None yet.</p>
            ) : (
              <div className="space-y-2">
                {history.slice(0, 5).map((h) => (
                  <Link key={h.id} to="/analysis" className="flex items-center justify-between rounded-[2px] border border-border bg-bg-soft p-3 hover:border-border-soft transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-[2px] bg-primary-soft text-primary flex items-center justify-center flex-shrink-0">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{h.file_name}</div>
                        <div className="text-xs text-text-faint">{new Date(h.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold">{h.overall_score}</span>
                      <ArrowRight className="h-4 w-4 text-text-faint" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
        </>
      )}

      {/* Quick nav */}
      <motion.div variants={fadeOnly} initial="hidden" animate="visible">
        <h3 className="font-medium mb-3 text-sm text-text-muted">Quick navigation</h3>
        <motion.div variants={staggerContainer(50)} initial="hidden" animate="visible" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickLinks.map((q) => (
            <motion.div key={q.to} variants={fadeSlideUp}>
            <Link to={q.to} className="card p-4 hover:border-primary/30 transition-colors group">
              <div className="h-9 w-9 rounded-[2px] bg-bg-elev text-primary flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <q.icon className="h-4 w-4" />
              </div>
              <div className="text-sm font-medium">{q.label}</div>
              <div className="text-xs text-text-faint">{q.desc}</div>
            </Link>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
