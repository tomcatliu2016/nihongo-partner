'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Mail } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { sendVerificationEmail } from '@/lib/firebase'
import { useAuth } from '@/components/auth-provider'
import { Link } from '@/i18n/navigation'

export default function VerifyEmailPage() {
  const t = useTranslations('auth')
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  async function handleResend() {
    setIsLoading(true)
    try {
      await sendVerificationEmail()
      toast.success(t('verifyEmailSent'))
    } catch (error) {
      console.error('Failed to send verification email:', error)
      toast.error(t('errors.verifyEmailFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm space-y-6 text-center">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
        <Mail className="size-8 text-primary" aria-hidden="true" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold">{t('verifyEmail')}</h1>
        <p className="text-muted-foreground">
          {t('verifyEmailDescription', { email: user?.email || '' })}
        </p>
      </div>

      <div className="space-y-4">
        <Button
          onClick={handleResend}
          disabled={isLoading}
          variant="outline"
          className="w-full"
        >
          {isLoading ? t('loading') : t('resendVerification')}
        </Button>

        <Button asChild className="w-full">
          <Link href="/login">{t('backToLogin')}</Link>
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">{t('verifyEmailHint')}</p>
    </div>
  )
}
