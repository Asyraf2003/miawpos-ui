// Transport-only types. Never pass credential DTOs into the application or query cache.
export interface BrowserAuthDto {
  access_token: string
  access_exp: string
  session_exp: string
  trust_level: string
  step_up_required: boolean
}

export interface MeDto {
  account_id: string
  session_id: string
  roles: string[]
  permissions: string[]
  trust_level: string
}
