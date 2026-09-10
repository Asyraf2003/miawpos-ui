import type { CashCommand, Sale } from '../../domain/sale'
export interface SalesPort {
  post(command: CashCommand): Promise<Sale>
  get(rootId: string, saleId: string): Promise<Sale>
  reverse(rootId: string, saleId: string, reason: string): Promise<Sale>
}
