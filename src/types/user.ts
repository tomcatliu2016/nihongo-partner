export interface User {
  id: string
  email: string
  displayName: string | null
  photoURL: string | null
  jlptLevel: number
  totalPracticeTime: number
  sessionsCompleted: number
  createdAt: Date
  updatedAt: Date
}

export interface UserProfile {
  id: string
  displayName: string | null
  photoURL: string | null
  jlptLevel: number
  learningGoals: string[]
  preferredScenarios: string[]
  dailyPracticeGoal: number // in minutes
}

export interface UserStats {
  totalSessions: number
  totalPracticeTime: number // in minutes
  averageScore: number
  strongPoints: string[]
  weakPoints: string[]
  streakDays: number
  lastPracticeDate: Date | null
}
