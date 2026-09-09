import { outcome, OutcomeError } from '../../domain/outcome'
import type { BrowserAuthDto, MeDto } from './auth-dto'

export function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
const nonempty = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every(nonempty)
const timestamp = (value: unknown): value is string => typeof value === 'string'
  && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
  && Number.isFinite(Date.parse(value))

export function contractError(): never {
  throw new OutcomeError(outcome('system.contract_error'))
}

export function decodeBrowserAuth(value: unknown): BrowserAuthDto {
  if (!record(value) || 'refresh_token' in value || 'refresh_exp' in value
    || !nonempty(value.access_token) || /\s/.test(value.access_token)
    || !timestamp(value.access_exp) || !timestamp(value.session_exp)
    || !nonempty(value.trust_level) || typeof value.step_up_required !== 'boolean') return contractError()
  return {
    access_token: value.access_token, access_exp: value.access_exp, session_exp: value.session_exp,
    trust_level: value.trust_level, step_up_required: value.step_up_required,
  }
}

export function decodeMe(value: unknown): MeDto {
  if (!record(value) || !nonempty(value.account_id) || !nonempty(value.session_id)
    || !strings(value.roles) || !strings(value.permissions) || !nonempty(value.trust_level)) return contractError()
  return {
    account_id: value.account_id, session_id: value.session_id, roles: value.roles,
    permissions: value.permissions, trust_level: value.trust_level,
  }
}
