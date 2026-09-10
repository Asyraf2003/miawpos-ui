import { describe, expect, it, vi } from 'vitest'
import { decodeItem, CatalogAdapter } from './catalog-adapter'
import { HttpClient } from './http-client'
import { json } from '../../test/fixtures'
import { createItem } from '../../application/catalog/create-item'

const item = { id: 'item', root_id: 'root', name: 'Kopi', price: { currency: 'IDR', amount_rupiah: 18000 } }
const wire = (data: unknown) => ({ success: true, data, meta: {} })
describe('catalog contract', () => {
  it.each([null, {}, wire({ ...item, root_id: 'other' }), wire({ ...item, id: 'other' }), wire({ ...item, price: null }), wire({ ...item, name: '' }), ...[0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, '18000'].map(amount_rupiah => wire({ ...item, price: { currency: 'IDR', amount_rupiah } })), wire({ ...item, price: { currency: 'USD', amount_rupiah: 18000 } })])('fails closed for malformed, cross-context, or unsafe money', value => {
    expect(() => decodeItem(value, 'root', 'item')).toThrow()
  })
  it('supports core-only items and a safe IDR price', () => {
    expect(decodeItem(wire({ id: 'item', root_id: 'root', name: 'Kopi' }), 'root').priceRupiah).toBeNull()
    expect(decodeItem(wire(item), 'root').priceRupiah).toBe(18000)
  })
  it('sends only normalized command fields and validates before HTTP', async () => {
    const fetcher = vi.fn(async () => json(wire(item)))
    const http = new HttpClient(fetcher)
    const port = new CatalogAdapter(http.request.bind(http))
    for (const price of ['-1', '0', '1.5', '1e3', '9007199254740992']) expect(() => createItem(port, 'root', 'Kopi', price)).toThrow()
    await createItem(port, 'root', ' Kopi ', '18000')
    expect(fetcher).toHaveBeenCalledOnce()
    expect(fetcher.mock.calls[0]).toMatchObject(['/api/roots/root/catalog/items', { body: '{"name":"Kopi","price_rupiah":18000}' }])
  })
})
