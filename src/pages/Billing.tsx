import { Crown, Check, Zap, Sparkles, Shield, Infinity as InfinityIcon } from 'lucide-react'
import { PageHeader } from '../components/DashboardLayout'
import { useAuthStore } from '../lib/authStore'
import { PLAN_PRICING, FOUNDER_PASS_CAP, FOUNDER_PRICE_TIERS, getFounderPriceForPosition } from '../lib/types'
import { useEffect, useState } from 'react'
import { supabase, callEdgeFunction } from '../lib/supabase'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { fadeSlideUp, staggerContainer, fadeOnly } from '../lib/motionVariants'

type Billing = 'monthly' | 'yearly'

const FREE_FEATURES = [
  '3 resume analyses per month',
  'Career DNA assessment',
  'AI Career Mentor (20 messages/month)',
  'Basic Skill Gap Analysis',
  'Basic Roadmap',
]

const PRO_FEATURES = [
  'Unlimited resume analyses',
  'Unlimited AI Career Mentor chat',
  'Advanced Skill Gap Analysis with sub-skills & resources',
  'Full Personalized Roadmap (daily/weekly/monthly)',
  'Premium resume templates',
  'Advanced ATS reports',
  'Career analytics (basic)',
  'Weekly progress reports',
  'Priority support',
]

const PRO_PLUS_FEATURES = [
  'Everything in Pro, plus:',
  'Advanced Skill Gap with industry benchmarks',
  'Industry-specific Roadmaps',
  'Advanced career analytics',
  'Personalized learning recommendations',
  'Career goal tracking',
  'AI career planning sessions',
  'Premium priority support',
  'Early access to new features',
]

const FOUNDER_FEATURES = [
  'Lifetime Pro+ membership — all V1 features + all future V2 updates',
  'Early access to new AI features before public release',
  'Exclusive "Founding Member" badge on your profile',
  'Priority support — faster responses, priority bug fixes',
  'Vote on upcoming features + higher-priority feature requests',
  'Access to private founders-only community',
  'Lifetime price lock — never pay a subscription fee',
]

export default function Billing() {
  const { profile } = useAuthStore()
  const [billing, setBilling] = useState<Billing>('monthly')
  const [founderSold, setFounderSold] = useState<number>(0)

  const currentPlan = profile?.plan ?? 'FREE'
  const isFounder = profile?.is_founder === true

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await supabase
          .from('founder_pass_counter')
          .select('sold_count')
          .eq('id', 'singleton')
          .maybeSingle()
        if (!cancelled && data) setFounderSold(data.sold_count)
      } catch { /* ignore */ }
    })()
    return () => { cancelled = true }
  }, [])

  const founderRemaining = Math.max(0, FOUNDER_PASS_CAP - founderSold)

  const handleUpgrade = async (plan: 'PRO' | 'PRO_PLUS' | 'FOUNDER') => {
    try {
      const res = await callEdgeFunction<{ url: string }>('create-checkout', {
        plan,
        cycle: billing === 'yearly' ? 'YEARLY' : 'MONTHLY',
      })
      if (res.url) window.location.href = res.url
    } catch (err: any) {
      if (err.code === 'FOUNDER_SOLD_OUT') toast.error('The Founder Pass is sold out.')
      else toast.error(err.message || 'Checkout failed. Try again or contact support.')
    }
  }

  const isCurrent = (plan: string) => {
    if (plan === 'FOUNDER') return isFounder
    if (isFounder) return false
    return currentPlan === plan
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeOnly}>
      <PageHeader title="Billing & Plans" subtitle="Manage your subscription. Upgrade to unlock the full platform." icon={Crown} />

      {/* Current plan banner */}
      <motion.div variants={fadeSlideUp} className="card p-5 mb-6 flex items-center justify-between card-hover">
        <div>
          <div className="text-sm text-text-muted">Current plan</div>
          <div className="text-xl font-semibold flex items-center gap-2 mt-1">
            {isFounder ? (
              <><InfinityIcon className="h-5 w-5 text-warning" /> Founder Pass</>
            ) : currentPlan === 'PRO_PLUS' ? (
              <><Sparkles className="h-5 w-5 text-primary" /> Pro+</>
            ) : currentPlan === 'PRO' ? (
              <><Crown className="h-5 w-5 text-warning" /> Pro</>
            ) : (
              <><Zap className="h-5 w-5 text-text-muted" /> Free</>
            )}
          </div>
        </div>
        <span className={`badge ${isFounder || currentPlan !== 'FREE' ? 'bg-warning/10 text-warning border border-warning/20' : 'bg-bg-elev text-text-muted'}`}>
          {isFounder ? 'FOUNDER' : currentPlan}
        </span>
      </motion.div>

      {/* Billing toggle */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex items-center gap-1 p-1 rounded-md border border-border bg-bg-soft">
          <button
            onClick={() => setBilling('monthly')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${billing === 'monthly' ? 'bg-bg-elev text-text shadow-sm' : 'text-text-muted hover:text-text'}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling('yearly')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${billing === 'yearly' ? 'bg-bg-elev text-text shadow-sm' : 'text-text-muted hover:text-text'}`}
          >
            Yearly <span className="text-[10px] px-1.5 py-0.5 rounded bg-success/10 text-success font-medium">Save 30%</span>
          </button>
        </div>
      </div>

      {/* Plan cards */}
      <motion.div variants={staggerContainer(60)} initial="hidden" animate="visible" className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Free */}
        <PlanCard
          icon={<Zap className="h-5 w-5 text-text-muted" />}
          name="Free"
          price="₹0"
          period="forever"
          features={FREE_FEATURES}
          cta={isCurrent('FREE')
            ? <div className="text-center text-sm text-text-muted py-2.5 border border-border rounded-md">Current plan</div>
            : <div className="text-center text-sm text-text-muted py-2.5 border border-border rounded-md">Current plan</div>}
        />

        {/* Pro */}
        <PlanCard
          icon={<Crown className="h-5 w-5 text-primary" />}
          name="Pro"
          price={billing === 'monthly' ? `₹${PLAN_PRICING.PRO.monthly}` : `₹${PLAN_PRICING.PRO.yearly}`}
          period={billing === 'monthly' ? '/mo' : '/yr'}
          badge="RECOMMENDED"
          highlight
          features={PRO_FEATURES}
          cta={isCurrent('PRO')
            ? <div className="text-center text-sm text-success py-2.5 border border-success/30 rounded-md bg-success/5">Active — thank you!</div>
            : <button onClick={() => handleUpgrade('PRO')} className="btn-primary w-full"><Crown className="h-4 w-4" /> Upgrade to Pro</button>}
        />

        {/* Pro+ */}
        <PlanCard
          icon={<Sparkles className="h-5 w-5 text-accent" />}
          name="Pro+"
          price={billing === 'monthly' ? `₹${PLAN_PRICING.PRO_PLUS.monthly}` : `₹${PLAN_PRICING.PRO_PLUS.yearly}`}
          period={billing === 'monthly' ? '/mo' : '/yr'}
          badge="BEST VALUE"
          highlight
          features={PRO_PLUS_FEATURES}
          cta={isCurrent('PRO_PLUS')
            ? <div className="text-center text-sm text-success py-2.5 border border-success/30 rounded-md bg-success/5">Active — thank you!</div>
            : <button onClick={() => handleUpgrade('PRO_PLUS')} className="btn-accent w-full"><Sparkles className="h-4 w-4" /> Go Pro+</button>}
        />

        {/* Founder Pass */}
        <div className="card p-6 flex flex-col border-warning/40 relative overflow-hidden">
          <div className="absolute -top-3 right-5 badge bg-warning text-white border border-warning/20">LIMITED</div>
          <div className="flex items-center gap-2 mb-1">
            <InfinityIcon className="h-5 w-5 text-warning" />
            <h3 className="text-lg font-semibold">Founder Pass</h3>
          </div>
          <div className="text-3xl font-bold mb-1">
            {founderRemaining === 0 ? 'SOLD OUT' : `₹${getFounderPriceForPosition(founderSold + 1).toLocaleString('en-IN')}`}
          </div>
          <div className="text-xs text-text-muted mb-4">one-time · lifetime access</div>

          {/* Tier breakdown */}
          {founderRemaining > 0 && (
            <div className="mb-3 flex items-center gap-1.5 text-[11px] text-text-faint flex-wrap">
              {FOUNDER_PRICE_TIERS.map((t, i) => (
                <span key={i} className="px-1.5 py-0.5 rounded bg-bg-elev">
                  #{t.minPosition}–{t.maxPosition}: ₹{t.priceInr.toLocaleString('en-IN')}
                </span>
              ))}
            </div>
          )}

          <div className="mb-4 p-3 rounded-md bg-warning/5 border border-warning/20">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-text-muted">Claimed</span>
              <span className="font-semibold text-warning">{founderSold} of {FOUNDER_PASS_CAP}</span>
            </div>
            <div className="h-1.5 rounded-full bg-bg-elev overflow-hidden">
              <div className="h-full bg-warning transition-all duration-700" style={{ width: `${Math.min(100, (founderSold / FOUNDER_PASS_CAP) * 100)}%` }} />
            </div>
            <div className="text-[11px] text-text-faint mt-1.5">{founderRemaining === 0 ? 'Sold out' : `Only ${founderRemaining} left`}</div>
          </div>

          <ul className="space-y-2 mb-6 flex-1">
            {FOUNDER_FEATURES.map((f) => (
              <li key={f} className="text-sm text-text-muted flex gap-2">
                <Check className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" /> {f}
              </li>
            ))}
          </ul>
          {isCurrent('FOUNDER')
            ? <div className="text-center text-sm text-warning py-2.5 border border-warning/30 rounded-md bg-warning/5">Founder — lifetime access</div>
            : founderRemaining === 0
              ? <div className="text-center text-sm text-text-muted py-2.5 border border-border rounded-md bg-bg-soft">Founder Pass — SOLD OUT</div>
              : <button onClick={() => handleUpgrade('FOUNDER')} className="btn-primary w-full" style={{ background: 'var(--warning)' }}>
                  <InfinityIcon className="h-4 w-4" /> Claim Founder Pass
                </button>}
        </div>
      </motion.div>

      {/* How billing works */}
      <motion.div variants={fadeSlideUp} className="card p-5 mt-6 flex gap-3 items-start card-hover">
        <Shield className="h-5 w-5 text-text-faint mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="text-sm font-medium mb-1">How billing works</h4>
          <p className="text-sm text-text-muted">
            Your plan is set exclusively by a verified Stripe webhook — never by a client-side request. Free-tier limits are enforced server-side on every AI call, keyed to your authenticated user ID. Cancel anytime; your data stays, you just lose the paid features.
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

function PlanCard({
  icon, name, price, period, features, cta, badge, highlight,
}: {
  icon: React.ReactNode
  name: string
  price: string
  period: string
  features: string[]
  cta: React.ReactNode
  badge?: string
  highlight?: boolean
}) {
  return (
    <motion.div variants={fadeSlideUp} className={`card p-6 flex flex-col relative card-hover ${highlight ? 'card-accent shadow-glow' : ''}`}>
      {badge && <div className="absolute -top-3 right-5 badge bg-primary text-onprimary border border-primary/20">{badge}</div>}
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <h3 className="text-lg font-semibold">{name}</h3>
      </div>
      <div className="text-3xl font-bold mb-4">{price}<span className="text-sm font-normal text-text-muted">{period}</span></div>
      <ul className="space-y-2.5 mb-6 flex-1">
        {features.map((f) => (
          <li key={f} className="text-sm text-text-muted flex gap-2">
            <Check className={`h-4 w-4 mt-0.5 flex-shrink-0 ${highlight ? 'text-primary' : 'text-success'}`} /> {f}
          </li>
        ))}
      </ul>
      {cta}
    </motion.div>
  )
}
