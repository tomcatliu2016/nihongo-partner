import { SpeechClient } from '@google-cloud/speech'

let speechClient: SpeechClient | null = null

function getSpeechClient(): SpeechClient {
  if (!speechClient) {
    speechClient = new SpeechClient()
  }
  return speechClient
}

export interface TranscriptionResult {
  transcript: string
  confidence: number
}

export async function transcribeAudio(
  audioContent: Buffer,
  encoding: 'LINEAR16' | 'FLAC' | 'WEBM_OPUS' | 'OGG_OPUS' = 'WEBM_OPUS',
  sampleRateHertz = 48000,
  languageCode = 'ja-JP'
): Promise<TranscriptionResult> {
  const client = getSpeechClient()

  const [response] = await client.recognize({
    audio: {
      content: audioContent.toString('base64'),
    },
    config: {
      encoding,
      sampleRateHertz,
      languageCode,
      enableAutomaticPunctuation: true,
      model: 'latest_long',
    },
  })

  const results = response.results
  if (!results || results.length === 0) {
    return { transcript: '', confidence: 0 }
  }

  const transcript = results
    .map((result) => result.alternatives?.[0]?.transcript || '')
    .join(' ')

  const confidence =
    results.reduce(
      (sum, result) => sum + (result.alternatives?.[0]?.confidence || 0),
      0
    ) / results.length

  return { transcript, confidence }
}

export async function transcribeAudioStream(
  audioStream: NodeJS.ReadableStream,
  encoding: 'LINEAR16' | 'WEBM_OPUS' | 'OGG_OPUS' = 'WEBM_OPUS',
  sampleRateHertz = 48000,
  languageCode = 'ja-JP'
): Promise<TranscriptionResult> {
  const client = getSpeechClient()

  const recognizeStream = client.streamingRecognize({
    config: {
      encoding,
      sampleRateHertz,
      languageCode,
      enableAutomaticPunctuation: true,
    },
    interimResults: false,
  })

  return new Promise((resolve, reject) => {
    let transcript = ''
    let totalConfidence = 0
    let resultCount = 0

    audioStream.pipe(recognizeStream)

    recognizeStream.on('data', (data) => {
      if (data.results?.[0]?.alternatives?.[0]) {
        const result = data.results[0].alternatives[0]
        transcript += result.transcript || ''
        totalConfidence += result.confidence || 0
        resultCount++
      }
    })

    recognizeStream.on('error', reject)

    recognizeStream.on('end', () => {
      resolve({
        transcript,
        confidence: resultCount > 0 ? totalConfidence / resultCount : 0,
      })
    })
  })
}
