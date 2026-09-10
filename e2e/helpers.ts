import { expect, type Page } from '@playwright/test'

export async function login(page: Page) {
  await expect(page.getByRole('heading', { name: 'Masuk ke MiawPOS' })).toBeVisible()
  await expect(page.locator('form')).toHaveCount(0)
  await expect(page.getByRole('textbox')).toHaveCount(0)
  await expect(page.locator('input[type="email"], input[type="password"]')).toHaveCount(0)
  await page.getByRole('link', { name: 'Lanjutkan dengan Google' }).click()
  await expect(page).toHaveURL(/^http:\/\/127\.0\.0\.1:4184\/authorize\?/)
  await page.getByRole('link', { name: 'Authorize test account', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Akun Anda' })).toBeVisible()
}

export async function openAccountMenu(page: Page, label = 'Menu pengguna') {
  await page.getByRole('button', { name: label, exact: true }).click()
}

export async function openAccountSettings(page: Page, menuLabel = 'Menu pengguna', settingsLabel = 'Pengaturan') {
  await openAccountMenu(page, menuLabel)
  await page.getByRole('button', { name: settingsLabel, exact: true }).click()
}

export async function signOut(page: Page, menuLabel = 'Menu pengguna', signOutLabel = 'Keluar') {
  await openAccountMenu(page, menuLabel)
  await page.getByRole('button', { name: signOutLabel, exact: true }).click()
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
  // The shell animates its padding across responsive breakpoints. Measure settled
  // reflow, just as hit-target checks below wait for entrance motion to settle.
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  for (const control of await page.locator('button:visible, input:visible:not([aria-hidden="true"]), select:visible, nav a:visible, [role="option"]:visible, [data-slot="button"]:visible').all()) {
    const target = await control.evaluate(element => ({ tag: element.tagName, role: element.getAttribute('role'), ariaHidden: element.getAttribute('aria-hidden'), width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height }))
    // Allow entrance motion to settle without relaxing the 44px minimum.
    await expect.poll(async () => {
      const box = await control.boundingBox()
      return !!box && box.width >= 44 && box.height >= 44
    }, { message: JSON.stringify(target) }).toBe(true)
  }
}
