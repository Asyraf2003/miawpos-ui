import { outcome, OutcomeError } from './outcome'

export function positiveInteger(text: string): number {
  const value = Number(text)
  if (!/^\d+$/.test(text) || !Number.isSafeInteger(value) || value <= 0) throw new OutcomeError(outcome('validation.invalid_value'))
  return value
}
