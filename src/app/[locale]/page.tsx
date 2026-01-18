import { redirect } from 'next/navigation'

import { defaultLocale } from '@/i18n/config'

interface Props {
  params: Promise<{ locale: string }>
}

export default async function LocaleHome({ params }: Props) {
  const { locale } = await params

  // For default locale, redirect without prefix
  // For other locales, include the locale prefix
  if (locale === defaultLocale) {
    redirect('/dashboard')
  } else {
    redirect(`/${locale}/dashboard`)
  }
}
