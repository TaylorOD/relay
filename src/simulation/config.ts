import type { Config, Fault } from './types.ts'

export const defaults: Config = {
  seed: 42,
  rate: 120,
  fault: 'outage',
  faultStart: 15000,
  faultEnd: 35000,
  retries: true,
  breaker: true,
  balancing: 'least-busy',
}
export function parseConfig(input: unknown): Config {
  const value = input && typeof input === 'object' ? (input as Record<string, unknown>) : {}
  const number = (key: keyof Config, min: number, max: number) =>
    typeof value[key] === 'number' && Number.isFinite(value[key])
      ? Math.round(Math.max(min, Math.min(max, value[key] as number)))
      : (defaults[key] as number)
  const start = number('faultStart', 0, 55000)
  return {
    seed: number('seed', 1, 999999),
    rate: number('rate', 20, 300),
    fault: ['outage', 'latency', 'surge'].includes(value.fault as string)
      ? (value.fault as Fault)
      : defaults.fault,
    faultStart: start,
    faultEnd: Math.max(start + 1000, number('faultEnd', 1000, 60000)),
    retries: typeof value.retries === 'boolean' ? value.retries : defaults.retries,
    breaker: typeof value.breaker === 'boolean' ? value.breaker : defaults.breaker,
    balancing: value.balancing === 'round-robin' ? 'round-robin' : 'least-busy',
  }
}
