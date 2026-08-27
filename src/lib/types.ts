export type Plan = 'FREE' | 'PRO' | 'PRO_PLUS' | 'FOUNDER'
export type BillingCycle = 'MONTHLY' | 'YEARLY' | 'LIFETIME'
export type UserRole = 'USER' | 'ADMIN'

export interface Profile {
  id: string
  email: string
  name: string | null
  job_title: string | null
  plan: Plan
  role: UserRole
  target_roles: string[]
  experience_level: string | null
  preferred_work_style: string | null
  billing_cycle: BillingCycle | null
  plan_renews_at: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  is_founder: boolean | null
  avatar_url: string | null
  created_at: string
}

export interface AtsReportItem {
  type: 'formatting' | 'missing_keyword' | 'structure' | 'grammar'
  severity: 'high' | 'medium' | 'low'
  message: string
}

export interface ResumeAnalysis {
  id: string
  user_id: string
  file_name: string
  extracted_text: string | null
  overall_score: number
  ats_score: number
  technical_score: number
  experience_score: number
  project_score: number

  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
  current_skills: string[]
  missing_skills: string[]
  suitable_roles_text: string | null
  ats_report: AtsReportItem[]
  created_at: string
}

export interface CareerDNA {
  id: string
  user_id: string
  interests: string[]
  strengths: string[]
  work_style: string | null
  personality: string | null
  suggested_careers: string[]
  created_at: string
}

export interface CareerDNATraitVector {
  AN: number; CR: number; SY: number; CO: number; ST: number; SE: number; OW: number
}

export interface CareerDNAMatch {
  career: string
  match_percent: number
}

export interface CareerDNAResult {
  id: string
  user_id: string
  created_at: string
  trait_vector: CareerDNATraitVector
  top_matches: CareerDNAMatch[]
  raw_answers: Record<string, number>
}

export type MilestoneStatus = 'LOCKED' | 'IN_PROGRESS' | 'COMPLETED'

export interface Milestone {
  id: string
  user_id: string
  week: number
  title: string
  description: string
  status: MilestoneStatus
  created_at: string
}

export interface ChatMessage {
  id: string
  user_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface UsageCounter {
  id: string
  user_id: string
  month_key: string
  analyses_count: number
  chat_count: number
}

export interface CareerGoal {
  id: string
  user_id: string
  title: string
  description: string | null
  target_date: string | null
  status: 'IN_PROGRESS' | 'COMPLETED'
  milestone_id: string | null
  created_at: string
  updated_at: string
}

// Resources
export type ResourceType = 'course' | 'book' | 'youtube' | 'github' | 'roadmap'

export interface Resource {
  id: string
  title: string
  url: string
  type: ResourceType
  category: string
  skill_tags: string[]
  is_published: boolean
  created_at: string
}

// Feedback
export interface Feedback {
  id: string
  user_id: string
  page: string
  rating: number
  comment: string | null
  created_at: string
}

// Feature flags
export interface FeatureFlag {
  key: string
  is_enabled: boolean
  updated_at: string
}

// AI usage logs
export interface AiUsageLog {
  id: string
  user_id: string
  service: 'gemini' | 'claude'
  feature: string
  tokens_in: number
  tokens_out: number
  estimated_cost_usd: number
  created_at: string
}


export const CAREER_PATHS = [
  'Software Engineer',
  'AI Engineer',
  'Data Scientist',
  'Cybersecurity Engineer',
  'UI/UX Designer',
  'Product Manager',
  'DevOps Engineer',
] as const

export type CareerPath = typeof CAREER_PATHS[number]

export const EXPERIENCE_LEVELS = ['Student', 'Fresh Graduate', '0-2 years', '2-5 years', '5+ years'] as const
export const WORK_STYLES = ['Remote', 'Hybrid', 'On-site', 'Flexible'] as const

export const FREE_ANALYSES_PER_MONTH = 3
export const FREE_CHAT_PER_MONTH = 10

// Pricing — re-exported from planLimits.ts (single source of truth)
export { PLAN_PRICING, FOUNDER_PASS_CAP, FOUNDER_PRICE_TIERS, getFounderPriceForPosition } from './planLimits'
