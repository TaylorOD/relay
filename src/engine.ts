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

type Request = { id: number; born: number; attempt: number }
type Event = {
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

// A stable min heap keeps event order independent of wall clock or render rate.
class EventQueue {
  items: Event[] = []
  before(a: Event, b: Event) {
    return a.at < b.at || (a.at === b.at && a.seq < b.seq)
  }
  push(event: Event) {
    const items = this.items
    items.push(event)
    let i = items.length - 1
    while (i > 0) {
      const p = (i - 1) >> 1
      if (!this.before(items[i], items[p])) break
      ;[items[i], items[p]] = [items[p], items[i]]
      i = p
    }
  }
  pop(): Event | undefined {
    const head = this.items[0]
    const last = this.items.pop()
    if (this.items.length && last) {
      this.items[0] = last
      let i = 0
      while (true) {
        let child = i * 2 + 1
        if (child >= this.items.length) break
        if (child + 1 < this.items.length && this.before(this.items[child + 1], this.items[child]))
          child++
        if (!this.before(this.items[child], this.items[i])) break
        ;[this.items[i], this.items[child]] = [this.items[child], this.items[i]]
        i = child
      }
    }
    return head
  }
}

// Stateless noise gives every request the same service cost across policy runs.
function noise(seed: number, id: number, salt: number) {
  let n = Math.imul(seed ^ id, 0x45d9f3b) ^ Math.imul(salt, 0x27d4eb2d)
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b)
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296
}
const percentile = (values: number[]) => {
  if (!values.length) return 0
  const ordered = [...values].sort((a, b) => a - b)
  return Math.round(ordered[Math.ceil(ordered.length * 0.95) - 1])
}

export class Simulation {
  config: Config
  time = 0
  generated = 0
  success = 0
  failed = 0
  attempts = 0
  trips = 0
  private sequence = 0
  private cursor = 0
  private nextSample = 1000
  private latencies: number[] = []
  private recentLatencies: number[] = []
  private lastSuccess = 0
  private lastFailed = 0
  private faultWasActive = false
  private events = new EventQueue()
  history: Point[] = []
  logs: Log[] = []
  pools: Pool[] = [0, 1].map(() => ({
    active: 0,
    queue: [],
    state: 'closed',
    until: 0,
    failures: 0,
    completed: 0,
    rejected: 0,
  }))
  constructor(config: Partial<Config> = {}) {
    this.config = parseConfig({ ...defaults, ...config })
    this.schedule({ at: 0, kind: 'arrival' })
    this.log('Experiment started. Both regions are healthy.', 'info')
  }
  private schedule(event: Omit<Event, 'seq'>) {
    this.events.push({ ...event, seq: this.sequence++ })
  }
  private log(message: string, type: Log['type']) {
    this.logs.push({ at: this.time, message, type })
    if (this.logs.length > 60) this.logs.shift()
  }
  faultAt(time: number) {
    return time >= this.config.faultStart && time < this.config.faultEnd
  }
  inject() {
    if (this.time >= this.config.faultStart || this.time >= 55000) return
    this.config.faultStart = Math.round(this.time)
    this.config.faultEnd = Math.min(60000, Math.round(this.time) + 20000)
  }
  private refreshFault() {
    const active = this.faultAt(this.time)
    if (active !== this.faultWasActive) {
      this.log(
        active
          ? {
              outage: 'East region offline. Requests are failing.',
              latency: 'East region slowed to 900 ms.',
              surge: 'Traffic surge started. Arrival rate tripled.',
            }[this.config.fault]
          : 'Fault cleared. Recovery underway.',
        active ? 'bad' : 'good',
      )
      this.faultWasActive = active
    }
  }
  private available(pool: Pool) {
    if (!this.config.breaker) return true
    if (pool.state === 'open' && this.time >= pool.until) {
      pool.state = 'half-open'
      this.log('Circuit testing recovery with one request.', 'info')
    }
    return pool.state === 'closed' || (pool.state === 'half-open' && pool.active === 0)
  }
  private attempt(request: Request) {
    if (this.time - request.born >= 1800) {
      this.failed++
      return
    }
    const candidates = this.pools
      .map((pool, index) => ({ pool, index }))
      .filter(({ pool }) => this.available(pool))
    if (!candidates.length) {
      this.retry(request)
      return
    }
    const turn = this.cursor++ % candidates.length
    const chosen =
      this.config.balancing === 'least-busy'
        ? candidates.reduce(
            (best, item) =>
              item.pool.active + item.pool.queue.length < best.pool.active + best.pool.queue.length
                ? item
                : best,
            candidates[turn],
          )
        : candidates[turn]
    this.attempts++
    if (chosen.pool.active < 12) this.start(request, chosen.index)
    else if (chosen.pool.queue.length < 80) chosen.pool.queue.push(request)
    else {
      chosen.pool.rejected++
      this.retry(request)
    }
  }
  private start(request: Request, index: number) {
    if (this.time - request.born >= 1800) {
      this.failed++
      return
    }
    const unhealthy = index === 0 && this.faultAt(this.time)
    const ok = !(unhealthy && this.config.fault === 'outage')
    const cost = !ok
      ? 260
      : unhealthy && this.config.fault === 'latency'
        ? 900
        : 70 + noise(this.config.seed, request.id, 1) * 70
    this.pools[index].active++
    this.schedule({ kind: 'complete', at: this.time + cost, request, pool: index, ok })
  }
  private retry(request: Request) {
    if (this.config.retries && request.attempt < 2 && this.time - request.born < 1500) {
      const delay =
        100 * 2 ** request.attempt + noise(this.config.seed, request.id, request.attempt + 2) * 100
      this.schedule({
        kind: 'attempt',
        at: this.time + delay,
        request: { ...request, attempt: request.attempt + 1 },
      })
    } else this.failed++
  }
  private complete(event: Event) {
    const request = event.request!
    const pool = this.pools[event.pool!]
    pool.active--
    // An outage also interrupts requests that were in flight when it started.
    const ok =
      event.ok && !(event.pool === 0 && this.faultAt(this.time) && this.config.fault === 'outage')
    if (ok) {
      pool.completed++
      pool.failures = 0
      if (pool.state === 'half-open') {
        pool.state = 'closed'
        this.log('Circuit closed. Region is accepting traffic.', 'good')
      }
      if (this.time - request.born <= 1800) {
        this.success++
        this.latencies.push(this.time - request.born)
        this.recentLatencies.push(this.time - request.born)
      } else this.failed++
    } else {
      pool.failures++
      if (
        this.config.breaker &&
        (pool.failures >= 5 || pool.state === 'half-open') &&
        pool.state !== 'open'
      ) {
        pool.state = 'open'
        pool.until = this.time + 3000
        this.trips++
        this.log('East circuit opened. Traffic routed away for 3 s.', 'bad')
        const waiting = pool.queue.splice(0)
        waiting.forEach((item) => this.retry(item))
      }
      this.retry(request)
    }
    while (pool.queue.length && pool.active < 12 && pool.state !== 'open')
      this.start(pool.queue.shift()!, event.pool!)
  }
  private sample() {
    this.history.push({
      second: this.nextSample / 1000,
      success: this.success - this.lastSuccess,
      failed: this.failed - this.lastFailed,
      pending: this.generated - this.success - this.failed,
      latency: percentile(this.recentLatencies),
    })
    this.lastSuccess = this.success
    this.lastFailed = this.failed
    this.recentLatencies = []
    this.nextSample += 1000
  }
  advance(target: number) {
    const end = Math.max(this.time, Math.min(70000, target))
    while (true) {
      const event = this.events.items[0]
      if (this.nextSample <= end && (!event || this.nextSample <= event.at)) {
        this.time = this.nextSample
        this.refreshFault()
        this.sample()
      } else if (event && event.at <= end) {
        this.events.pop()
        this.time = event.at
        this.refreshFault()
        if (event.kind === 'arrival') {
          const request = { id: ++this.generated, born: this.time, attempt: 0 }
          this.attempt(request)
          const rate =
            this.config.rate * (this.config.fault === 'surge' && this.faultAt(this.time) ? 3 : 1)
          const next = this.time + 1000 / rate
          if (next < 60000) this.schedule({ at: next, kind: 'arrival' })
        } else if (event.kind === 'attempt') this.attempt(event.request!)
        else this.complete(event)
      } else break
    }
    this.time = end
    return this.snapshot()
  }
  snapshot(): Snapshot {
    const settled = this.success + this.failed
    return {
      time: this.time,
      generated: this.generated,
      success: this.success,
      failed: this.failed,
      pending: this.generated - settled,
      attempts: this.attempts,
      p95: percentile(this.latencies),
      availability: settled ? (this.success / settled) * 100 : 100,
      trips: this.trips,
      done: this.time >= 60000 && this.events.items.length === 0,
      faultActive: this.faultAt(this.time),
      pools: this.pools.map((pool) => ({
        active: pool.active,
        queued: pool.queue.length,
        state: pool.state,
        completed: pool.completed,
        rejected: pool.rejected,
      })),
      history: [...this.history],
      logs: [...this.logs],
      config: { ...this.config },
    }
  }
}

export function run(config: Partial<Config> = {}) {
  return new Simulation(config).advance(70000)
}
export function compare(config: Config) {
  return {
    baseline: run({ ...config, retries: false, breaker: false, balancing: 'round-robin' }),
    protected: run(config),
  }
}
