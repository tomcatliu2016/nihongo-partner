export type ErrorType = 'grammar' | 'vocabulary' | 'wordOrder' | 'politeness'

export interface ConversationError {
  id: string
  type: ErrorType
  original: string
  correction: string
  explanation: string
}

export interface AnalysisReport {
  id: string
  userId: string
  conversationId: string
  score: number
  errors: ConversationError[]
  suggestions: string[]
  createdAt: Date
}

export interface AnalysisGenerateRequest {
  conversationId: string
}

export interface AnalysisGenerateResponse {
  analysisId: string
  score: number
  errorCount: number
}

export interface AnalysisSummary {
  id: string
  conversationId: string
  scenario: string
  score: number
  errorCount: number
  createdAt: Date
}
