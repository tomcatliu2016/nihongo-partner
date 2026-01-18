'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { LogOut, User, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/firebase'
import { useAuth } from '@/components/auth-provider'
import { Link } from '@/i18n/navigation'

export function UserMenu() {
  const t = useTranslations('auth')
  const router = useRouter()
  const { user, loading } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleCopyUid() {
    if (!user?.uid) return
    try {
      await navigator.clipboard.writeText(user.uid)
      setCopied(true)
      toast.success('UID 已复制')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('复制失败')
    }
  }

  async function handleSignOut() {
    try {
      await signOut()
      router.push('/login')
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error(t('errors.logoutFailed'))
    }
  }

  if (loading) {
    return (
      <div className="size-8 animate-pulse rounded-full bg-muted" />
    )
  }

  if (!user) {
    return (
      <Button variant="ghost" size="sm" asChild>
        <Link href="/login">{t('login')}</Link>
      </Button>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-primary text-primary-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={t('userMenu')}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {user.photoURL ? (
          <Image
            src={user.photoURL}
            alt={user.displayName || user.email || ''}
            width={32}
            height={32}
            className="size-full object-cover"
          />
        ) : (
          <User className="size-4" aria-hidden="true" />
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div
            className="absolute right-0 top-full z-50 mt-2 w-56 rounded-md border bg-popover p-1 shadow-lg"
            role="menu"
          >
            <div className="border-b px-3 py-2">
              <p className="text-sm font-medium">
                {user.displayName || t('user')}
              </p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
              <div className="mt-1 flex items-center gap-1">
                <code className="text-xs text-muted-foreground font-mono">
                  UID: {user.uid.slice(0, 8)}...
                </code>
                <button
                  onClick={handleCopyUid}
                  className="rounded p-0.5 hover:bg-muted"
                  title="复制完整 UID"
                >
                  {copied ? (
                    <Check className="size-3 text-green-500" />
                  ) : (
                    <Copy className="size-3 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
              role="menuitem"
            >
              <LogOut className="size-4" aria-hidden="true" />
              {t('logout')}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
