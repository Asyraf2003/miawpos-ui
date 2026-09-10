import type { Sale } from '../../domain/sale'
import { contractError, record } from './auth-decoder'

function text(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) return contractError()
  return value
}
function integer(value: unknown, minimum = 0): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < minimum) return contractError()
  return value
}
function timestamp(value: unknown) { if (!Number.isFinite(Date.parse(text(value)))) contractError() }

export function decodeSale(value: unknown, rootId: string, saleId?: string): Sale {
  if (!record(value) || value.success !== true || !record(value.data)) return contractError()
  const sale = value.data
  const id = text(sale.id)
  if (sale.root_id !== rootId || (saleId !== undefined && id !== saleId)
    || (sale.status !== 'POSTED' && sale.status !== 'REVERSED') || !Array.isArray(sale.lines) || !sale.lines.length || sale.lines.length > 100) return contractError()
  text(sale.actor_account_id); text(sale.session_id); timestamp(sale.posted_at)
  const totalRupiah = integer(sale.total_rupiah, 1)
  const lines = sale.lines.map(line => {
    if (!record(line)) return contractError()
    const quantity = integer(line.quantity, 1), unitPriceRupiah = integer(line.unit_price_rupiah, 1), total = integer(line.line_total_rupiah, 1)
    if (BigInt(quantity) * BigInt(unitPriceRupiah) !== BigInt(total)) return contractError()
    return { itemId: text(line.catalog_item_id), name: text(line.item_name_snapshot), quantity, unitPriceRupiah, totalRupiah: total }
  })
  if (lines.reduce((sum, line) => sum + BigInt(line.totalRupiah), 0n) !== BigInt(totalRupiah)) return contractError()
  const payment = sale.payment
  if (!record(payment) || payment.type !== 'cash') return contractError()
  text(payment.id); timestamp(payment.paid_at)
  const tenderedRupiah = integer(payment.tendered_rupiah), applied = integer(payment.applied_rupiah), changeRupiah = integer(payment.change_rupiah)
  if (applied !== totalRupiah || BigInt(tenderedRupiah) - BigInt(applied) !== BigInt(changeRupiah)) return contractError()
  let reversal: Sale['reversal'] = null
  if (sale.status === 'REVERSED') {
    if (!record(sale.reversal) || !record(sale.reversal.refund) || sale.reversal.refund.type !== 'cash') return contractError()
    text(sale.reversal.id); timestamp(sale.reversal.reversed_at)
    text(sale.reversal.refund.id); timestamp(sale.reversal.refund.refunded_at)
    const refundRupiah = integer(sale.reversal.refund.amount_rupiah)
    if (refundRupiah !== totalRupiah) return contractError()
    reversal = { reason: text(sale.reversal.reason), refundRupiah }
  } else if (sale.reversal !== undefined) return contractError()
  return { id, rootId, status: sale.status, totalRupiah, tenderedRupiah, changeRupiah, lines, reversal }
}
