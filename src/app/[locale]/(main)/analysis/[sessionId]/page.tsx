'use client'

import { useEffect, useState, use } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AnalysisReport } from '@/components/features/analysis'
import { Link } from '@/i18n/navigation'
import type { AnalysisReport as AnalysisReportType } from '@/types/analysis'

interface PageProps {
  params: Promise<{ sessionId: string }>
}

export default function AnalysisSessionPage({ params }: PageProps) {
  const { sessionId } = use(params)
  const t = useTranslations('analysis')
  const router = useRouter()
  const locale = useLocale()

  const [report, setReport] = useState<AnalysisReportType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [generatingIndex, setGeneratingIndex] = useState<number | null>(null)

  useEffect(() => {
    async function fetchReport() {
      try {
        const response = await fetch(`/api/analysis/${sessionId}`)
        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error?.message || 'Failed to fetch analysis')
        }

        setReport(data.data)
      } catch (error) {
        console.error('Error fetching analysis:', error)
        toast.error(t('errorLoading'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchReport()
  }, [sessionId, t])

  const handleGenerateMaterial = async (errorIndex: number) => {
    if (!report) return

    setGeneratingIndex(errorIndex)

    try {
      const response = await fetch('/api/materials/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisId: sessionId,
          errorIndex,
          language: locale, // 根据当前语言生成解释
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to generate material')
      }

      router.push(`/materials/${data.data.materialId}`)
    } catch (error) {
      console.error('Error generating material:', error)
      toast.error(t('errorGenerating'))
    } finally {
      setGeneratingIndex(null)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="mb-8 h-10 w-48" />
        <div className="space-y-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">{t('noReports')}</p>
        <Button asChild className="mt-4">
          <Link href="/practice">{t('startPractice')}</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/analysis">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">{t('report.title')}</h1>
      </div>

      <AnalysisReport
        report={report}
        onGenerateMaterial={handleGenerateMaterial}
        generatingMaterialIndex={generatingIndex}
      />
    </div>
  )
}
