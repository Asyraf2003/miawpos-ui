import type { SalesPort } from '../../application/ports/sales-port'
import type { CashCommand } from '../../domain/sale'
import { decodeSale } from './sale-decoder'
import type { ProtectedRequest } from './protected-request'

export class SalesAdapter implements SalesPort {
  readonly request: ProtectedRequest
  constructor(request: ProtectedRequest) { this.request = request }
  post(command: CashCommand) {
    return this.request(`/roots/${encodeURIComponent(command.rootId)}/sales`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': command.key },
      body: JSON.stringify({ items: [{ catalog_item_id: command.itemId, quantity: command.quantity }], payment: { type: 'cash', tendered_rupiah: command.tenderedRupiah } }),
    }, value => decodeSale(value, command.rootId))
  }
  get(rootId: string, saleId: string) {
    return this.request(`/roots/${encodeURIComponent(rootId)}/sales/${encodeURIComponent(saleId)}`, { method: 'GET' }, value => decodeSale(value, rootId, saleId))
  }
  reverse(rootId: string, saleId: string, reason: string) {
    return this.request(`/roots/${encodeURIComponent(rootId)}/sales/${encodeURIComponent(saleId)}/reversals`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason }),
    }, value => decodeSale(value, rootId, saleId))
  }
}
