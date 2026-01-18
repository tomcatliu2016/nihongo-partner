'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { sendVerificationEmail } from '@/lib/firebase'
import { useAuth } from '@/components/auth-provider'

export function EmailVerifyBanner() {
  const t = useTranslations('auth')
  const { user, isEmailVerified } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  // Only show for email users who haven't verified
  if (!user || isEmailVerified || !user.email) {
    return null
  }

  // Don't show for users who signed in with Google (they don't need verification)
  if (user.providerData[0]?.providerId === 'google.com') {
    return null
  }

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
    <div className="flex items-center justify-between gap-4 bg-yellow-100 px-4 py-2 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
      <div className="flex items-center gap-2">
        <AlertCircle className="size-4" aria-hidden="true" />
        <span className="text-sm">{t('emailNotVerified')}</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleResend}
        disabled={isLoading}
        className="text-yellow-800 hover:bg-yellow-200 dark:text-yellow-200 dark:hover:bg-yellow-900/40"
      >
        {isLoading ? t('loading') : t('resendVerification')}
      </Button>
    </div>
  )
}
