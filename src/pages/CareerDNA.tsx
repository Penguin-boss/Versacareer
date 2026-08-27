import { useEffect, useState, useMemo } from 'react'
import { Dna, ArrowRight, ArrowLeft, RotateCcw, Target, Check } from 'lucide-react'
import { PageHeader } from '../components/DashboardLayout'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../lib/authStore'
import { useAuth } from '../lib/auth'
import { useTheme } from '../lib/useTheme'
import { LoadingState } from '../components/ui'
import type { CareerDNAResult } from '../lib/types'
import {
  QUESTIONS, AXIS_LABELS, AXIS_ORDER,
  type CareerDNAQuestion, type AxisKey,
} from '../lib/careerDnaQuestions'
import {
  scoreAssessment, shuffleQuestions,
  type AnswerMap, type TraitVector, type CareerMatch,
} from '../lib/careerDnaScoring'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { fadeSlideUp, staggerContainer, fadeOnly } from '../lib/motionVariants'
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts'

export default function CareerDNA() {
  const { user, profile } = useAuthStore()
  const { theme } = useTheme()
  const { refreshProfile } = useAuth()
  const [existing, setExisting] = useState<CareerDNAResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [phase, setPhase] = useState<'intro' | 'questions' | 'results'>('intro')
  const [shuffled, setShuffled] = useState<CareerDNAQuestion[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<AnswerMap>({})
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{ traitVector: TraitVector; topMatches: CareerMatch[] } | null>(null)
  const [settingRole, setSettingRole] = useState(false)

  const load = async () => {
    if (!user) return
    const { data } = await supabase
      .from('career_dna_results')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    setExisting(data as unknown as CareerDNAResult | null)
    setLoading(false)
  }
  useEffect(() => { load() }, [user]) // eslint-disable-line

  const startAssessment = () => {
    setShuffled(shuffleQuestions())
    setAnswers({})
    setCurrentIdx(0)
    setResult(null)
    setPhase('questions')
  }

  const currentQuestion = shuffled[currentIdx]
  const progress = shuffled.length > 0 ? ((currentIdx + 1) / shuffled.length) * 100 : 0

  const handleAnswer = (optionIdx: number) => {
    if (!currentQuestion) return
    setAnswers({ ...answers, [currentQuestion.id]: optionIdx })
  }

  const next = () => {
    if (currentIdx < shuffled.length - 1) {
      setCurrentIdx(currentIdx + 1)
    } else {
      submit()
    }
  }

  const back = () => {
    if (currentIdx > 0) setCurrentIdx(currentIdx - 1)
  }

  const submit = async () => {
    setSaving(true)
    try {
      const scored = scoreAssessment(answers)
      setResult(scored)

      const { error } = await supabase.from('career_dna_results').insert({
        user_id: user!.id,
        trait_vector: scored.traitVector,
        top_matches: scored.topMatches.map((m) => ({ career: m.career, match_percent: m.matchPercent })),
        raw_answers: answers,
      })
      if (error) throw error

      await load()
      setPhase('results')
      toast.success('Career DNA analysis complete!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to save results.')
    } finally {
      setSaving(false)
    }
  }

  const setTargetRole = async (career: string) => {
    setSettingRole(true)
    try {
      const currentRoles = profile?.target_roles ?? []
      if (currentRoles.includes(career)) {
        toast.success(`${career} is already your target role.`)
        setSettingRole(false)
        return
      }
      const newRoles = [career, ...currentRoles.filter((r) => r !== career)]
      const { error } = await supabase
        .from('profiles')
        .update({ target_roles: newRoles })
        .eq('id', user!.id)
      if (error) throw error
      await refreshProfile()
      toast.success(`${career} set as your target role. Skill Gap and Roadmap will use it.`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to set target role.')
    } finally {
      setSettingRole(false)
    }
  }

  if (loading) return <LoadingState label="Loading Career DNA…" />

  // Show existing results if available and not in question flow
  if (existing && phase === 'intro') {
    return <ResultsView result={existing} onRetake={startAssessment} onSetTargetRole={setTargetRole} settingRole={settingRole} />
  }

  if (phase === 'results' && result) {
    const syntheticResult: CareerDNAResult = {
      id: 'temp',
      user_id: user!.id,
      created_at: new Date().toISOString(),
      trait_vector: result.traitVector,
      top_matches: result.topMatches.map((m) => ({ career: m.career, match_percent: m.matchPercent })),
      raw_answers: answers,
    }
    return <ResultsView result={syntheticResult} onRetake={startAssessment} onSetTargetRole={setTargetRole} settingRole={settingRole} />
  }

  // Intro screen
  if (phase === 'intro') {
    return (
      <motion.div initial="hidden" animate="visible" variants={fadeOnly}>
        <PageHeader title="Career DNA" subtitle="A 21-question assessment that maps your traits across 7 dimensions and matches you to career archetypes." icon={Dna} />
        <div className="max-w-2xl mx-auto">
          <motion.div variants={fadeSlideUp} className="card p-8 text-center">
            <div className="h-16 w-16 rounded-[2px] bg-accent-soft text-accent flex items-center justify-center mx-auto mb-6 diamond-accent-lg">
              <Dna className="h-8 w-8" />
            </div>
            <h2 className="font-display text-2xl font-semibold mb-3">Discover your career DNA</h2>
            <p className="text-text-muted mb-2 max-w-md mx-auto">
              Answer 21 scenario-based questions about how you think and work. We'll score you across 7 trait dimensions and match you to career archetypes.
            </p>
            <p className="text-sm text-text-faint mb-8">
              Takes about 4 minutes. Free for all plans. Unlimited retakes.
            </p>
            <button onClick={startAssessment} className="btn-accent text-base px-6 py-3">
              Start assessment <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>

          {/* Axis overview */}
          <motion.div variants={fadeSlideUp} className="card p-6 mt-4">
            <h3 className="font-medium mb-4 text-sm">7 Trait Dimensions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {AXIS_ORDER.map((axis) => (
                <div key={axis} className="flex flex-col items-center text-center p-3 rounded-[2px] bg-bg-soft border border-border">
                  <span className="text-xs font-mono text-primary mb-1">{axis}</span>
                  <span className="text-xs text-text-muted">{AXIS_LABELS[axis]}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    )
  }

  // Question flow
  if (phase === 'questions' && currentQuestion) {
    const selectedIdx = answers[currentQuestion.id]
    const isAnswered = selectedIdx !== undefined
    const isLast = currentIdx === shuffled.length - 1

    return (
      <motion.div initial="hidden" animate="visible" variants={fadeOnly}>
        <PageHeader title="Career DNA" subtitle="Pick the option that fits you best. There are no right answers." icon={Dna} />

        <div className="max-w-2xl mx-auto">
          {/* Progress bar */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-text-muted font-mono">{currentIdx + 1} / {shuffled.length}</span>
            <span className="text-sm text-text-faint font-mono">{Math.round(progress)}%</span>
          </div>
          <div className="h-1 bg-bg-elev overflow-hidden mb-6">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>

          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="card p-6"
          >
            <h3 className="text-lg font-display font-medium mb-6 leading-snug">{currentQuestion.prompt}</h3>

            <div className="space-y-2">
              {currentQuestion.options.map((opt, idx) => {
                const selected = selectedIdx === idx
                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    className={`w-full text-left rounded-[2px] border p-4 text-sm transition-all ${
                      selected
                        ? 'bg-primary-soft border-primary text-text'
                        : 'bg-bg-soft border-border hover:border-border-soft text-text-muted'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`h-5 w-5 rounded-[2px] border flex items-center justify-center ${
                        selected ? 'bg-primary border-primary' : 'border-border'
                      }`}>
                        {selected && <Check className="h-3.5 w-3.5 text-bg" />}
                      </span>
                      <span>{opt.label}</span>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="flex items-center justify-between mt-6">
              <button onClick={back} disabled={currentIdx === 0 || saving} className="btn-ghost">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              {isLast ? (
                <button onClick={submit} disabled={!isAnswered || saving} className="btn-accent">
                  {saving ? 'Computing…' : 'See results'} <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button onClick={next} disabled={!isAnswered} className="btn-accent">
                  Next <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    )
  }

  return null
}

// ── Results View ─────────────────────────────────────────────────────────────

function ResultsView({
  result, onRetake, onSetTargetRole, settingRole,
}: {
  result: CareerDNAResult
  onRetake: () => void
  onSetTargetRole: (career: string) => void
  settingRole: boolean
}) {
  const { profile } = useAuthStore()
  const { theme } = useTheme()
  const radarData = useMemo(() => {
    const tv = result.trait_vector
    return AXIS_ORDER.map((axis: AxisKey) => ({
      axis: AXIS_LABELS[axis],
      value: Math.round((tv[axis] ?? 0) * 100),
    }))
  }, [result])

  const topMatch = result.top_matches?.[0]
  const isCurrentTarget = (career: string) => (profile?.target_roles ?? []).includes(career)

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeOnly}>
      <PageHeader title="Career DNA" subtitle="Your trait profile and career archetype matches." icon={Dna} />

      <motion.div
        variants={staggerContainer(60)}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto"
      >
        {/* Left column — Trait Profile */}
        <motion.div variants={fadeSlideUp} className="card p-6 min-w-0">
          <h3 className="font-display font-medium text-lg mb-4 diamond-accent">Trait Profile</h3>
          <div style={{ width: '100%', height: 360 }}>
            <ResponsiveContainer>
              <RadarChart data={radarData} margin={{ top: 24, right: 48, bottom: 32, left: 48 }}>
                <PolarGrid stroke={theme === 'dark' ? '#1E2938' : '#E2E6EC'} />
                <PolarAngleAxis dataKey="axis" tick={{ fill: theme === 'dark' ? '#949EAC' : '#5B6472', fontSize: 11, fontFamily: 'IBM Plex Sans' }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fill: theme === 'dark' ? '#5B6472' : '#949EAC', fontSize: 9, fontFamily: 'IBM Plex Sans' }} stroke={theme === 'dark' ? '#1E2938' : '#E2E6EC'} />
                <Radar
                  dataKey="value"
                  stroke="rgb(var(--color-primary))"
                  fill="rgb(var(--color-primary))"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mt-4">
            {AXIS_ORDER.map((axis) => {
              const val = Math.round((result.trait_vector[axis] ?? 0) * 100)
              return (
                <div key={axis} className="text-center p-2 rounded-[2px] bg-bg-soft border border-border">
                  <div className="text-[10px] font-mono text-text-faint mb-0.5">{axis}</div>
                  <div className={`text-sm font-display font-bold ${val >= 67 ? 'text-primary' : val >= 40 ? 'text-primary' : 'text-text-muted'}`}>{val}</div>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Right column — Career Matches */}
        <motion.div variants={fadeSlideUp} className="card p-6 min-w-0 card-accent">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-medium text-lg diamond-accent">Career Matches</h3>
            <button onClick={onRetake} className="btn-ghost text-sm">
              <RotateCcw className="h-4 w-4" /> Retake
            </button>
          </div>
          <div className="space-y-3">
            {result.top_matches?.slice(0, 5).map((match, idx) => {
              const isTop = idx === 0
              const alreadyTarget = isCurrentTarget(match.career)
              return (
                <div
                  key={match.career}
                  className={`rounded-[2px] border p-4 transition-all w-full min-w-0 ${
                    isTop ? 'border-accent/40 bg-accent-soft' : 'border-border bg-bg-soft'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-2 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      {isTop && <span className="h-2 w-2 rounded-full bg-primary animate-pulse-soft flex-shrink-0" />}
                      <span className={`font-display truncate ${isTop ? 'font-semibold text-text' : 'font-medium text-text-muted'}`}>
                        {match.career}
                      </span>
                    </div>
                    <span className={`text-2xl font-display font-bold flex-shrink-0 ${isTop ? 'text-primary' : 'text-text-muted'}`}>
                      {match.match_percent}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-bg-elev overflow-hidden rounded-[2px]">
                    <motion.div
                      className={`h-full rounded-[2px] ${isTop ? 'bg-primary' : 'bg-primary'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${match.match_percent}%` }}
                      transition={{ duration: 0.7, ease: 'easeOut', delay: idx * 0.1 }}
                    />
                  </div>
                  {isTop && (
                    <button
                      onClick={() => onSetTargetRole(match.career)}
                      disabled={settingRole || alreadyTarget}
                      className="btn-accent w-full mt-3 text-sm"
                    >
                      {alreadyTarget ? (
                        <><Check className="h-4 w-4" /> Already your target role</>
                      ) : (
                        <><Target className="h-4 w-4" /> Set as my target role</>
                      )}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </motion.div>
      </motion.div>

      {/* Retake button at bottom */}
      <motion.div variants={fadeSlideUp} className="text-center mt-6">
        <button onClick={onRetake} className="btn-secondary">
          <RotateCcw className="h-4 w-4" /> Retake assessment
        </button>
      </motion.div>
    </motion.div>
  )
}


