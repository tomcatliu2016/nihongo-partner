import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { LoginForm } from '@/components/features/auth'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth')
  return {
    title: t('login'),
  }
}

export default function LoginPage() {
  return <LoginForm />
}
