'use client'

import { useTranslations } from 'next-intl'
import { UtensilsCrossed, ShoppingBag, UserCircle } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Scenario } from '@/types/conversation'

interface ScenarioSelectorProps {
  onSelect: (scenario: Scenario, difficulty: number) => void
  isLoading?: boolean
}

const scenarioIcons = {
  restaurant: UtensilsCrossed,
  shopping: ShoppingBag,
  introduction: UserCircle,
}

const scenarios: Scenario[] = ['restaurant', 'shopping', 'introduction']

export function ScenarioSelector({
  onSelect,
  isLoading,
}: ScenarioSelectorProps) {
  const t = useTranslations('practice')

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {scenarios.map((scenario) => {
          const Icon = scenarioIcons[scenario]

          return (
            <ScenarioCard
              key={scenario}
              scenario={scenario}
              icon={Icon}
              title={t(`scenarios.${scenario}.title`)}
              description={t(`scenarios.${scenario}.description`)}
              difficultyLabel={t('difficulty.label')}
              difficultyLevels={{
                1: t('difficulty.levels.1'),
                2: t('difficulty.levels.2'),
                3: t('difficulty.levels.3'),
                4: t('difficulty.levels.4'),
                5: t('difficulty.levels.5'),
              }}
              onSelect={onSelect}
              isLoading={isLoading}
            />
          )
        })}
      </div>
    </div>
  )
}

interface ScenarioCardProps {
  scenario: Scenario
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  difficultyLabel: string
  difficultyLevels: Record<number, string>
  onSelect: (scenario: Scenario, difficulty: number) => void
  isLoading?: boolean
}

function ScenarioCard({
  scenario,
  icon: Icon,
  title,
  description,
  difficultyLabel,
  difficultyLevels,
  onSelect,
  isLoading,
}: ScenarioCardProps) {
  const handleSelect = (difficulty: string) => {
    onSelect(scenario, parseInt(difficulty, 10))
  }

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <p className="mb-4 flex-1 text-sm text-muted-foreground">
          {description}
        </p>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{difficultyLabel}:</span>
            <Select onValueChange={handleSelect} disabled={isLoading}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={difficultyLevels[1]} />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((level) => (
                  <SelectItem key={level} value={level.toString()}>
                    {level}. {difficultyLevels[level]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
