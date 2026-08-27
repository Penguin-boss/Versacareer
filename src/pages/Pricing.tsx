import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Check, Crown, Zap, Sparkles, Shield, ArrowRight, TrendingUp, Infinity as InfinityIcon,
} from 'lucide-react'
import { PLAN_PRICING, FOUNDER_PASS_CAP, FOUNDER_PRICE_TIERS, getFounderPriceForPosition } from '../lib/types'
import { supabase } from '../lib/supabase'
import { fadeSlideUp, staggerContainer, fadeOnly } from '../lib/motionVariants'
import { AmbientBackground } from '../components/AmbientBackground'

type Billing = 'monthly' | 'yearly'

const FREE_FEATURES = [
  '3 resume analyses per month',
  'Career DNA assessment',
  'AI Career Mentor (10 messages/month)',
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

export default function Pricing() {
  const [billing, setBilling] = useState<Billing>('monthly')
  const [founderSold, setFounderSold] = useState<number | null>(null)

  // Live founder pass counter — read from the DB when signed in; fall back
  // to a demo number for the public (signed-out) view so the urgency
  // counter still renders.
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
      } catch {
        if (!cancelled) setFounderSold(8)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const founderCount = founderSold ?? 8
  const founderRemaining = Math.max(0, FOUNDER_PASS_CAP - founderCount)
  const founderPct = Math.min(100, Math.round((founderCount / FOUNDER_PASS_CAP) * 100))

  const yearlySavings = (plan: 'PRO' | 'PRO_PLUS') => {
    const m = PLAN_PRICING[plan].monthly * 12
    const y = PLAN_PRICING[plan].yearly
    return Math.round(((m - y) / m) * 100)
  }

  return (
    <div className="min-h-screen bg-bg relative overflow-hidden">
      <AmbientBackground />
      {/* Nav */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/VersaCareer_AI_Logo.png" alt="VersaCareer AI" className="h-9 w-9 rounded-[2px]" />
            <div>
              <div className="font-semibold leading-tight">VersaCareer AI</div>
              <div className="text-[11px] text-text-faint">by Pragma</div>
            </div>
          </Link>
          <Link to="/dashboard" className="btn-primary">Get started <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </header>

      {/* Hero */}
      <motion.section initial="hidden" animate="visible" variants={fadeOnly} className="max-w-6xl mx-auto px-4 md:px-8 pt-16 pb-8 text-center relative z-10">
        <div className="inline-flex items-center gap-2 rounded-[2px] border border-border bg-bg-soft px-3 py-1 text-xs text-text-muted mb-6">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Simple, transparent pricing
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-[1.1]">
          Choose the plan that fits<br />
          <span className="text-primary">your career stage.</span>
        </h1>
        <p className="text-text-muted text-lg max-w-2xl mx-auto mb-8">
          Start free. Upgrade when you're ready. Cancel anytime. Every plan is enforced server-side — no tricks, no hidden caps.
        </p>

        {/* Billing toggle */}
        <div className="inline-flex items-center gap-1 p-1 rounded-[2px] border border-border bg-bg-soft mb-2">
          <button
            onClick={() => setBilling('monthly')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${billing === 'monthly' ? 'bg-bg-elev text-text shadow-sm' : 'text-text-muted hover:text-text'}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling('yearly')}
            className={`px-4 py-2 text-sm rounded-md transition-colors flex items-center gap-2 ${billing === 'yearly' ? 'bg-bg-elev text-text shadow-sm' : 'text-text-muted hover:text-text'}`}
          >
            Yearly
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-success/10 text-success font-medium">Save up to 30%</span>
          </button>
        </div>
      </motion.section>

      {/* Plan cards */}
      <motion.section variants={staggerContainer(80)} initial="hidden" animate="visible" className="max-w-6xl mx-auto px-4 md:px-8 py-8 relative z-10">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Free */}
          <PlanCard
            icon={<Zap className="h-5 w-5 text-text-muted" />}
            name="Free"
            price="₹0"
            period="forever"
            features={FREE_FEATURES}
            cta={<Link to="/dashboard" className="btn-secondary w-full">Start free</Link>}
          />

          {/* Pro */}
          <PlanCard
            icon={<Crown className="h-5 w-5 text-warning" />}
            name="Pro"
            price={billing === 'monthly' ? `₹${PLAN_PRICING.PRO.monthly}` : `₹${PLAN_PRICING.PRO.yearly}`}
            period={billing === 'monthly' ? '/mo' : '/yr'}
            badge="RECOMMENDED"
            highlight
            features={PRO_FEATURES}
            sub={billing === 'yearly' ? `Save ${yearlySavings('PRO')}% vs monthly` : undefined}
            cta={<Link to="/billing" className="btn-primary w-full"><Crown className="h-4 w-4" /> Upgrade to Pro</Link>}
          />

          {/* Pro+ */}
          <PlanCard
            icon={<Sparkles className="h-5 w-5 text-primary" />}
            name="Pro+"
            price={billing === 'monthly' ? `₹${PLAN_PRICING.PRO_PLUS.monthly}` : `₹${PLAN_PRICING.PRO_PLUS.yearly}`}
            period={billing === 'monthly' ? '/mo' : '/yr'}
            badge="BEST VALUE"
            features={PRO_PLUS_FEATURES}
            sub={billing === 'yearly' ? `Save ${yearlySavings('PRO_PLUS')}% vs monthly` : undefined}
            cta={<Link to="/billing" className="btn-primary w-full"><Sparkles className="h-4 w-4" /> Go Pro+</Link>}
          />

          {/* Founder Pass */}
          <motion.div variants={fadeSlideUp} className="card p-6 flex flex-col border-warning/40 relative overflow-hidden card-hover">
            <div className="absolute -top-3 right-5 badge bg-warning text-white border border-warning/20">LIMITED</div>
            <div className="flex items-center gap-2 mb-1">
              <InfinityIcon className="h-5 w-5 text-warning" />
              <h3 className="text-lg font-semibold">Founder Pass</h3>
            </div>
            {founderRemaining === 0 ? (
              <>
                <div className="text-3xl font-bold mb-1 text-text-muted">SOLD OUT</div>
                <div className="text-xs text-text-muted mb-4">All 50 Founder Passes have been claimed.</div>
              </>
            ) : (
              <>
                <div className="text-3xl font-bold mb-1">₹{getFounderPriceForPosition(founderCount + 1).toLocaleString('en-IN')}</div>
                <div className="text-xs text-text-muted mb-4">one-time · lifetime access</div>

                {/* Tier breakdown */}
                <div className="mb-3 flex items-center gap-1.5 text-[11px] text-text-faint flex-wrap">
                  {FOUNDER_PRICE_TIERS.map((t, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded bg-bg-elev">
                      #{t.minPosition}–{t.maxPosition}: ₹{t.priceInr.toLocaleString('en-IN')}
                    </span>
                  ))}
                </div>

                {/* Live counter */}
                <div className="mb-4 p-3 rounded-[2px] bg-warning/5 border border-warning/20">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-text-muted">Claimed</span>
                    <span className="font-semibold text-warning">{founderCount} of {FOUNDER_PASS_CAP}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-bg-elev overflow-hidden">
                    <div
                      className="h-full bg-warning transition-all duration-700"
                      style={{ width: `${founderPct}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-text-faint mt-1.5">
                    {founderRemaining === 0
                      ? 'Sold out'
                      : (() => {
                          const nextTier = FOUNDER_PRICE_TIERS.find(
                            (t) => founderCount + 1 < t.maxPosition && founderCount + 1 >= t.minPosition
                          )
                          const nextTierBoundary = nextTier?.maxPosition ?? FOUNDER_PASS_CAP
                          const positionsLeftInTier = nextTierBoundary - founderCount
                          if (positionsLeftInTier <= 5 && nextTier) {
                            const nextPrice = FOUNDER_PRICE_TIERS[FOUNDER_PRICE_TIERS.indexOf(nextTier) + 1]?.priceInr
                            return nextPrice
                              ? `Only ${positionsLeftInTier} left at ₹${getFounderPriceForPosition(founderCount + 1).toLocaleString('en-IN')} — next tier ₹${nextPrice.toLocaleString('en-IN')}`
                              : `Only ${positionsLeftInTier} left at this price`
                          }
                          return `Only ${founderRemaining} left`
                        })()}
                  </div>
                </div>
              </>
            )}

            <ul className="space-y-2 mb-6 flex-1">
              {FOUNDER_FEATURES.map((f) => (
                <li key={f} className="text-sm text-text-muted flex gap-2">
                  <Check className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" /> {f}
                </li>
              ))}
            </ul>
            {founderRemaining === 0 ? (
              <div className="text-center text-sm text-text-muted py-2.5 border border-border rounded-[2px] bg-bg-soft">Founder Pass — SOLD OUT</div>
            ) : (
              <Link to="/billing" className="btn-primary w-full" style={{ background: 'var(--warning)' }}>
                <InfinityIcon className="h-4 w-4" /> Claim Founder Pass
              </Link>
            )}
          </motion.div>
        </div>
      </motion.section>

      {/* Comparison */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }} variants={fadeSlideUp} className="max-w-6xl mx-auto px-4 md:px-8 py-12 relative z-10">
        <h2 className="text-2xl font-semibold text-center mb-8">Compare plans in detail</h2>
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 font-medium text-text-muted">Feature</th>
                <th className="p-4 font-medium">Free</th>
                <th className="p-4 font-medium text-primary">Pro</th>
                <th className="p-4 font-medium text-primary">Pro+</th>
                <th className="p-4 font-medium text-warning">Founder</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Resume analyses / month', '3', 'Unlimited', 'Unlimited', 'Unlimited'],
                ['AI Mentor messages / month', '10', 'Unlimited', 'Unlimited', 'Unlimited'],
                ['Saved resumes', '1', 'Unlimited', 'Unlimited', 'Unlimited'],
                ['Resume templates', 'Basic', 'Premium', 'Premium', 'Premium'],
                ['Skill Gap depth', 'Basic', 'Unlimited', 'Advanced', 'Advanced'],
                ['Roadmap depth', 'Basic', 'Personalized', 'Industry-specific', 'Industry-specific'],
                ['ATS report', 'Basic', 'Advanced', 'Advanced', 'Advanced'],
                ['Career analytics', '—', 'Basic', 'Advanced', 'Advanced'],
                ['Learning recommendations', '—', 'Basic', 'Personalized', 'Personalized'],
                ['Resume version history', '—', '✓', '✓', '✓'],
                ['Weekly progress reports', '—', '✓', '✓', '✓'],
                ['AI Resume Rewrite', '—', '—', '✓', '✓'],
                ['Career goal tracking', '—', '—', '✓', '✓'],
                ['AI career planning sessions', '—', '—', '✓', '✓'],
                ['Priority support', '—', 'Priority', 'Premium', 'Premium'],
                ['Early access to features', '—', '—', '✓', '✓'],
                ['Price', '₹0', '₹299/mo', '₹599/mo', '₹3,999–₹4,999 once'],
              ].map((row, i) => (
                <tr key={i} className="border-b border-border/50 last:border-0">
                  <td className="p-4 text-text-muted">{row[0]}</td>
                  <td className="p-4 text-center">{row[1]}</td>
                  <td className="p-4 text-center text-primary">{row[2]}</td>
                  <td className="p-4 text-center text-primary">{row[3]}</td>
                  <td className="p-4 text-center text-warning">{row[4]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.section>

      {/* Trust */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={staggerContainer(60)} className="max-w-6xl mx-auto px-4 md:px-8 py-12 border-t border-border relative z-10">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Shield, title: 'Server-enforced limits', desc: 'Every cap is checked server-side against your authenticated account. No client-side bypasses.' },
            { icon: Crown, title: 'Plan set by webhook only', desc: 'Your plan only changes when a verified Stripe webhook confirms payment — never from the client.' },
            { icon: TrendingUp, title: 'Cancel anytime', desc: 'Downgrade to Free at any time. Your data stays. You just lose the paid features.' },
          ].map((t) => (
            <motion.div key={t.title} variants={fadeSlideUp} className="flex gap-3">
              <div className="h-10 w-10 rounded-[2px] bg-bg-elev flex items-center justify-center flex-shrink-0">
                <t.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-sm mb-1">{t.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{t.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* CTA */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeOnly} className="max-w-6xl mx-auto px-4 md:px-8 py-20 text-center border-t border-border relative z-10">
        <h2 className="text-3xl font-semibold mb-4">Start free. No credit card.</h2>
        <p className="text-text-muted mb-8">Get 3 resume analyses + 10 mentor messages every month, on us.</p>
        <Link to="/dashboard" className="btn-primary text-base px-6 py-3 inline-flex">Get started free <ArrowRight className="h-4 w-4" /></Link>
      </motion.section>

      <footer className="border-t border-border relative z-10 bg-bg-soft">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 text-center text-sm text-text-faint">
          VersaCareer is a product of Pragma, the AI SaaS wing of Optimus, founded by Vadlamudi Sai Chanakya and Devella Sankeerth.
        </div>
      </footer>
    </div>
  )
}

function PlanCard({
  icon, name, price, period, features, cta, badge, highlight, sub,
}: {
  icon: React.ReactNode
  name: string
  price: string
  period: string
  features: string[]
  cta: React.ReactNode
  badge?: string
  highlight?: boolean
  sub?: string
}) {
  return (
    <motion.div variants={fadeSlideUp} className={`card p-6 flex flex-col relative card-hover ${highlight ? 'card-accent' : ''}`}>
      {badge && (
        <div className={`absolute -top-3 right-5 badge ${highlight ? 'bg-warning text-white border border-warning/20' : 'bg-primary text-white border border-primary/20'}`}>{badge}</div>
      )}
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <h3 className="text-lg font-semibold">{name}</h3>
      </div>
      <div className="text-3xl font-bold mb-1">{price}<span className="text-sm font-normal text-text-muted">{period}</span></div>
      {sub && <div className="text-xs text-success mb-4">{sub}</div>}
      {!sub && <div className="mb-4" />}
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

