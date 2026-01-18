import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'

import {
  getConversation,
  updateConversation,
} from '@/lib/google-cloud/firestore'
import { generateChatResponse } from '@/lib/google-cloud/vertex-ai'
import { AppError, successResponse, errorResponse } from '@/lib/api-error'
import { SCENARIO_CONFIGS, type Scenario } from '@/types/conversation'

interface MessageRequest {
  sessionId: string
  content: string
  // For temp sessions without Firestore
  scenario?: Scenario
  difficulty?: number
  history?: Array<{ role: 'user' | 'assistant'; content: string }>
}

export async function POST(request: NextRequest) {
  try {
    const body: MessageRequest = await request.json()

    // Validate request
    if (!body.sessionId) {
      throw AppError.validation('Session ID is required')
    }

    if (!body.content || body.content.trim().length === 0) {
      throw AppError.validation('Message content is required')
    }

    // Check if this is a temp session (Firestore not configured)
    const isTempSession = body.sessionId.startsWith('temp-')

    let scenario: Scenario
    let difficulty: number
    let chatHistory: Array<{ role: 'user' | 'model'; content: string }>

    if (isTempSession) {
      // For temp sessions, use data from request body
      if (!body.scenario || !body.difficulty) {
        throw AppError.validation('Scenario and difficulty required for temp sessions')
      }
      scenario = body.scenario
      difficulty = body.difficulty
      chatHistory = (body.history || []).map((msg) => ({
        role: msg.role === 'assistant' ? ('model' as const) : ('user' as const),
        content: msg.content,
      }))
    } else {
      // Get existing conversation from Firestore
      const conversation = await getConversation(body.sessionId)
      if (!conversation) {
        throw AppError.notFound('Conversation not found')
      }

      if (conversation.status !== 'active') {
        throw AppError.validation('Conversation is not active')
      }

      scenario = conversation.scenario as Scenario
      difficulty = conversation.difficulty
      chatHistory = conversation.messages.map((msg) => ({
        role: msg.role === 'assistant' ? ('model' as const) : ('user' as const),
        content: msg.content,
      }))
    }

    const scenarioConfig = SCENARIO_CONFIGS[scenario]
    if (!scenarioConfig) {
      throw AppError.internal('Invalid scenario configuration')
    }

    // Add difficulty instruction to system prompt
    const systemPrompt = `${scenarioConfig.systemPrompt}

Current difficulty level: ${difficulty}/5
Please adjust your language complexity accordingly.`

    // Generate AI response
    const aiResponse = await generateChatResponse(
      systemPrompt,
      chatHistory,
      body.content
    )

    const now = new Date()

    // Create new messages
    const userMessage = {
      role: 'user' as const,
      content: body.content,
      timestamp: now,
    }

    const assistantMessage = {
      role: 'assistant' as const,
      content: aiResponse,
      timestamp: new Date(now.getTime() + 1),
    }

    // Update conversation in Firestore (skip for temp sessions)
    if (!isTempSession) {
      // Re-fetch to get current messages for update
      const currentConversation = await getConversation(body.sessionId)
      if (currentConversation) {
        await updateConversation(body.sessionId, {
          messages: [...currentConversation.messages, userMessage, assistantMessage],
        })
      }
    }

    return NextResponse.json(
      successResponse({
        userMessage: {
          id: `msg-${now.getTime()}`,
          ...userMessage,
        },
        assistantMessage: {
          id: `msg-${now.getTime() + 1}`,
          ...assistantMessage,
        },
      })
    )
  } catch (error) {
    console.error('Error sending message:', error)

    if (error instanceof AppError) {
      return NextResponse.json(errorResponse(error), { status: error.statusCode })
    }

    return NextResponse.json(
      errorResponse(AppError.internal('Failed to send message')),
      { status: 500 }
    )
  }
}
