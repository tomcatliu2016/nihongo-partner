'use client'

import { useTranslations } from 'next-intl'
import { Clock, FileText, AlertCircle } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import type { RecentSession } from '@/types/recommendation'
import type { Scenario } from '@/types/conversation'

interface RecentSessionsProps {
  sessions: RecentSession[]
}

const SCENARIO_ICONS: Record<Scenario, string> = {
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

function formatDate(date: Date | string): string {
  const now = new Date()
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const diff = now.getTime() - dateObj.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60))
      return `${minutes}m ago`
    }
    return `${hours}h ago`
  }
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return dateObj.toLocaleDateString()
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600 dark:text-green-400'
  if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}

export function RecentSessions({ sessions }: RecentSessionsProps) {
  const t = useTranslations('dashboard')
  const tPractice = useTranslations('practice')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-purple-500" />
          {t('recentSessions.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <div className="text-center">
            <p className="text-muted-foreground">{t('recentSessions.noSessions')}</p>
            <Button asChild className="mt-4">
              <Link href="/practice">{t('practice.start')}</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent/50"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{SCENARIO_ICONS[session.scenario]}</div>
                  <div>
                    <h4 className="font-medium">
                      {tPractice(`scenarios.${session.scenario}.title`)}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>
                        {tPractice('difficulty.label')}:{' '}
                        {tPractice(`difficulty.levels.${session.difficulty}`)}
                      </span>
                      <span>•</span>
                      <span>{formatDate(session.startedAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className={`text-lg font-bold ${getScoreColor(session.score)}`}>
                      {session.score}%
                    </p>
                    {session.errorCount > 0 && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <AlertCircle className="h-3 w-3" />
                        {session.errorCount} {t('recentSessions.errors')}
                      </p>
                    )}
                  </div>
                  {session.analysisId && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/analysis/${session.analysisId}`}>
                        <FileText className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
