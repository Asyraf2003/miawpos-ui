export type OutcomeCode =
  | 'auth.login_required' | 'auth.session_expired' | 'auth.logged_out'
  | 'access.denied' | 'capability.unavailable'
  | 'validation.invalid_request' | 'validation.required' | 'validation.invalid_value'
  | 'network.unavailable' | 'request.failed'
  | 'system.unexpected_error' | 'system.contract_error'

export interface FieldIssue {
  path: 'email' | 'password'
  code: 'validation.required' | 'validation.invalid_value'
}

export interface Outcome {
  code: OutcomeCode
  severity: 'success' | 'info' | 'warning' | 'error'
  retryable: boolean
  fields?: readonly FieldIssue[]
  requestId?: string
}

export function outcome(code: OutcomeCode, requestId?: string): Outcome {
  return {
    code,
    severity: code === 'auth.logged_out' ? 'success' : 'error',
    retryable: code === 'network.unavailable' || code === 'system.unexpected_error',
    ...(requestId ? { requestId } : {}),
  }
}

export class OutcomeError extends Error {
  readonly outcome: Outcome
  constructor(value: Outcome) {
    super(value.code)
    this.name = 'OutcomeError'
    this.outcome = value
  }
}

export function outcomeFrom(error: unknown): Outcome {
  return error instanceof OutcomeError ? error.outcome : outcome('system.unexpected_error')
}
