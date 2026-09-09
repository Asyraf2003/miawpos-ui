import { describe, expect, it, vi } from 'vitest'
import { HttpClient } from './http-client'
import { decodeMe } from './auth-decoder'
import { failure, json, meDto } from '../../test/fixtures'

describe('HTTP edge', () => {
  it.each([[403, 'forbidden', 'access.denied'], [403, 'capability_disabled', 'capability.unavailable'],
    [400, 'invalid_request_body', 'validation.invalid_request'], [409, 'future_code', 'request.failed'],
    [503, 'future_code', 'system.unexpected_error']])('maps %s/%s explicitly and redacts prose', async (status, code, expected) => {
    const client = new HttpClient(async () => failure(Number(status), String(code)))
    await expect(client.request('/me', {}, decodeMe)).rejects.toMatchObject({ outcome: { code: expected } })
    try { await client.request('/me', {}, decodeMe) } catch (error) { expect(JSON.stringify(error)).not.toContain('PRIVATE SERVER DETAIL') }
  })
  it('whitelists supported field issues and removes arbitrary params', async () => {
    const client = new HttpClient(async () => failure(400, 'invalid_request_body', [
      { path: 'email', code: 'validation.required', params: { secret: 'PRIVATE' } },
      { path: 'root_id', code: 'validation.required' },
    ]))
    await expect(client.request('/me', {}, decodeMe)).rejects.toMatchObject({ outcome: { fields: [{ path: 'email', code: 'validation.required' }] } })
  })
  it('captures only bounded safe request IDs on contract failures', async () => {
    for (const id of ['request_123', '<unsafe>', 'x'.repeat(81)]) {
      const client = new HttpClient(async () => json({}, 200, { 'X-Request-ID': id }))
      await expect(client.request('/me', {}, decodeMe)).rejects.toMatchObject({ outcome: { code: 'system.contract_error', ...(id === 'request_123' ? { requestId: id } : {}) } })
      try { await client.request('/me', {}, decodeMe) } catch (error) { if (id !== 'request_123') expect(error).not.toHaveProperty('outcome.requestId') }
    }
  })
  it('rejects HTML, invalid JSON, and malformed error envelopes', async () => {
    for (const response of [new Response('<html>'), new Response('{', { headers: { 'Content-Type': 'application/json' } }), json({}, 500)]) {
      await expect(new HttpClient(async () => response).request('/me', {}, decodeMe)).rejects.toMatchObject({ outcome: { code: 'system.contract_error' } })
    }
  })
  it('reports network failure without storing raw exceptions', async () => {
    await expect(new HttpClient(async () => { throw new Error('PRIVATE') }).request('/me', {}, decodeMe)).rejects.toMatchObject({ outcome: { code: 'network.unavailable' } })
  })
  it('uses same-origin /api, bounded requests, and no-store', async () => {
    const fetcher = vi.fn(async () => json(meDto))
    await new HttpClient(fetcher).request('/me', { method: 'GET' }, decodeMe)
    expect(fetcher).toHaveBeenCalledWith('/api/me', expect.objectContaining({ method: 'GET', credentials: 'same-origin', cache: 'no-store', redirect: 'error', signal: expect.any(AbortSignal) }))
  })
})
