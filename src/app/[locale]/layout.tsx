import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'

import { locales } from '@/i18n/config'
import { routing } from '@/i18n/routing'
import { Toaster } from '@/components/ui/sonner'
import { QueryProvider } from '@/lib/query-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/components/auth-provider'
import { LocaleSetter } from '@/components/locale-setter'

type Props = {
  children: ReactNode
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound()
  }

  setRequestLocale(locale)
  const messages = await getMessages()

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryProvider>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <LocaleSetter />
            {children}
            <Toaster />
          </AuthProvider>
        </NextIntlClientProvider>
      </QueryProvider>
    </ThemeProvider>
  )
}
