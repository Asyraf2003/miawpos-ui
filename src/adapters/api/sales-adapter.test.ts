import { describe, expect, it, vi } from 'vitest'
import { SalesAdapter } from './sales-adapter'
import { BrowserSessionAdapter } from '../session/browser-session-adapter'
import { HttpClient, type Fetch } from './http-client'
import { authDto, meDto, failure, json } from '../../test/fixtures'
import { saleDto, success } from '../../test/sale-fixtures'

const command = { rootId: 'root', itemId: 'item', quantity: 2, tenderedRupiah: 50000, key: 'stable-key' }
describe('sales protected HTTP edge', () => {
  it('preserves the body and idempotency key through the single 401 refresh/retry', async () => {
    const requests: RequestInit[] = []
    const fetcher: Fetch = async (path, init) => {
      if (String(path).endsWith('/refresh')) return json(authDto)
      if (String(path).endsWith('/me')) return json(meDto)
      requests.push(init!)
      return requests.length === 1 ? failure() : json(success(saleDto))
    }
    const session = new BrowserSessionAdapter(new HttpClient(fetcher), vi.fn())
    await session.bootstrap()
    await new SalesAdapter(session.request.bind(session)).post(command)
    expect(requests).toHaveLength(2)
    for (const request of requests) {
      expect(new Headers(request.headers).get('Idempotency-Key')).toBe('stable-key')
      expect(JSON.parse(String(request.body))).toEqual({ items: [{ catalog_item_id: 'item', quantity: 2 }], payment: { type: 'cash', tendered_rupiah: 50000 } })
    }
  })
  it('rejects a valid sale belonging to another submitted item', async () => {
    const adapter = new SalesAdapter(async (_path, _init, decode) => decode(success({ ...saleDto, lines: [{ ...saleDto.lines[0], catalog_item_id: 'different-item' }] })))
    await expect(adapter.post(command)).rejects.toThrow()
  })
})
