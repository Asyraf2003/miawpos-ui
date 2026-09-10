import { useEffect, useRef, useState, type ReactNode } from 'react'
import { QueryClientProvider, useQuery } from '@tanstack/react-query'
import { bootstrapSession } from '../application/session/bootstrap-session'
import { logout as logoutSession } from '../application/session/logout'
import { outcomeFrom, type Outcome } from '../domain/outcome'
import { readLocale, saveLocale, type Locale } from '../adapters/localization/locale'
import { translate } from '../adapters/localization/translate'
import { LocaleContext, SessionContext } from '../presentation/context'
import { sessionKey, type Runtime } from './runtime'
import { RootProvider } from './root-provider'
import { WorkspacePorts } from '../presentation/workspace-ports'

function SessionProvider({ runtime, children }: { runtime: Runtime; children: ReactNode }) {
  const session = useQuery({ queryKey: sessionKey, queryFn: () => bootstrapSession(runtime.session) })
  const [notice, setNotice] = useState<Outcome | null>(null)
  const [pending, setPending] = useState(false)
  const busy = useRef(false)

  async function logout() {
    if (busy.current) return
    busy.current = true
    setPending(true)
    setNotice(null)
    try { setNotice(await logoutSession(runtime.session)) }
    catch (error) { setNotice(outcomeFrom(error)) }
    finally { busy.current = false; setPending(false) }
  }

  return <SessionContext.Provider value={{
    principal: session.data ?? null,
    bootstrapping: session.isFetching && !session.data,
    bootstrapError: session.isError ? outcomeFrom(session.error) : null,
    notice, pending, googleLoginURL: runtime.googleLoginURL, logout,
    retryBootstrap: () => { void session.refetch() },
  }}>{session.data ? <RootProvider key={session.data.sessionId} runtime={runtime}>{children}</RootProvider> : children}</SessionContext.Provider>
}

export function Providers({ runtime, children }: { runtime: Runtime; children: ReactNode }) {
  const [locale, updateLocale] = useState<Locale>(readLocale)
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (runtime.cash.hasPending()) event.preventDefault() }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [runtime])
  useEffect(() => { document.documentElement.lang = locale }, [locale])
  function setLocale(next: Locale) { saveLocale(next); updateLocale(next) }
  return <LocaleContext.Provider value={{ locale, setLocale, t: (key, params) => translate(locale, key, params) }}>
    <QueryClientProvider client={runtime.queryClient}>
      <WorkspacePorts.Provider value={{ catalog: runtime.catalog, sales: runtime.sales, cash: runtime.cash }}><SessionProvider runtime={runtime}>{children}</SessionProvider></WorkspacePorts.Provider>
    </QueryClientProvider>
  </LocaleContext.Provider>
}
