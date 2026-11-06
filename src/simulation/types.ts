export type Fault = 'outage' | 'latency' | 'surge'
export type Config = {
  seed: number
  rate: number
  fault: Fault
  faultStart: number
  faultEnd: number
  retries: boolean
  breaker: boolean
  balancing: 'round-robin' | 'least-busy'
}
export type Request = { id: number; born: number; attempt: number }
export type Event = {
  at: number
  seq: number
  kind: 'arrival' | 'attempt' | 'complete'
  request?: Request
  pool?: number
  ok?: boolean
}
export type Pool = {
  active: number
  queue: Request[]
  state: 'closed' | 'open' | 'half-open'
  until: number
  failures: number
  completed: number
  rejected: number
}
export type Log = { at: number; message: string; type: 'info' | 'bad' | 'good' }
export type Point = {
  second: number
  success: number
  failed: number
  pending: number
  latency: number
}
export type Snapshot = {
  time: number
  generated: number
  success: number
  failed: number
  pending: number
  attempts: number
  p95: number
  availability: number
  trips: number
  done: boolean
  faultActive: boolean
  pools: {
    active: number
    queued: number
    state: Pool['state']
    completed: number
    rejected: number
  }[]
  history: Point[]
  logs: Log[]
  config: Config
}

export type ComparisonResult = { baseline: Snapshot; protected: Snapshot }
