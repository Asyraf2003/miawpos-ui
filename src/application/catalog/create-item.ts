import type { CatalogPort } from '../ports/catalog-port'
import { outcome, OutcomeError } from '../../domain/outcome'
import { positiveInteger } from '../../domain/rupiah'

export function createItem(port: CatalogPort, rootId: string, name: string, price: string) {
  const normalized = name.trim()
  if (!normalized || [...normalized].length > 200) throw new OutcomeError(outcome('validation.invalid_request'))
  return port.create(rootId, normalized, price.trim() ? positiveInteger(price.trim()) : null)
}
