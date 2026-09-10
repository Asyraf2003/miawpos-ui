import { test, expect } from '@playwright/test'
import { checkLayout, checkStorage, login, openAccountSettings, signOut } from './helpers'

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
    await page.getByRole('button', { name: 'Navigasi', exact: true }).click()
    const mobileSidebar = page.locator('#primary-sidebar')
    await expect(mobileSidebar.getByRole('link', { name: 'Dashboard', exact: true })).toBeVisible()
    await mobileSidebar.getByRole('link', { name: 'Dashboard', exact: true }).click()
  }

  // The smallest presentation scale may compact rem-based geometry, but the accepted
  // interaction target floor must remain at least 44 CSS px.
  await page.getByRole('button', { name: 'Kustomisasi', exact: true }).click()
  const appearance = page.locator('aside[aria-label="Kustomisasi"]')
  await appearance.getByRole('button', { name: 'S', exact: true }).click()
  await checkLayout(page)
  await appearance.getByRole('button', { name: 'M', exact: true }).click()
  await appearance.getByRole('button', { name: 'Tutup', exact: true }).click()

  await openAccountSettings(page)
  await page.getByLabel('Bahasa / Language').click()
  await expect(page.getByRole('option', { name: 'English' })).toBeVisible()
  await checkLayout(page)
  await page.getByRole('option', { name: 'English' }).click()
  await expect(page.getByRole('heading', { name: 'Your account' })).toBeVisible()
  await expect(page.locator('[role="option"]:visible')).toHaveCount(0)
  await page.getByRole('button', { name: 'Close', exact: true }).click()
  await checkLayout(page)
  await page.screenshot({ path: `test-results/${testInfo.project.name}-account.png`, fullPage: true })

  await page.getByRole('link', { name: 'Open workspace' }).click()
  // The tablet chain created two memberships. A fresh client must ask, not remember.
  await expect(page.getByRole('heading', { name: 'Choose a workspace' })).toBeVisible()
  await page.getByRole('button', { name: 'Warung R6', exact: true }).click()
  await page.getByRole('link', { name: 'Add item' }).click()
  const itemName = `Coffee ${testInfo.project.name} ${'a'.repeat(80)}`
  const price = testInfo.project.name === 'desktop' ? '9007199254740991' : '18000'
  await page.getByLabel('Item name').fill(itemName)
  await page.getByLabel('Price (Rupiah)').fill(price)
  await page.getByRole('button', { name: 'Save item' }).click()
  await expect(page.getByRole('heading', { name: itemName })).toBeVisible()
  await checkLayout(page)
  await page.screenshot({ path: `test-results/${testInfo.project.name}-cash.png`, fullPage: true })
  await page.setViewportSize({ width: 320, height: 900 })
  await checkLayout(page)
  await page.getByLabel('Cash received (Rupiah)').fill(testInfo.project.name === 'desktop' ? price : '20000')
  await page.getByRole('button', { name: 'Confirm cash payment' }).click()
  await expect(page.getByText('Sale posted', { exact: true })).toBeVisible()
  await checkLayout(page)
  await page.getByLabel('Reversal reason').fill('Responsive proof')
  await page.getByRole('button', { name: 'Confirm reversal and refund' }).click()
  await expect(page.getByText('Sale reversed and refund recorded', { exact: true })).toBeVisible()
  await checkLayout(page)
  await page.screenshot({ path: `test-results/${testInfo.project.name}-reversal-320.png`, fullPage: true })
  await page.getByRole('link', { name: 'Account', exact: true }).click()
  await signOut(page, 'User menu', 'Sign out')
  await expect(page.getByRole('heading', { name: 'Sign in to MiawPOS' })).toBeVisible()
  await checkLayout(page)
  await checkStorage(page)
})
