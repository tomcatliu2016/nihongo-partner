import type { ErrorType } from './analysis'

export interface Exercise {
  id: string
  question: string
  options: string[]
  correctIndex: number
}

export interface LearningMaterial {
  id: string
  userId: string
  analysisId: string
  errorType: ErrorType
  grammarPoint: string
  explanation: string
  examples: string[]
  exercises: Exercise[]
  createdAt: Date
}

export interface MaterialGenerateRequest {
  analysisId: string
  errorId: string
}

export interface MaterialGenerateResponse {
  materialId: string
  grammarPoint: string
}

export interface MaterialSummary {
  id: string
  errorType: ErrorType
  grammarPoint: string
  createdAt: Date
}

export interface ExerciseResult {
  exerciseId: string
  selectedIndex: number
  isCorrect: boolean
}

export interface MaterialProgress {
  materialId: string
  completed: boolean
  exerciseResults: ExerciseResult[]
  completedAt: Date | null
}
