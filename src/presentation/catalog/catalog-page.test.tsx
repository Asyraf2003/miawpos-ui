import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router'
import { Providers } from '../../app/providers'
import { AppRouter } from '../../app/router'
import { createRuntime } from '../../app/runtime'
import { authDto, meDto, json } from '../../test/fixtures'

describe('catalog human chain', () => {
  it('creates then reads server data; reload-safe detail comes from GET, not submitted data', async () => {
    localStorage.setItem('miawpos.locale', 'id-ID')
    let reads = 0
    const runtime = createRuntime(async (path, init) => {
      const url = String(path)
      if (url.includes('/catalog/items')) {
        if (init?.method === 'GET') reads++
        return json({ success: true, data: { id: 'item', root_id: 'root', name: init?.method === 'GET' ? 'Kopi dari server' : 'Kopi', price: { currency: 'IDR', amount_rupiah: 18000 } }, meta: {} })
      }
      if (url.endsWith('/roots')) return json({ success: true, data: [{ id: 'root', name: 'Toko', primary_owner_account_id: 'owner', created_at: '2026-09-10T00:00:00Z' }], meta: {} })
      return json(url.endsWith('/me') ? meDto : authDto)
    })
    render(<Providers runtime={runtime}><MemoryRouter initialEntries={['/app/catalog/new']}><AppRouter /></MemoryRouter></Providers>)
    const user = userEvent.setup()
    await user.type(await screen.findByLabelText('Nama item'), 'Kopi')
    await user.type(screen.getByLabelText('Harga (Rupiah)'), '18000')
    await user.click(screen.getByRole('button', { name: 'Simpan item' }))
    expect(await screen.findByRole('heading', { name: 'Kopi dari server' })).toBeVisible()
    expect(reads).toBe(1)
  })
})
