import type { Scenario } from './conversation'
import type { ErrorType } from './analysis'

export interface Recommendation {
  id: string
  scenario: Scenario
  difficulty: number
  reason: string
  reasonKey: string // i18n key for the reason
  priority: 'high' | 'medium' | 'low'
  targetWeakPoints: ErrorType[]
}

export interface RecommendationStats {
  totalSessions: number
  averageScore: number
  weakPoints: Array<{
    type: ErrorType
    count: number
    percentage: number
  }>
  strongPoints: Array<{
    type: ErrorType
    count: number
    percentage: number
  }>
  recentScores: Array<{
    sessionId: string
    score: number
    scenario: Scenario
    date: Date
  }>
}

export interface RecommendationsResponse {
  recommendations: Recommendation[]
  stats: RecommendationStats
}

export interface RecentSession {
  id: string
  scenario: Scenario
  difficulty: number
  score: number
  errorCount: number
  startedAt: Date
  endedAt: Date | null
  analysisId: string | null
}
