import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('home page loads', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/JURISAI/i)
  })

  test('can navigate to IRAC tool', async ({ page }) => {
    await page.goto('/')
    await page.click('text=IRAC')
    await expect(page).toHaveURL(/\/irac/)
  })

  test('can navigate to document generator', async ({ page }) => {
    await page.goto('/')
    await page.click('text=Document')
    await expect(page).toHaveURL(/\/document/)
  })

  test('responsive navigation works', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    const menuButton = page.locator('button[aria-label*="menu"]')
    if (await menuButton.isVisible()) {
      await menuButton.click()
    }
    
    await expect(page.locator('nav')).toBeVisible()
  })
})
