import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'

import { transcribeAudio } from '@/lib/google-cloud/speech-to-text'
import { AppError, successResponse, errorResponse } from '@/lib/api-error'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as Blob | null

    if (!audioFile) {
      throw AppError.validation('Audio file is required')
    }

    // Convert blob to buffer
    const arrayBuffer = await audioFile.arrayBuffer()
    const audioBuffer = Buffer.from(arrayBuffer)

    // Determine encoding based on content type
    const contentType = audioFile.type
    let encoding: 'LINEAR16' | 'FLAC' | 'WEBM_OPUS' | 'OGG_OPUS' = 'WEBM_OPUS'

    if (contentType.includes('ogg')) {
      encoding = 'OGG_OPUS'
    } else if (contentType.includes('flac')) {
      encoding = 'FLAC'
    } else if (contentType.includes('wav') || contentType.includes('linear16')) {
      encoding = 'LINEAR16'
    }

    // Transcribe the audio
    const result = await transcribeAudio(audioBuffer, encoding)

    return NextResponse.json(
      successResponse({
        transcript: result.transcript,
        confidence: result.confidence,
      })
    )
  } catch (error) {
    console.error('Error transcribing audio:', error)

    if (error instanceof AppError) {
      return NextResponse.json(errorResponse(error), { status: error.statusCode })
    }

    return NextResponse.json(
      errorResponse(AppError.internal('Failed to transcribe audio')),
      { status: 500 }
    )
  }
}
