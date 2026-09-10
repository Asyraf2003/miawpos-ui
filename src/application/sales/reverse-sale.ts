import type { SalesPort } from '../ports/sales-port'
import { outcome, OutcomeError } from '../../domain/outcome'

export function reverseSale(port: SalesPort, rootId: string, saleId: string, reason: string) {
  const trimmed = reason.trim()
  if (!trimmed || [...trimmed].length > 500) throw new OutcomeError(outcome('validation.invalid_request'))
  return port.reverse(rootId, saleId, trimmed)
}
