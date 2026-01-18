'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

type Props = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: Props) {
  const t = useTranslations('errors')

  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="size-6 text-destructive" aria-hidden="true" />
          </div>
          <CardTitle>{t('serverError')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t('serverErrorDescription')}</p>
          {error.digest && (
            <p className="mt-2 text-xs text-muted-foreground">
              Error ID: {error.digest}
            </p>
          )}
        </CardContent>
        <CardFooter className="justify-center">
          <Button onClick={reset} aria-label={t('tryAgain')}>
            {t('tryAgain')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
