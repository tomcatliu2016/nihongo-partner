'use client'

import { useTranslations } from 'next-intl'
import { TrendingUp, AlertTriangle, CheckCircle, BarChart3 } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScoreChart } from '@/components/features/analysis/score-chart'
import type { RecommendationStats } from '@/types/recommendation'

interface ProgressOverviewProps {
  stats: RecommendationStats
}

export function ProgressOverview({ stats }: ProgressOverviewProps) {
  const t = useTranslations('dashboard')
  const tAnalysis = useTranslations('analysis')

  const hasData = stats.totalSessions > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-500" />
          {t('progress.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <p className="text-muted-foreground">{t('progress.noData')}</p>
        ) : (
          <div className="space-y-6">
            {/* Score and Sessions Summary */}
            <div className="flex items-center gap-6">
              <ScoreChart score={stats.averageScore} size="md" />
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t('progress.averageScore')}
                  </p>
                  <p className="text-2xl font-bold">{stats.averageScore}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t('progress.totalSessions')}
                  </p>
                  <p className="text-lg font-semibold">{stats.totalSessions}</p>
                </div>
              </div>
            </div>

            {/* Weak Points */}
            {stats.weakPoints.length > 0 && stats.weakPoints[0].count > 0 && (
              <div>
                <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  {t('progress.weakPoints')}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {stats.weakPoints
                    .filter((wp) => wp.count > 0)
                    .slice(0, 3)
                    .map((wp) => (
                      <span
                        key={wp.type}
                        className="rounded-full bg-yellow-100 px-3 py-1 text-sm text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                      >
                        {tAnalysis(`errorTypes.${wp.type}`)} ({wp.percentage}%)
                      </span>
                    ))}
                </div>
              </div>
            )}

            {/* Strong Points */}
            {stats.strongPoints.length > 0 && (
              <div>
                <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  {t('progress.strongPoints')}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {stats.strongPoints.slice(0, 3).map((sp) => (
                    <span
                      key={sp.type}
                      className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    >
                      {tAnalysis(`skillTypes.${sp.type}`)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Score Trend */}
            {stats.recentScores.length > 1 && (
              <div>
                <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  {t('progress.recentTrend')}
                </h4>
                <div className="flex items-end gap-1">
                  {stats.recentScores
                    .slice()
                    .reverse()
                    .map((score, index) => (
                      <div
                        key={score.sessionId}
                        className="flex flex-col items-center"
                      >
                        <div
                          className={`w-8 rounded-t ${
                            score.score >= 80
                              ? 'bg-green-500'
                              : score.score >= 60
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                          }`}
                          style={{ height: `${Math.max(score.score * 0.6, 10)}px` }}
                        />
                        <span className="mt-1 text-xs text-muted-foreground">
                          {index + 1}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
