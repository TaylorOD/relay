import { compare, Simulation } from './simulation/engine.ts'
import { defaults } from './simulation/config.ts'
import type { WorkerCommand, WorkerReply } from './worker-messages.ts'
let simulation = new Simulation(defaults)
let timer: ReturnType<typeof setInterval> | undefined
let speed = 1
let revision = 0
function pause() {
  clearInterval(timer)
  timer = undefined
}
function send() {
  postMessage({ type: 'snapshot', revision, data: simulation.snapshot() } satisfies WorkerReply)
}
function play() {
  if (timer) return
  timer = setInterval(() => {
    simulation.advance(simulation.time + 100 * speed)
    send()
    if (simulation.snapshot().done) pause()
  }, 100)
}
onmessage = (event: MessageEvent<WorkerCommand>) => {
  const message = event.data
  if (message.type === 'reset') {
    pause()
    revision = message.revision
    simulation = new Simulation(message.config)
    send()
  }
  if (message.type === 'play') play()
  if (message.type === 'pause') pause()
  if (message.type === 'speed') speed = message.speed
  if (message.type === 'inject') {
    revision = message.revision
    simulation.inject()
    send()
  }
  if (message.type === 'compare')
    postMessage({
      type: 'comparison',
      revision,
      data: compare(message.config),
    } satisfies WorkerReply)
}
