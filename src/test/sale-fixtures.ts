export const saleDto = {
  id: 'sale', root_id: 'root', status: 'POSTED', total_rupiah: 36000,
  actor_account_id: 'account', session_id: 'session', posted_at: '2026-09-10T00:00:00Z',
  lines: [{ catalog_item_id: 'item', item_name_snapshot: 'Kopi', unit_price_rupiah: 18000, quantity: 2, line_total_rupiah: 36000 }],
  payment: { id: 'payment', type: 'cash', tendered_rupiah: 50000, applied_rupiah: 36000, change_rupiah: 14000, paid_at: '2026-09-10T00:00:00Z' },
}
export const reversalDto = {
  id: 'reversal', reason: 'Salah pesanan', reversed_at: '2026-09-10T00:01:00Z',
  refund: { id: 'refund', type: 'cash', amount_rupiah: 36000, refunded_at: '2026-09-10T00:01:00Z' },
}
export const success = (data: unknown) => ({ success: true, data, meta: {} })
