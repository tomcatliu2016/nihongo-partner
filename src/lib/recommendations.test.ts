import { describe, it, expect, vi } from 'vitest'
import {
  generateRecommendations,
  calculateStats,
  mapConversationsToRecentSessions,
} from './recommendations'
import type { AnalysisReport, ConversationSession } from '@/lib/google-cloud/firestore'

// Mock the firestore module
vi.mock('@/lib/google-cloud/firestore', () => ({
  getUserAnalyses: vi.fn(),
  getUserConversations: vi.fn(),
}))

// Helper to create mock analysis reports
function createMockAnalysis(overrides: Partial<AnalysisReport> = {}): AnalysisReport {
  return {
    id: `analysis-${Math.random().toString(36).slice(2)}`,
    conversationId: `conv-${Math.random().toString(36).slice(2)}`,
    userId: 'user-1',
    score: 75,
    errors: [],
    suggestions: [],
    createdAt: new Date(),
    ...overrides,
  }
}

// Helper to create mock conversation sessions
function createMockConversation(overrides: Partial<ConversationSession> = {}): ConversationSession {
  return {
    id: `conv-${Math.random().toString(36).slice(2)}`,
    userId: 'user-1',
    scenario: 'restaurant',
    difficulty: 2,
    status: 'completed',
    messages: [],
    startedAt: new Date(),
    endedAt: new Date(),
    ...overrides,
  }
}

describe('generateRecommendations', () => {
  it('returns recommendations based on weak points', () => {
    const analyses: AnalysisReport[] = [
      createMockAnalysis({
        errors: [
          { type: 'grammar', original: 'test', correction: 'test', explanation: 'test' },
          { type: 'grammar', original: 'test', correction: 'test', explanation: 'test' },
          { type: 'vocabulary', original: 'test', correction: 'test', explanation: 'test' },
        ],
      }),
    ]
    const conversations: ConversationSession[] = [
      createMockConversation({ scenario: 'restaurant' }),
    ]

    const recommendations = generateRecommendations(analyses, conversations)

    expect(recommendations.length).toBeGreaterThan(0)
    expect(recommendations[0].priority).toBe('high')
    expect(recommendations[0].targetWeakPoints).toContain('grammar')
  })

  it('recommends new scenarios when no weak points', () => {
    const analyses: AnalysisReport[] = []
    const conversations: ConversationSession[] = [
      createMockConversation({ scenario: 'restaurant' }),
    ]

    const recommendations = generateRecommendations(analyses, conversations)

    expect(recommendations.length).toBeGreaterThan(0)
    // Should recommend a scenario not recently practiced
    expect(recommendations[0].scenario).not.toBe('restaurant')
  })

  it('suggests difficulty increase for high scores', () => {
    const analyses: AnalysisReport[] = [
      createMockAnalysis({ score: 90 }),
      createMockAnalysis({ score: 85 }),
    ]
    const conversations: ConversationSession[] = [
      createMockConversation({ difficulty: 2 }),
      createMockConversation({ difficulty: 2 }),
    ]

    const recommendations = generateRecommendations(analyses, conversations)

    expect(recommendations[0].difficulty).toBe(3)
  })

  it('suggests difficulty decrease for low scores', () => {
    const analyses: AnalysisReport[] = [
      createMockAnalysis({ score: 40 }),
      createMockAnalysis({ score: 35 }),
    ]
    const conversations: ConversationSession[] = [
      createMockConversation({ difficulty: 3 }),
      createMockConversation({ difficulty: 3 }),
    ]

    const recommendations = generateRecommendations(analyses, conversations)

    expect(recommendations[0].difficulty).toBe(2)
  })

  it('limits recommendations to 3', () => {
    const analyses: AnalysisReport[] = [
      createMockAnalysis({
        errors: [
          { type: 'grammar', original: 'test', correction: 'test', explanation: 'test' },
          { type: 'vocabulary', original: 'test', correction: 'test', explanation: 'test' },
          { type: 'wordOrder', original: 'test', correction: 'test', explanation: 'test' },
          { type: 'politeness', original: 'test', correction: 'test', explanation: 'test' },
        ],
      }),
    ]
    const conversations: ConversationSession[] = []

    const recommendations = generateRecommendations(analyses, conversations)

    expect(recommendations.length).toBeLessThanOrEqual(3)
  })

  it('recommends unpracticed scenario when some scenarios recently practiced', () => {
    // The function only tracks the first 3 conversations as "recent"
    // With 9 total scenarios, there will always be unpracticed scenarios to recommend
    const analyses: AnalysisReport[] = []
    const conversations: ConversationSession[] = [
      createMockConversation({ scenario: 'restaurant' }),
      createMockConversation({ scenario: 'shopping' }),
      createMockConversation({ scenario: 'introduction' }),
    ]

    const recommendations = generateRecommendations(analyses, conversations)

    expect(recommendations.length).toBeGreaterThan(0)
    // Should recommend an unpracticed scenario (one of the 6 new ones)
    expect(recommendations[0].reasonKey).toBe('dashboard.recommendations.reasons.variety')
    expect(['station', 'hotel', 'hospital', 'bank', 'convenience', 'directions']).toContain(
      recommendations[0].scenario
    )
  })
})

describe('calculateStats', () => {
  it('calculates average score correctly', () => {
    const analyses: AnalysisReport[] = [
      createMockAnalysis({ score: 80 }),
      createMockAnalysis({ score: 70 }),
      createMockAnalysis({ score: 90 }),
    ]
    const conversations: ConversationSession[] = [
      createMockConversation(),
      createMockConversation(),
      createMockConversation(),
    ]

    const stats = calculateStats(analyses, conversations)

    expect(stats.averageScore).toBe(80)
  })

  it('counts completed sessions', () => {
    const analyses: AnalysisReport[] = []
    const conversations: ConversationSession[] = [
      createMockConversation({ status: 'completed' }),
      createMockConversation({ status: 'completed' }),
      createMockConversation({ status: 'active' }),
    ]

    const stats = calculateStats(analyses, conversations)

    expect(stats.totalSessions).toBe(2)
  })

  it('identifies weak points from errors', () => {
    const analyses: AnalysisReport[] = [
      createMockAnalysis({
        errors: [
          { type: 'grammar', original: 'test', correction: 'test', explanation: 'test' },
          { type: 'grammar', original: 'test', correction: 'test', explanation: 'test' },
          { type: 'grammar', original: 'test', correction: 'test', explanation: 'test' },
        ],
      }),
    ]
    const conversations: ConversationSession[] = []

    const stats = calculateStats(analyses, conversations)

    expect(stats.weakPoints.length).toBeGreaterThan(0)
    expect(stats.weakPoints[0].type).toBe('grammar')
    expect(stats.weakPoints[0].count).toBe(3)
  })

  it('handles empty analyses', () => {
    const stats = calculateStats([], [])

    expect(stats.averageScore).toBe(0)
    expect(stats.totalSessions).toBe(0)
    expect(stats.recentScores).toEqual([])
  })
})

describe('mapConversationsToRecentSessions', () => {
  it('maps conversations with matching analyses', () => {
    const convId = 'conv-1'
    const conversations: ConversationSession[] = [
      createMockConversation({
        id: convId,
        scenario: 'restaurant',
        difficulty: 3,
      }),
    ]
    const analyses: AnalysisReport[] = [
      createMockAnalysis({
        id: 'analysis-1',
        conversationId: convId,
        score: 85,
        errors: [
          { type: 'grammar', original: 'test', correction: 'test', explanation: 'test' },
        ],
      }),
    ]

    const sessions = mapConversationsToRecentSessions(conversations, analyses)

    expect(sessions[0].id).toBe(convId)
    expect(sessions[0].score).toBe(85)
    expect(sessions[0].errorCount).toBe(1)
    expect(sessions[0].analysisId).toBe('analysis-1')
  })

  it('handles conversations without analyses', () => {
    const conversations: ConversationSession[] = [
      createMockConversation({ id: 'conv-1' }),
    ]

    const sessions = mapConversationsToRecentSessions(conversations, [])

    expect(sessions[0].score).toBe(0)
    expect(sessions[0].errorCount).toBe(0)
    expect(sessions[0].analysisId).toBeNull()
  })
})
