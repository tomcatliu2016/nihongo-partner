import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'

import { getAnalysis } from '@/lib/google-cloud/firestore'
import { AppError, successResponse, errorResponse } from '@/lib/api-error'

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params

    if (!id) {
      throw AppError.validation('Analysis ID is required')
    }

    const analysis = await getAnalysis(id)

    if (!analysis) {
      throw AppError.notFound('Analysis not found')
    }

    return NextResponse.json(successResponse(analysis))
  } catch (error) {
    console.error('Error fetching analysis:', error)

    if (error instanceof AppError) {
      return NextResponse.json(errorResponse(error), { status: error.statusCode })
    }

    return NextResponse.json(
      errorResponse(AppError.internal('Failed to fetch analysis')),
      { status: 500 }
    )
  }
}
