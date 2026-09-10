import { describe, expect, it, vi } from 'vitest'
import { decodeRoot, decodeRoots, RootAdapter } from './root-adapter'
import { HttpClient } from './http-client'
import { BrowserSessionAdapter } from '../session/browser-session-adapter'
import { authDto, meDto, json, failure, deferred } from '../../test/fixtures'
import { activeRoot } from '../../domain/root'
import { createRoot } from '../../application/root/create-root'

export const rootDto = { id: 'root-one', name: 'Toko Satu', primary_owner_account_id: 'account-one', created_at: '2026-09-10T00:00:00Z' }
const envelope = (data: unknown) => ({ success: true, data, meta: {} })

describe('ROOT wire and context boundary', () => {
  it.each([null, {}, { success: false, data: [] }, envelope(null), envelope([{}]), envelope([{ ...rootDto, name: '' }]), envelope([{ ...rootDto, created_at: 'bad' }]), envelope([rootDto, rootDto])])('rejects malformed root lists', value => {
    expect(() => decodeRoots(value)).toThrow()
  })
  it('maps only context fields and resolves zero/one/multiple explicitly', () => {
    const one = decodeRoot(envelope(rootDto))
    expect(one).toEqual({ id: 'root-one', name: 'Toko Satu' })
    expect(activeRoot([], null)).toBeNull()
    expect(activeRoot([one], null)).toEqual(one)
    const two = { id: 'root-two', name: 'Toko Dua' }
    expect(activeRoot([one, two], null)).toBeNull()
    expect(activeRoot([one, two], 'unlisted')).toBeNull()
    expect(activeRoot([one, two], two.id)).toEqual(two)
  })
  it('validates normalized names before calling the port', async () => {
    const port = { create: vi.fn().mockResolvedValue(rootDto), list: vi.fn() }
    expect(() => createRoot(port, ' ')).toThrow()
    expect(() => createRoot(port, 'a'.repeat(201))).toThrow()
    await createRoot(port, ' Toko ')
    expect(port.create).toHaveBeenCalledExactlyOnceWith('Toko')
  })
  it('retries the exact create body once after 401 and never exposes bearer to ROOT data', async () => {
    let calls = 0
    const fetcher = vi.fn(async (path: RequestInfo | URL) => {
      if (String(path).endsWith('/me')) return json(meDto)
      if (String(path).endsWith('/refresh')) return json(authDto)
      return ++calls === 1 ? failure() : json(envelope(rootDto))
    })
    const session = new BrowserSessionAdapter(new HttpClient(fetcher), vi.fn())
    await session.bootstrap()
    const port = new RootAdapter(session.request.bind(session))
    expect(await port.create('Toko')).toEqual({ id: rootDto.id, name: rootDto.name })
    const requests = fetcher.mock.calls.filter(([path]) => String(path).endsWith('/roots'))
    expect(requests).toHaveLength(2)
  })
  it('rejects a late ROOT response after authoritative logout', async () => {
    const pending = deferred<Response>()
    const session = new BrowserSessionAdapter(new HttpClient(async path => {
      if (String(path).endsWith('/me')) return json(meDto)
      if (String(path).endsWith('/refresh')) return json(authDto)
      if (String(path).endsWith('/logout')) return new Response(null, { status: 204 })
      return pending.promise
    }), vi.fn())
    await session.bootstrap()
    const result = new RootAdapter(session.request.bind(session)).list()
    await session.logout()
    pending.resolve(json(envelope([rootDto])))
    await expect(result).rejects.toMatchObject({ outcome: { code: 'auth.session_expired' } })
  })
})
