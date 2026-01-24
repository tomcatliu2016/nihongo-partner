import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'

import { getAnalysis, createMaterial } from '@/lib/google-cloud/firestore'
import { generateLearningMaterial } from '@/lib/google-cloud/vertex-ai'
import { AppError, successResponse, errorResponse } from '@/lib/api-error'
import type { ErrorType } from '@/types/analysis'

interface GenerateRequest {
  // 模式1: 通过 analysisId + errorIndex 获取 error
  analysisId?: string
  errorIndex?: number
  // 模式2: 直接传递 error 详情（用于 local/temp 模式）
  errorType?: string
  original?: string
  correction?: string
  explanation?: string
  // 通用参数
  language?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json()

    let errorType: string
    let original: string
    let correction: string
    let explanation: string
    let userId = 'anonymous'

    // 模式1: 通过 analysisId 获取 error
    if (body.analysisId && typeof body.errorIndex === 'number') {
      const analysis = await getAnalysis(body.analysisId)
      if (!analysis) {
        throw AppError.notFound('Analysis not found')
      }

      const error = analysis.errors[body.errorIndex]
      if (!error) {
        throw AppError.notFound('Error not found at specified index')
      }

      errorType = error.type
      original = error.original
      correction = error.correction
      explanation = error.explanation
      userId = analysis.userId
    }
    // 模式2: 直接传递 error 详情
    else if (body.errorType && body.original && body.correction) {
      errorType = body.errorType
      original = body.original
      correction = body.correction
      explanation = body.explanation || ''
    }
    // 无效请求
    else {
      throw AppError.validation('Either analysisId+errorIndex or error details (errorType, original, correction) are required')
    }

    // Generate learning material
    const materialContent = await generateLearningMaterial(
      errorType,
      original,
      correction,
      explanation,
      body.language || 'zh'
    )

    // Create material in Firestore (only if we have analysisId)
    let material = null
    if (body.analysisId) {
      material = await createMaterial({
        userId,
        analysisId: body.analysisId,
        errorType: errorType as ErrorType,
        grammarPoint: materialContent.grammarPoint,
        explanation: materialContent.explanation,
        examples: materialContent.examples,
        exercises: materialContent.exercises.map((ex, index) => ({
          id: `exercise-${index}`,
          ...ex,
        })),
      })
    }

    // Generate a temporary material ID if Firestore is not configured
    const materialId = material?.id || `temp-${Date.now()}`

    // 如果是模式2（无 analysisId），返回完整的材料内容供前端使用
    if (!body.analysisId) {
      return NextResponse.json(
        successResponse({
          materialId,
          material: {
            id: materialId,
            userId,
            errorType: errorType as ErrorType,
            grammarPoint: materialContent.grammarPoint,
            explanation: materialContent.explanation,
            examples: materialContent.examples,
            exercises: materialContent.exercises.map((ex, index) => ({
              id: `exercise-${index}`,
              ...ex,
            })),
            createdAt: new Date(),
          },
        }),
        { status: 201 }
      )
    }

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
