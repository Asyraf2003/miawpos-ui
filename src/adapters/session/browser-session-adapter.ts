import type { SessionPort } from '../../application/ports/session-port'
import { outcome, OutcomeError } from '../../domain/outcome'
import type { SessionPrincipal } from '../../domain/session'
import { contractError, decodeBrowserAuth, decodeMe } from '../api/auth-decoder'
import { HttpClient, isUnauthorized } from '../api/http-client'

export class BrowserSessionAdapter implements SessionPort {
  readonly #http: HttpClient
  readonly #clearProtectedState: () => void
  #accessToken: string | null = null
  #epoch = 0
  #refreshFlight: Promise<void> | null = null
  #bootstrapFlight: Promise<SessionPrincipal | null> | null = null

  constructor(http: HttpClient, clearProtectedState: () => void) {
    this.#http = http
    this.#clearProtectedState = clearProtectedState
  }

  #clear() {
    this.#epoch++
    this.#accessToken = null
    this.#clearProtectedState()
  }

  #assertCurrent(epoch: number) {
    if (epoch !== this.#epoch) throw new OutcomeError(outcome('auth.session_expired'))
  }

  async #refresh() {
    if (this.#refreshFlight) return this.#refreshFlight
    const epoch = this.#epoch
    const previouslyAuthenticated = this.#accessToken !== null
    this.#refreshFlight = (async () => {
      try {
        const dto = await this.#http.request('/auth/browser/refresh', { method: 'POST' }, decodeBrowserAuth)
        this.#assertCurrent(epoch)
        this.#accessToken = dto.access_token
      } catch (error) {
        if (epoch === this.#epoch) this.#clear()
        if (isUnauthorized(error)) {
          throw new OutcomeError(outcome(previouslyAuthenticated ? 'auth.session_expired' : 'auth.login_required'))
        }
        throw error
      } finally { this.#refreshFlight = null }
    })()
    return this.#refreshFlight
  }

  async #protected<T>(path: string, method: 'GET' | 'POST', decode: (value: unknown) => T): Promise<T> {
    const epoch = this.#epoch
    const token = this.#accessToken
    const send = () => this.#http.request(path, {
      method, headers: { Authorization: `Bearer ${this.#accessToken ?? ''}` },
    }, decode)
    try {
      const result = await send()
      this.#assertCurrent(epoch)
      return result
    } catch (error) {
      this.#assertCurrent(epoch)
      if (!isUnauthorized(error)) throw error
      // A late 401 for an old bearer reuses the already completed refresh.
      if (token === this.#accessToken) await this.#refresh()
      this.#assertCurrent(epoch)
      try {
        const result = await send()
        this.#assertCurrent(epoch)
        return result
      } catch (retryError) {
        this.#assertCurrent(epoch)
        if (isUnauthorized(retryError)) {
          this.#clear()
          throw new OutcomeError(outcome('auth.session_expired'))
        }
        throw retryError
      }
    }
  }

  async #principal(): Promise<SessionPrincipal> {
    const dto = await this.#protected('/me', 'GET', decodeMe)
    return {
      accountId: dto.account_id, sessionId: dto.session_id,
      roles: dto.roles, permissions: dto.permissions, trustLevel: dto.trust_level,
    }
  }

  async loginManual(email: string, password: string) {
    // Settle a bootstrap refresh before issuing a new cookie through login.
    if (this.#bootstrapFlight) await this.#bootstrapFlight.catch(() => undefined)
    if (this.#refreshFlight) await this.#refreshFlight.catch(() => undefined)
    this.#clear()
    const epoch = this.#epoch
    try {
      const dto = await this.#http.request('/auth/browser/manual/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }),
      }, decodeBrowserAuth)
      this.#assertCurrent(epoch)
      this.#accessToken = dto.access_token
      return await this.#principal()
    } catch (error) {
      if (epoch === this.#epoch) this.#clear()
      throw error
    }
  }

  bootstrap() {
    if (this.#bootstrapFlight) return this.#bootstrapFlight
    this.#bootstrapFlight = (async () => {
      try {
        if (!this.#accessToken) await this.#refresh()
        return await this.#principal()
      } catch (error) {
        this.#clear()
        if (error instanceof OutcomeError && ['auth.login_required', 'auth.session_expired'].includes(error.outcome.code)) return null
        throw error
      } finally { this.#bootstrapFlight = null }
    })()
    return this.#bootstrapFlight
  }

  async logout() {
    await this.#protected('/auth/browser/logout', 'POST', value => {
      if (value !== undefined) contractError()
    })
    this.#clear()
  }
}
