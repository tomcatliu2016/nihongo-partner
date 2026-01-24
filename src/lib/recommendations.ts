import type { Scenario } from '@/types/conversation'
import type { ErrorType } from '@/types/analysis'
import type {
  Recommendation,
  RecommendationStats,
  RecentSession,
} from '@/types/recommendation'
import {
  getUserAnalyses,
  getUserConversations,
  type AnalysisReport,
  type ConversationSession,
} from '@/lib/google-cloud/firestore'

const ERROR_TYPES: ErrorType[] = ['grammar', 'vocabulary', 'wordOrder', 'politeness']

const ERROR_TYPE_SCENARIO_MAP: Record<ErrorType, Scenario[]> = {
  grammar: ['introduction', 'shopping', 'directions', 'hotel'],
  vocabulary: ['restaurant', 'shopping', 'convenience', 'hospital'],
  wordOrder: ['introduction', 'restaurant', 'bank', 'station'],
  politeness: ['restaurant', 'introduction', 'hotel', 'bank'],
}

interface ErrorStats {
  type: ErrorType
  count: number
  percentage: number
}

function calculateErrorStats(analyses: AnalysisReport[]): {
  weakPoints: ErrorStats[]
  strongPoints: ErrorStats[]
  totalErrors: number
} {
  const errorCounts: Record<ErrorType, number> = {
    grammar: 0,
    vocabulary: 0,
    wordOrder: 0,
    politeness: 0,
  }

  let totalErrors = 0

  for (const analysis of analyses) {
    for (const error of analysis.errors) {
      const errorType = error.type as ErrorType
      if (ERROR_TYPES.includes(errorType)) {
        errorCounts[errorType]++
        totalErrors++
      }
    }
  }

  const errorStats: ErrorStats[] = ERROR_TYPES.map((type) => ({
    type,
    count: errorCounts[type],
    percentage: totalErrors > 0 ? Math.round((errorCounts[type] / totalErrors) * 100) : 0,
  }))

  // Sort by count descending for weak points
  const sorted = [...errorStats].sort((a, b) => b.count - a.count)

  // Weak points: errors that appear more than average
  const avgCount = totalErrors / ERROR_TYPES.length
  const weakPoints = sorted.filter((e) => e.count > avgCount || e.count > 0)

  // Strong points: errors that appear less than average (including zero)
  const strongPoints = sorted
    .filter((e) => e.count <= avgCount)
    .sort((a, b) => a.count - b.count)

  return { weakPoints, strongPoints, totalErrors }
}

function calculateAverageScore(analyses: AnalysisReport[]): number {
  if (analyses.length === 0) return 0
  const total = analyses.reduce((sum, a) => sum + a.score, 0)
  return Math.round(total / analyses.length)
}

function determineRecommendedDifficulty(
  analyses: AnalysisReport[],
  currentDifficulty?: number
): number {
  if (analyses.length === 0) return currentDifficulty || 1

  const avgScore = calculateAverageScore(analyses)
  const baseDifficulty = currentDifficulty || 1

  // If scoring well (>= 80), suggest increasing difficulty
  if (avgScore >= 80 && baseDifficulty < 5) {
    return Math.min(baseDifficulty + 1, 5)
  }

  // If struggling (< 50), suggest decreasing difficulty
  if (avgScore < 50 && baseDifficulty > 1) {
    return Math.max(baseDifficulty - 1, 1)
  }

  return baseDifficulty
}

function getRecentScenarios(conversations: ConversationSession[]): Set<Scenario> {
  return new Set(conversations.map((c) => c.scenario as Scenario))
}

function generateRecommendationId(): string {
  return `rec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export function generateRecommendations(
  analyses: AnalysisReport[],
  conversations: ConversationSession[]
): Recommendation[] {
  const recommendations: Recommendation[] = []
  const { weakPoints } = calculateErrorStats(analyses)
  const recentScenarios = getRecentScenarios(conversations.slice(0, 3))

  // Get the most recent conversation's difficulty
  const lastDifficulty = conversations.length > 0 ? conversations[0].difficulty : 1
  const recommendedDifficulty = determineRecommendedDifficulty(analyses, lastDifficulty)

  // If user has weak points, recommend scenarios that focus on those areas
  if (weakPoints.length > 0) {
    const topWeakPoint = weakPoints[0]
    const targetScenarios = ERROR_TYPE_SCENARIO_MAP[topWeakPoint.type]

    // Find a scenario that targets the weak point and wasn't recently practiced
    for (const scenario of targetScenarios) {
      if (!recentScenarios.has(scenario) || recentScenarios.size >= 3) {
        recommendations.push({
          id: generateRecommendationId(),
          scenario,
          difficulty: recommendedDifficulty,
          reason: `Focus on ${topWeakPoint.type} improvement`,
          reasonKey: `dashboard.recommendations.reasons.${topWeakPoint.type}`,
          priority: 'high',
          targetWeakPoints: [topWeakPoint.type],
        })
        break
      }
    }

    // If there's a second weak point, add another recommendation
    if (weakPoints.length > 1 && weakPoints[1].count > 0) {
      const secondWeakPoint = weakPoints[1]
      const secondScenarios = ERROR_TYPE_SCENARIO_MAP[secondWeakPoint.type]

      for (const scenario of secondScenarios) {
        const existingRec = recommendations.find((r) => r.scenario === scenario)
        if (!existingRec) {
          recommendations.push({
            id: generateRecommendationId(),
            scenario,
            difficulty: recommendedDifficulty,
            reason: `Practice ${secondWeakPoint.type}`,
            reasonKey: `dashboard.recommendations.reasons.${secondWeakPoint.type}`,
            priority: 'medium',
            targetWeakPoints: [secondWeakPoint.type],
          })
          break
        }
      }
    }
  }

  // If no specific weak points or need variety, recommend a scenario not recently practiced
  if (recommendations.length === 0) {
    const allScenarios: Scenario[] = [
      'restaurant',
      'shopping',
      'introduction',
      'station',
      'hotel',
      'hospital',
      'bank',
      'convenience',
      'directions',
    ]
    for (const scenario of allScenarios) {
      if (!recentScenarios.has(scenario)) {
        recommendations.push({
          id: generateRecommendationId(),
          scenario,
          difficulty: recommendedDifficulty,
          reason: 'Try a new scenario',
          reasonKey: 'dashboard.recommendations.reasons.variety',
          priority: 'medium',
          targetWeakPoints: [],
        })
        break
      }
    }
  }

  // If still no recommendations (user has practiced everything recently), suggest revisiting
  if (recommendations.length === 0) {
    recommendations.push({
      id: generateRecommendationId(),
      scenario: 'restaurant',
      difficulty: recommendedDifficulty,
      reason: 'Continue practicing',
      reasonKey: 'dashboard.recommendations.reasons.continue',
      priority: 'low',
      targetWeakPoints: [],
    })
  }

  // Limit to 3 recommendations
  return recommendations.slice(0, 3)
}

export function calculateStats(
  analyses: AnalysisReport[],
  conversations: ConversationSession[]
): RecommendationStats {
  const { weakPoints, strongPoints } = calculateErrorStats(analyses)
  const averageScore = calculateAverageScore(analyses)

  const recentScores = analyses.slice(0, 5).map((analysis) => {
    const conversation = conversations.find((c) => c.id === analysis.conversationId)
    return {
      sessionId: analysis.conversationId,
      score: analysis.score,
      scenario: (conversation?.scenario || 'restaurant') as Scenario,
      date: analysis.createdAt,
    }
  })

  return {
    totalSessions: conversations.filter((c) => c.status === 'completed').length,
    averageScore,
    weakPoints,
    strongPoints,
    recentScores,
  }
}

export function mapConversationsToRecentSessions(
  conversations: ConversationSession[],
  analyses: AnalysisReport[]
): RecentSession[] {
  return conversations.map((conv) => {
    const analysis = analyses.find((a) => a.conversationId === conv.id)
    return {
      id: conv.id,
      scenario: conv.scenario as Scenario,
      difficulty: conv.difficulty,
      score: analysis?.score || 0,
      errorCount: analysis?.errors.length || 0,
      startedAt: conv.startedAt,
      endedAt: conv.endedAt,
      analysisId: analysis?.id || null,
    }
  })
}

export async function getRecommendationsForUser(userId: string): Promise<{
  recommendations: Recommendation[]
  stats: RecommendationStats
  recentSessions: RecentSession[]
}> {
  // Fetch last 10 analyses and conversations
  const [analyses, conversations] = await Promise.all([
    getUserAnalyses(userId, 10),
    getUserConversations(userId, 10),
  ])

  const recommendations = generateRecommendations(analyses, conversations)
  const stats = calculateStats(analyses, conversations)
  const recentSessions = mapConversationsToRecentSessions(
    conversations.filter((c) => c.status === 'completed').slice(0, 5),
    analyses
  )

  return {
    recommendations,
    stats,
    recentSessions,
  }
}
