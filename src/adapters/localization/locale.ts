export type Locale = 'id-ID' | 'en-US'
const key = 'miawpos.locale'

function match(value: string): Locale | undefined {
  if (/^id(?:-|$)/i.test(value)) return 'id-ID'
  if (/^en(?:-|$)/i.test(value)) return 'en-US'
}

export function resolveLocale(saved: string | null, languages: readonly string[]): Locale {
  if (saved !== null) return match(saved) ?? 'id-ID'
  for (const language of languages) {
    const locale = match(language)
    if (locale) return locale
  }
  return 'id-ID'
}

export function readLocale(): Locale {
  let saved: string | null = null
  try { saved = localStorage.getItem(key) } catch { /* Storage may be unavailable. */ }
  return resolveLocale(saved, navigator.languages)
}

export function saveLocale(locale: Locale) {
  try { localStorage.setItem(key, locale) } catch { /* The current tab still switches. */ }
}
