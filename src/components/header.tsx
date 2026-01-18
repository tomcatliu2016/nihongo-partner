'use client'

import { useTranslations } from 'next-intl'
import { BookOpen } from 'lucide-react'

import { Link, usePathname } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageSelector } from '@/components/language-selector'
import { MobileNav } from '@/components/mobile-nav'
import { UserMenu } from '@/components/features/auth'

const navItems = [
  { href: '/dashboard', labelKey: 'dashboard' },
  { href: '/practice', labelKey: 'practice' },
  { href: '/analysis', labelKey: 'analysis' },
  { href: '/materials', labelKey: 'materials' },
] as const

export function Header() {
  const t = useTranslations('common')
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link
          href="/dashboard"
          className="mr-6 flex items-center gap-2 font-semibold"
          aria-label={t('appName')}
        >
          <BookOpen className="size-5 text-primary" />
          <span className="hidden sm:inline-block">{t('appName')}</span>
        </Link>

        <nav
          className="hidden flex-1 md:flex"
          role="navigation"
          aria-label={t('nav.openMenu')}
        >
          <ul className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {t(`nav.${item.labelKey}`)}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="flex flex-1 items-center justify-end gap-2">
          <LanguageSelector />
          <ThemeToggle />
          <UserMenu />
          <MobileNav />
        </div>
      </div>
    </header>
  )
}
