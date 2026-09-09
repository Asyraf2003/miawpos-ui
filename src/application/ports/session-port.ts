import type { SessionPrincipal } from '../../domain/session'

export interface SessionPort {
  loginManual(email: string, password: string): Promise<SessionPrincipal>
  bootstrap(): Promise<SessionPrincipal | null>
  logout(): Promise<void>
}
