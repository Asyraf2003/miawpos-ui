// Adapter-to-adapter transport seam. No HTTP types cross application ports.
export type ProtectedRequest = <T>(path: string, init: RequestInit, decode: (value: unknown) => T) => Promise<T>
