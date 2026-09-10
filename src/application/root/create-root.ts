import type { RootPort } from '../ports/root-port'
import { outcome, OutcomeError } from '../../domain/outcome'

export function createRoot(port: RootPort, name: string) {
  const trimmed = name.trim()
  if (!trimmed || [...trimmed].length > 200) {
    throw new OutcomeError({ ...outcome('validation.invalid_request'), fields: [{ path: 'name', code: trimmed ? 'validation.invalid_value' : 'validation.required' }] })
  }
  return port.create(trimmed)
}
