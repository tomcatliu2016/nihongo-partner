import type { ReactNode } from 'react'
import { getTranslations } from 'next-intl/server'

import { Link } from '@/i18n/navigation'
import { BookOpen } from 'lucide-react'

type Props = {
  children: ReactNode
}

export default async function AuthLayout({ children }: Props) {
  const t = await getTranslations('common')

  return (
    <div className="flex min-h-screen flex-col">
      <div className="container flex h-14 items-center">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-semibold"
          aria-label={t('appName')}
        >
          <BookOpen className="size-5 text-primary" />
          <span>{t('appName')}</span>
        </Link>
      </div>
      <main className="flex flex-1 items-center justify-center px-4">
        {children}
      </main>
    </div>
  )
}
