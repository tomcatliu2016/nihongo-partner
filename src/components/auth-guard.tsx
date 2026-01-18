'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

import { useAuth } from '@/components/auth-provider'
import { Skeleton } from '@/components/ui/skeleton'

interface AuthGuardProps {
  children: ReactNode
  requireAuth?: boolean
  requireEmailVerified?: boolean
}

export function AuthGuard({
  children,
  requireAuth = true,
  requireEmailVerified = false,
}: AuthGuardProps) {
  const router = useRouter()
  const { user, loading, isEmailVerified } = useAuth()

  useEffect(() => {
    if (loading) return

    if (requireAuth && !user) {
      router.replace('/login')
      return
    }

    if (requireEmailVerified && user && !isEmailVerified) {
      router.replace('/verify-email')
      return
    }
  }, [user, loading, isEmailVerified, requireAuth, requireEmailVerified, router])

  if (loading) {
    return (
      <div className="container py-8">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (requireAuth && !user) {
    return null
  }

  if (requireEmailVerified && user && !isEmailVerified) {
    return null
  }

  return <>{children}</>
}
