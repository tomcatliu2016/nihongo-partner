import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'

import { getMaterial } from '@/lib/google-cloud/firestore'
import { AppError, successResponse, errorResponse } from '@/lib/api-error'

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params

    if (!id) {
      throw AppError.validation('Material ID is required')
    }

    const material = await getMaterial(id)

    if (!material) {
      throw AppError.notFound('Material not found')
    }

    return NextResponse.json(successResponse(material))
  } catch (error) {
    console.error('Error fetching material:', error)

    if (error instanceof AppError) {
      return NextResponse.json(errorResponse(error), { status: error.statusCode })
    }

    return NextResponse.json(
      errorResponse(AppError.internal('Failed to fetch material')),
      { status: 500 }
    )
  }
}
