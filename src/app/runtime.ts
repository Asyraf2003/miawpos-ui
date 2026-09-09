import { QueryClient } from '@tanstack/react-query'
import { HttpClient, type Fetch } from '../adapters/api/http-client'
import { BrowserSessionAdapter } from '../adapters/session/browser-session-adapter'

export const sessionKey = ['session'] as const

export function createRuntime(fetcher: Fetch = globalThis.fetch.bind(globalThis)) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity, refetchOnWindowFocus: false, refetchOnReconnect: false }, mutations: { retry: false } },
  })
  const session = new BrowserSessionAdapter(new HttpClient(fetcher), () => {
    // The adapter guards in-flight principal reads with its session generation.
    // Cancel and remove every other protected query before admitting a new user.
    const otherQueries = { predicate: (query: { queryKey: readonly unknown[] }) => query.queryKey[0] !== sessionKey[0] }
    void queryClient.cancelQueries(otherQueries)
    queryClient.removeQueries(otherQueries)
    queryClient.getMutationCache().clear()
    queryClient.setQueryData(sessionKey, null)
  })
  return { queryClient, session, googleLoginURL: '/api/auth/browser/google/start' }
}

export type Runtime = ReturnType<typeof createRuntime>
