export interface Sale {
  readonly id: string
  readonly rootId: string
  readonly status: 'POSTED' | 'REVERSED'
  readonly totalRupiah: number
  readonly tenderedRupiah: number
  readonly changeRupiah: number
  readonly lines: readonly { itemId: string; name: string; quantity: number; unitPriceRupiah: number; totalRupiah: number }[]
  readonly reversal: { reason: string; refundRupiah: number } | null
}
export interface CashCommand {
  readonly rootId: string
  readonly itemId: string
  readonly quantity: number
  readonly tenderedRupiah: number
  readonly key: string
}
