import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'

import { getAnalysis, createMaterial } from '@/lib/google-cloud/firestore'
import { generateLearningMaterial } from '@/lib/google-cloud/vertex-ai'
import { AppError, successResponse, errorResponse } from '@/lib/api-error'
import type { ErrorType } from '@/types/analysis'

interface GenerateRequest {
  // モード1: analysisId + errorIndex から error を取得
  analysisId?: string
  errorIndex?: number
  // モード2: error 詳細を直接渡す（local/temp モード用）
  errorType?: string
  original?: string
  correction?: string
  explanation?: string
  // 共通パラメータ
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

    // モード1: analysisId から error を取得
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
    // モード2: error 詳細を直接渡す
    else if (body.errorType && body.original && body.correction) {
      errorType = body.errorType
      original = body.original
      correction = body.correction
      explanation = body.explanation || ''
    }
    // 無効なリクエスト
    else {
      throw AppError.validation('Either analysisId+errorIndex or error details (errorType, original, correction) are required')
    }

    // 学習教材を生成
    const materialContent = await generateLearningMaterial(
      errorType,
      original,
      correction,
      explanation,
      body.language || 'zh'
    )

    // Firestore に教材を作成（analysisId がある場合のみ）
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

    // Firestore 未設定の場合、一時的な教材 ID を生成
    const materialId = material?.id || `temp-${Date.now()}`

    // モード2（analysisId なし）の場合、フロントエンド用に完全な教材コンテンツを返す
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
