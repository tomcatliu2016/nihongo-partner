'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { FileText, Calendar, Target, TrendingUp } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Link } from '@/i18n/navigation'
import { useAuth } from '@/components/auth-provider'
import type { AnalysisReport } from '@/types/analysis'

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600 dark:text-green-400'
  if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}

function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function AnalysisSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-10 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function AnalysisPage() {
  const t = useTranslations('analysis')
  const tPractice = useTranslations('practice')
  const { user, loading: authLoading } = useAuth()
  const [analyses, setAnalyses] = useState<AnalysisReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return

    async function fetchAnalyses() {
      const userId = user?.uid || 'anonymous'

      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`/api/analysis?userId=${userId}`)
        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to fetch analyses')
        }

        setAnalyses(result.data.analyses)
      } catch (err) {
        console.error('Error fetching analyses:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalyses()
  }, [user?.uid, authLoading])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <Button asChild>
          <Link href="/practice">
            <TrendingUp className="mr-2 h-4 w-4" />
            {tPractice('title')}
          </Link>
        </Button>
      </div>

      {isLoading || authLoading ? (
        <AnalysisSkeleton />
      ) : error ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-destructive">{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              {t('retry') || 'Retry'}
            </Button>
          </CardContent>
        </Card>
      ) : analyses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="mb-4 text-muted-foreground">{t('noReports')}</p>
            <Button asChild>
              <Link href="/practice">{tPractice('title')}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {analyses.map((analysis) => (
            <Card
              key={analysis.id}
              className="transition-colors hover:bg-accent/50"
            >
              <CardContent className="py-4">
                <Link
                  href={`/analysis/${analysis.id}`}
                  className="flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {t('report.title')}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(analysis.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        {analysis.errors.length} {t('report.errorsFound') || 'errors'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-2xl font-bold ${getScoreColor(analysis.score)}`}
                    >
                      {analysis.score}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('report.score')}
                    </p>
                  </div>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
