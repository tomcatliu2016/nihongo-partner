'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { MessageBubble } from './message-bubble'
import { InputArea } from './input-area'
import type { Message, Scenario } from '@/types/conversation'

interface ChatContainerProps {
  scenario: Scenario
  messages: Message[]
  onSendMessage: (content: string) => Promise<void>
  onEndSession: () => void
  onBack: () => void
  onStartRecording?: () => void
  onStopRecording?: () => void
  isLoading?: boolean
  isRecording?: boolean
  isProcessing?: boolean
  interimTranscript?: string
}

export function ChatContainer({
  scenario,
  messages,
  onSendMessage,
  onEndSession,
  onBack,
  onStartRecording,
  onStopRecording,
  isLoading,
  isRecording,
  isProcessing,
  interimTranscript,
}: ChatContainerProps) {
  const t = useTranslations('practice')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handlePlayAudio = async (message: Message) => {
    if (playingMessageId === message.id) return

    setPlayingMessageId(message.id)

    try {
      const response = await fetch('/api/speech/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message.content }),
      })

      if (!response.ok) throw new Error('Failed to synthesize speech')

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)

      audio.onended = () => {
        setPlayingMessageId(null)
        URL.revokeObjectURL(audioUrl)
      }

      audio.onerror = () => {
        setPlayingMessageId(null)
        URL.revokeObjectURL(audioUrl)
      }

      await audio.play()
    } catch (error) {
      console.error('Error playing audio:', error)
      setPlayingMessageId(null)
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            disabled={isLoading}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="font-semibold">{t(`scenarios.${scenario}.title`)}</h2>
            <p className="text-sm text-muted-foreground">
              {t(`scenarios.${scenario}.description`)}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={onEndSession} disabled={isLoading}>
          {t('endSession')}
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onPlayAudio={
                message.role === 'assistant'
                  ? () => handlePlayAudio(message)
                  : undefined
              }
              isPlaying={playingMessageId === message.id}
            />
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-muted px-4 py-2">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-foreground/50 [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-foreground/50 [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-foreground/50" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <InputArea
        onSend={onSendMessage}
        onStartRecording={onStartRecording}
        onStopRecording={onStopRecording}
        isLoading={isLoading}
        isRecording={isRecording}
        isProcessing={isProcessing}
        interimTranscript={interimTranscript}
      />
    </div>
  )
}
