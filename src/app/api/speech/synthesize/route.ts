import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'

import { synthesizeSpeech } from '@/lib/google-cloud/text-to-speech'
import { AppError, errorResponse } from '@/lib/api-error'

interface SynthesizeRequest {
  text: string
  voice?: {
    name?: string
    gender?: 'MALE' | 'FEMALE' | 'NEUTRAL'
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: SynthesizeRequest = await request.json()

    if (!body.text || body.text.trim().length === 0) {
      throw AppError.validation('Text is required')
    }

    if (body.text.length > 5000) {
      throw AppError.validation('Text exceeds maximum length of 5000 characters')
    }

    // Synthesize speech
    const result = await synthesizeSpeech(body.text, body.voice)

    // Return audio as binary response
    return new NextResponse(new Uint8Array(result.audioContent), {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': result.audioContent.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error synthesizing speech:', error)

    if (error instanceof AppError) {
      return NextResponse.json(errorResponse(error), { status: error.statusCode })
    }

    return NextResponse.json(
      errorResponse(AppError.internal('Failed to synthesize speech')),
      { status: 500 }
    )
  }
}
