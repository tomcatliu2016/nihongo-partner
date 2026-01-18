'use client'

import { Volume2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { Message } from '@/types/conversation'

interface MessageBubbleProps {
  message: Message
  onPlayAudio?: () => void
  isPlaying?: boolean
}

export function MessageBubble({
  message,
  onPlayAudio,
  isPlaying,
}: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div
      className={cn(
        'flex w-full gap-2',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground'
        )}
      >
        <p className="whitespace-pre-wrap text-sm">{message.content}</p>

        {!isUser && onPlayAudio && (
          <div className="mt-2 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={onPlayAudio}
              disabled={isPlaying}
              className="h-6 w-6 p-0"
            >
              <Volume2
                className={cn('h-4 w-4', isPlaying && 'animate-pulse')}
              />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
