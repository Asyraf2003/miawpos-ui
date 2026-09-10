import { useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createRoot } from '../application/root/create-root'
import { activeRoot } from '../domain/root'
import { outcomeFrom } from '../domain/outcome'
import { RootContext } from '../presentation/root/context'
import type { Runtime } from './runtime'

const rootsKey = ['roots'] as const

export function RootProvider({ runtime, children }: { runtime: Runtime; children: ReactNode }) {
  const roots = useQuery({ queryKey: rootsKey, queryFn: () => runtime.roots.list(), staleTime: 0 })
  const [selected, setSelected] = useState<string | null>(null)
  const list = roots.data ?? []
  function select(id: string) {
    // Switching context discards all ROOT-scoped cached data and mutations.
    const scoped = { predicate: (query: { queryKey: readonly unknown[] }) => query.queryKey[0] === 'root-scoped' }
    void runtime.queryClient.cancelQueries(scoped)
    runtime.queryClient.removeQueries(scoped)
    runtime.queryClient.getMutationCache().clear()
    setSelected(id)
  }
  return <RootContext.Provider value={{
    roots: list, active: roots.isError ? null : activeRoot(list, selected),
    loading: roots.isFetching, error: roots.isError ? outcomeFrom(roots.error) : null,
    select: id => { if (list.some(root => root.id === id)) select(id) },
    create: async name => {
      const created = await createRoot(runtime.roots, name)
      runtime.queryClient.setQueryData(rootsKey, [...list.filter(root => root.id !== created.id), created])
      select(created.id)
    },
    refresh: () => { void roots.refetch() },
  }}>{children}</RootContext.Provider>
}
