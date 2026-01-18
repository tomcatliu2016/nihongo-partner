import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import {
  getConversation,
  updateConversation,
  createAnalysis,
} from '@/lib/google-cloud/firestore'
import { analyzeConversation } from '@/lib/google-cloud/vertex-ai'
import { AppError, successResponse, errorResponse } from '@/lib/api-error'
import type { Scenario } from '@/types/conversation'

interface EndRequest {
  sessionId: string
  // For temp sessions without Firestore
  scenario?: Scenario
  difficulty?: number
  messages?: Array<{ role: 'user' | 'assistant'; content: string }>
  // User's locale for analysis language
  locale?: string
  // User ID for analysis
  userId?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: EndRequest = await request.json()

    // Validate request
    if (!body.sessionId) {
      throw AppError.validation('Session ID is required')
    }

    // Check if this is a temp session (Firestore not configured)
    const isTempSession = body.sessionId.startsWith('temp-')

    let scenario: Scenario
    let difficulty: number
    let messages: Array<{ role: 'user' | 'assistant'; content: string }>
    let userId: string = body.userId || 'anonymous'

    if (isTempSession) {
      // For temp sessions, use data from request body
      if (!body.scenario || !body.difficulty || !body.messages) {
        throw AppError.validation(
          'Scenario, difficulty, and messages required for temp sessions'
        )
      }
      scenario = body.scenario
      difficulty = body.difficulty
      messages = body.messages
    } else {
      // Get existing conversation from Firestore
      const conversation = await getConversation(body.sessionId)
      if (!conversation) {
        throw AppError.notFound('Conversation not found')
      }

      if (conversation.status !== 'active') {
        throw AppError.validation('Conversation is already ended')
      }

      // Update conversation status
      await updateConversation(body.sessionId, {
        status: 'completed',
        endedAt: new Date(),
      })

      scenario = conversation.scenario as Scenario
      difficulty = conversation.difficulty
      messages = conversation.messages.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }))
      // Use userId from conversation if available
      userId = conversation.userId || userId
    }

    // Only analyze if there are user messages
    const userMessages = messages.filter((msg) => msg.role === 'user')

    if (userMessages.length === 0) {
      return NextResponse.json(
        successResponse({
          sessionId: body.sessionId,
          analysisId: null,
          message: 'No user messages to analyze',
        })
      )
    }

    // Analyze the conversation
    const chatHistory = messages.map((msg) => ({
      role: msg.role === 'assistant' ? ('model' as const) : ('user' as const),
      content: msg.content,
    }))

    const analysisResult = await analyzeConversation(
      chatHistory,
      scenario,
      difficulty,
      body.locale || 'zh'
    )

    // Create analysis report
    const analysis = await createAnalysis({
      userId,
      conversationId: body.sessionId,
      score: analysisResult.score,
      errors: analysisResult.errors.map((err, index) => ({
        ...err,
        id: `error-${index}`,
      })),
      suggestions: analysisResult.suggestions,
    })

    if (!analysis) {
      // Firestore not configured, return full analysis result for client-side display
      return NextResponse.json(
        successResponse({
          sessionId: body.sessionId,
          analysisId: null,
          score: analysisResult.score,
          errors: analysisResult.errors.map((err, index) => ({
            ...err,
            id: `error-${index}`,
          })),
          suggestions: analysisResult.suggestions,
          scenario,
          difficulty,
        })
      )
    }

    return NextResponse.json(
      successResponse({
        sessionId: body.sessionId,
        analysisId: analysis.id,
        score: analysis.score,
        errorCount: analysis.errors.length,
      })
    )
  } catch (error) {
    console.error('Error ending conversation:', error)

    if (error instanceof AppError) {
      return NextResponse.json(errorResponse(error), { status: error.statusCode })
    }

    return NextResponse.json(
      errorResponse(AppError.internal('Failed to end conversation')),
      { status: 500 }
    )
  }
}
