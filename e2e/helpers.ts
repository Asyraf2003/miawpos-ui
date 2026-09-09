import { expect, type Page } from '@playwright/test'

export async function login(page: Page) {
  await expect(page.getByRole('heading', { name: 'Masuk ke MiawPOS' })).toBeVisible()
  await expect(page.locator('input, form')).toHaveCount(0)
  await page.getByRole('link', { name: 'Lanjutkan dengan Google' }).click()
  await expect(page).toHaveURL(/^http:\/\/127\.0\.0\.1:4184\/authorize\?/)
  await page.getByRole('link', { name: 'Authorize test account', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Akun Anda' })).toBeVisible()
}

export async function checkStorage(page: Page) {
  const browser = await page.evaluate(() => ({
    localKeys: Object.keys(localStorage), sessionKeys: Object.keys(sessionStorage), cookies: document.cookie,
  }))
  expect(browser.localKeys.filter(key => key !== 'miawpos.locale')).toEqual([])
  expect(browser.sessionKeys).toEqual([])
  expect(browser.cookies.includes('miawpos_session')).toBe(false)
}

export async function checkLayout(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  for (const control of await page.locator('button:visible, input:visible, select:visible, nav a:visible, [data-slot="button"]:visible').all()) {
    const box = await control.boundingBox()
    expect(!!box && box.width >= 44 && box.height >= 44).toBe(true)
  }
}
