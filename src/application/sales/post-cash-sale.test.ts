import { describe, expect, it, vi } from 'vitest'
import { PostCashSale } from './post-cash-sale'
import { OutcomeError, outcome } from '../../domain/outcome'
import { decodeSale } from '../../adapters/api/sale-decoder'
import { saleDto, success } from '../../test/sale-fixtures'
import { deferred } from '../../test/fixtures'
import type { Sale } from '../../domain/sale'

const sale = decodeSale(success(saleDto), 'root')
describe('cash command retry identity', () => {
  it('does not abandon ambiguous intent when a later retry is denied', async () => {
    const post = vi.fn().mockRejectedValueOnce(new OutcomeError(outcome('network.unavailable'))).mockRejectedValueOnce(new OutcomeError(outcome('access.denied')))
    const cash = new PostCashSale({ post, get: vi.fn(), reverse: vi.fn() }, () => 'key')
    await expect(cash.execute('root', 'item', '2', '50000')).rejects.toThrow()
    const command = cash.pending('root')
    await expect(cash.execute('root', 'item', '2', '50000')).rejects.toThrow()
    expect(cash.pending('root')).toBe(command)
    expect(cash.hasPending()).toBe(true)
    cash.clear()
    expect(cash.hasPending()).toBe(false)
  })
  it('retains exactly the same command/key after unknown outcome and blocks changed input', async () => {
    const post = vi.fn().mockRejectedValueOnce(new OutcomeError(outcome('network.unavailable'))).mockResolvedValue(sale)
    const key = vi.fn(() => 'key-one')
    const cash = new PostCashSale({ post, get: vi.fn(), reverse: vi.fn() }, key)
    await expect(cash.execute('root', 'item', '2', '50000')).rejects.toThrow()
    const pending = cash.pending('root')
    expect(() => cash.execute('root', 'item', '3', '50000')).toThrow('sale.pending')
    await expect(cash.execute('root', 'item', '2', '50000')).resolves.toEqual(sale)
    expect(post.mock.calls[1]![0]).toBe(pending)
    expect(key).toHaveBeenCalledOnce()
    expect(cash.pending('root')).toBeUndefined()
  })
  it('deduplicates simultaneous submissions and clears session-memory intent', async () => {
    const pending = deferred<Sale>()
    const post = vi.fn(() => pending.promise)
    const cash = new PostCashSale({ post, get: vi.fn(), reverse: vi.fn() }, () => 'key')
    const a = cash.execute('root', 'item', '2', '50000')
    expect(cash.execute('root', 'item', '2', '50000')).toBe(a)
    expect(post).toHaveBeenCalledOnce()
    cash.clear()
    expect(cash.pending('root')).toBeUndefined()
    pending.resolve(sale)
    await a
  })
  it('allows correction after explicit insufficient-tender rejection', async () => {
    const post = vi.fn().mockRejectedValueOnce(new OutcomeError(outcome('payment.insufficient_cash'))).mockResolvedValue(sale)
    const cash = new PostCashSale({ post, get: vi.fn(), reverse: vi.fn() }, () => 'key')
    await expect(cash.execute('root', 'item', '2', '1')).rejects.toThrow()
    expect(cash.pending('root')).toBeUndefined()
    await cash.execute('root', 'item', '2', '50000')
  })
})
