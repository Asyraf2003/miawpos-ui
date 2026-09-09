import { describe, expect, it, vi } from 'vitest'
import { BrowserSessionAdapter } from './browser-session-adapter'
import { HttpClient, type Fetch } from '../api/http-client'
import { authDto, meDto, json, failure, deferred } from '../../test/fixtures'

describe('browser session adapter', () => {
  it('keeps access credentials private and establishes principal only through /me', async () => {
    const fetcher = vi.fn<Fetch>(async path => String(path).endsWith('/me') ? json(meDto) : json(authDto))
    const adapter = new BrowserSessionAdapter(new HttpClient(fetcher), vi.fn())
    const principal = await adapter.loginManual('user@example.com', 'test-password')
    expect(principal).toEqual({ accountId: meDto.account_id, sessionId: meDto.session_id, roles: meDto.roles, permissions: meDto.permissions, trustLevel: meDto.trust_level })
    expect(JSON.stringify(adapter)).not.toContain(authDto.access_token)
    expect(JSON.stringify(principal)).not.toContain(authDto.access_token)
    expect(localStorage.length).toBe(0)
    expect(sessionStorage.length).toBe(0)
    expect(fetcher.mock.calls[1]?.[1]?.headers).toMatchObject({ Authorization: `Bearer ${authDto.access_token}` })
  })
  it('bootstraps once under concurrent calls and sends no refresh body', async () => {
    const fetcher = vi.fn<Fetch>(async path => String(path).endsWith('/me') ? json(meDto) : json(authDto))
    const adapter = new BrowserSessionAdapter(new HttpClient(fetcher), vi.fn())
    const [a, b] = await Promise.all([adapter.bootstrap(), adapter.bootstrap()])
    expect(a).toEqual(b)
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(fetcher.mock.calls[0]).toEqual(['/api/auth/browser/refresh', expect.objectContaining({ method: 'POST' })])
    expect(fetcher.mock.calls[0]?.[1]).not.toHaveProperty('body')
  })
  it('returns login state for an absent session and clears protected state', async () => {
    const clear = vi.fn()
    const fetcher = vi.fn<Fetch>(async () => failure())
    expect(await new BrowserSessionAdapter(new HttpClient(fetcher), clear).bootstrap()).toBeNull()
    expect(clear).toHaveBeenCalled()
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
  it('single-flights concurrent protected 401s and retries each exact request once', async () => {
    let refreshCount = 0
    let logoutCount = 0
    const refresh = deferred<Response>()
    const fetcher: Fetch = async (path, init) => {
      if (String(path).endsWith('/manual/login')) return json(authDto)
      if (String(path).endsWith('/me')) return json(meDto)
      if (String(path).endsWith('/refresh')) { refreshCount++; return refresh.promise }
      logoutCount++
      return new Headers(init?.headers).get('Authorization') === 'Bearer new-access' ? failure(403, 'forbidden') : failure()
    }
    const adapter = new BrowserSessionAdapter(new HttpClient(fetcher), vi.fn())
    await adapter.loginManual('user@example.com', 'test-password')
    const first = adapter.logout().catch(error => error)
    const second = adapter.logout().catch(error => error)
    await vi.waitFor(() => expect(refreshCount).toBe(1))
    refresh.resolve(json({ ...authDto, access_token: 'new-access' }))
    expect((await first).outcome.code).toBe('access.denied')
    expect((await second).outcome.code).toBe('access.denied')
    expect(refreshCount).toBe(1)
    expect(logoutCount).toBe(4)
  })
  it('does not start another refresh for a late 401 using the old bearer', async () => {
    const late = deferred<Response>()
    let refreshCount = 0
    let logoutCount = 0
    const fetcher: Fetch = async path => {
      if (String(path).endsWith('/manual/login')) return json(authDto)
      if (String(path).endsWith('/me')) return json(meDto)
      if (String(path).endsWith('/refresh')) { refreshCount++; return json({ ...authDto, access_token: 'new-access' }) }
      logoutCount++
      if (logoutCount === 2) return late.promise
      return logoutCount === 1 ? failure() : failure(403, 'forbidden')
    }
    const adapter = new BrowserSessionAdapter(new HttpClient(fetcher), vi.fn())
    await adapter.loginManual('user@example.com', 'test-password')
    const first = adapter.logout().catch(error => error)
    const second = adapter.logout().catch(error => error)
    await first
    late.resolve(failure())
    await second
    expect(refreshCount).toBe(1)
    expect(logoutCount).toBe(4)
  })
  it('stops after one recovery retry and clears state on another 401', async () => {
    const clear = vi.fn()
    const fetcher = vi.fn<Fetch>(async path => String(path).endsWith('/logout') ? failure() : String(path).endsWith('/me') ? json(meDto) : json(authDto))
    const adapter = new BrowserSessionAdapter(new HttpClient(fetcher), clear)
    await adapter.loginManual('user@example.com', 'test-password')
    clear.mockClear()
    await expect(adapter.logout()).rejects.toThrow('auth.session_expired')
    expect(fetcher.mock.calls.filter(([path]) => String(path).endsWith('/refresh'))).toHaveLength(1)
    expect(fetcher.mock.calls.filter(([path]) => String(path).endsWith('/logout'))).toHaveLength(2)
    expect(clear).toHaveBeenCalled()
  })
  it.each(['unauthorized', 'network', 'malformed'])('clears protected state when refresh fails: %s', async mode => {
    const clear = vi.fn()
    const fetcher: Fetch = async path => {
      if (String(path).endsWith('/manual/login')) return json(authDto)
      if (String(path).endsWith('/me')) return json(meDto)
      if (String(path).endsWith('/refresh')) {
        if (mode === 'network') throw new Error('network')
        return mode === 'malformed' ? json({}) : failure()
      }
      return failure()
    }
    const adapter = new BrowserSessionAdapter(new HttpClient(fetcher), clear)
    await adapter.loginManual('user@example.com', 'test-password')
    clear.mockClear()
    await expect(adapter.logout()).rejects.toThrow()
    expect(clear).toHaveBeenCalled()
  })
  it('does not claim logout or clear a valid principal on revocation failure', async () => {
    let failLogout = true
    const clear = vi.fn()
    const fetcher: Fetch = async path => String(path).endsWith('/logout') ? failLogout ? failure(500, 'internal_server_error') : new Response(null, { status: 204 })
      : String(path).endsWith('/me') ? json(meDto) : json(authDto)
    const adapter = new BrowserSessionAdapter(new HttpClient(fetcher), clear)
    await adapter.loginManual('user@example.com', 'test-password')
    clear.mockClear()
    await expect(adapter.logout()).rejects.toThrow('system.unexpected_error')
    expect(clear).not.toHaveBeenCalled()
    failLogout = false
    await adapter.logout()
    expect(clear).toHaveBeenCalledOnce()
  })
  it('prevents an in-flight principal response from restoring state after logout', async () => {
    const late = deferred<Response>()
    let reads = 0
    const fetcher: Fetch = async path => {
      if (String(path).endsWith('/me')) return ++reads === 1 ? json(meDto) : late.promise
      if (String(path).endsWith('/logout')) return new Response(null, { status: 204 })
      return json(authDto)
    }
    const adapter = new BrowserSessionAdapter(new HttpClient(fetcher), vi.fn())
    await adapter.loginManual('user@example.com', 'test-password')
    const pendingRead = adapter.bootstrap()
    await adapter.logout()
    late.resolve(json(meDto))
    expect(await pendingRead).toBeNull()
  })
  it('does not clear a replacement session when an old recovery retry returns 401', async () => {
    const late = deferred<Response>()
    const retryStarted = deferred<void>()
    const clear = vi.fn()
    let logoutCount = 0
    const fetcher: Fetch = async path => {
      if (String(path).endsWith('/me')) return json(meDto)
      if (String(path).endsWith('/logout')) {
        if (++logoutCount === 1) return failure()
        retryStarted.resolve()
        return late.promise
      }
      return json(authDto)
    }
    const adapter = new BrowserSessionAdapter(new HttpClient(fetcher), clear)
    await adapter.loginManual('user@example.com', 'test-password')
    const oldLogout = adapter.logout().catch(error => error)
    await retryStarted.promise
    await adapter.loginManual('replacement@example.com', 'test-password')
    clear.mockClear()
    late.resolve(failure())
    expect((await oldLogout).outcome.code).toBe('auth.session_expired')
    expect(clear).not.toHaveBeenCalled()
    expect(await adapter.bootstrap()).not.toBeNull()
  })
})
