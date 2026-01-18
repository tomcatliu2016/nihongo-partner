'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Globe } from 'lucide-react'

import { useRouter, usePathname } from '@/i18n/navigation'
import { locales, localeNames, type Locale } from '@/i18n/config'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function LanguageSelector() {
  const t = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const handleChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale as Locale })
  }

  return (
    <Select value={locale} onValueChange={handleChange}>
      <SelectTrigger
        className="w-auto gap-2 border-none bg-transparent shadow-none hover:bg-accent"
        aria-label={t('language.select')}
      >
        <Globe className="size-4" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {locales.map((loc) => (
          <SelectItem key={loc} value={loc}>
            {localeNames[loc]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
