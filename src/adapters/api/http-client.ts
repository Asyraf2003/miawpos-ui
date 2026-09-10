import { outcome, OutcomeError, type OutcomeCode, type FieldIssue } from '../../domain/outcome'
import { record } from './auth-decoder'

export type Fetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

const codes: Record<string, OutcomeCode> = {
  authentication_required: 'auth.login_required', forbidden: 'access.denied',
  capability_disabled: 'capability.unavailable', invalid_request_body: 'validation.invalid_request',
  bad_request: 'validation.invalid_request', internal_server_error: 'system.unexpected_error',
  root_access_denied: 'access.denied', root_name_required: 'validation.required', root_name_too_long: 'validation.invalid_value',
  catalog_item_validation_failed: 'validation.invalid_request', catalog_pricing_inactive: 'capability.unavailable',
  catalog_item_not_found: 'catalog.item_not_found', invalid_catalog_item_id: 'validation.invalid_value',
  catalog_item_not_sellable: 'catalog.item_not_sellable', sale_not_found: 'sale.not_found',
  sale_already_reversed: 'sale.already_reversed', idempotency_conflict: 'sale.idempotency_conflict',
  money_overflow: 'system.contract_error', insufficient_cash_tender: 'payment.insufficient_cash',
  invalid_quantity: 'validation.invalid_value', sale_validation_failed: 'validation.invalid_request', invalid_sale_id: 'validation.invalid_value',
}

export class ApiFailure extends OutcomeError {
  readonly status: number
  constructor(status: number, code: OutcomeCode, requestId?: string, fields?: FieldIssue[]) {
    super({ ...outcome(code, requestId), ...(fields?.length ? { fields } : {}) })
    this.status = status
  }
}

export function isUnauthorized(error: unknown) {
  return error instanceof ApiFailure && error.status === 401
}

function fieldIssues(value: unknown): FieldIssue[] {
  if (!Array.isArray(value)) return []
  return value.filter((field): field is FieldIssue => record(field)
    && (field.path === 'email' || field.path === 'password' || field.path === 'name')
    && (field.code === 'validation.required' || field.code === 'validation.invalid_value'))
    .map(({ path, code }) => ({ path, code }))
}

export class HttpClient {
  readonly #fetch: Fetch
  constructor(fetcher: Fetch) { this.#fetch = fetcher }

  async request<T>(path: string, init: RequestInit, decode: (value: unknown) => T): Promise<T> {
    let response: Response
    try {
      response = await this.#fetch(`/api${path}`, {
        ...init, credentials: 'same-origin', cache: 'no-store', redirect: 'error',
        signal: AbortSignal.timeout(15_000),
        headers: { Accept: 'application/json', ...init.headers },
      })
    } catch { throw new OutcomeError(outcome('network.unavailable')) }
    const id = response.headers.get('X-Request-ID')
    const requestId = id && /^[A-Za-z0-9_-]{1,80}$/.test(id) ? id : undefined
    let value: unknown
    if (response.status !== 204) {
      try {
        if (!response.headers.get('Content-Type')?.toLowerCase().includes('application/json')) throw new Error()
        value = await response.json()
      } catch { throw new ApiFailure(response.status, 'system.contract_error', requestId) }
    }
    if (!response.ok) {
      if (!record(value) || !record(value.error) || typeof value.error.code !== 'string') {
        throw new ApiFailure(response.status, 'system.contract_error', requestId)
      }
      const code = Object.hasOwn(codes, value.error.code) ? codes[value.error.code]!
        : response.status >= 500 ? 'system.unexpected_error' : 'request.failed'
      throw new ApiFailure(response.status, code, requestId, fieldIssues(value.error.fields))
    }
    try { return decode(value) }
    catch { throw new ApiFailure(response.status, 'system.contract_error', requestId) }
  }
}
