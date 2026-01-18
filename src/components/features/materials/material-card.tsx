'use client'

import { useTranslations } from 'next-intl'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ExampleList } from './example-list'
import { ExerciseQuiz } from './exercise-quiz'
import type { LearningMaterial } from '@/types/material'

interface MaterialCardProps {
  material: LearningMaterial
}

export function MaterialCard({ material }: MaterialCardProps) {
  const t = useTranslations('materials')

  return (
    <div className="space-y-6">
      {/* Grammar Point */}
      <Card>
        <CardHeader>
          <CardTitle>{material.grammarPoint}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-muted-foreground">
            {material.explanation}
          </p>
        </CardContent>
      </Card>

      {/* Examples */}
      {material.examples.length > 0 && (
        <ExampleList title={t('types.examples')} examples={material.examples} />
      )}

      {/* Exercises */}
      {material.exercises.length > 0 && (
        <ExerciseQuiz title={t('types.quiz')} exercises={material.exercises} />
      )}
    </div>
  )
}
