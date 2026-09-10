import { QueryClient } from '@tanstack/react-query'
import { HttpClient, type Fetch } from '../adapters/api/http-client'
import { BrowserSessionAdapter } from '../adapters/session/browser-session-adapter'
import { RootAdapter } from '../adapters/api/root-adapter'
import { CatalogAdapter } from '../adapters/api/catalog-adapter'
import { SalesAdapter } from '../adapters/api/sales-adapter'
import { PostCashSale } from '../application/sales/post-cash-sale'

export const sessionKey = ['session'] as const

export function createRuntime(fetcher: Fetch = globalThis.fetch.bind(globalThis)) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity, refetchOnWindowFocus: false, refetchOnReconnect: false }, mutations: { retry: false } },
  })
  const session = new BrowserSessionAdapter(new HttpClient(fetcher), () => {
    cash.clear()
    // The adapter guards in-flight principal reads with its session generation.
    // Cancel and remove every other protected query before admitting a new user.
    const otherQueries = { predicate: (query: { queryKey: readonly unknown[] }) => query.queryKey[0] !== sessionKey[0] }
    void queryClient.cancelQueries(otherQueries)
    queryClient.removeQueries(otherQueries)
    queryClient.getMutationCache().clear()
    queryClient.setQueryData(sessionKey, null)
  })
  const roots = new RootAdapter(session.request.bind(session))
  const catalog = new CatalogAdapter(session.request.bind(session))
  const sales = new SalesAdapter(session.request.bind(session))
  const cash = new PostCashSale(sales, () => crypto.randomUUID())
  return { queryClient, session, roots, catalog, sales, cash, googleLoginURL: '/api/auth/browser/google/start' }
}

export type Runtime = ReturnType<typeof createRuntime>
