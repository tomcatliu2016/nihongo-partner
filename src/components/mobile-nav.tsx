'use client'

import * as React from 'react'
import { Menu, X } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Link, usePathname } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', labelKey: 'dashboard' },
  { href: '/practice', labelKey: 'practice' },
  { href: '/analysis', labelKey: 'analysis' },
  { href: '/materials', labelKey: 'materials' },
] as const

export function MobileNav() {
  const t = useTranslations('common')
  const pathname = usePathname()
  const [isOpen, setIsOpen] = React.useState(false)

  const toggleMenu = () => setIsOpen(!isOpen)
  const closeMenu = () => setIsOpen(false)

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMenu}
        aria-label={isOpen ? t('nav.closeMenu') : t('nav.openMenu')}
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
      >
        {isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
            onClick={closeMenu}
            aria-hidden="true"
          />
          <nav
            id="mobile-menu"
            className="fixed inset-x-0 top-14 z-50 border-b bg-background p-4 shadow-lg"
            role="navigation"
            aria-label={t('nav.openMenu')}
          >
            <ul className="flex flex-col gap-2">
              {navItems.map((item) => {
                const isActive = pathname.startsWith(item.href)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={closeMenu}
                      className={cn(
                        'block rounded-md px-4 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-accent'
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
        </>
      )}
    </div>
  )
}
