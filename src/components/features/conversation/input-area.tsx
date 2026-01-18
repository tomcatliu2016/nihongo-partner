'use client'

import { useState } from 'react'
import { Send, Mic, Square, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface InputAreaProps {
  onSend: (message: string) => void
  onStartRecording?: () => void
  onStopRecording?: () => void
  isLoading?: boolean
  isRecording?: boolean
  isProcessing?: boolean
  interimTranscript?: string
  disabled?: boolean
}

export function InputArea({
  onSend,
  onStartRecording,
  onStopRecording,
  isLoading,
  isRecording,
  isProcessing,
  interimTranscript,
  disabled,
}: InputAreaProps) {
  const t = useTranslations('practice.input')
  const [message, setMessage] = useState('')

  // Show interim transcript while recording
  const displayValue = isRecording && interimTranscript ? interimTranscript : message
  const placeholderText = isProcessing ? t('processing') : isRecording ? t('stop') : t('placeholder')

  const handleSend = () => {
    if (message.trim() && !isLoading && !disabled) {
      onSend(message.trim())
      setMessage('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleRecordingToggle = () => {
    if (isRecording) {
      onStopRecording?.()
    } else {
      onStartRecording?.()
    }
  }

  return (
    <div className="flex gap-2 border-t bg-background p-4">
      <Textarea
        value={displayValue}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholderText}
        disabled={isLoading || isRecording || isProcessing || disabled}
        readOnly={isRecording}
        className="min-h-[44px] max-h-32 resize-none"
        rows={1}
      />

      {onStartRecording && (
        <Button
          variant={isRecording ? 'destructive' : 'outline'}
          size="icon"
          onClick={handleRecordingToggle}
          disabled={isLoading || disabled}
          title={isRecording ? t('stop') : t('voice')}
          className={isRecording ? 'animate-pulse' : ''}
        >
          {isRecording ? (
            <Square className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </Button>
      )}

      <Button
        size="icon"
        onClick={handleSend}
        disabled={!message.trim() || isLoading || isRecording || disabled}
        title={t('send')}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}
