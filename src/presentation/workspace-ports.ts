import { createContext, useContext } from 'react'
import type { CatalogPort } from '../application/ports/catalog-port'
import type { SalesPort } from '../application/ports/sales-port'
import type { PostCashSale } from '../application/sales/post-cash-sale'
export const WorkspacePorts = createContext<{ catalog: CatalogPort; sales: SalesPort; cash: PostCashSale } | null>(null)
export function useWorkspacePorts() {
  const value = useContext(WorkspacePorts)
  if (!value) throw new Error('Workspace ports missing')
  return value
}
