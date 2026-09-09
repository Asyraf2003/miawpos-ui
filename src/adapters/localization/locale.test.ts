import { describe, expect, it, vi } from 'vitest'
import { readLocale, resolveLocale, saveLocale } from './locale'
import { translate } from './translate'
import type { MessageKey } from './message-keys'

describe('locale boundary', () => {
  it.each([
    [null, [], 'id-ID'], [null, ['fr-FR'], 'id-ID'], [null, ['en-GB'], 'en-US'],
    [null, ['fr-FR', 'id'], 'id-ID'], ['id-ID', ['en-US'], 'id-ID'],
    ['unsupported', ['en-US'], 'id-ID'], ['en-US', ['id-ID'], 'en-US'],
  ])('resolves saved=%s languages=%j deterministically', (saved, languages, expected) => {
    expect(resolveLocale(saved, languages)).toBe(expected)
  })
  it('supports denied storage without crashing', () => {
    const get = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied') })
    const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('denied') })
    expect(() => readLocale()).not.toThrow()
    expect(() => saveLocale('en-US')).not.toThrow()
    get.mockRestore(); set.mockRestore()
  })
  it('shows visible missing keys and safely interpolates scalar params', () => {
    expect(translate('en-US', 'missing.key' as MessageKey)).toBe('⟦missing.key⟧')
    expect(translate('id-ID', 'feedback.reference', { requestId: 'request-123' })).toBe('Referensi bantuan: request-123')
    expect(translate('en-US', 'feedback.reference')).toContain('{requestId}')
  })
})
