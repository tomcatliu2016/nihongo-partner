'use client'

import { Volume2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ExampleListProps {
  title: string
  examples: string[]
}

export function ExampleList({ title, examples }: ExampleListProps) {
  const [playingIndex, setPlayingIndex] = useState<number | null>(null)

  const handlePlayAudio = async (text: string, index: number) => {
    if (playingIndex === index) return

    setPlayingIndex(index)

    try {
      const response = await fetch('/api/speech/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) throw new Error('Failed to synthesize speech')

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)

      audio.onended = () => {
        setPlayingIndex(null)
        URL.revokeObjectURL(audioUrl)
      }

      audio.onerror = () => {
        setPlayingIndex(null)
        URL.revokeObjectURL(audioUrl)
      }

      await audio.play()
    } catch (error) {
      console.error('Error playing audio:', error)
      setPlayingIndex(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {examples.map((example, index) => (
            <li
              key={index}
              className="flex items-center justify-between rounded-md bg-muted p-3"
            >
              <span className="flex-1">{example}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handlePlayAudio(example, index)}
                disabled={playingIndex === index}
                className="ml-2"
              >
                <Volume2
                  className={`h-4 w-4 ${
                    playingIndex === index ? 'animate-pulse' : ''
                  }`}
                />
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
