import type { SalesPort } from '../ports/sales-port'
import type { CashCommand, Sale } from '../../domain/sale'
import { outcome, outcomeFrom, OutcomeError } from '../../domain/outcome'
import { positiveInteger } from '../../domain/rupiah'

// Session-memory attempts survive presentation remounts. Each ROOT is isolated.
export class PostCashSale {
  readonly #port: SalesPort
  readonly #newKey: () => string
  readonly #attempts = new Map<string, CashCommand>()
  readonly #flights = new Map<string, Promise<Sale>>()
  constructor(port: SalesPort, newKey: () => string) { this.#port = port; this.#newKey = newKey }
  pending(rootId: string) { return this.#attempts.get(rootId) }
  hasPending() { return this.#attempts.size > 0 }
  clear() { this.#attempts.clear(); this.#flights.clear() }
  execute(rootId: string, itemId: string, quantity: string, tender: string): Promise<Sale> {
    const count = positiveInteger(quantity.trim())
    const amount = positiveInteger(tender.trim())
    const existing = this.#attempts.get(rootId)
    if (existing && (existing.itemId !== itemId || existing.quantity !== count || existing.tenderedRupiah !== amount)) {
      throw new OutcomeError(outcome('sale.pending'))
    }
    const flight = this.#flights.get(rootId)
    if (flight) return flight
    const command = existing ?? Object.freeze({ rootId, itemId, quantity: count, tenderedRupiah: amount, key: this.#newKey() })
    this.#attempts.set(rootId, command)
    const result = this.#port.post(command).then(sale => {
      if (this.#attempts.get(rootId) === command) this.#attempts.delete(rootId)
      return sale
    }).catch((error: unknown) => {
      // Only a first-attempt explicit rejection proves no commit. A later
      // denial cannot disprove an earlier ambiguous commit (e.g. revoked access).
      if (!existing && this.#attempts.get(rootId) === command && ['validation.invalid_request', 'validation.invalid_value', 'payment.insufficient_cash', 'catalog.item_not_sellable', 'catalog.item_not_found', 'access.denied'].includes(outcomeFrom(error).code)) this.#attempts.delete(rootId)
      throw error
    }).finally(() => { if (this.#flights.get(rootId) === result) this.#flights.delete(rootId) })
    this.#flights.set(rootId, result)
    return result
  }
}
