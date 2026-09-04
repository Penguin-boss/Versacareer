import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { User as UserIcon, Mail, Briefcase, Shield, Target } from 'lucide-react'
import { PageHeader } from '../components/DashboardLayout'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../lib/authStore'
import { useAuth } from '../lib/auth'
import { LoadingState } from '../components/ui'
import { CAREER_PATHS, EXPERIENCE_LEVELS, WORK_STYLES } from '../lib/types'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { fadeSlideUp, staggerContainer, fadeOnly } from '../lib/motionVariants'

export default function Profile() {
  const { profile, setProfile } = useAuthStore()
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [targetRoles, setTargetRoles] = useState<string[]>([])
  const [experienceLevel, setExperienceLevel] = useState('')
  const [workStyle, setWorkStyle] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? '')
      setJobTitle(profile.job_title ?? '')
      setTargetRoles(profile.target_roles ?? [])
      setExperienceLevel(profile.experience_level ?? '')
      setWorkStyle(profile.preferred_work_style ?? '')
    }
    setLoading(false)
  }, [profile])

  const toggleRole = (r: string) => {
    setTargetRoles((prev) => prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r])
  }

  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const validate = () => {
    const newErrors: { [key: string]: string } = {}
    if (!name.trim()) newErrors.name = 'Full name is required'
    if (!jobTitle.trim()) newErrors.jobTitle = 'Job title is required'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const save = async () => {
    if (!profile) return
    if (!validate()) return
    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ name, job_title: jobTitle, target_roles: targetRoles, experience_level: experienceLevel || null, preferred_work_style: workStyle || null })
        .eq('id', profile.id)
        .select('*')
        .single()
      if (error) throw error
      setProfile(data as any)
      toast.success('Profile updated.')
    } catch (err: any) {
      toast.error(err.message || 'Failed to update.')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  if (loading || !profile) return <LoadingState label="Loading profile…" />

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeOnly}>
      <PageHeader title="Profile" subtitle="Manage your account details." icon={UserIcon} />

      <motion.div variants={staggerContainer(60)} initial="hidden" animate="visible" className="grid md:grid-cols-3 gap-6">
        <motion.div variants={fadeSlideUp} className="card p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/20 text-primary flex items-center justify-center text-2xl font-semibold">
              {(profile.name ?? profile.email)?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0">
              <div className="font-medium truncate">{profile.name ?? 'User'}</div>
              <div className="text-sm text-text-muted truncate">{profile.email}</div>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-text-muted">
              <Mail className="h-4 w-4 text-text-faint" /> {profile.email}
            </div>
            <div className="flex items-center gap-2 text-text-muted">
              <Shield className="h-4 w-4 text-text-faint" /> Plan: <span className="badge bg-primary-soft text-primary border border-primary/20">{profile.plan}</span>
            </div>
            <div className="flex items-center gap-2 text-text-muted">
              <Briefcase className="h-4 w-4 text-text-faint" /> {profile.job_title ?? 'No title set'}
            </div>
          </div>
          <div className="text-xs text-text-faint mt-4">
            Member since {new Date(profile.created_at).toLocaleDateString()}
          </div>
        </motion.div>

        <motion.div variants={fadeSlideUp} className="card p-6 md:col-span-2">
          <h3 className="font-medium mb-4">Edit details</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="profile-name" className="label">Full name</label>
              <input id="profile-name" className={`input ${errors.name ? 'border-error' : ''}`} value={name} onChange={(e) => { setName(e.target.value); if (errors.name) setErrors(prev => ({ ...prev, name: '' })) }} placeholder="Your name" />
              {errors.name && <p className="text-error text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="profile-job-title" className="label">Job title / target role</label>
              <input id="profile-job-title" className={`input ${errors.jobTitle ? 'border-error' : ''}`} value={jobTitle} onChange={(e) => { setJobTitle(e.target.value); if (errors.jobTitle) setErrors(prev => ({ ...prev, jobTitle: '' })) }} placeholder="e.g. Software Engineer" />
              {errors.jobTitle && <p className="text-error text-xs mt-1">{errors.jobTitle}</p>}
            </div>
            <div>
              <label htmlFor="profile-email" className="label">Email</label>
              <input id="profile-email" className="input opacity-60 cursor-not-allowed" value={profile.email} disabled />
            </div>

            <div className="pt-2 border-t border-border">
              <h4 className="text-sm font-medium mb-3 mt-3 flex items-center gap-2"><div className="diamond-accent"></div><Target className="h-4 w-4 text-primary" /> Career Preferences</h4>
              <div className="space-y-4">
                <div>
                  <label className="label">Target roles</label>
                  <div className="flex flex-wrap gap-2">
                    {CAREER_PATHS.map((r) => (
                      <button key={r} type="button" onClick={() => toggleRole(r)} className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${targetRoles.includes(r) ? 'bg-primary-soft border-primary/40 text-text' : 'bg-bg-soft border-border text-text-muted hover:border-border-soft'}`}>{r}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">Experience level</label>
                  <select className="input" value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)}>
                    <option value="">Select…</option>
                    {EXPERIENCE_LEVELS.map((e) => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Preferred work style</label>
                  <select className="input" value={workStyle} onChange={(e) => setWorkStyle(e.target.value)}>
                    <option value="">Select…</option>
                    {WORK_STYLES.map((w) => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={save} disabled={saving} className="btn-primary">
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              <button onClick={handleSignOut} className="btn-secondary">
                Sign out
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
