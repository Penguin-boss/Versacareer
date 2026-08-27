import { useEffect, useState } from 'react'
import { Target, Plus, Trash2, Calendar, Flag, Check, X } from 'lucide-react'
import { PageHeader, ProBadge } from '../components/DashboardLayout'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../lib/authStore'
import type { CareerGoal, Milestone } from '../lib/types'
import { LoadingState, ErrorState, EmptyState } from '../components/ui'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { fadeSlideUp, staggerContainer, fadeOnly } from '../lib/motionVariants'

export default function CareerGoals() {
  const { user, profile } = useAuthStore()
  const [goals, setGoals] = useState<CareerGoal[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', target_date: '', milestone_id: '' })

  const isProPlus = profile?.plan === 'PRO_PLUS' || profile?.is_founder === true

  const load = async () => {
    if (!user) return
    setLoading(true)
    try {
      const [g, m] = await Promise.all([
        supabase.from('career_goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('milestones').select('id,title,week').eq('user_id', user.id).order('week', { ascending: true }),
      ])
      if (g.error) throw g.error
      if (m.error) throw m.error
      setGoals((g.data ?? []) as unknown as CareerGoal[])
      setMilestones((m.data ?? []) as unknown as Milestone[])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [user]) // eslint-disable-line

  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const validate = () => {
    const newErrors: { [key: string]: string } = {}
    if (!form.title.trim()) newErrors.title = 'Title is required'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const create = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const { data, error } = await supabase.from('career_goals').insert({
        user_id: user!.id,
        title: form.title,
        description: form.description || null,
        target_date: form.target_date || null,
        milestone_id: form.milestone_id || null,
      }).select('*').single()
      if (error) throw error
      setGoals((prev) => [data as unknown as CareerGoal, ...prev])
      setForm({ title: '', description: '', target_date: '', milestone_id: '' })
      setShowForm(false)
      toast.success('Goal created.')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (goal: CareerGoal) => {
    const newStatus = goal.status === 'COMPLETED' ? 'IN_PROGRESS' : 'COMPLETED'
    try {
      const { error } = await supabase.from('career_goals').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', goal.id)
      if (error) throw error
      setGoals((prev) => prev.map((g) => g.id === goal.id ? { ...g, status: newStatus } : g))
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this goal?')) return
    try {
      const { error } = await supabase.from('career_goals').delete().eq('id', id)
      if (error) throw error
      setGoals((prev) => prev.filter((g) => g.id !== id))
      toast.success('Goal deleted.')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  if (!isProPlus) {
    return (
      <motion.div initial="hidden" animate="visible" variants={fadeOnly}>
        <PageHeader title="Career Goals" subtitle="Track your personal career goals and link them to roadmap milestones." icon={Target} />
        <div className="card p-8 max-w-lg mx-auto text-center mt-8">
          <Target className="h-12 w-12 text-text-faint mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Pro+ Feature</h3>
          <p className="text-text-muted text-sm mb-4">Career Goal Tracking is available on the Pro+ plan. Upgrade to set goals, track progress, and link them to your roadmap milestones.</p>
          <a href="/billing" className="btn-primary inline-flex">Upgrade to Pro+</a>
        </div>
      </motion.div>
    )
  }

  if (loading) return <LoadingState label="Loading goals…" />
  if (error) return <ErrorState message={error} onRetry={load} />

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeOnly}>
      <PageHeader title="Career Goals" subtitle="Track personal career goals. Link them to roadmap milestones for context." icon={Target} />

      <motion.div variants={staggerContainer(60)} initial="hidden" animate="visible" className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-text-muted">{goals.length} goal{goals.length !== 1 ? 's' : ''}</p>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
            <Plus className="h-4 w-4" /> New goal
          </button>
        </div>

        {showForm && (
          <motion.div variants={fadeSlideUp} className="card p-5 mb-4 space-y-4">
            <div className="space-y-1">
              <label htmlFor="goal-title" className="label">Title</label>
              <input id="goal-title" className={`input ${errors.title ? 'border-error' : ''}`} placeholder="e.g. Get AWS Solutions Architect certified" value={form.title} onChange={(e) => { setForm({ ...form, title: e.target.value }); if (errors.title) setErrors(prev => ({ ...prev, title: '' })) }} />
              {errors.title && <p className="text-error text-xs mt-1">{errors.title}</p>}
            </div>
            <div className="space-y-1">
              <label htmlFor="goal-description" className="label">Description (optional)</label>
              <textarea id="goal-description" className="input min-h-[80px] resize-y" placeholder="Any specific details." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="goal-target-date" className="label">Target date (optional)</label>
                <input id="goal-target-date" type="date" className="input" value={form.target_date} onChange={(e) => setForm({ ...form, target_date: e.target.value })} />
              </div>
              <div>
                <label htmlFor="goal-milestone" className="label">Link to milestone (optional)</label>
                <select id="goal-milestone" className="input" value={form.milestone_id || ''} onChange={(e) => setForm({ ...form, milestone_id: e.target.value || '' })}>
                  <option value="">None</option>
                  {milestones.map((m) => (
                    <option key={m.id} value={m.id}>Week {m.week}: {m.title}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={create} disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Create goal'}</button>
              <button onClick={() => { setShowForm(false); setErrors({}); setForm({ title: '', description: '', target_date: '', milestone_id: '' }) }} className="btn-ghost">Cancel</button>
            </div>
          </motion.div>
        )}

        {goals.length === 0 && !showForm ? (
          <EmptyState icon={Target} title="No goals yet" description="Create your first career goal to start tracking progress." action={<button onClick={() => setShowForm(true)} className="btn-primary">Create goal</button>} />
        ) : (
          <div className="space-y-3">
            {goals.map((goal) => {
              const linkedMilestone = milestones.find((m) => m.id === goal.milestone_id)
              return (
                <motion.div key={goal.id} variants={fadeSlideUp} className={`card p-4 ${goal.status === 'COMPLETED' ? 'opacity-60' : ''}`}>
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleStatus(goal)}
                      className={`mt-0.5 shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        goal.status === 'COMPLETED' ? 'bg-success border-success' : 'border-border hover:border-primary'
                      }`}
                    >
                      {goal.status === 'COMPLETED' && <Check className="h-3 w-3 text-white" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-medium ${goal.status === 'COMPLETED' ? 'line-through' : ''}`}>{goal.title}</h3>
                      {goal.description && <p className="text-sm text-text-muted mt-1">{goal.description}</p>}
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-text-faint">
                        {goal.target_date && (
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(goal.target_date).toLocaleDateString()}</span>
                        )}
                        {linkedMilestone && (
                          <span className="flex items-center gap-1"><Flag className="h-3 w-3" /> Week {linkedMilestone.week}: {linkedMilestone.title}</span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full ${goal.status === 'COMPLETED' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'}`}>
                          {goal.status === 'COMPLETED' ? 'Completed' : 'In Progress'}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => remove(goal.id)} className="text-text-faint hover:text-error shrink-0" aria-label="Delete goal"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
