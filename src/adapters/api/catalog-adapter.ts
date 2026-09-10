import type { CatalogPort } from '../../application/ports/catalog-port'
import type { CatalogItem } from '../../domain/catalog'
import { contractError, record } from './auth-decoder'
import type { ProtectedRequest } from './protected-request'

export function decodeItem(value: unknown, rootId: string, itemId?: string): CatalogItem {
  if (!record(value) || value.success !== true || !record(value.data)) return contractError()
  const item = value.data
  if (typeof item.id !== 'string' || !item.id || item.root_id !== rootId
    || (itemId !== undefined && item.id !== itemId)
    || typeof item.name !== 'string' || !item.name.trim()) return contractError()
  let priceRupiah: number | null = null
  if (item.price !== undefined) {
    if (!record(item.price) || item.price.currency !== 'IDR' || typeof item.price.amount_rupiah !== 'number'
      || !Number.isSafeInteger(item.price.amount_rupiah) || item.price.amount_rupiah <= 0) return contractError()
    priceRupiah = item.price.amount_rupiah
  }
  return { id: item.id, rootId, name: item.name, priceRupiah }
}

export class CatalogAdapter implements CatalogPort {
  readonly request: ProtectedRequest
  constructor(request: ProtectedRequest) { this.request = request }
  create(rootId: string, name: string, priceRupiah: number | null) {
    return this.request(`/roots/${encodeURIComponent(rootId)}/catalog/items`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, ...(priceRupiah === null ? {} : { price_rupiah: priceRupiah }) }),
    }, value => decodeItem(value, rootId))
  }
  get(rootId: string, itemId: string) {
    return this.request(`/roots/${encodeURIComponent(rootId)}/catalog/items/${encodeURIComponent(itemId)}`, { method: 'GET' }, value => decodeItem(value, rootId, itemId))
  }
}
