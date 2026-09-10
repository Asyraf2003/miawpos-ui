import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router'
import { Providers } from '../../app/providers'
import { AppRouter } from '../../app/router'
import { createRuntime } from '../../app/runtime'
import type { Fetch } from '../../adapters/api/http-client'
import { authDto, meDto, json, failure, deferred } from '../../test/fixtures'
import { reversalDto, saleDto, success } from '../../test/sale-fixtures'

function setup(path: string, financial: Fetch) {
  localStorage.setItem('miawpos.locale', 'id-ID')
  const runtime = createRuntime(async (url, init) => {
    if (String(url).includes('/sales')) return financial(url, init)
    if (String(url).includes('/catalog/items')) return json(success({ id: 'item', root_id: 'root', name: 'Kopi', price: { currency: 'IDR', amount_rupiah: 18000 } }))
    if (String(url).endsWith('/roots')) return json(success([{ id: 'root', name: 'Toko', primary_owner_account_id: 'owner', created_at: '2026-09-10T00:00:00Z' }]))
    return json(String(url).endsWith('/me') ? meDto : authDto)
  })
  render(<Providers runtime={runtime}><MemoryRouter initialEntries={[path]}><AppRouter /></MemoryRouter></Providers>)
  return { runtime, user: userEvent.setup() }
}

describe('Cash and reversal human feedback', () => {
  it('advances Cash by keyboard, preserves validation, and blocks repeated submission while pending', async () => {
    const response = deferred<Response>()
    let posts = 0
    const { user } = setup('/app/catalog/item', async (_url, init) => {
      if (init?.method === 'POST') { posts++; return response.promise }
      return json(success(saleDto))
    })
    expect(await screen.findByLabelText('Jumlah')).toHaveFocus()
    await user.clear(screen.getByLabelText('Jumlah'))
    await user.keyboard('0{Enter}')
    expect(screen.getByLabelText('Uang diterima (Rupiah)')).toHaveFocus()
    expect(posts).toBe(0)
    await user.keyboard('50000{Enter}')
    expect(await screen.findByRole('alert')).toBeVisible()
    expect(posts).toBe(0)
    await user.clear(screen.getByLabelText('Jumlah'))
    await user.keyboard('2{Enter}{Enter}{Enter}{Enter}')
    expect(posts).toBe(1)
    expect(screen.getByLabelText('Jumlah')).toBeDisabled()
    expect(screen.getByLabelText('Uang diterima (Rupiah)')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Memproses pembayaran…' })).toBeDisabled()
    await act(async () => { response.resolve(failure(422, 'insufficient_cash_tender')) })
    expect(await screen.findByRole('alert')).toBeVisible()
    expect(screen.getByText('Uang tunai belum mencukupi total penjualan. Periksa jumlah uang yang diterima.')).toBeVisible()
    expect(screen.getByLabelText('Jumlah')).toBeEnabled()
    expect(posts).toBe(1)
  })

  it('does not claim a sale after transport loss; retries immutable intent and renders GET truth', async () => {
    const requests: RequestInit[] = []
    let reads = 0
    const { user, runtime } = setup('/app/catalog/item', async (_url, init) => {
      if (init?.method === 'POST') {
        requests.push(init)
        if (requests.length === 1) throw new TypeError('connection lost')
        return json(success(saleDto))
      }
      reads++
      return json(success({ ...saleDto, lines: [{ ...saleDto.lines[0], item_name_snapshot: 'Nama dari readback' }] }))
    })
    await user.clear(await screen.findByLabelText('Jumlah'))
    await user.type(screen.getByLabelText('Jumlah'), '2')
    await user.type(screen.getByLabelText('Uang diterima (Rupiah)'), '50000')
    await user.click(screen.getByRole('button', { name: 'Konfirmasi pembayaran tunai' }))
    expect(await screen.findByText('Tidak dapat terhubung')).toBeVisible()
    expect(screen.queryByText('Penjualan tersimpan')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Jumlah')).toBeDisabled()
    expect(runtime.cash.pending('root')).toBeDefined()
    await user.click(screen.getByRole('button', { name: 'Periksa / ulangi transaksi yang sama' }))
    expect(await screen.findByText('Nama dari readback × 2')).toBeVisible()
    expect(reads).toBe(1)
    expect(requests).toHaveLength(2)
    expect(requests[1]!.body).toEqual(requests[0]!.body)
    expect(new Headers(requests[1]!.headers).get('Idempotency-Key')).toEqual(new Headers(requests[0]!.headers).get('Idempotency-Key'))
    expect(runtime.cash.pending('root')).toBeUndefined()
    expect(Object.keys(localStorage)).toEqual(['miawpos.locale'])
  })

  it('reads current sale after uncertain reversal without optimistically declaring a refund or posting twice', async () => {
    let reversed = false
    let posts = 0
    const { user } = setup('/app/sales/sale', async (_url, init) => {
      if (init?.method === 'POST') { posts++; reversed = true; throw new TypeError('lost after commit') }
      return json(success(reversed ? { ...saleDto, status: 'REVERSED', reversal: reversalDto } : saleDto))
    })
    expect(await screen.findByLabelText('Alasan pembatalan')).toHaveFocus()
    await user.keyboard('Salah pesanan{Enter}')
    expect(await screen.findByText('Tidak dapat terhubung')).toBeVisible()
    expect(screen.queryByText('Penjualan dibatalkan dan refund tercatat')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Konfirmasi pembatalan dan refund' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Periksa status terbaru' }))
    expect(await screen.findByText('Penjualan dibatalkan dan refund tercatat')).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Konfirmasi pembatalan dan refund' })).not.toBeInTheDocument()
    await waitFor(() => expect(posts).toBe(1))
  })
})
