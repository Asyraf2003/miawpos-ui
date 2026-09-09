export const authDto = {
  access_token: 'test-access-one',
  access_exp: '2026-09-09T03:15:00Z',
  session_exp: '2026-10-09T03:00:00Z',
  trust_level: 'aal1', step_up_required: false,
}
export const meDto = {
  account_id: 'account-one', session_id: 'session-one',
  roles: ['cashier'], permissions: ['profile.self.read', 'auth.session.logout'], trust_level: 'aal1',
}
export const json = (value: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json', ...headers } })
export const failure = (status = 401, code = 'authentication_required', fields: unknown = null) =>
  json({ success: false, error: { code, message: 'PRIVATE SERVER DETAIL', fields }, meta: {} }, status)

export function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(done => { resolve = done })
  return { promise, resolve }
}
