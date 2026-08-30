// Career DNA Scoring Engine — pure functions, no external calls
import {
  QUESTIONS,
  type AxisKey,
  type CareerArchetype,
  ARCHETYPES,
} from './questions.ts'

export type AnswerMap = Record<string, number> // questionId -> option index (0-3)

export interface TraitVector {
  AN: number; CR: number; SY: number; CO: number; ST: number; SE: number; OW: number
}

export interface CareerMatch {
  career: string
  matchPercent: number
}

export interface ScoringResult {
  traitVector: TraitVector
  topMatches: CareerMatch[]
}

const AXES: AxisKey[] = ['AN', 'CR', 'SY', 'CO', 'ST', 'SE', 'OW']

export function scoreAssessment(answers: AnswerMap): ScoringResult {
  const raw: Record<AxisKey, number> = { AN: 0, CR: 0, SY: 0, CO: 0, ST: 0, SE: 0, OW: 0 }

  for (const q of QUESTIONS) {
    const optionIdx = answers[q.id]
    if (optionIdx === undefined) continue
    const opt = q.options[optionIdx]
    if (opt) {
      raw[opt.axis] += 1
    }
  }

  // Normalize: raw / MAX_AXIS_SCORE -> 0-1, then scale to 0-100
  const traitVector = {} as TraitVector
  for (const axis of AXES) {
    const normalized = Math.min(1, raw[axis] / MAX_AXIS_SCORE)
    ;(traitVector as any)[axis] = normalized
  }

  const topMatches = matchArchetypes(traitVector)
  return { traitVector, topMatches }
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    magA += a[i] * a[i]
    magB += b[i] * b[i]
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB)
  if (denom === 0) return 0
  return dot / denom
}

function matchArchetypes(traitVector: TraitVector): CareerMatch[] {
  const userVec = AXES.map((a) => traitVector[a])

  const sims = ARCHETYPES.map((arch) => {
    const archVec = AXES.map((a) => arch.vector[a])
    return { career: arch.career, sim: cosineSimilarity(userVec, archVec) }
  })

  sims.sort((a, b) => b.sim - a.sim)

  const topSim = sims[0].sim
  const topDisplay = Math.min(98, Math.max(90, 88 + topSim * 10))

  const matches: CareerMatch[] = sims.map((s, i) => {
    if (i === 0) return { career: s.career, matchPercent: Math.round(topDisplay) }
    const ratio = topSim > 0 ? s.sim / topSim : 0
    const pct = topDisplay * ratio * 0.92
    return { career: s.career, matchPercent: Math.round(Math.max(1, pct)) }
  })

  return matches
}

export function shuffleQuestions(): CareerDNAQuestion[] {
  const arr = [...QUESTIONS]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
