import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getRecommendationsForUser } from '@/lib/recommendations'
import { AppError, successResponse, errorResponse } from '@/lib/api-error'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      throw AppError.validation('userId is required')
    }

    const { recommendations, stats, recentSessions } =
      await getRecommendationsForUser(userId)

    return NextResponse.json(
      successResponse({
        recommendations,
        stats,
        recentSessions,
      })
    )
  } catch (error) {
    console.error('Error fetching recommendations:', error)

    if (error instanceof AppError) {
      return NextResponse.json(errorResponse(error), { status: error.statusCode })
    }

    return NextResponse.json(
      errorResponse(AppError.internal('Failed to fetch recommendations')),
      { status: 500 }
    )
  }
}
