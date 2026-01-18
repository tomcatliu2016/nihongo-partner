'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

// Type declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: Event & { error: string }) => void) | null
  onend: (() => void) | null
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition
    webkitSpeechRecognition?: new () => SpeechRecognition
  }
}

interface UseVoiceRecorderReturn {
  isRecording: boolean
  isProcessing: boolean
  interimTranscript: string
  error: string | null
  startRecording: () => Promise<void>
  stopRecording: () => Promise<string | null>
}

export function useVoiceRecorder(): UseVoiceRecorderReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const finalTranscriptRef = useRef('')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const useFallbackRef = useRef(false)

  // Check if Web Speech API is available
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    useFallbackRef.current = !SpeechRecognition
  }, [])

  const startRecording = useCallback(async () => {
    setError(null)
    setInterimTranscript('')
    finalTranscriptRef.current = ''

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (SpeechRecognition) {
      // Use Web Speech API for real-time transcription
      const recognition = new SpeechRecognition()
      recognitionRef.current = recognition

      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'ja-JP'

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = ''
        let final = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          if (result.isFinal) {
            final += result[0].transcript
          } else {
            interim += result[0].transcript
          }
        }

        if (final) {
          finalTranscriptRef.current += final
        }
        setInterimTranscript(finalTranscriptRef.current + interim)
      }

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        if (event.error !== 'no-speech') {
          setError(event.error)
        }
      }

      recognition.onend = () => {
        // Recognition ended, but we don't set isRecording false here
        // because user might not have clicked stop yet
      }

      try {
        recognition.start()
        setIsRecording(true)
      } catch (err) {
        console.error('Error starting speech recognition:', err)
        setError(err instanceof Error ? err.message : 'Failed to start speech recognition')
      }
    } else {
      // Fallback to MediaRecorder + server transcription
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        streamRef.current = stream

        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
            ? 'audio/ogg;codecs=opus'
            : 'audio/webm'

        const mediaRecorder = new MediaRecorder(stream, { mimeType })
        mediaRecorderRef.current = mediaRecorder
        audioChunksRef.current = []

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data)
          }
        }

        mediaRecorder.start()
        setIsRecording(true)
      } catch (err) {
        console.error('Error starting recording:', err)
        setError(err instanceof Error ? err.message : 'Failed to access microphone')
      }
    }
  }, [])

  const stopRecording = useCallback(async (): Promise<string | null> => {
    setIsRecording(false)

    // Stop Web Speech API if active
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      const transcript = finalTranscriptRef.current || interimTranscript
      recognitionRef.current = null
      setInterimTranscript('')
      return transcript || null
    }

    // Stop MediaRecorder fallback if active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      return new Promise((resolve) => {
        const mediaRecorder = mediaRecorderRef.current!

        mediaRecorder.onstop = async () => {
          setIsProcessing(true)

          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop())
            streamRef.current = null
          }

          try {
            const audioBlob = new Blob(audioChunksRef.current, {
              type: mediaRecorder.mimeType,
            })

            const formData = new FormData()
            formData.append('audio', audioBlob, 'recording.webm')

            const response = await fetch('/api/speech/transcribe', {
              method: 'POST',
              body: formData,
            })

            const data = await response.json()

            if (!data.success) {
              throw new Error(data.error?.message || 'Transcription failed')
            }

            setIsProcessing(false)
            resolve(data.data.transcript)
          } catch (err) {
            console.error('Error processing audio:', err)
            setError(err instanceof Error ? err.message : 'Failed to transcribe audio')
            setIsProcessing(false)
            resolve(null)
          }
        }

        mediaRecorder.stop()
      })
    }

    return null
  }, [interimTranscript])

  return {
    isRecording,
    isProcessing,
    interimTranscript,
    error,
    startRecording,
    stopRecording,
  }
}
