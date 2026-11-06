import { test } from 'node:test'
import assert from 'node:assert/strict'
import { compare, defaults, parseConfig, run, Simulation } from '../src/engine.ts'

test('the same seed and configuration produce the same complete report', () => {
  assert.deepEqual(run(), run())
  assert.notDeepEqual(run({ seed: 42 }), run({ seed: 43 }))
})
test('playback chunk size does not change event ordering or results', () => {
  const simulation = new Simulation()
  for (let time = 100; time <= 70000; time += 100) simulation.advance(time)
  assert.deepEqual(simulation.snapshot(), run())
})
test('every generated request settles exactly once under all scenarios and policies', () => {
  for (const fault of ['outage', 'latency', 'surge'] as const) {
    for (const rate of [20, 120, 300]) {
      for (const retries of [true, false]) {
        for (const breaker of [true, false]) {
          const simulation = new Simulation({ fault, rate, retries, breaker })
          for (let time = 1000; time <= 70000; time += 1000) {
            const result = simulation.advance(time)
            assert.ok(result.pending >= 0)
            for (const pool of result.pools) {
              assert.ok(pool.active >= 0 && pool.active <= 12)
              assert.ok(pool.queued >= 0 && pool.queued <= 80)
            }
          }
          const result = simulation.snapshot()
          assert.equal(
            result.generated,
            result.success + result.failed,
            JSON.stringify({ fault, rate, retries, breaker }),
          )
          assert.equal(result.pending, 0)
          assert.equal(result.done, true)
          assert.ok(result.attempts <= result.generated * 3)
          assert.ok(result.p95 <= 1800)
        }
      }
    }
  }
})
test('healthy low traffic delivers everything without retries', () => {
  const result = run({
    rate: 20,
    faultStart: 60000,
    faultEnd: 60000,
    fault: 'surge',
    retries: false,
  })
  assert.equal(result.failed, 0)
  assert.equal(result.availability, 100)
  assert.equal(result.attempts, result.generated)
})
test('circuit opens during an outage and recovers after a successful probe', () => {
  const simulation = new Simulation()
  const down = simulation.advance(17000)
  assert.equal(down.pools[0].state, 'open')
  assert.ok(down.trips > 0)
  const recovered = simulation.advance(45000)
  assert.equal(recovered.pools[0].state, 'closed')
  assert.ok(recovered.logs.some((log) => log.message.includes('Circuit closed')))
})
test('protected and baseline comparisons have identical offered traffic', () => {
  const result = compare(defaults)
  assert.equal(result.baseline.generated, result.protected.generated)
  assert.ok(result.protected.success > result.baseline.success)
  assert.ok(result.protected.attempts > result.baseline.attempts)
})
test('surge increases demand and saturates finite queues', () => {
  const result = run({ fault: 'surge', rate: 300 })
  assert.ok(result.generated > run({ rate: 300 }).generated)
  assert.ok(result.failed > 0)
  assert.ok(result.pools.some((pool) => pool.rejected > 0))
})
test('untrusted URL input is bounded and cannot select unknown policies', () => {
  assert.deepEqual(parseConfig(null), defaults)
  const result = parseConfig({
    seed: -9,
    rate: Infinity,
    fault: '<script>',
    retries: 'false',
    faultStart: 55000,
    faultEnd: 1000,
  })
  assert.equal(result.seed, 1)
  assert.equal(result.rate, 120)
  assert.equal(result.fault, 'outage')
  assert.equal(result.retries, true)
  assert.equal(result.faultEnd, 56000)
})
test('inject records a reproducible schedule in the exported config', () => {
  const simulation = new Simulation()
  simulation.advance(7300)
  simulation.inject()
  const config = simulation.snapshot().config
  assert.equal(config.faultStart, 7300)
  assert.equal(config.faultEnd, 27300)
  assert.deepEqual(simulation.advance(70000), run(config))
})
