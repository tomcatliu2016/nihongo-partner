import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'

import { getAnalysis, createMaterial } from '@/lib/google-cloud/firestore'
import { generateLearningMaterial } from '@/lib/google-cloud/vertex-ai'
import { AppError, successResponse, errorResponse } from '@/lib/api-error'
import type { ErrorType } from '@/types/analysis'

interface GenerateRequest {
  analysisId: string
  errorIndex: number
  language?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json()

    // Validate request
    if (!body.analysisId) {
      throw AppError.validation('Analysis ID is required')
    }

    if (typeof body.errorIndex !== 'number' || body.errorIndex < 0) {
      throw AppError.validation('Valid error index is required')
    }

    // Get analysis
    const analysis = await getAnalysis(body.analysisId)
    if (!analysis) {
      throw AppError.notFound('Analysis not found')
    }

    // Get the specific error
    const error = analysis.errors[body.errorIndex]
    if (!error) {
      throw AppError.notFound('Error not found at specified index')
    }

    // Generate learning material
    const materialContent = await generateLearningMaterial(
      error.type,
      error.original,
      error.correction,
      error.explanation,
      body.language || 'zh'
    )

    // Create material in Firestore
    const material = await createMaterial({
      userId: analysis.userId,
      analysisId: body.analysisId,
      errorType: error.type as ErrorType,
      grammarPoint: materialContent.grammarPoint,
      explanation: materialContent.explanation,
      examples: materialContent.examples,
      exercises: materialContent.exercises.map((ex, index) => ({
        id: `exercise-${index}`,
        ...ex,
      })),
    })

    // Generate a temporary material ID if Firestore is not configured
    const materialId = material?.id || `temp-${Date.now()}`

    return NextResponse.json(
      successResponse({
        materialId,
        grammarPoint: material?.grammarPoint || materialContent.grammarPoint,
      }),
      { status: 201 }
    )
  } catch (error) {
    console.error('Error generating material:', error)

    if (error instanceof AppError) {
      return NextResponse.json(errorResponse(error), { status: error.statusCode })
    }

    return NextResponse.json(
      errorResponse(AppError.internal('Failed to generate material')),
      { status: 500 }
    )
  }
}
