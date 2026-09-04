import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../lib/authStore'
import { CAREER_PATHS, EXPERIENCE_LEVELS, WORK_STYLES } from '../lib/types'
import { Check, ArrowRight, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { fadeSlideUp, fadeOnly } from '../lib/motionVariants'

export default function Onboarding() {
  const { user, setProfile, profile } = useAuthStore()
  const navigate = useNavigate()

  const hasTargetRoles = profile && profile.target_roles && profile.target_roles.length > 0;
  const hasExperience = profile && !!profile.experience_level;
  const hasWorkStyle = profile && !!profile.preferred_work_style;

  const [targetRoles, setTargetRoles] = useState<string[]>(profile?.target_roles || [])
  const [experienceLevel, setExperienceLevel] = useState<string>(profile?.experience_level || '')
  const [workStyle, setWorkStyle] = useState<string>(profile?.preferred_work_style || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (hasTargetRoles && hasExperience && hasWorkStyle) {
      navigate('/dashboard', { replace: true })
    }
  }, [hasTargetRoles, hasExperience, hasWorkStyle, navigate])

  const toggleRole = (r: string) => {
    setTargetRoles((prev) => prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r])
  }

  const finish = async () => {
    if (!user) return
    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          target_roles: targetRoles,
          experience_level: experienceLevel || null,
          preferred_work_style: workStyle || null,
        })
        .eq('id', user.id)
        .select('*')
        .single()
      if (error) throw error
      setProfile({ ...profile, ...(data as any) })
      sessionStorage.setItem('onboarded', 'true')
      toast.success('Preferences saved!')
      navigate('/dashboard')
    } catch (err: any) {
      toast.error(err.message || 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  const skip = () => {
    sessionStorage.setItem('onboarded', 'true')
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-10">
      <motion.div initial="hidden" animate="visible" variants={fadeOnly} className="w-full max-w-xl">
        <div className="text-center mb-8">
          <img src="/VersaCareer_AI_Logo.png" alt="" className="h-14 w-14 rounded-lg mx-auto mb-4" />
          <h1 className="text-2xl font-semibold flex items-center justify-center gap-2"><div className="diamond-accent-lg"></div>Welcome to VersaCareer AI</h1>
          <p className="text-text-muted text-sm mt-1">Tell us a bit about yourself so we can personalize your experience.</p>
        </div>

        <motion.div variants={fadeSlideUp} className="card p-6 space-y-6">
          {!hasTargetRoles && (
            <div>
              <label className="label">Target roles <span className="text-text-faint">(pick any)</span></label>
              <div className="flex flex-wrap gap-2">
                {CAREER_PATHS.map((r) => (
                  <button
                    key={r}
                    onClick={() => toggleRole(r)}
                    className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                      targetRoles.includes(r)
                        ? 'bg-primary-soft border-primary/40 text-text'
                        : 'bg-bg-soft border-border text-text-muted hover:border-border-soft'
                    }`}
                  >
                    {targetRoles.includes(r) && <Check className="h-3.5 w-3.5 inline mr-1 text-primary" />}
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!hasExperience && (
            <div>
              <label className="label">Experience level</label>
              <div className="flex flex-wrap gap-2">
                {EXPERIENCE_LEVELS.map((e) => (
                  <button
                    key={e}
                    onClick={() => setExperienceLevel(e)}
                    className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                      experienceLevel === e
                        ? 'bg-primary-soft border-primary/40 text-text'
                        : 'bg-bg-soft border-border text-text-muted hover:border-border-soft'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!hasWorkStyle && (
            <div>
              <label className="label">Preferred work style</label>
              <div className="flex flex-wrap gap-2">
                {WORK_STYLES.map((w) => (
                  <button
                    key={w}
                    onClick={() => setWorkStyle(w)}
                    className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                      workStyle === w
                        ? 'bg-primary-soft border-primary/40 text-text'
                        : 'bg-bg-soft border-border text-text-muted hover:border-border-soft'
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button onClick={skip} className="btn-ghost text-sm">Skip for now</button>
            <button onClick={finish} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Continue'} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
        <p className="text-center text-xs text-text-faint mt-4 flex items-center justify-center gap-1.5">
          <Sparkles className="h-3 w-3" /> You can change these anytime from your Profile.
        </p>
      </motion.div>
    </div>
  )
}
