import { outcome, OutcomeError, type FieldIssue } from '../../domain/outcome'
import type { SessionPort } from '../ports/session-port'

export async function loginManual(port: SessionPort, email: string, password: string) {
  const fields: FieldIssue[] = []
  if (!email.trim()) fields.push({ path: 'email', code: 'validation.required' })
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    fields.push({ path: 'email', code: 'validation.invalid_value' })
  }
  if (!password) fields.push({ path: 'password', code: 'validation.required' })
  if (fields.length) throw new OutcomeError({ ...outcome('validation.invalid_request'), fields })
  return port.loginManual(email.trim(), password)
}
