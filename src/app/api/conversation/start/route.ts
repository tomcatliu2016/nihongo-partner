import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'

import { createConversation } from '@/lib/google-cloud/firestore'
import { AppError, successResponse, errorResponse } from '@/lib/api-error'
import type { Scenario } from '@/types/conversation'
import { SCENARIO_CONFIGS as configs } from '@/types/conversation'

interface StartRequest {
  scenario: Scenario
  difficulty: number
  userId?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: StartRequest = await request.json()

    // Validate request
    if (!body.scenario || !configs[body.scenario]) {
      throw AppError.validation('Invalid scenario')
    }

    if (!body.difficulty || body.difficulty < 1 || body.difficulty > 5) {
      throw AppError.validation('Difficulty must be between 1 and 5')
    }

    const scenarioConfig = configs[body.scenario]
    const userId = body.userId || 'anonymous'

    // Create initial message
    const initialMessage = {
      role: 'assistant' as const,
      content: scenarioConfig.initialMessage,
      timestamp: new Date(),
    }

    // Create conversation in Firestore
    const session = await createConversation({
      userId,
      scenario: body.scenario,
      difficulty: body.difficulty,
      messages: [initialMessage],
      status: 'active',
    })

    // Generate a temporary session ID if Firestore is not configured
    const sessionId = session?.id || `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

    return NextResponse.json(
      successResponse({
        sessionId,
        initialMessage: {
          id: `msg-${Date.now()}`,
          ...initialMessage,
        },
        suggestedResponses: scenarioConfig.suggestedResponses,
      }),
      { status: 201 }
    )
  } catch (error) {
    console.error('Error starting conversation:', error)

    if (error instanceof AppError) {
      return NextResponse.json(errorResponse(error), { status: error.statusCode })
    }

    return NextResponse.json(
      errorResponse(AppError.internal('Failed to start conversation')),
      { status: 500 }
    )
  }
}
