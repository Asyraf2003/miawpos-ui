import type { RootPort } from '../../application/ports/root-port'
import type { Root } from '../../domain/root'
import { contractError, record } from './auth-decoder'
import type { ProtectedRequest } from './protected-request'

function root(value: unknown): Root {
  if (!record(value) || typeof value.id !== 'string' || !value.id.trim()
    || typeof value.name !== 'string' || !value.name.trim()
    || typeof value.primary_owner_account_id !== 'string' || !value.primary_owner_account_id
    || typeof value.created_at !== 'string' || !Number.isFinite(Date.parse(value.created_at))) return contractError()
  return { id: value.id, name: value.name }
}

export function decodeRoot(value: unknown): Root {
  if (!record(value) || value.success !== true) return contractError()
  return root(value.data)
}

export function decodeRoots(value: unknown): readonly Root[] {
  if (!record(value) || value.success !== true || !Array.isArray(value.data)) return contractError()
  const roots = value.data.map(root)
  if (new Set(roots.map(item => item.id)).size !== roots.length) return contractError()
  return roots
}

export class RootAdapter implements RootPort {
  readonly request: ProtectedRequest
  constructor(request: ProtectedRequest) { this.request = request }
  list() { return this.request('/roots', { method: 'GET' }, decodeRoots) }
  create(name: string) {
    return this.request('/roots', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) }, decodeRoot)
  }
}
