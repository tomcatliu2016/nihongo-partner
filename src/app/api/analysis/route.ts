import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getUserAnalyses } from '@/lib/google-cloud/firestore'
import { AppError, successResponse, errorResponse } from '@/lib/api-error'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const limitParam = searchParams.get('limit')

    if (!userId) {
      throw AppError.validation('userId is required')
    }

    const limit = limitParam ? parseInt(limitParam, 10) : 20

    const analyses = await getUserAnalyses(userId, limit)

    return NextResponse.json(successResponse({ analyses }))
  } catch (error) {
    console.error('Error fetching analyses:', error)

    if (error instanceof AppError) {
      return NextResponse.json(errorResponse(error), { status: error.statusCode })
    }

    return NextResponse.json(
      errorResponse(AppError.internal('Failed to fetch analyses')),
      { status: 500 }
    )
  }
}
