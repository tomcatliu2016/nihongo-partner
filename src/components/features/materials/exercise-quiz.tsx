'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { CheckCircle, XCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { Exercise } from '@/types/material'

interface ExerciseQuizProps {
  title: string
  exercises: Exercise[]
}

export function ExerciseQuiz({ title, exercises }: ExerciseQuizProps) {
  const t = useTranslations('materials.exercise')
  const [answers, setAnswers] = useState<Record<string, number | null>>({})
  const [showResults, setShowResults] = useState<Record<string, boolean>>({})

  const handleSelectAnswer = (exerciseId: string, optionIndex: number) => {
    if (showResults[exerciseId]) return

    setAnswers((prev) => ({
      ...prev,
      [exerciseId]: optionIndex,
    }))
  }

  const handleCheckAnswer = (exerciseId: string) => {
    setShowResults((prev) => ({
      ...prev,
      [exerciseId]: true,
    }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {exercises.map((exercise, index) => {
          const selectedAnswer = answers[exercise.id]
          const showResult = showResults[exercise.id]
          const isCorrect = selectedAnswer === exercise.correctIndex

          return (
            <div key={exercise.id} className="space-y-3">
              <p className="font-medium">
                {index + 1}. {exercise.question}
              </p>

              <div className="grid gap-2">
                {exercise.options.map((option, optionIndex) => {
                  const isSelected = selectedAnswer === optionIndex
                  const isCorrectOption = optionIndex === exercise.correctIndex

                  return (
                    <button
                      key={optionIndex}
                      onClick={() =>
                        handleSelectAnswer(exercise.id, optionIndex)
                      }
                      disabled={showResult}
                      className={cn(
                        'flex items-center gap-2 rounded-md border p-3 text-left transition-colors',
                        isSelected && !showResult && 'border-primary bg-primary/5',
                        showResult && isCorrectOption && 'border-green-500 bg-green-500/10',
                        showResult && isSelected && !isCorrect && 'border-red-500 bg-red-500/10',
                        !showResult && !isSelected && 'hover:bg-muted'
                      )}
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full border text-sm">
                        {String.fromCharCode(65 + optionIndex)}
                      </span>
                      <span className="flex-1">{option}</span>
                      {showResult && isCorrectOption && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      {showResult && isSelected && !isCorrect && (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </button>
                  )
                })}
              </div>

              {selectedAnswer !== null && !showResult && (
                <Button
                  size="sm"
                  onClick={() => handleCheckAnswer(exercise.id)}
                >
                  {t('check')}
                </Button>
              )}

              {showResult && (
                <p
                  className={cn(
                    'text-sm font-medium',
                    isCorrect ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {isCorrect ? t('correct') : t('incorrect')}
                </p>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
