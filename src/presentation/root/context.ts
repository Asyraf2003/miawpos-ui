import { createContext, useContext } from 'react'
import type { Root } from '../../domain/root'
import type { Outcome } from '../../domain/outcome'

export interface RootContextValue {
  roots: readonly Root[]
  active: Root | null
  loading: boolean
  error: Outcome | null
  select(id: string): void
  create(name: string): Promise<void>
  refresh(): void
}
export const RootContext = createContext<RootContextValue | null>(null)
export function useRoots() {
  const value = useContext(RootContext)
  if (!value) throw new Error('ROOT provider missing')
  return value
}
