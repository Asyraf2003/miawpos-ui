import { outcome } from '../../domain/outcome'
import type { SessionPort } from '../ports/session-port'

export async function logout(port: SessionPort) {
  await port.logout()
  return outcome('auth.logged_out')
}
