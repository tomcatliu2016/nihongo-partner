'use client'

import { useTranslations } from 'next-intl'
import { ArrowRight, Target, Sparkles, TrendingUp } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import type { Recommendation } from '@/types/recommendation'
import type { Scenario } from '@/types/conversation'

interface RecommendationCardProps {
  recommendations: Recommendation[]
}

const SCENARIO_ICONS: Record<Scenario, React.ReactNode> = {
  restaurant: '🍜',
  shopping: '🛍️',
  introduction: '👋',
  station: '🚉',
  hotel: '🏨',
  hospital: '🏥',
  bank: '🏦',
  convenience: '🏪',
  directions: '🗺️',
}

const PRIORITY_COLORS: Record<'high' | 'medium' | 'low', string> = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}

export function RecommendationCard({ recommendations }: RecommendationCardProps) {
  const t = useTranslations('dashboard')
  const tPractice = useTranslations('practice')

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            {t('recommendations.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t('recommendations.noRecommendations')}</p>
          <Button asChild className="mt-4">
            <Link href="/practice">{t('practice.start')}</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          {t('recommendations.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent/50"
          >
            <div className="flex items-center gap-4">
              <div className="text-3xl">{SCENARIO_ICONS[rec.scenario]}</div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">
                    {tPractice(`scenarios.${rec.scenario}.title`)}
                  </h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_COLORS[rec.priority]}`}
                  >
                    {t(`recommendations.priority.${rec.priority}`)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t(`recommendations.reasons.${rec.targetWeakPoints[0] || 'variety'}`)}
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <Target className="h-3 w-3" />
                  <span>
                    {tPractice('difficulty.label')}: {tPractice(`difficulty.levels.${rec.difficulty}`)}
                  </span>
                </div>
              </div>
            </div>
            <Button asChild size="sm">
              <Link href={`/practice?scenario=${rec.scenario}&difficulty=${rec.difficulty}`}>
                <TrendingUp className="mr-2 h-4 w-4" />
                {t('recommendations.start')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
