import { create } from 'zustand'

export type MessageRole = 'user' | 'assistant' | 'system'

export interface Message {
  id: string
  role: MessageRole
  content: string
  timestamp: Date
  audioUrl?: string
}

export type Scenario = 'restaurant' | 'shopping' | 'introduction'

export interface AnalysisError {
  id: string
  type: string
  original: string
  correction: string
  explanation: string
}

export interface AnalysisResult {
  sessionId: string
  scenario: Scenario
  difficulty: number
  score: number
  errors: AnalysisError[]
  suggestions: string[]
  createdAt: Date
}

interface ConversationState {
  sessionId: string | null
  scenario: Scenario | null
  difficulty: number
  messages: Message[]
  isLoading: boolean
  isRecording: boolean
  lastAnalysis: AnalysisResult | null

  setSession: (sessionId: string, scenario: Scenario, difficulty: number) => void
  addMessage: (message: Message) => void
  setLoading: (loading: boolean) => void
  setRecording: (recording: boolean) => void
  setAnalysis: (analysis: AnalysisResult) => void
  reset: () => void
}

export const useConversationStore = create<ConversationState>((set) => ({
  sessionId: null,
  scenario: null,
  difficulty: 1,
  messages: [],
  isLoading: false,
  isRecording: false,
  lastAnalysis: null,

  setSession: (sessionId, scenario, difficulty) =>
    set({ sessionId, scenario, difficulty, messages: [] }),

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  setLoading: (isLoading) => set({ isLoading }),

  setRecording: (isRecording) => set({ isRecording }),

  setAnalysis: (analysis) => set({ lastAnalysis: analysis }),

  reset: () =>
    set({
      sessionId: null,
      scenario: null,
      difficulty: 1,
      messages: [],
      isLoading: false,
      isRecording: false,
    }),
}))
