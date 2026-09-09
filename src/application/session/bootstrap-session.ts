import type { SessionPort } from '../ports/session-port'

export const bootstrapSession = (port: SessionPort) => port.bootstrap()
