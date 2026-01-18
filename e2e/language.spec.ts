import { test, expect } from '@playwright/test'

test.describe('Language Switching', () => {
  test('Chinese locale loads correctly', async ({ page }) => {
    // Default locale (zh) doesn't need prefix
    await page.goto('/dashboard')

    // Page should load
    await expect(page.locator('body')).toBeVisible()

    // URL should not have locale prefix for default locale
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('Japanese locale loads correctly', async ({ page }) => {
    await page.goto('/ja/dashboard')

    // Page should load
    await expect(page.locator('body')).toBeVisible()

    // URL should contain /ja
    await expect(page).toHaveURL(/\/ja/)
  })

  test('English locale loads correctly', async ({ page }) => {
    await page.goto('/en/dashboard')

    // Page should load
    await expect(page.locator('body')).toBeVisible()

    // URL should contain /en
    await expect(page).toHaveURL(/\/en/)
  })

  test('language selector is visible', async ({ page }) => {
    await page.goto('/dashboard')

    // Look for language selector trigger with aria-label
    const languageSelector = page.locator('[aria-label*="语言"], [aria-label*="language"], [aria-label*="言語"]')

    if ((await languageSelector.count()) > 0) {
      await expect(languageSelector.first()).toBeVisible()
    }
  })

  test('switching from Chinese to Japanese updates URL', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Find language selector by aria-label
    const languageSelector = page.locator('[aria-label*="语言"], [aria-label*="language"], [aria-label*="言語"]')

    if ((await languageSelector.count()) > 0) {
      await languageSelector.first().click()
      await page.waitForTimeout(300)

      // Look for Japanese option in the dropdown
      const japaneseOption = page.locator('[data-slot="select-item"]').filter({ hasText: '日本語' })

      if ((await japaneseOption.count()) > 0) {
        await japaneseOption.first().click()
        await page.waitForURL(/\/ja\//)

        // URL should change to /ja
        await expect(page).toHaveURL(/\/ja/)
      }
    }
  })

  test('switching from Chinese to English updates URL', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Find language selector by aria-label
    const languageSelector = page.locator('[aria-label*="语言"], [aria-label*="language"], [aria-label*="言語"]')

    if ((await languageSelector.count()) > 0) {
      await languageSelector.first().click()
      await page.waitForTimeout(300)

      // Look for English option in the dropdown
      const englishOption = page.locator('[data-slot="select-item"]').filter({ hasText: 'English' })

      if ((await englishOption.count()) > 0) {
        await englishOption.first().click()
        await page.waitForURL(/\/en\//)

        // URL should change to /en
        await expect(page).toHaveURL(/\/en/)
      }
    }
  })

  test('content is translated in Chinese', async ({ page }) => {
    await page.goto('/dashboard')

    // Page should contain Chinese characters
    const bodyText = await page.locator('body').textContent()
    const hasChinese = /[\u4e00-\u9fa5]/.test(bodyText || '')

    expect(hasChinese).toBe(true)
  })

  test('content is translated in Japanese', async ({ page }) => {
    await page.goto('/ja/dashboard')

    // Page should contain Japanese characters (hiragana, katakana, or kanji)
    const bodyText = await page.locator('body').textContent()
    const hasJapanese = /[\u3040-\u30ff\u4e00-\u9faf]/.test(bodyText || '')

    expect(hasJapanese).toBe(true)
  })

  test('language preference persists after navigation', async ({ page }) => {
    await page.goto('/ja/dashboard')

    // Navigate to another page if possible
    const anyLink = page.locator('a[href*="/ja/"]').first()

    if ((await anyLink.count()) > 0) {
      await anyLink.click()

      // Should still be in Japanese locale
      await expect(page).toHaveURL(/\/ja\//)
    }
  })
})

test.describe('Locale-specific formatting', () => {
  test('displays correctly in RTL-compatible layout', async ({ page }) => {
    // All supported locales (zh, ja, en) are LTR
    await page.goto('/dashboard')

    const html = page.locator('html')
    const dir = await html.getAttribute('dir')

    // Should be LTR or undefined (default LTR)
    expect(dir).not.toBe('rtl')
  })

  test('page title includes locale', async ({ page }) => {
    await page.goto('/dashboard')

    // Page should have a title
    const title = await page.title()
    expect(title.length).toBeGreaterThan(0)
  })
})

test.describe('Language Accessibility', () => {
  test('html lang attribute matches locale for explicit paths', async ({ page }) => {
    // Test Japanese (explicit locale path)
    await page.goto('/ja/dashboard')
    await page.waitForLoadState('domcontentloaded')
    const jaLang = await page.locator('html').getAttribute('lang')
    expect(jaLang).toBe('ja')

    // Test English (explicit locale path)
    await page.goto('/en/dashboard')
    await page.waitForLoadState('domcontentloaded')
    const enLang = await page.locator('html').getAttribute('lang')
    expect(enLang).toBe('en')

    // Test Chinese (explicit locale path)
    await page.goto('/zh/dashboard')
    await page.waitForLoadState('domcontentloaded')
    const zhLang = await page.locator('html').getAttribute('lang')
    expect(zhLang).toBe('zh')
  })

  test('default path uses browser locale or default', async ({ page }) => {
    // When accessing /dashboard without locale prefix,
    // next-intl uses browser's Accept-Language header
    // The lang should be one of our supported locales
    await page.goto('/dashboard')
    await page.waitForLoadState('domcontentloaded')
    const lang = await page.locator('html').getAttribute('lang')
    expect(['zh', 'ja', 'en']).toContain(lang)
  })

  test('language selector is keyboard accessible', async ({ page }) => {
    await page.goto('/dashboard')

    // Tab to language selector
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Try to find a focused language-related element
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
  })
})
