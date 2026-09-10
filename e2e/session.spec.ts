import { test, expect } from '@playwright/test'
import { login, checkStorage, checkLayout, signOut } from './helpers'

test('real PostgreSQL login → /me → cookie reload → authoritative logout', async ({ page, context, request }) => {
  const browserErrors: string[] = []
  page.on('pageerror', error => browserErrors.push(error.message))
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', event => {
      document.documentElement.dataset.cspViolation = event.violatedDirective
    })
  })
  const initial = await page.goto('/account')
  expect(initial?.headers()['content-security-policy']).toContain("script-src 'self'")
  expect(initial?.headers()['strict-transport-security']).toContain('max-age=')
  expect(initial?.headers()['x-content-type-options']).toBe('nosniff')
  expect(initial?.headers()['referrer-policy']).toBe('no-referrer')
  await expect(page).toHaveURL(/\/login$/)
  await page.screenshot({ path: 'test-results/tablet-login.png', fullPage: true })
  await checkLayout(page)

  const callbackResponse = page.waitForResponse(response => new URL(response.url()).pathname === '/api/auth/browser/google/callback')
  const authResponse = page.waitForResponse(response => response.url().endsWith('/browser/refresh') && response.status() === 200)
  const principalResponse = page.waitForResponse(response => response.url().endsWith('/api/me'))
  await login(page)
  const callback = await callbackResponse
  expect(callback.status()).toBe(303)
  expect(callback.headers().location).toBe('/account')
  expect(callback.headers()['cache-control']).toBe('no-store')
  expect(callback.headers()['referrer-policy']).toBe('no-referrer')
  expect(callback.headers()['content-length'] ?? '0').toBe('0')
  expect(new URL(callback.url()).searchParams.has('access_token')).toBe(false)
  expect(new URL(callback.url()).searchParams.has('refresh_token')).toBe(false)
  expect((await context.cookies()).some(cookie => cookie.name === 'miawpos_google_state')).toBe(false)
  const auth = await (await authResponse).json()
  expect(Object.keys(auth).sort()).toEqual(['access_exp', 'access_token', 'session_exp', 'step_up_required', 'trust_level'])
  const me = await (await principalResponse).json()
  await expect(page.getByText(me.account_id, { exact: true })).toBeVisible()
  const oldBearer: string = auth.access_token // Test memory only, never printed or persisted.
  const cookie = (await context.cookies()).find(value => value.name === 'miawpos_session')
  expect(!!cookie).toBe(true)
  expect(cookie?.httpOnly).toBe(true)
  expect(cookie?.secure).toBe(true)
  expect(cookie?.sameSite).toBe('Strict')
  expect(cookie?.path).toBe('/api/auth/browser')
  expect(cookie?.domain).toBe('localhost')
  expect(cookie?.expires).toBe(-1)
  await checkStorage(page)
  await checkLayout(page)
  await page.screenshot({ path: 'test-results/tablet-account.png', fullPage: true })

  const refreshResponse = page.waitForResponse(response => response.url().endsWith('/browser/refresh'))
  const recoveredMe = page.waitForResponse(response => response.url().endsWith('/api/me'))
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Akun Anda' })).toBeVisible()
  const refreshed = await (await refreshResponse).json()
  expect(Object.hasOwn(refreshed, 'refresh_token')).toBe(false)
  // Login uses Go's nanosecond timestamp; PostgreSQL persists microseconds.
  expect(Date.parse(refreshed.session_exp)).toBe(Date.parse(auth.session_exp))
  expect((await (await recoveredMe).json()).session_id).toBe(me.session_id)
  const rotated = (await context.cookies()).find(value => value.name === 'miawpos_session')
  expect(rotated?.value !== cookie?.value).toBe(true)
  await checkStorage(page)

  const secondRefresh = page.waitForResponse(response => response.url().endsWith('/browser/refresh'))
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Akun Anda' })).toBeVisible()
  expect((await (await secondRefresh).json()).session_exp).toBe(refreshed.session_exp)

  const logout = page.waitForResponse(response => response.url().endsWith('/browser/logout'))
  await signOut(page)
  expect((await logout).status()).toBe(204)
  await expect(page.getByRole('heading', { name: 'Masuk ke MiawPOS' })).toBeVisible()
  await expect(page.getByRole('status')).toContainText('Anda telah keluar')
  expect((await context.cookies()).some(value => value.name === 'miawpos_session')).toBe(false)
  // A formerly valid bearer must now fail at the authoritative server boundary.
  expect((await request.get('/api/me', { headers: { Authorization: `Bearer ${oldBearer}` } })).status()).toBe(401)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Masuk ke MiawPOS' })).toBeVisible()
  await checkStorage(page)
  // Replay after logout cannot recreate the session, even with the old callback URL.
  await page.goto(callback.url())
  await expect(page).toHaveURL('/login?auth=failed')
  expect((await context.cookies()).some(cookie => cookie.name === 'miawpos_session')).toBe(false)
  expect(browserErrors).toEqual([])
  expect(await page.getAttribute('html', 'data-csp-violation')).toBeNull()
})

test('static routing preserves API responses and client not-found/back-forward behavior', async ({ page, request }) => {
  expect((await request.get('/api/health')).headers()['content-type']).toContain('application/json')
  const missing = await request.get('/api/nonexistent')
  // Existing backend middleware returns 401 for this unauthenticated unknown path.
  // The reverse proxy must preserve it, never replace it with the SPA index.
  const upstream = await request.get('http://127.0.0.1:8081/api/nonexistent')
  expect(missing.status()).toBe(upstream.status())
  expect(missing.status()).toBe(401)
  expect(missing.headers()['content-type']).toContain('application/json')
  expect(await missing.json()).toEqual(await upstream.json())
  await page.goto('/login')
  await page.goto('/unknown-route')
  await expect(page.getByRole('heading', { name: 'Halaman tidak ditemukan' })).toBeVisible()
  await page.goBack()
  await expect(page.getByRole('heading', { name: 'Masuk ke MiawPOS' })).toBeVisible()
  await page.goForward()
  await expect(page.getByRole('heading', { name: 'Halaman tidak ditemukan' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Halaman tidak ditemukan' })).toBeVisible()
})

for (const action of ['Cancel authorization', 'Reject invalid nonce']) {
  test(`Google ${action} returns safe login feedback without a session`, async ({ page, context }) => {
    await page.goto('/login')
    await page.getByRole('link', { name: 'Lanjutkan dengan Google' }).click()
    await page.getByRole('link', { name: action, exact: true }).click()
    await expect(page).toHaveURL('/login?auth=failed')
    await expect(page.getByText('Belum dapat masuk', { exact: true })).toBeVisible()
    expect((await context.cookies()).some(cookie => cookie.name === 'miawpos_session')).toBe(false)
    await checkStorage(page)
  })
}

test('debug manual login routes are absent in the ordinary Google configuration', async ({ request }) => {
  for (const path of ['/api/auth/manual/login', '/api/auth/browser/manual/login']) {
    const response = await request.post(path, { data: { email: 'kasir@example.com', password: '12345678' } })
    expect(response.ok()).toBe(false)
    expect(response.headers()['set-cookie']).toBeUndefined()
  }
})
