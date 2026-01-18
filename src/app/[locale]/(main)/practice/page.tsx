'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

import { ScenarioSelector } from '@/components/features/conversation'
import { ChatContainer } from '@/components/features/conversation'
import { useConversationStore } from '@/stores/conversation-store'
import { useAuth } from '@/components/auth-provider'
import { useVoiceRecorder } from '@/hooks/use-voice-recorder'
import type { Message, Scenario } from '@/types/conversation'

export default function PracticePage() {
  const t = useTranslations('practice')
  const locale = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [isStarting, setIsStarting] = useState(false)
  const [autoStarted, setAutoStarted] = useState(false)

  const {
    sessionId,
    scenario,
    messages,
    isLoading,
    setSession,
    addMessage,
    setLoading,
    setAnalysis,
    reset,
  } = useConversationStore()

  const {
    isRecording,
    isProcessing,
    interimTranscript,
    startRecording,
    stopRecording,
  } = useVoiceRecorder()

  const startConversation = useCallback(async (
    selectedScenario: Scenario,
    difficulty: number
  ) => {
    setIsStarting(true)

    try {
      const response = await fetch('/api/conversation/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: selectedScenario,
          difficulty,
          userId: user?.uid || 'anonymous',
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to start conversation')
      }

      setSession(data.data.sessionId, selectedScenario, difficulty)
      addMessage(data.data.initialMessage)
    } catch (error) {
      console.error('Error starting conversation:', error)
      toast.error(t('errorStarting'))
    } finally {
      setIsStarting(false)
    }
  }, [setSession, addMessage, t, user?.uid])

  // Auto-start conversation from query params (from recommendations)
  useEffect(() => {
    const scenarioParam = searchParams.get('scenario') as Scenario | null
    const difficultyParam = searchParams.get('difficulty')

    if (scenarioParam && difficultyParam && !sessionId && !autoStarted) {
      const difficulty = parseInt(difficultyParam, 10)
      if (['restaurant', 'shopping', 'introduction'].includes(scenarioParam) && difficulty >= 1 && difficulty <= 5) {
        setAutoStarted(true)
        startConversation(scenarioParam, difficulty)
      }
    }
  }, [searchParams, sessionId, autoStarted, startConversation])

  const handleSelectScenario = async (
    selectedScenario: Scenario,
    difficulty: number
  ) => {
    await startConversation(selectedScenario, difficulty)
  }

  const handleSendMessage = async (content: string) => {
    if (!sessionId || !scenario) return

    // Add user message immediately
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    }
    addMessage(userMessage)
    setLoading(true)

    // Get current difficulty from store
    const { difficulty: currentDifficulty, messages: currentMessages } = useConversationStore.getState()

    try {
      // For temp sessions, include scenario, difficulty, and history
      const isTempSession = sessionId.startsWith('temp-')
      const requestBody: Record<string, unknown> = {
        sessionId,
        content,
      }

      if (isTempSession) {
        requestBody.scenario = scenario
        requestBody.difficulty = currentDifficulty
        requestBody.history = currentMessages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }))
      }

      const response = await fetch('/api/conversation/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to send message')
      }

      addMessage(data.data.assistantMessage)
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error(t('errorSending'))
    } finally {
      setLoading(false)
    }
  }

  const handleStartRecording = async () => {
    await startRecording()
  }

  const handleStopRecording = async () => {
    const transcript = await stopRecording()
    if (transcript) {
      await handleSendMessage(transcript)
    }
  }

  const handleBack = () => {
    reset()
  }

  const handleEndSession = async () => {
    if (!sessionId || !scenario) return

    setLoading(true)

    // Get current state for temp sessions
    const { difficulty: currentDifficulty, messages: currentMessages } =
      useConversationStore.getState()

    try {
      // For temp sessions, include conversation data
      const isTempSession = sessionId.startsWith('temp-')
      const requestBody: Record<string, unknown> = { sessionId }

      if (isTempSession) {
        requestBody.scenario = scenario
        requestBody.difficulty = currentDifficulty
        requestBody.messages = currentMessages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }))
      }

      // Always send locale for analysis language and userId
      requestBody.locale = locale
      requestBody.userId = user?.uid || 'anonymous'

      const response = await fetch('/api/conversation/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to end conversation')
      }

      // Check if we got full analysis data (when Firestore not configured)
      if (data.data.errors && data.data.suggestions) {
        // Store the analysis result locally
        setAnalysis({
          sessionId: data.data.sessionId,
          scenario: data.data.scenario,
          difficulty: data.data.difficulty,
          score: data.data.score,
          errors: data.data.errors,
          suggestions: data.data.suggestions,
          createdAt: new Date(),
        })
        reset()
        // Redirect to analysis page with local flag
        router.push('/analysis/local')
      } else if (data.data.analysisId) {
        reset()
        router.push(`/analysis/${data.data.analysisId}`)
      } else {
        reset()
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error ending session:', error)
      toast.error(t('errorEnding'))
      setLoading(false)
    }
  }

  // Show chat if session is active
  if (sessionId && scenario) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col">
        <ChatContainer
          scenario={scenario}
          messages={messages}
          onSendMessage={handleSendMessage}
          onEndSession={handleEndSession}
          onBack={handleBack}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
          isLoading={isLoading}
          isRecording={isRecording}
          isProcessing={isProcessing}
          interimTranscript={interimTranscript}
        />
      </div>
    )
  }

  // Show scenario selection
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">{t('title')}</h1>
      <p className="mb-6 text-muted-foreground">{t('selectScenario')}</p>
      <ScenarioSelector onSelect={handleSelectScenario} isLoading={isStarting} />
    </div>
  )
}
