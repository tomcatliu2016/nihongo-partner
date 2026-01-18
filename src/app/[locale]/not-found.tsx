import { getTranslations } from 'next-intl/server'
import { FileQuestion } from 'lucide-react'

import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default async function NotFound() {
  const t = await getTranslations('errors')

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
            <FileQuestion className="size-6 text-muted-foreground" aria-hidden="true" />
          </div>
          <CardTitle>{t('notFound')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t('notFoundDescription')}</p>
        </CardContent>
        <CardFooter className="justify-center">
          <Button asChild>
            <Link href="/dashboard" aria-label={t('goHome')}>
              {t('goHome')}
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
