import { useEffect, useState } from 'react'
import { Target, ChevronDown } from 'lucide-react'
import { PageHeader } from '../components/DashboardLayout'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../lib/authStore'
import { useTheme } from '../lib/useTheme'
import { CAREER_PATHS, type ResumeAnalysis } from '../lib/types'
import { LoadingState, EmptyState, ErrorState } from '../components/ui'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { fadeSlideUp, staggerContainer, fadeOnly } from '../lib/motionVariants'

// Reference skill sets per career path (used for gap analysis)
const SKILL_REFERENCES: Record<string, { category: string; skills: string[] }> = {
  'Software Engineer': {
    category: 'Programming',
    skills: ['JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'React', 'Node.js', 'SQL', 'Git', 'Docker', 'REST APIs', 'System Design'],
  },
  'AI Engineer': {
    category: 'Programming',
    skills: ['Python', 'PyTorch', 'TensorFlow', 'Machine Learning', 'Deep Learning', 'NLP', 'LLMs', 'Pandas', 'NumPy', 'MLOps', 'Vector Databases', 'Prompt Engineering'],
  },
  'Data Scientist': {
    category: 'Database',
    skills: ['Python', 'R', 'SQL', 'Statistics', 'Pandas', 'Machine Learning', 'Data Visualization', 'Tableau', 'Power BI', 'A/B Testing', 'Probability', 'Excel'],
  },
  'Cybersecurity Engineer': {
    category: 'Tools',
    skills: ['Network Security', 'Penetration Testing', 'Linux', 'Cryptography', 'SIEM', 'OWASP', 'Python', 'Bash', 'Incident Response', 'Risk Assessment', 'Firewalls', 'Wireshark'],
  },
  'UI/UX Designer': {
    category: 'Tools',
    skills: ['Figma', 'User Research', 'Prototyping', 'Wireframing', 'Design Systems', 'Accessibility', 'Interaction Design', 'Information Architecture', 'Usability Testing', 'Adobe XD', 'Sketch', 'Typography'],
  },
  'Product Manager': {
    category: 'Tools',
    skills: ['Product Strategy', 'Roadmapping', 'User Research', 'Analytics', 'A/B Testing', 'SQL', 'Stakeholder Management', 'Agile', 'User Stories', 'Go-to-Market', 'Prioritization', 'KPIs'],
  },
  'DevOps Engineer': {
    category: 'DevOps',
    skills: ['Docker', 'Kubernetes', 'AWS', 'Terraform', 'CI/CD', 'Linux', 'Bash', 'Python', 'Prometheus', 'Grafana', 'Ansible', 'Jenkins'],
  },
}

function categorize(skill: string): string {
  const s = skill.toLowerCase()
  if (/python|java|typescript|javascript|go|c\+\+|react|node|angular|vue/.test(s)) return 'Programming'
  if (/aws|azure|gcp|docker|kubernetes|terraform/.test(s)) return 'Cloud'
  if (/sql|postgres|mysql|mongo|redis|database/.test(s)) return 'Database'
  if (/git|jenkins|figma|jira|linux|bash|ansible/.test(s)) return 'Tools'
  if (/ci\/cd|prometheus|grafana|monitoring/.test(s)) return 'DevOps'
  return 'Programming'
}

function priority(missing: string, target: string): 'HIGH' | 'MEDIUM' | 'LOW' {
  const ref = SKILL_REFERENCES[target]
  if (!ref) return 'MEDIUM'
  const idx = ref.skills.findIndex((s) => s.toLowerCase() === missing.toLowerCase())
  if (idx <= 3) return 'HIGH'
  if (idx <= 8) return 'MEDIUM'
  return 'LOW'
}

export default function SkillGap() {
  const { user, profile } = useAuthStore()
  const { theme } = useTheme()
  const isProPlus = profile?.plan === 'PRO_PLUS' || profile?.is_founder === true
  const [latest, setLatest] = useState<ResumeAnalysis | null>(null)
  const [target, setTarget] = useState<string>(CAREER_PATHS[0])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('resume_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      setLatest(data as unknown as ResumeAnalysis)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [user]) // eslint-disable-line

  if (loading) return <LoadingState label="Loading skill data…" />
  if (error) return <ErrorState message={error} onRetry={load} />
  if (!latest) {
    return (
      <EmptyState
        icon={Target}
        title="No resume analysis yet"
        description="Analyze your resume first — we use the detected skills as your baseline for the gap analysis."
        action={<Link to="/upload" className="btn-accent">Upload your resume</Link>}
      />
    )
  }

  const currentSkills = latest.current_skills ?? []
  const ref = SKILL_REFERENCES[target]
  const refSkills = ref?.skills ?? []
  const currentSet = new Set(currentSkills.map((s) => s.toLowerCase()))
  const missing = refSkills.filter((s) => !currentSet.has(s.toLowerCase()))
  const matched = refSkills.filter((s) => currentSet.has(s.toLowerCase()))

  // Radar chart data: coverage per category
  const categories = ['Programming', 'Cloud', 'Database', 'Tools', 'DevOps']
  const radarData = categories.map((cat) => {
    const refForCat = refSkills.filter((s) => categorize(s) === cat)
    const matchedForCat = refForCat.filter((s) => currentSet.has(s.toLowerCase()))
    const coverage = refForCat.length ? Math.round((matchedForCat.length / refForCat.length) * 100) : 0
    return { category: cat, coverage }
  })

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeOnly}>
      <PageHeader title="Skill Gap Analysis" subtitle="Compare your current skills against a target career." icon={Target} />

      <motion.div variants={fadeSlideUp} className="card p-5 mb-6 card-hover">
        <label className="label">Target career</label>
        <div className="relative max-w-sm">
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="input appearance-none pr-10"
          >
            {CAREER_PATHS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-faint pointer-events-none" />
        </div>
      </motion.div>

      <motion.div variants={staggerContainer(60)} initial="hidden" animate="visible" className="grid lg:grid-cols-2 gap-6">
        <motion.div variants={fadeSlideUp} className="card p-6 card-hover">
          <h3 className="font-medium mb-4 diamond-accent">Skill Coverage</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <RadarChart data={radarData}>
                <PolarGrid stroke={theme === 'dark' ? '#1E2938' : '#E2E6EC'} />
                <PolarAngleAxis dataKey="category" tick={{ fill: theme === 'dark' ? '#949EAC' : '#5B6472', fontSize: 12 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fill: theme === 'dark' ? '#5B6472' : '#949EAC', fontSize: 10 }} stroke={theme === 'dark' ? '#1E2938' : '#E2E6EC'} />
                <Radar dataKey="coverage" stroke="rgb(var(--color-primary))" fill="rgb(var(--color-primary))" fillOpacity={0.35} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-sm text-text-muted text-center">
            {matched.length} of {refSkills.length} target skills covered
          </div>
        </motion.div>

        <motion.div variants={fadeSlideUp} className="card p-6 card-hover">
          <h3 className="font-medium mb-4 diamond-accent">Missing Skills ({missing.length})</h3>
          {missing.length === 0 ? (
            <p className="text-sm text-success">You have all the core skills for this role. Nice!</p>
          ) : (
            <div className="space-y-2">
              {missing.map((s) => {
                const p = priority(s, target)
                const cat = categorize(s)
                const pColor = p === 'HIGH' ? 'text-error' : p === 'MEDIUM' ? 'text-warning' : 'text-success'
                const pBg = p === 'HIGH' ? 'bg-error/10 border-error/20' : p === 'MEDIUM' ? 'bg-warning/10 border-warning/20' : 'bg-success/10 border-success/20'
                return (
                  <div key={s} className="flex items-center justify-between rounded-[2px] border border-border bg-bg-soft p-3">
                    <div>
                      <div className="text-sm font-medium">{s}</div>
                      <div className="text-xs text-text-faint">{cat}</div>
                    </div>
                    <span className={`badge border ${pBg} ${pColor}`}>{p}</span>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>
      </motion.div>

      <motion.div variants={fadeSlideUp} className="card p-6 mt-6 card-hover">
        <h3 className="font-medium mb-4 diamond-accent">Current Skills ({currentSkills.length})</h3>
        <div className="flex flex-wrap gap-2">
          {currentSkills.length ? currentSkills.map((s) => (
            <span key={s} className="badge bg-primary-soft text-primary border border-primary/20">{s}</span>
          )) : <span className="text-sm text-text-faint">None detected.</span>}
        </div>
      </motion.div>
    </motion.div>
  )
}
