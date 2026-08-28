import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FileText, Target, Map, ArrowRight, Upload, Radar } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../lib/authStore'
import type { ResumeAnalysis, Milestone } from '../lib/types'
import { LoadingState } from '../components/ui'
import { fadeSlideUp, staggerContainer, fadeOnly } from '../lib/motionVariants'

export default function Dashboard() {
  const { user, profile } = useAuthStore()
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

  const greeting = profile?.name ? `Welcome back, ${profile.name.split(' ')[0]}` : 'Welcome back'

  const totalMilestones = milestones.length
  const completedMilestones = milestones.filter((m) => m.status === 'COMPLETED').length
  const roadmapProgress = totalMilestones ? Math.round((completedMilestones / totalMilestones) * 100) : 0

  const currentCount = (latest?.current_skills ?? []).length
  const missingCount = (latest?.missing_skills ?? []).length
  const skillCoverage = (currentCount + missingCount) > 0 ? Math.round((currentCount / (currentCount + missingCount)) * 100) : 0

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeOnly}>
      <div className="page-head">
        <h1>{greeting}</h1>
        <div className="page-sub">Here's your career intelligence overview.</div>
      </div>

      {!latest ? (
        <motion.div variants={staggerContainer(80)} initial="hidden" animate="visible" style={{ textAlign: 'center', padding: '60px 0' }}>
          <motion.div variants={fadeSlideUp} style={{ marginBottom: '24px' }}>
            <div className="empty-icon-ring" style={{ margin: '0 auto', width: '80px', height: '80px' }}>
              <FileText width="32" height="32" />
            </div>
          </motion.div>
          <motion.div variants={fadeSlideUp}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '12px' }}>Let's get started</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
              Upload your resume to unlock your AI analysis, skill gaps, and roadmap.
            </p>
            <Link to="/upload" className="empty-cta primary">
              <Upload width="16" height="16" />
              Analyze your first resume
            </Link>
          </motion.div>
        </motion.div>
      ) : (
        <>
          <motion.div variants={staggerContainer(80)} initial="hidden" animate="visible" className="kpi-row">
            <motion.div variants={fadeSlideUp} className="kpi">
              <div className="kpi-label">PROFILE SCORE</div>
              <div className="kpi-value">{latest.overall_score}</div>
              <div className="kpi-status">Latest analysis</div>
            </motion.div>

            <motion.div variants={fadeSlideUp} className="kpi">
              <div className="kpi-label">SKILL COVERAGE</div>
              <div className="kpi-value">{skillCoverage}%</div>
              <div className="kpi-status">{currentCount} skills detected</div>
            </motion.div>

            <motion.div variants={fadeSlideUp} className="kpi">
              <div className="kpi-label">ROADMAP</div>
              <div className="kpi-value">{roadmapProgress}%</div>
              <div className="kpi-status">{completedMilestones}/{totalMilestones} milestones</div>
            </motion.div>

            <motion.div variants={fadeSlideUp} className="kpi">
              <div className="kpi-label">ATS MATCH</div>
              <div className="kpi-value">{latest.ats_score}</div>
              <div className="kpi-status">
                <Link to="/analysis">Improve <ArrowRight width="10" height="10" /></Link>
              </div>
            </motion.div>
          </motion.div>

          <motion.div variants={staggerContainer(80)} initial="hidden" animate="visible" className="glance-grid">
            <motion.div variants={fadeSlideUp} className="card">
              <div className="card-head">
                <div className="card-title">
                  <Radar width="18" height="18" />
                  Skill Matrix
                </div>
              </div>
              <div className="empty-widget">
                <div className="empty-icon-ring">
                  <Target width="22" height="22" />
                </div>
                <p>Run a skill gap analysis against your target role to build your competency matrix.</p>
                <Link to="/skill-gap" className="empty-cta mt-2">
                  Find skill gaps <ArrowRight width="14" height="14" />
                </Link>
              </div>
            </motion.div>

            <motion.div variants={fadeSlideUp} className="card">
              <div className="card-head">
                <div className="card-title">
                  <Map width="18" height="18" />
                  Next Milestone
                </div>
              </div>
              {totalMilestones === 0 ? (
                <div className="empty-widget">
                  <div className="empty-icon-ring">
                    <Map width="22" height="22" />
                  </div>
                  <p>Generate a step-by-step roadmap to guide your learning and career progression.</p>
                  <Link to="/roadmap" className="empty-cta mt-2">
                    Create roadmap <ArrowRight width="14" height="14" />
                  </Link>
                </div>
              ) : (
                <div className="empty-widget">
                  <p style={{marginBottom: 16}}>
                    {milestones.find(m => m.status !== 'COMPLETED')?.title || "You've completed all milestones!"}
                  </p>
                  <Link to="/roadmap" className="empty-cta primary mt-2">
                    View roadmap <ArrowRight width="14" height="14" />
                  </Link>
                </div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </motion.div>
  )
}
