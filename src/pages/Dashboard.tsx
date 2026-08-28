import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../lib/authStore'
import type { ResumeAnalysis, Milestone } from '../lib/types'
import { LoadingState } from '../components/ui'
import { fadeSlideUp, staggerContainer, fadeOnly } from '../lib/motionVariants'

export default function Dashboard() {
  const { user, profile } = useAuthStore()
  const [latest, setLatest] = useState<ResumeAnalysis | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    if (!user) return
    setLoading(true)
    try {
      const [aRes, mRes] = await Promise.all([
        supabase.from('resume_analyses').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1),
        supabase.from('milestones').select('*').eq('user_id', user.id).order('week', { ascending: true }),
      ])
      const rows = (aRes.data ?? []) as unknown as ResumeAnalysis[]
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

  const totalMilestones = milestones.length
  const completedMilestones = milestones.filter((m) => m.status === 'COMPLETED').length
  const roadmapProgress = totalMilestones ? Math.round((completedMilestones / totalMilestones) * 100) : 0
  const missingCount = (latest?.missing_skills ?? []).length

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeOnly}>
      <div className="page-head">
        <h1>Welcome back.</h1>
        <p className="page-sub">Your career intelligence overview.</p>
      </div>

      <motion.div variants={staggerContainer(80)} initial="hidden" animate="visible" className="kpi-row">
        <motion.div variants={fadeSlideUp} className="kpi">
          <div className="kpi-label">Resume score</div>
          {latest ? (
            <>
              <div className="kpi-value">{latest.overall_score}</div>
              <div className="kpi-status"><Link to="/analysis">View latest scan</Link></div>
            </>
          ) : (
            <>
              <div className="kpi-value empty">—</div>
              <div className="kpi-status">Not analyzed yet</div>
            </>
          )}
        </motion.div>

        <motion.div variants={fadeSlideUp} className="kpi">
          <div className="kpi-label">Open skill gaps</div>
          {latest ? (
            <>
              <div className="kpi-value">{missingCount}</div>
              <div className="kpi-status"><Link to="/skill-gap">Review gaps</Link></div>
            </>
          ) : (
            <>
              <div className="kpi-value empty">—</div>
              <div className="kpi-status">Run an analysis</div>
            </>
          )}
        </motion.div>

        <motion.div variants={fadeSlideUp} className="kpi">
          <div className="kpi-label">Roadmap progress</div>
          {totalMilestones > 0 ? (
            <>
              <div className="kpi-value">{roadmapProgress}%</div>
              <div className="kpi-status"><Link to="/roadmap">View roadmap</Link></div>
            </>
          ) : (
            <>
              <div className="kpi-value empty">—</div>
              <div className="kpi-status">No roadmap yet</div>
            </>
          )}
        </motion.div>

        <motion.div variants={fadeSlideUp} className="kpi">
          <div className="kpi-label">Mock interview score</div>
          <div className="kpi-value empty">—</div>
          <div className="kpi-status">Not attempted</div>
        </motion.div>
      </motion.div>

      <motion.div variants={staggerContainer(80)} initial="hidden" animate="visible" className="glance-grid">

        <motion.div variants={fadeSlideUp} className="card">
          <div className="card-head">
            <div className="card-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 15h6M9 11h2"/></svg>
              Resume score
            </div>
          </div>
          {!latest ? (
            <div className="empty-widget">
              <div className="ring-wrap" style={{width: '52px', height: '52px'}}>
                <svg width="52" height="52" viewBox="0 0 52 52">
                  <circle cx="26" cy="26" r="21" fill="none" stroke="var(--border)" strokeWidth="5" strokeDasharray="4 5"/>
                </svg>
              </div>
              <p>You haven't analyzed a resume yet. Upload one to get your score and a line-by-line breakdown.</p>
              <Link className="empty-cta primary" to="/upload">Analyze your resume</Link>
            </div>
          ) : (
            <div className="empty-widget">
              <div className="ring-wrap" style={{width: '52px', height: '52px'}}>
                <svg width="52" height="52" viewBox="0 0 52 52">
                  <circle cx="26" cy="26" r="21" fill="none" stroke="var(--border)" strokeWidth="5" />
                  <circle cx="26" cy="26" r="21" fill="none" stroke="var(--accent)" strokeWidth="5" strokeDasharray="132" strokeDashoffset={132 - (132 * (latest.overall_score || 0)) / 100} strokeLinecap="round" transform="rotate(-90 26 26)" />
                </svg>
                <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: '14px', fontWeight: 600}}>
                  {latest.overall_score}
                </div>
              </div>
              <p>Your latest scan scored {latest.overall_score}. See what to fix.</p>
              <Link className="empty-cta primary" to="/analysis">View report</Link>
            </div>
          )}
        </motion.div>

        <motion.div variants={fadeSlideUp} className="card">
          <div className="card-head">
            <div className="card-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              Skill gap
            </div>
          </div>
          <div className="empty-widget">
            <div className="empty-icon-ring">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            </div>
            {!latest ? (
              <p>Once you analyze a resume and pick a target role, we'll show exactly which skills you're missing.</p>
            ) : (
              <p>You have {missingCount} key skill gaps compared to your target role. Review them to know what to learn.</p>
            )}
            <Link className="empty-cta" to="/skill-gap">Run skill gap analysis</Link>
          </div>
        </motion.div>

        <motion.div variants={fadeSlideUp} className="card">
          <div className="card-head">
            <div className="card-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
              Roadmap
            </div>
          </div>
          <div className="empty-widget">
            <div className="empty-icon-ring">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
            </div>
            {totalMilestones === 0 ? (
              <p>Your roadmap builds itself from your skill gaps. Complete a skill gap analysis to generate your milestones.</p>
            ) : (
              <p>You have {totalMilestones} milestones to complete. Stay on track to become interview-ready.</p>
            )}
            <Link className="empty-cta" to="/roadmap">Build my roadmap</Link>
          </div>
        </motion.div>

        <motion.div variants={fadeSlideUp} className="card">
          <div className="card-head">
            <div className="card-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              Mock interview
            </div>
          </div>
          <div className="empty-widget">
            <div className="empty-icon-ring">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <p>You haven't done a mock interview yet. Rehearse questions for your target role and get scored on clarity and structure.</p>
            <Link className="empty-cta" to="/mentor">Start mock interview</Link>
          </div>
        </motion.div>

      </motion.div>
    </motion.div>
  )
}
