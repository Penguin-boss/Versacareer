// Central source of truth for every plan-gated limit. Edge functions and
// the frontend both read from here so limits never drift out of sync with
// the pricing page. "Unlimited" in marketing maps to a high internal
// ceiling (ABUSE_CEILING) so a single user cannot run up runaway AI cost.

export type Plan = 'FREE' | 'PRO' | 'PRO_PLUS' | 'FOUNDER'
export type BillingCycle = 'MONTHLY' | 'YEARLY' | 'LIFETIME'

// Hard internal ceiling applied to every "Infinity" limit. Never surfaced
// in marketing copy — only used server-side to cap abuse.
export const ABUSE_CEILING = 500

export interface PlanLimit {
  resumeAnalysesPerMonth: number
  mentorPromptsPerMonth: number
  skillGapDepth: 'basic' | 'unlimited' | 'advanced'
  roadmapDepth: 'basic' | 'personalized' | 'industry_specific'
  atsReport: 'basic' | 'advanced'
  careerAnalytics: boolean | 'basic' | 'advanced'
  learningRecommendations: boolean | 'basic' | 'personalized'
  weeklyProgressReports: boolean
  prioritySupport: boolean | 'premium'
  earlyAccess: boolean
  careerGoalTracking: boolean
  aiCareerPlanningSessions: boolean
}

export const PLAN_LIMITS: Record<Exclude<Plan, 'FOUNDER'>, PlanLimit> = {
  FREE: {
    resumeAnalysesPerMonth: 3,
    mentorPromptsPerMonth: 10,
    skillGapDepth: 'basic',
    roadmapDepth: 'basic',
    atsReport: 'basic',
    careerAnalytics: false,
    learningRecommendations: false,
    weeklyProgressReports: false,
    prioritySupport: false,
    earlyAccess: false,
    careerGoalTracking: false,
    aiCareerPlanningSessions: false,
  },
  PRO: {
    resumeAnalysesPerMonth: ABUSE_CEILING,
    mentorPromptsPerMonth: ABUSE_CEILING,
    skillGapDepth: 'unlimited',
    roadmapDepth: 'personalized',
    atsReport: 'advanced',
    careerAnalytics: 'basic',
    learningRecommendations: 'basic',
    weeklyProgressReports: true,
    prioritySupport: true,
    earlyAccess: false,
    careerGoalTracking: false,
    aiCareerPlanningSessions: false,
  },
  PRO_PLUS: {
    resumeAnalysesPerMonth: ABUSE_CEILING,
    mentorPromptsPerMonth: ABUSE_CEILING,
    skillGapDepth: 'advanced',
    roadmapDepth: 'industry_specific',
    atsReport: 'advanced',
    careerAnalytics: 'advanced',
    learningRecommendations: 'personalized',
    weeklyProgressReports: true,
    prioritySupport: 'premium',
    earlyAccess: true,
    careerGoalTracking: true,
    aiCareerPlanningSessions: true,
  },
}

// FOUNDER is an alias for PRO_PLUS limits (lifetime, no renewal).
export function getEffectivePlan(user: { plan: string; is_founder?: boolean }): Exclude<Plan, 'FOUNDER'> {
  if (user.is_founder) return 'PRO_PLUS'
  if (user.plan === 'PRO_PLUS') return 'PRO_PLUS'
  if (user.plan === 'PRO') return 'PRO'
  return 'FREE'
}

export function getLimits(user: { plan: string; is_founder?: boolean }): PlanLimit {
  return PLAN_LIMITS[getEffectivePlan(user)]
}

export function isFeatureAllowed(user: { plan: string; is_founder?: boolean }, feature: keyof PlanLimit): boolean {
  const limits = getLimits(user)
  const v = limits[feature] as unknown
  if (typeof v === 'boolean') return v
  if (typeof v === 'number') return v > 0
  return Boolean(v)
}

// Pricing — single source of truth for the pricing/billing UI.
export const PLAN_PRICING = {
  FREE: { monthly: 0, yearly: 0, label: 'Free' },
  PRO: { monthly: 299, yearly: 2499, label: 'Pro' },
  PRO_PLUS: { monthly: 599, yearly: 5499, label: 'Pro+' },
  FOUNDER: { oneTime: 3999, label: 'Founder Pass' },
} as const

export const FOUNDER_PRICE_TIERS = [
  { minPosition: 1, maxPosition: 10, priceInr: 3999 },
  { minPosition: 11, maxPosition: 30, priceInr: 4599 },
  { minPosition: 31, maxPosition: 50, priceInr: 4999 },
] as const

export const FOUNDER_PASS_CAP = 50

export function getFounderPriceForPosition(position: number): number {
  const tier = FOUNDER_PRICE_TIERS.find(
    (t) => position >= t.minPosition && position <= t.maxPosition
  )
  if (!tier) throw new Error('Position exceeds Founder Pass cap')
  return tier.priceInr
}

export type CountedFeature = 'resumeAnalyses' | 'mentorPrompts'

export const LIMIT_REACHED_REASONS = {
  RESUME_ANALYSIS_LIMIT_REACHED: "You've used all your free resume analyses this month. Upgrade to Pro for unlimited.",
  MENTOR_PROMPT_LIMIT_REACHED: "You've used all your free mentor messages this month. Upgrade to Pro for unlimited.",
} as const

export type LimitReason = keyof typeof LIMIT_REACHED_REASONS
