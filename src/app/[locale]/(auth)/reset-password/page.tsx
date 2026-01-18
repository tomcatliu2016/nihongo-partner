'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { KeyRound } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { resetPassword } from '@/lib/firebase'
import { Link } from '@/i18n/navigation'

export default function ResetPasswordPage() {
  const t = useTranslations('auth')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    try {
      await resetPassword(email)
      setIsSubmitted(true)
      toast.success(t('resetEmailSent'))
    } catch (error) {
      console.error('Failed to send reset email:', error)
      toast.error(t('errors.resetPasswordFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
          <KeyRound className="size-8 text-primary" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{t('checkEmail')}</h1>
          <p className="text-muted-foreground">
            {t('resetEmailSentDescription', { email })}
          </p>
        </div>

        <Button asChild className="w-full">
          <Link href="/login">{t('backToLogin')}</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">{t('resetPassword')}</h1>
        <p className="text-muted-foreground">{t('resetPasswordDescription')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            {t('email')}
          </label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            autoComplete="email"
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? t('loading') : t('sendResetLink')}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="text-primary hover:underline">
          {t('backToLogin')}
        </Link>
      </p>
    </div>
  )
}
