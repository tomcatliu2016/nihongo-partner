'use client'

import { useEffect, useState, use } from 'react'
import { useTranslations } from 'next-intl'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { MaterialCard } from '@/components/features/materials'
import { Link } from '@/i18n/navigation'
import type { LearningMaterial } from '@/types/material'

interface PageProps {
  params: Promise<{ materialId: string }>
}

export default function MaterialDetailPage({ params }: PageProps) {
  const { materialId } = use(params)
  const t = useTranslations('materials')

  const [material, setMaterial] = useState<LearningMaterial | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchMaterial() {
      // 支持从 sessionStorage 读取 local 材料
      if (materialId === 'local') {
        try {
          const localData = sessionStorage.getItem('localMaterial')
          if (localData) {
            setMaterial(JSON.parse(localData))
          }
        } catch (error) {
          console.error('Error loading local material:', error)
          toast.error(t('errorLoading'))
        } finally {
          setIsLoading(false)
        }
        return
      }

      // 从 API 获取材料
      try {
        const response = await fetch(`/api/materials/${materialId}`)
        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error?.message || 'Failed to fetch material')
        }

        setMaterial(data.data)
      } catch (error) {
        console.error('Error fetching material:', error)
        toast.error(t('errorLoading'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchMaterial()
  }, [materialId, t])

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="mb-8 h-10 w-48" />
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (!material) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">{t('noMaterials')}</p>
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
          <Link href="/materials">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
      </div>

      <MaterialCard material={material} />
    </div>
  )
}
