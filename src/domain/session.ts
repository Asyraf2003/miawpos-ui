export interface SessionPrincipal {
  accountId: string
  sessionId: string
  roles: readonly string[]
  permissions: readonly string[]
  trustLevel: string
}
