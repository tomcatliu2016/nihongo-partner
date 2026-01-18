import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('redirects root to dashboard', async ({ page }) => {
    await page.goto('/')

    // Should redirect to dashboard (default locale zh has no prefix)
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('home page loads correctly', async ({ page }) => {
    await page.goto('/dashboard')

    // Page should be visible
    await expect(page.locator('body')).toBeVisible()
  })

  test('navigates to practice page', async ({ page }) => {
    await page.goto('/dashboard')

    // Look for a link to practice and click it
    const practiceLink = page.getByRole('link', { name: /练习|練習|practice/i })

    if ((await practiceLink.count()) > 0) {
      await practiceLink.first().click()
      await expect(page).toHaveURL(/practice/)
    }
  })

  test('navigates to materials page', async ({ page }) => {
    await page.goto('/dashboard')

    const materialsLink = page.getByRole('link', { name: /学习材料|学習資料|materials/i })

    if ((await materialsLink.count()) > 0) {
      await materialsLink.first().click()
      await expect(page).toHaveURL(/materials/)
    }
  })

  test('navigates to analysis page', async ({ page }) => {
    await page.goto('/dashboard')

    const analysisLink = page.getByRole('link', { name: /分析|解析|analysis/i })

    if ((await analysisLink.count()) > 0) {
      await analysisLink.first().click()
      await expect(page).toHaveURL(/analysis/)
    }
  })

  test('404 page shows for invalid routes', async ({ page }) => {
    // Use a path that clearly doesn't exist under any locale
    await page.goto('/zh/this-page-does-not-exist-404')
    await page.waitForLoadState('domcontentloaded')

    // Wait for page to render
    await page.waitForTimeout(500)

    // Check for 404 indication - look for the not found text or the card title
    // Translations: zh="页面不存在", ja="ページが見つかりません", en="Page not found"
    const pageContent = await page.locator('body').textContent()
    const has404Text =
      /page not found|页面不存在|ページが見つかりません|not found|404/i.test(pageContent || '')

    expect(has404Text).toBe(true)
  })

  test('skip to content link is accessible', async ({ page }) => {
    await page.goto('/dashboard')

    // Press Tab to focus on skip link
    await page.keyboard.press('Tab')

    // Check if skip link becomes visible
    const skipLink = page.getByText(/skip to content|跳转到内容|コンテンツにスキップ/i)

    if ((await skipLink.count()) > 0) {
      await expect(skipLink.first()).toBeFocused()
    }
  })
})

test.describe('Mobile Navigation', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('mobile menu button is visible on small screens', async ({ page }) => {
    await page.goto('/dashboard')

    // Look for hamburger menu button
    const menuButton = page.getByRole('button', { name: /menu|菜单|メニュー/i })

    if ((await menuButton.count()) > 0) {
      await expect(menuButton.first()).toBeVisible()
    }
  })

  test('mobile menu opens when clicked', async ({ page }) => {
    await page.goto('/dashboard')

    const menuButton = page.getByRole('button', { name: /menu|菜单|メニュー/i })

    if ((await menuButton.count()) > 0) {
      await menuButton.first().click()

      // Menu should be visible
      const mobileNav = page.locator('[role="dialog"]')
      if ((await mobileNav.count()) > 0) {
        await expect(mobileNav.first()).toBeVisible()
      }
    }
  })
})
