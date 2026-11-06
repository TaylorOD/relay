import { useEffect, useRef, useState } from 'react'
import { defaults, parseConfig } from '../simulation/config.ts'
import { Simulation } from '../simulation/engine.ts'
import type { Config, ComparisonResult } from '../simulation/types.ts'
import type { WorkerCommand, WorkerReply } from '../worker-messages.ts'

function initialConfig() {
  try {
    return parseConfig(JSON.parse(new URLSearchParams(location.search).get('experiment') || '{}'))
  } catch {
    return defaults
  }
}

export function useExperiment() {
  const [config, setConfig] = useState(initialConfig)
  const [snapshot, setSnapshot] = useState(() => new Simulation(config).snapshot())
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [comparison, setComparison] = useState<ComparisonResult | null>(null)
  const [comparing, setComparing] = useState(false)
  const [toast, setToast] = useState('')
  const worker = useRef<Worker | null>(null)
  // Ignore results from a run that was reset or had its fault schedule changed.
  const revision = useRef(0)
  // Keep one worker. Config changes reset it rather than creating another one.
  useEffect(() => {
    const active = new Worker(new URL('../worker.ts', import.meta.url), { type: 'module' })
    worker.current = active
    active.onmessage = (event: MessageEvent<WorkerReply>) => {
      if (event.data.revision !== revision.current) return
      if (event.data.type === 'snapshot') {
        setSnapshot(event.data.data)
        if (event.data.data.done) setRunning(false)
      } else {
        setComparison(event.data.data)
        setComparing(false)
      }
    }
    active.onerror = () => {
      setToast('The simulation stopped. Reload the page to try again.')
      setRunning(false)
      setComparing(false)
    }
    active.postMessage({
      type: 'reset',
      config,
      revision: revision.current,
    } satisfies WorkerCommand)
    return () => active.terminate()
  }, [])
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [toast])
  function reset(next = config) {
    next = parseConfig(next)
    revision.current++
    setConfig(next)
    setRunning(false)
    setComparison(null)
    setComparing(false)
    setSnapshot(new Simulation(next).snapshot())
    send({ type: 'reset', config: next, revision: revision.current })
  }
  function change(next: Partial<Config>) {
    reset({ ...config, ...next })
  }
  function toggle() {
    if (snapshot.done) reset()
    send({ type: running ? 'pause' : 'play' })
    setRunning(!running)
  }
  function inject() {
    revision.current++
    setComparison(null)
    setComparing(false)
    send({ type: 'inject', revision: revision.current })
    if (!running) {
      send({ type: 'play' })
      setRunning(true)
    }
  }
  async function share() {
    const url = new URL(location.href)
    url.search = ''
    url.searchParams.set('experiment', JSON.stringify(snapshot.config))
    history.replaceState(null, '', url)
    try {
      await navigator.clipboard.writeText(url.href)
      setToast('Experiment link copied. Same seed, same setup.')
    } catch {
      setToast('Your experiment is in the address bar. Copy that link to share it.')
    }
  }
  function download() {
    const blob = new Blob([JSON.stringify({ version: 1, snapshot, comparison }, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob),
      anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `relay-${config.fault}-${config.seed}.json`
    anchor.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setToast('Experiment report downloaded.')
  }

  function send(command: WorkerCommand) {
    worker.current?.postMessage(command)
  }
  function changeSpeed(value: number) {
    setSpeed(value)
    send({ type: 'speed', speed: value })
  }
  function compare() {
    setComparing(true)
    send({ type: 'compare', config: snapshot.config })
  }
  return {
    config,
    snapshot,
    running,
    speed,
    comparison,
    comparing,
    toast,
    reset,
    change,
    toggle,
    inject,
    share,
    download,
    changeSpeed,
    compare,
  }
}
