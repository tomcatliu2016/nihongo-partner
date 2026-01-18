'use client'

import { useTranslations } from 'next-intl'
import { AlertCircle, ChevronRight } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { ConversationError } from '@/types/analysis'

interface ErrorCardProps {
  error: ConversationError
  index: number
  onGenerateMaterial?: () => void
  isGenerating?: boolean
}

export function ErrorCard({
  error,
  index,
  onGenerateMaterial,
  isGenerating,
}: ErrorCardProps) {
  const t = useTranslations('analysis')

  const errorTypeLabel = t(`errorTypes.${error.type}`)

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <CardTitle className="text-base">
            #{index + 1} {errorTypeLabel}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="rounded-md bg-destructive/10 p-2">
            <p className="text-sm line-through">{error.original}</p>
          </div>
          <div className="rounded-md bg-green-500/10 p-2">
            <p className="text-sm font-medium">{error.correction}</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">{error.explanation}</p>

        {onGenerateMaterial && (
          <Button
            variant="outline"
            size="sm"
            onClick={onGenerateMaterial}
            disabled={isGenerating}
            className="w-full"
          >
            {t('report.generateMaterial')}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
