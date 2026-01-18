import { TextToSpeechClient } from '@google-cloud/text-to-speech'

let ttsClient: TextToSpeechClient | null = null

function getTTSClient(): TextToSpeechClient {
  if (!ttsClient) {
    ttsClient = new TextToSpeechClient()
  }
  return ttsClient
}

export interface SynthesisResult {
  audioContent: Buffer
  audioEncoding: string
}

export type VoiceGender = 'MALE' | 'FEMALE' | 'NEUTRAL'

export interface VoiceConfig {
  languageCode?: string
  name?: string
  gender?: VoiceGender
}

const defaultVoiceConfig: VoiceConfig = {
  languageCode: 'ja-JP',
  name: 'ja-JP-Neural2-B', // Female Japanese voice
  gender: 'FEMALE',
}

export async function synthesizeSpeech(
  text: string,
  voiceConfig: VoiceConfig = {}
): Promise<SynthesisResult> {
  const client = getTTSClient()

  const config = { ...defaultVoiceConfig, ...voiceConfig }

  const [response] = await client.synthesizeSpeech({
    input: { text },
    voice: {
      languageCode: config.languageCode,
      name: config.name,
      ssmlGender: config.gender,
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: 0.9, // Slightly slower for learners
      pitch: 0,
    },
  })

  if (!response.audioContent) {
    throw new Error('No audio content in response')
  }

  return {
    audioContent: Buffer.from(response.audioContent as Uint8Array),
    audioEncoding: 'MP3',
  }
}

export async function synthesizeSpeechSSML(
  ssml: string,
  voiceConfig: VoiceConfig = {}
): Promise<SynthesisResult> {
  const client = getTTSClient()

  const config = { ...defaultVoiceConfig, ...voiceConfig }

  const [response] = await client.synthesizeSpeech({
    input: { ssml },
    voice: {
      languageCode: config.languageCode,
      name: config.name,
      ssmlGender: config.gender,
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: 0.9,
      pitch: 0,
    },
  })

  if (!response.audioContent) {
    throw new Error('No audio content in response')
  }

  return {
    audioContent: Buffer.from(response.audioContent as Uint8Array),
    audioEncoding: 'MP3',
  }
}

export async function listVoices(languageCode = 'ja-JP'): Promise<
  Array<{
    name: string
    gender: string
    languageCodes: string[]
  }>
> {
  const client = getTTSClient()

  const [response] = await client.listVoices({ languageCode })

  return (
    response.voices?.map((voice) => ({
      name: voice.name || '',
      gender: String(voice.ssmlGender || 'NEUTRAL'),
      languageCodes: voice.languageCodes || [],
    })) || []
  )
}
