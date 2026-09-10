import { test, expect } from '@playwright/test'
import { login, checkLayout, checkStorage, signOut } from './helpers'

test('human ROOT → catalog/pricing → Cash retry/readback → reversal → logout', async ({ page, request }) => {
  await page.goto('/login')
  const authResponse = page.waitForResponse(response => response.url().endsWith('/browser/refresh') && response.status() === 200)
  await login(page)
  const bearer: string = (await (await authResponse).json()).access_token // Test memory only.
  const headers = { Authorization: `Bearer ${bearer}` }
  await page.getByRole('link', { name: 'Buka ruang usaha' }).click()
  await expect(page.getByRole('heading', { name: 'Buat ruang usaha pertama' })).toBeVisible()
  await page.getByLabel('Nama ruang usaha').fill('Warung R6')
  const createdRoot = page.waitForResponse(response => response.url().endsWith('/api/roots') && response.status() === 201)
  await page.getByRole('button', { name: 'Buat ruang usaha', exact: true }).click()
  const rootId: string = (await (await createdRoot).json()).data.id
  await expect(page.getByRole('heading', { name: 'Warung R6' })).toBeVisible()
  await expect(page).toHaveURL('/app')
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Warung R6' })).toBeVisible()
  await checkStorage(page)
  await checkLayout(page)
  await page.screenshot({ path: 'test-results/tablet-root.png', fullPage: true })
  await page.getByRole('link', { name: 'Tambah item' }).click()
  await page.getByLabel('Nama item').fill('Kopi R6')
  await page.getByLabel('Harga (Rupiah)').fill('18000')
  await page.getByRole('button', { name: 'Simpan item' }).click()
  await expect(page.getByRole('heading', { name: 'Kopi R6' })).toBeVisible()
  const itemId = new URL(page.url()).pathname.split('/').at(-1)!
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Kopi R6' })).toBeVisible()
  await checkLayout(page)
  await page.screenshot({ path: 'test-results/tablet-catalog.png', fullPage: true })
  // Drop the response AFTER the real server commits, then retry the same intent.
  const keys: string[] = []
  let committedSaleId: string | undefined
  await page.route('**/api/roots/*/sales', async route => {
    keys.push(route.request().headers()['idempotency-key'] ?? '')
    const response = await route.fetch()
    if (keys.length === 1) {
      expect(response.status()).toBe(201)
      committedSaleId = (await response.json()).data.id
      await route.abort('failed')
    } else {
      expect(response.status()).toBe(200)
      expect((await response.json()).data.id).toBe(committedSaleId)
      await route.fulfill({ response })
    }
  })
  await page.getByLabel('Jumlah', { exact: true }).fill('2')
  await page.getByLabel('Uang diterima (Rupiah)').fill('50000')
  await page.getByRole('button', { name: 'Konfirmasi pembayaran tunai' }).click()
  await expect(page.getByText('Tidak dapat terhubung', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Jumlah', { exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'Periksa / ulangi transaksi yang sama' }).click()
  await expect(page.getByText('Penjualan tersimpan', { exact: true })).toBeVisible()
  const salePath = new URL(page.url()).pathname
  const saleId = salePath.split('/').at(-1)!
  expect(keys.length).toBe(2)
  expect(!!keys[0] && keys[0] === keys[1]).toBe(true)
  await page.reload()
  await expect(page.getByText('Penjualan tersimpan', { exact: true })).toBeVisible()
  await expect(page.getByText(/Rp\s*36\.000/, { exact: true }).first()).toBeVisible()
  await expect(page.getByText(/Rp\s*14\.000/, { exact: true })).toBeVisible()
  await checkLayout(page)
  await page.screenshot({ path: 'test-results/tablet-sale.png', fullPage: true })
  await page.getByLabel('Alasan pembatalan').fill('Salah pesanan')
  await page.getByRole('button', { name: 'Konfirmasi pembatalan dan refund' }).click()
  await expect(page.getByText('Penjualan dibatalkan dan refund tercatat', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByText('Penjualan dibatalkan dan refund tercatat', { exact: true })).toBeVisible()
  await expect(page.getByText('Salah pesanan', { exact: true })).toBeVisible()
  await checkStorage(page)
  await checkLayout(page)
  await page.screenshot({ path: 'test-results/tablet-reversal.png', fullPage: true })
  // Create a second accessible ROOT as a fixture, not a new UI product flow.
  const second = await request.post('/api/roots', { headers, data: { name: 'Ruang kedua R6' } })
  expect(second.status()).toBe(201)
  const otherRootId: string = (await second.json()).data.id
  expect((await request.get(`/api/roots/${otherRootId}/catalog/items/${itemId}`, { headers })).status()).toBe(404)
  expect((await request.get(`/api/roots/${otherRootId}/sales/${saleId}`, { headers })).status()).toBe(404)
  expect((await request.post(`/api/roots/${otherRootId}/sales`, { headers: { ...headers, 'Idempotency-Key': 'cross-root-negative-proof' }, data: { items: [{ catalog_item_id: itemId, quantity: 1 }], payment: { type: 'cash', tendered_rupiah: 50000 } } })).status()).toBe(404)
  expect((await request.get('/api/roots/00000000-0000-4000-8000-000000000000/sales/' + saleId, { headers })).status()).toBe(403)
  await page.goto('/app')
  await expect(page.getByRole('heading', { name: 'Pilih ruang usaha' })).toBeVisible()
  await page.getByRole('button', { name: 'Ruang kedua R6', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Ruang kedua R6' })).toBeVisible()
  expect(await page.getByText('Salah pesanan', { exact: true }).count()).toBe(0)
  await page.getByRole('link', { name: 'Ganti ruang usaha' }).click()
  await page.getByRole('button', { name: 'Warung R6', exact: true }).click()
  expect((await request.get(`/api/roots/${rootId}/sales/${saleId}`, { headers })).status()).toBe(200)
  await checkStorage(page)
  await page.getByRole('link', { name: 'Akun', exact: true }).click()
  await signOut(page)
  await page.goto('/app')
  await expect(page.getByRole('heading', { name: 'Masuk ke MiawPOS' })).toBeVisible()
})
