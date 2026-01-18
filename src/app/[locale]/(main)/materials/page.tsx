'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { BookOpen, Calendar, Lightbulb, TrendingUp } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Link } from '@/i18n/navigation'
import { useAuth } from '@/components/auth-provider'
import type { LearningMaterial } from '@/types/material'

function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function MaterialsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function MaterialsPage() {
  const t = useTranslations('materials')
  const tAnalysis = useTranslations('analysis')
  const tPractice = useTranslations('practice')
  const { user, loading: authLoading } = useAuth()
  const [materials, setMaterials] = useState<LearningMaterial[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return

    async function fetchMaterials() {
      const userId = user?.uid || 'anonymous'

      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`/api/materials?userId=${userId}`)
        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to fetch materials')
        }

        setMaterials(result.data.materials)
      } catch (err) {
        console.error('Error fetching materials:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMaterials()
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
        <MaterialsSkeleton />
      ) : error ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-destructive">{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              {t('errorLoading')}
            </Button>
          </CardContent>
        </Card>
      ) : materials.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="mb-4 text-muted-foreground">{t('noMaterials')}</p>
            <Button asChild>
              <Link href="/practice">{tPractice('title')}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {materials.map((material) => (
            <Card
              key={material.id}
              className="transition-colors hover:bg-accent/50"
            >
              <CardContent className="py-4">
                <Link
                  href={`/materials/${material.id}`}
                  className="flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium">{material.grammarPoint}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                        {tAnalysis(`errorTypes.${material.errorType}`)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(material.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>{material.examples.length} {t('types.examples')}</p>
                    <p>{material.exercises.length} {t('types.quiz')}</p>
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
