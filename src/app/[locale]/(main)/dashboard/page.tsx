'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Link } from '@/i18n/navigation'
import {
  RecommendationCard,
  ProgressOverview,
  RecentSessions,
} from '@/components/features/dashboard'
import { useAuth } from '@/components/auth-provider'
import type { Recommendation, RecommendationStats, RecentSession } from '@/types'

interface DashboardData {
  recommendations: Recommendation[]
  stats: RecommendationStats
  recentSessions: RecentSession[]
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Recommendation Card Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>

      {/* Grid Skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const t = useTranslations('dashboard')
  const tCommon = useTranslations('common')
  const { user, loading: authLoading } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return

    async function fetchDashboardData() {
      // Use Firebase UID or 'anonymous' for non-logged-in users
      const userId = user?.uid || 'anonymous'

      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`/api/recommendations?userId=${userId}`)
        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to fetch recommendations')
        }

        setData(result.data)
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [user?.uid, authLoading])

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">{t('title')}</h1>

      {isLoading || authLoading ? (
        <DashboardSkeleton />
      ) : error ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-destructive">{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              {tCommon('retry')}
            </Button>
          </CardContent>
        </Card>
      ) : data ? (
        <div className="space-y-6">
          {/* Recommendations Section */}
          <RecommendationCard recommendations={data.recommendations} />

          {/* Progress and Recent Sessions Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            <ProgressOverview stats={data.stats} />
            <RecentSessions sessions={data.recentSessions} />
          </div>

          {/* Quick Actions */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>{t('practice.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-muted-foreground">
                  {t('practice.description')}
                </p>
                <Button asChild>
                  <Link href="/practice">{t('practice.start')}</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('analysis.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-muted-foreground">
                  {t('analysis.description')}
                </p>
                <Button variant="outline" asChild>
                  <Link href="/analysis">{t('analysis.view')}</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('materials.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-muted-foreground">
                  {t('materials.description')}
                </p>
                <Button variant="outline" asChild>
                  <Link href="/materials">{t('materials.browse')}</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  )
}
