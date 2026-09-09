import { idID } from './catalogs/id-ID'
import { enUS } from './catalogs/en-US'
import type { Locale } from './locale'
import type { MessageKey } from './message-keys'

export function translate(locale: Locale, key: MessageKey, params: Readonly<Record<string, string | number>> = {}) {
  const requested: Readonly<Record<string, string>> = locale === 'en-US' ? enUS : idID
  const fallback: Readonly<Record<string, string>> = idID
  const text = requested[key] ?? fallback[key] ?? `⟦${key}⟧`
  return text.replace(/\{(\w+)\}/g, (placeholder: string, name: string) => {
    const value = Object.hasOwn(params, name) ? params[name] : undefined
    return typeof value === 'string' || typeof value === 'number' ? String(value) : placeholder
  })
}
