import { createContext, useContext } from 'react'
import type { SessionPrincipal } from '../domain/session'
import type { Outcome } from '../domain/outcome'
import type { Locale } from '../adapters/localization/locale'
import type { MessageKey } from '../adapters/localization/message-keys'

interface SessionContextValue {
  principal: SessionPrincipal | null
  bootstrapping: boolean
  bootstrapError: Outcome | null
  notice: Outcome | null
  pending: boolean
  googleLoginURL: string
  logout(): Promise<void>
  retryBootstrap(): void
}

interface LocaleContextValue {
  locale: Locale
  setLocale(locale: Locale): void
  t(key: MessageKey, params?: Readonly<Record<string, string | number>>): string
}

export const SessionContext = createContext<SessionContextValue | null>(null)
export const LocaleContext = createContext<LocaleContextValue | null>(null)

export function useSession() {
  const context = useContext(SessionContext)
  if (!context) throw new Error('Session provider missing')
  return context
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (!context) throw new Error('Locale provider missing')
  return context
}
