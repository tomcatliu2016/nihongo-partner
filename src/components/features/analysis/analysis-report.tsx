'use client'

import { useTranslations } from 'next-intl'
import { Lightbulb } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScoreChart } from './score-chart'
import { ErrorCard } from './error-card'
import type { AnalysisReport as AnalysisReportType } from '@/types/analysis'

interface AnalysisReportProps {
  report: AnalysisReportType
  onGenerateMaterial?: (errorIndex: number) => void
  generatingMaterialIndex?: number | null
}

export function AnalysisReport({
  report,
  onGenerateMaterial,
  generatingMaterialIndex,
}: AnalysisReportProps) {
  const t = useTranslations('analysis')

  return (
    <div className="space-y-6">
      {/* Score Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t('report.score')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <ScoreChart score={report.score} size="lg" />
          <p className="text-center text-muted-foreground">
            {report.score >= 80 && '素晴らしい！よくできました！'}
            {report.score >= 60 && report.score < 80 && 'いい調子です！'}
            {report.score < 60 && 'もう少し練習しましょう！'}
          </p>
        </CardContent>
      </Card>

      {/* Errors Section */}
      {report.errors.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{t('report.errors')}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {report.errors.map((error, index) => (
              <ErrorCard
                key={error.id || index}
                error={error}
                index={index}
                onGenerateMaterial={
                  onGenerateMaterial
                    ? () => onGenerateMaterial(index)
                    : undefined
                }
                isGenerating={generatingMaterialIndex === index}
              />
            ))}
          </div>
        </div>
      )}

      {/* Suggestions Section */}
      {report.suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              <CardTitle>{t('report.suggestions')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.suggestions.map((suggestion, index) => (
                <li key={index} className="flex gap-2">
                  <span className="text-muted-foreground">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
