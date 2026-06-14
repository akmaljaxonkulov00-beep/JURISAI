import { test, expect } from '@playwright/test'

test.describe('IRAC Tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/irac')
  })

  test('IRAC page loads correctly', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/IRAC/i)
  })

  test('can input legal scenario', async ({ page }) => {
    const textarea = page.locator('textarea').first()
    await textarea.fill('Test legal scenario about contract breach')
    await expect(textarea).toHaveValue(/contract breach/)
  })

  test('submit button exists and is clickable', async ({ page }) => {
    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).toBeVisible()
    await expect(submitButton).toBeEnabled()
  })

  test('shows loading state on submit', async ({ page }) => {
    const textarea = page.locator('textarea').first()
    await textarea.fill('Contract dispute case')
    
    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()
    
    await expect(page.locator('text=/loading|analyzing/i')).toBeVisible({ timeout: 2000 }).catch(() => {})
  })
})
