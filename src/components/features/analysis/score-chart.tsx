'use client'

import { cn } from '@/lib/utils'

interface ScoreChartProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
}

export function ScoreChart({ score, size = 'md' }: ScoreChartProps) {
  const sizeClasses = {
    sm: 'h-20 w-20',
    md: 'h-32 w-32',
    lg: 'h-40 w-40',
  }

  const textSizeClasses = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-4xl',
  }

  const strokeWidth = {
    sm: 6,
    md: 8,
    lg: 10,
  }

  const radius = 45
  const circumference = 2 * Math.PI * radius
  const progress = ((100 - score) / 100) * circumference

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500 stroke-green-500'
    if (score >= 60) return 'text-yellow-500 stroke-yellow-500'
    return 'text-red-500 stroke-red-500'
  }

  const colorClass = getScoreColor(score)

  return (
    <div className={cn('relative', sizeClasses[size])}>
      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          className="stroke-muted"
          strokeWidth={strokeWidth[size]}
        />
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          className={cn('transition-all duration-500', colorClass)}
          strokeWidth={strokeWidth[size]}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={progress}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn('font-bold', textSizeClasses[size], colorClass)}>
          {score}
        </span>
      </div>
    </div>
  )
}
