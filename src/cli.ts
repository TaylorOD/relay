import { compare } from './simulation/engine.ts'
import { defaults, parseConfig } from './simulation/config.ts'
const args = process.argv.slice(2)
if (args.includes('--help')) {
  console.log(
    'Relay: node src/cli.ts [--rate 120] [--seed 42] [--fault outage|latency|surge] [--json]',
  )
  process.exit(0)
}
const input: Record<string, unknown> = { ...defaults }
for (let i = 0; i < args.length; i++) {
  const flag = args[i]
  if (flag === '--json') continue
  if (!['--rate', '--seed', '--fault'].includes(flag) || args[i + 1] === undefined)
    throw new Error(`Unknown or incomplete option: ${flag}`)
  const value = args[++i]
  if (flag === '--fault') {
    if (!['outage', 'latency', 'surge'].includes(value))
      throw new Error('Fault must be outage, latency or surge')
    input.fault = value
  } else {
    const number = Number(value)
    const max = flag === '--rate' ? 300 : 999999
    const min = flag === '--rate' ? 20 : 1
    if (!Number.isInteger(number) || number < min || number > max)
      throw new Error(`${flag} must be an integer from ${min} to ${max}`)
    input[flag.slice(2)] = number
  }
}
const results = compare(parseConfig(input))
if (args.includes('--json')) console.log(JSON.stringify({ version: 1, ...results }, null, 2))
else {
  console.log('\nRELAY / reliability experiment\n')
  console.table(
    Object.entries(results).map(([policy, result]) => ({
      policy,
      requests: result.generated,
      delivered: result.success,
      failed: result.failed,
      'success %': result.availability.toFixed(2),
      'p95 ms': result.p95,
      attempts: result.attempts,
      'circuit trips': result.trips,
    })),
  )
  console.log(
    '60 seconds of simulated traffic. Same seed and fault schedule. No network requests.\n',
  )
}
