'use client'

import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { AnalysisReport } from '@/components/features/analysis'
import { Link } from '@/i18n/navigation'
import { useConversationStore } from '@/stores/conversation-store'
import type { AnalysisReport as AnalysisReportType } from '@/types/analysis'

export default function LocalAnalysisPage() {
  const t = useTranslations('analysis')
  const tPractice = useTranslations('practice')
  const router = useRouter()
  const locale = useLocale()

  const { lastAnalysis } = useConversationStore()
  const [report, setReport] = useState<AnalysisReportType | null>(null)
  const [generatingIndex, setGeneratingIndex] = useState<number | null>(null)

  useEffect(() => {
    if (lastAnalysis) {
      // Convert store analysis to report format
      setReport({
        id: 'local',
        userId: 'anonymous',
        conversationId: lastAnalysis.sessionId,
        score: lastAnalysis.score,
        errors: lastAnalysis.errors,
        suggestions: lastAnalysis.suggestions,
        createdAt: lastAnalysis.createdAt,
      })
    }
  }, [lastAnalysis])

  const handleGenerateMaterial = async (errorIndex: number) => {
    if (!report || !lastAnalysis) return

    setGeneratingIndex(errorIndex)

    const error = lastAnalysis.errors[errorIndex]

    try {
      const response = await fetch('/api/materials/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Pass error details directly for temp generation
          errorType: error.type,
          original: error.original,
          correction: error.correction,
          explanation: error.explanation,
          language: locale, // 根据当前语言生成解释
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to generate material')
      }

      if (data.data.materialId) {
        router.push(`/materials/${data.data.materialId}`)
      } else if (data.data.material) {
        // Store material locally and navigate
        sessionStorage.setItem('localMaterial', JSON.stringify(data.data.material))
        router.push('/materials/local')
      }
    } catch (error) {
      console.error('Error generating material:', error)
      toast.error(t('errorGenerating'))
    } finally {
      setGeneratingIndex(null)
    }
  }

  if (!report) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">{t('noReports')}</p>
        <Button asChild className="mt-4">
          <Link href="/practice">{tPractice('title')}</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard">
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
