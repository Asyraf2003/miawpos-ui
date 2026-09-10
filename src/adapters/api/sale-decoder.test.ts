import { describe, expect, it } from 'vitest'
import { decodeSale } from './sale-decoder'
import { saleDto, reversalDto, success } from '../../test/sale-fixtures'

describe('authoritative sale readback', () => {
  it('decodes posted and reversed cash truth', () => {
    expect(decodeSale(success(saleDto), 'root', 'sale')).toMatchObject({ totalRupiah: 36000, tenderedRupiah: 50000, changeRupiah: 14000, reversal: null })
    expect(decodeSale(success({ ...saleDto, status: 'REVERSED', reversal: reversalDto }), 'root').reversal).toEqual({ reason: 'Salah pesanan', refundRupiah: 36000 })
  })
  it.each([
    null, {}, { ...saleDto, root_id: 'other' }, { ...saleDto, id: 'other' }, { ...saleDto, status: 'UNKNOWN' },
    { ...saleDto, lines: [] }, { ...saleDto, posted_at: 'bad' }, { ...saleDto, total_rupiah: 36001 },
    { ...saleDto, payment: { ...saleDto.payment, type: 'qris' } }, { ...saleDto, payment: { ...saleDto.payment, change_rupiah: 14001 } },
    { ...saleDto, status: 'REVERSED' }, { ...saleDto, reversal: reversalDto },
    { ...saleDto, status: 'REVERSED', reversal: { ...reversalDto, refund: { ...reversalDto.refund, amount_rupiah: 1 } } },
    ...[1.5, -1, Number.MAX_SAFE_INTEGER + 1, '36000'].map(total_rupiah => ({ ...saleDto, total_rupiah })),
    { ...saleDto, lines: [{ ...saleDto.lines[0], quantity: Number.MAX_SAFE_INTEGER + 1 }] },
    { ...saleDto, lines: [{ ...saleDto.lines[0], line_total_rupiah: 1 }] },
  ])('rejects malformed, unsafe, inconsistent, or wrong-context data', value => {
    expect(() => decodeSale(success(value), 'root', 'sale')).toThrow()
  })
})
