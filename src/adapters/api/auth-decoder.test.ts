import { describe, expect, it } from 'vitest'
import { decodeBrowserAuth, decodeMe } from './auth-decoder'
import { authDto, meDto } from '../../test/fixtures'

describe('endpoint decoders', () => {
  it('decodes the actual browser and /api/me contracts', () => {
    expect(decodeBrowserAuth(authDto)).toEqual(authDto)
    expect(decodeMe(meDto)).toEqual(meDto)
    expect(decodeMe({ ...meDto, roles: [], permissions: [] }).roles).toEqual([])
  })
  it.each([null, [], {}, { ...authDto, access_token: '' }, { ...authDto, access_token: 'unsafe\nheader' },
    { ...authDto, access_exp: 42 }, { ...authDto, session_exp: 'tomorrow' }, { ...authDto, step_up_required: 'false' },
    { ...authDto, refresh_token: 'MUST-NOT-ACCEPT' }, { ...authDto, refresh_exp: authDto.session_exp },
  ])('rejects malformed or credential-leaking browser response %#', value => {
    expect(() => decodeBrowserAuth(value)).toThrow('system.contract_error')
  })
  it.each([null, {}, { ...meDto, account_id: '' }, { ...meDto, roles: null }, { ...meDto, permissions: [1] },
    { ...meDto, session_id: 23 }, { ...meDto, trust_level: null },
  ])('rejects malformed principal %#', value => {
    expect(() => decodeMe(value)).toThrow('system.contract_error')
  })
})
