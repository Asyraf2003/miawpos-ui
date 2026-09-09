import { test, expect } from '@playwright/test'
import { checkLayout, checkStorage, login } from './helpers'

test('responsive navigation, keyboard input, locale, and reflow smoke', async ({ page }, testInfo) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Masuk ke MiawPOS' })).toBeVisible()
  await checkLayout(page)
  await page.getByLabel('Bahasa / Language').focus()
  await page.keyboard.press('Tab')
  const google = page.getByRole('link', { name: 'Lanjutkan dengan Google' })
  await expect(google).toBeFocused()
  expect(await google.evaluate(element => element.matches(':focus-visible'))).toBe(true)
  await page.screenshot({ path: `test-results/${testInfo.project.name}-login.png`, fullPage: true })
  await login(page)
  await checkLayout(page)
  if (testInfo.project.name === 'mobile') {
    await page.getByRole('button', { name: 'Buka navigasi' }).click()
    await expect(page.locator('#mobile-nav').getByRole('link', { name: 'Akun', exact: true })).toBeVisible()
    await page.locator('#mobile-nav').getByRole('link', { name: 'Akun', exact: true }).click()
  }
  await page.getByLabel('Bahasa / Language').selectOption('en-US')
  await expect(page.getByRole('heading', { name: 'Your account' })).toBeVisible()
  await checkLayout(page)
  await page.screenshot({ path: `test-results/${testInfo.project.name}-account.png`, fullPage: true })
  await page.setViewportSize({ width: 320, height: 900 })
  await checkLayout(page)
  await page.getByRole('button', { name: 'Sign out', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Sign in to MiawPOS' })).toBeVisible()
  await checkLayout(page)
  await checkStorage(page)
})
