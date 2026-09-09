import type { idID } from './catalogs/id-ID'

export type MessageKey = keyof typeof idID
export type MessageCatalog = { readonly [K in MessageKey]: string }
