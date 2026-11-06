import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  CircleHelp,
  Code2,
  Cpu,
  GitBranch,
  Link2,
  Pause,
  Play,
  Radio,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Terminal,
  Unplug,
  X,
  Zap,
} from 'lucide-react'
import { defaults, parseConfig, Simulation } from './engine.ts'
import type { Config, Snapshot } from './engine.ts'
import './style.css'

const scenarios = {
  outage: {
    name: 'Region outage',
    subtitle: 'One region goes dark. Can the other keep up?',
    icon: Unplug,
    label: 'Take east offline',
    short: 'East region offline',
  },
  latency: {
    name: 'Slow dependency',
    subtitle: 'A slow service can be worse than a dead one.',
    icon: Cpu,
    label: 'Slow east region',
    short: 'East latency at 900 ms',
  },
  surge: {
    name: 'Traffic spike',
    subtitle: 'Triple the traffic. Find your breaking point.',
    icon: Zap,
    label: 'Triple the traffic',
    short: 'Traffic at 3× normal',
  },
}
function initialConfig() {
  try {
    return parseConfig(JSON.parse(new URLSearchParams(location.search).get('experiment') || '{}'))
  } catch {
    return defaults
  }
}
const format = (value: number) => value.toLocaleString('en-US')
const seconds = (value: number) => `${(value / 1000).toFixed(1)}s`

function Sparkline({
  snapshot,
  kind,
}: {
  snapshot: Snapshot
  kind: 'success' | 'latency' | 'pending'
}) {
  const values = snapshot.history.map((point) => point[kind])
  const max = Math.max(1, ...values)
  const points = values
    .map((value, i) => `${(i * 140) / Math.max(1, values.length - 1)},${32 - (value / max) * 27}`)
    .join(' ')
  return (
    <svg className="sparkline" viewBox="0 0 140 36" aria-hidden="true">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function Topology({ snapshot, running }: { snapshot: Snapshot; running: boolean }) {
  const fault = snapshot.faultActive
  const eastDown = fault && snapshot.config.fault === 'outage'
  const eastSlow = fault && snapshot.config.fault === 'latency'
  const pools = snapshot.pools
  const node = (
    x: number,
    y: number,
    title: string,
    label: string,
    icon: string,
    status = 'healthy',
  ) => (
    <g transform={`translate(${x} ${y})`} className={`map-node ${status}`}>
      <rect width="152" height="88" rx="10" />
      <rect className="icon-tile" x="13" y="14" width="26" height="26" rx="6" />
      <text x="26" y="33" className="node-symbol" textAnchor="middle">
        {icon}
      </text>
      <circle className="status-dot" cx="133" cy="24" r="3.5" />
      <text className="node-title" x="13" y="58">
        {title}
      </text>
      <text className="node-sub" x="13" y="75">
        {label}
      </text>
    </g>
  )
  return (
    <div className={`topology ${running && !snapshot.done ? 'flowing' : ''}`}>
      <div className="map-top">
        <span>
          <span className="tiny-dot" /> STOREFRONT / PRODUCTION MODEL
        </span>
        <span className="map-status">{fault ? 'FAULT IN PROGRESS' : 'ALL SYSTEMS NOMINAL'}</span>
      </div>
      <svg
        className="network desktop-network"
        viewBox="0 0 960 342"
        role="img"
        aria-label={`System topology. ${eastDown ? 'East region offline' : eastSlow ? 'East region slow' : 'Both regions healthy'}. West has ${pools[1].active} active requests.`}
      >
        <defs>
          <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r=".8" fill="#2d3c41" />
          </pattern>
        </defs>
        <rect width="960" height="342" fill="url(#dots)" />
        <rect className="region-boundary" x="469" y="12" width="194" height="142" rx="12" />
        <rect className="region-boundary" x="469" y="187" width="194" height="142" rx="12" />
        <text className="region-label" x="485" y="33">
          REGION 01 / EAST
        </text>
        <text className="region-label" x="485" y="208">
          REGION 02 / WEST
        </text>
        <g fill="none" strokeWidth="1.6">
          <path className="wire" d="M189 171 H264" />
          <path
            className={`wire ${eastDown ? 'broken' : ''}`}
            d="M416 171 H446 Q456 171 456 161 V106 Q456 96 466 96 H490"
          />
          <path className="wire" d="M416 171 H446 Q456 171 456 181 V271 Q456 281 466 281 H490" />
          <path
            className={`wire ${eastDown ? 'broken' : ''}`}
            d="M642 96 H695 Q705 96 705 106 V161 Q705 171 715 171 H756"
          />
          <path className="wire" d="M642 281 H695 Q705 281 705 271 V181 Q705 171 715 171 H756" />
          <path className="packet" d="M189 171 H264" />
          {!eastDown && (
            <path
              className="packet packet-east"
              d="M416 171 H446 Q456 171 456 161 V106 Q456 96 466 96 H490 M642 96 H695 Q705 96 705 106 V161 Q705 171 715 171 H756"
            />
          )}
          <path
            className="packet packet-west"
            d="M416 171 H446 Q456 171 456 181 V271 Q456 281 466 281 H490 M642 281 H695 Q705 281 705 271 V181 Q705 171 715 171 H756"
          />
        </g>
        {node(
          37,
          127,
          'Incoming traffic',
          `${snapshot.config.rate * (fault && snapshot.config.fault === 'surge' ? 3 : 1)} requests / sec`,
          '↗',
        )}
        {node(
          264,
          127,
          'Load balancer',
          snapshot.config.balancing === 'least-busy' ? 'Least busy routing' : 'Round robin routing',
          '⑂',
        )}
        {node(
          490,
          52,
          'East service',
          eastDown ? 'Connection refused' : `${pools[0].active} active · ${pools[0].queued} queued`,
          '▤',
          eastDown ? 'offline' : eastSlow ? 'slow' : 'healthy',
        )}
        {node(
          490,
          237,
          'West service',
          `${pools[1].active} active · ${pools[1].queued} queued`,
          '▤',
        )}
        {node(756, 127, 'Response', `${format(snapshot.success)} delivered`, '✓')}
        <text
          className={`breaker-label ${pools[0].state === 'open' ? 'tripped' : ''}`}
          x="566"
          y="171"
          textAnchor="middle"
        >
          {snapshot.config.breaker ? `CIRCUIT ${pools[0].state.toUpperCase()}` : 'CIRCUIT DISABLED'}
        </text>
        <text className="wire-label" x="225" y="158" textAnchor="middle">
          HTTPS
        </text>
      </svg>
      <svg
        className="mobile-network"
        viewBox="0 0 360 365"
        role="img"
        aria-label={`System topology. ${eastDown ? 'East region offline' : eastSlow ? 'East region slow' : 'Both regions healthy'}. West has ${pools[1].active} active requests.`}
      >
        <rect width="360" height="365" fill="url(#dots)" />
        <g fill="none" strokeWidth="1.6">
          <path className="wire" d="M180 100 V130 M180 218 V238 H88 V263 M180 238 H272 V263" />
          <path className="packet" d="M180 100 V130 M180 218 V238 H272 V263" />
          {!eastDown && <path className="packet" d="M180 218 V238 H88 V263" />}
        </g>
        {node(
          104,
          12,
          'Incoming traffic',
          `${snapshot.config.rate * (fault && snapshot.config.fault === 'surge' ? 3 : 1)} requests / sec`,
          '↗',
        )}
        {node(
          104,
          130,
          'Load balancer',
          snapshot.config.balancing === 'least-busy' ? 'Least busy routing' : 'Round robin routing',
          '⑂',
        )}
        {node(
          12,
          263,
          'East service',
          eastDown ? 'Connection refused' : `${pools[0].active} active · ${pools[0].queued} queued`,
          '▤',
          eastDown ? 'offline' : eastSlow ? 'slow' : 'healthy',
        )}
        {node(
          196,
          263,
          'West service',
          `${pools[1].active} active · ${pools[1].queued} queued`,
          '▤',
        )}
        <text
          className={`breaker-label ${pools[0].state === 'open' ? 'tripped' : ''}`}
          x="88"
          y="256"
          textAnchor="middle"
        >
          {snapshot.config.breaker ? `CIRCUIT ${pools[0].state.toUpperCase()}` : 'NO CIRCUIT'}
        </text>
      </svg>
      <div className="map-bottom">
        <span>
          <i className="legend-dot green" /> Healthy <i className="legend-dot orange" /> Degraded{' '}
          <i className="legend-dot red" /> Offline
        </span>
        <span>Animated paths show routing, not individual requests</span>
      </div>
    </div>
  )
}

function Timeline({ snapshot }: { snapshot: Snapshot }) {
  const width = 920,
    height = 100
  const peak = Math.max(
    snapshot.config.rate * 1.2,
    ...snapshot.history.map((point) => point.success + point.failed),
  )
  const line = (key: 'success' | 'failed') =>
    snapshot.history
      .map((point) => `${(point.second / 70) * width},${height - (point[key] / peak) * 88}`)
      .join(' ')
  return (
    <div className="timeline-chart">
      <svg
        viewBox={`0 0 ${width} ${height + 20}`}
        role="img"
        aria-label="Throughput over time. Green is delivered requests per second. Orange is failed requests per second."
      >
        {[0, 1, 2].map((i) => (
          <line
            key={i}
            x1="0"
            x2={width}
            y1={i * 40 + 12}
            y2={i * 40 + 12}
            stroke="#e9e8e1"
            strokeDasharray="4 4"
          />
        ))}
        <rect
          x={(snapshot.config.faultStart / 70000) * width}
          width={((snapshot.config.faultEnd - snapshot.config.faultStart) / 70000) * width}
          height={height}
          fill="#fdf0e9"
        />
        <text
          x={(snapshot.config.faultStart / 70000) * width + 8}
          y="16"
          fill="#a7654b"
          fontSize="10"
        >
          FAULT WINDOW
        </text>
        <polyline points={line('success')} fill="none" stroke="#25846d" strokeWidth="2.5" />
        <polyline points={line('failed')} fill="none" stroke="#e2643e" strokeWidth="2.5" />
        <line
          x1={(snapshot.time / 70000) * width}
          x2={(snapshot.time / 70000) * width}
          y1="0"
          y2={height}
          stroke="#9baba8"
        />
        {[0, 10, 20, 30, 40, 50, 60, 70].map((s) => (
          <text
            key={s}
            x={(s / 70) * width}
            y="118"
            textAnchor={s === 0 ? 'start' : s === 70 ? 'end' : 'middle'}
            fill="#767c77"
            fontSize="10"
          >
            {s}s
          </text>
        ))}
      </svg>
    </div>
  )
}

function App() {
  const [config, setConfig] = useState(initialConfig)
  const [snapshot, setSnapshot] = useState(() => new Simulation(config).snapshot())
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [comparison, setComparison] = useState<{ baseline: Snapshot; protected: Snapshot } | null>(
    null,
  )
  const [comparing, setComparing] = useState(false)
  const [guide, setGuide] = useState(false)
  const [toast, setToast] = useState('')
  const worker = useRef<Worker | null>(null)
  const revision = useRef(0)
  const dialog = useRef<HTMLDialogElement>(null)
  const scenario = scenarios[config.fault]
  useEffect(() => {
    const active = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
    worker.current = active
    active.onmessage = (event) => {
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
    active.postMessage({ type: 'reset', config, revision: revision.current })
    return () => active.terminate()
    // Config changes reset the existing worker rather than creating another one.
  }, [])
  useEffect(() => {
    if (guide) dialog.current?.showModal()
    else dialog.current?.close()
  }, [guide])
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
    worker.current?.postMessage({ type: 'reset', config: next, revision: revision.current })
  }
  function change(next: Partial<Config>) {
    reset({ ...config, ...next })
  }
  function toggle() {
    if (snapshot.done) reset()
    worker.current?.postMessage({ type: running ? 'pause' : 'play' })
    setRunning(!running)
  }
  function inject() {
    worker.current?.postMessage({ type: 'inject' })
    if (!running) {
      worker.current?.postMessage({ type: 'play' })
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
  return (
    <>
      <a className="skip-link" href="#playground">
        Skip to playground
      </a>
      <header className="header">
        <a className="brand" href={import.meta.env.BASE_URL}>
          <span className="brand-mark">
            <GitBranch size={23} strokeWidth={2.4} />
          </span>
          relay<span className="brand-tag">SYSTEMS PLAYGROUND</span>
        </a>
        <nav aria-label="Main navigation">
          <button className="text-button" onClick={() => setGuide(true)}>
            <BookOpen size={16} /> Field guide
          </button>
          <a
            className="source-link"
            href="https://github.com/TaylorOD/relay"
            target="_blank"
            rel="noreferrer"
          >
            <Code2 size={17} /> Source <ArrowUpRight size={14} />
          </a>
        </nav>
      </header>
      <main>
        <section className="intro">
          <div>
            <div className="eyebrow">
              <span /> A SMALL LAB FOR BIG WHAT IFS
            </div>
            <h1>
              Break things.
              <br className="mobile-break" /> <span>See what holds.</span>
            </h1>
            <p>
              A hands on playground for resilient systems. Send traffic, cause a little chaos,
              <br className="desktop-break" /> and discover what keeps a service standing.
            </p>
          </div>
          <div className="intro-note">
            <span className="orbit">
              <Radio size={28} />
            </span>
            <p>
              Real simulation.
              <br />
              Zero production incidents.
            </p>
            <span className="note-number">LAB NO. 001</span>
          </div>
        </section>
        <div className="lab-heading" id="playground">
          <div>
            <span className="section-index">01</span>
            <h2>The experiment</h2>
            <span className="local-label">
              <span /> RUNS IN YOUR BROWSER
            </span>
          </div>
          <button className="text-button share" onClick={share}>
            <Link2 size={15} /> Share setup
          </button>
        </div>
        <div className="lab-layout">
          <aside className="controls" aria-label="Experiment settings">
            <div className="control-heading">
              <SlidersHorizontal size={15} />
              <h3>Set the conditions</h3>
            </div>
            <div className="control-block">
              <div className="label-row">
                <span className="control-label">Failure scenario</span>
                <span>
                  {String(Object.keys(scenarios).indexOf(config.fault) + 1).padStart(2, '0')} / 03
                </span>
              </div>
              <div className="scenario-options">
                {Object.entries(scenarios).map(([key, item]) => (
                  <button
                    key={key}
                    className={`scenario ${config.fault === key ? 'selected' : ''}`}
                    aria-pressed={config.fault === key}
                    onClick={() => change({ fault: key as Config['fault'] })}
                  >
                    <item.icon size={17} />
                    <span>{item.name}</span>
                    <span className="radio-dot" />
                  </button>
                ))}
              </div>
              <p className="control-help">{scenario.subtitle}</p>
            </div>
            <div className="control-block">
              <div className="label-row">
                <label htmlFor="traffic">Incoming traffic</label>
                <span className="traffic-value">
                  {config.rate} <small>req/s</small>
                </span>
              </div>
              <input
                id="traffic"
                type="range"
                min="20"
                max="300"
                step="10"
                value={config.rate}
                onChange={(e) => change({ rate: +e.target.value })}
              />
              <div className="range-labels">
                <span>20 req/s</span>
                <span>300 req/s</span>
              </div>
            </div>
            <div className="control-block">
              <div className="label-row">
                <label htmlFor="balancing">Load balancing</label>
                <CircleHelp size={13} aria-hidden="true" />
              </div>
              <div className="select-wrap">
                <select
                  id="balancing"
                  value={config.balancing}
                  onChange={(e) => change({ balancing: e.target.value as Config['balancing'] })}
                >
                  <option value="least-busy">Least busy</option>
                  <option value="round-robin">Round robin</option>
                </select>
                <ChevronDown size={14} />
              </div>
              <p className="control-help">
                {config.balancing === 'least-busy'
                  ? 'Send each request to the shortest queue.'
                  : 'Take turns sending traffic to each region.'}
              </p>
            </div>
            <div className="control-block protections">
              <div className="label-row">
                <label>Safety mechanisms</label>
                <ShieldCheck size={14} />
              </div>
              {(
                [
                  {
                    key: 'retries',
                    title: 'Retry with backoff',
                    text: 'Two more chances, with jitter.',
                  },
                  {
                    key: 'breaker',
                    title: 'Circuit breaker',
                    text: 'Stop calling a failing region.',
                  },
                ] as const
              ).map((item) => (
                <div className="toggle-row" key={item.key}>
                  <div>
                    <span>{item.title}</span>
                    <small>{item.text}</small>
                  </div>
                  <button
                    role="switch"
                    aria-checked={config[item.key]}
                    aria-label={item.title}
                    className={`switch ${config[item.key] ? 'on' : ''}`}
                    onClick={() => change({ [item.key]: !config[item.key] })}
                  >
                    <span />
                  </button>
                </div>
              ))}
            </div>
            <div className="seed-row">
              <label htmlFor="seed">Experiment seed</label>
              <input
                id="seed"
                type="number"
                min="1"
                max="999999"
                value={config.seed}
                onChange={(e) =>
                  change({ seed: Math.max(1, Math.min(999999, +e.target.value || 1)) })
                }
              />
            </div>
            <p className="reset-note">Changing a setting starts a fresh experiment.</p>
          </aside>
          <div className="workspace">
            <div className="workspace-bar">
              <div>
                <span className={`live-dot ${running ? 'active' : ''}`} />
                <strong>
                  {snapshot.done
                    ? 'Experiment complete'
                    : running
                      ? 'Simulation running'
                      : snapshot.time
                        ? 'Simulation paused'
                        : 'Ready when you are'}
                </strong>
                <span className="clock">
                  {seconds(snapshot.time)} <span>/ 60s + drain</span>
                </span>
              </div>
              <div className="playback">
                <label className="sr-only" htmlFor="speed">
                  Playback speed
                </label>
                <select
                  id="speed"
                  value={speed}
                  onChange={(e) => {
                    setSpeed(+e.target.value)
                    worker.current?.postMessage({ type: 'speed', speed: +e.target.value })
                  }}
                >
                  <option value="1">1×</option>
                  <option value="2">2×</option>
                  <option value="4">4×</option>
                </select>
                <button
                  className="icon-button"
                  onClick={() => reset()}
                  aria-label="Reset experiment"
                >
                  <RotateCcw size={16} />
                </button>
                <button className="run-button" onClick={toggle}>
                  {running ? (
                    <Pause size={14} fill="currentColor" />
                  ) : (
                    <Play size={14} fill="currentColor" />
                  )}
                  {running
                    ? 'Pause'
                    : snapshot.done
                      ? 'Run again'
                      : snapshot.time
                        ? 'Resume'
                        : 'Run experiment'}
                </button>
              </div>
            </div>
            <Topology snapshot={snapshot} running={running} />
            <div className={`fault-bar ${snapshot.faultActive ? 'fault-active' : ''}`}>
              <div>
                <span className="fault-icon">
                  <Zap size={16} />
                </span>
                <p>
                  <strong>
                    {snapshot.faultActive
                      ? scenario.short
                      : snapshot.time >= snapshot.config.faultEnd
                        ? 'Fault cleared. Let the system recover.'
                        : 'A little chaos, on purpose.'}
                  </strong>
                  <span>
                    {snapshot.faultActive
                      ? `Recovery scheduled at ${seconds(snapshot.config.faultEnd)}.`
                      : `Fault scheduled from ${seconds(snapshot.config.faultStart)} to ${seconds(snapshot.config.faultEnd)}.`}
                  </span>
                </p>
              </div>
              <button
                onClick={inject}
                disabled={snapshot.faultActive || snapshot.time >= snapshot.config.faultStart}
              >
                {snapshot.faultActive
                  ? 'Fault active'
                  : snapshot.time >= snapshot.config.faultEnd
                    ? 'Fault complete'
                    : 'Inject now'}
                <Zap size={13} />
              </button>
            </div>
            <div className="metrics">
              <div className="metric">
                <span>
                  Successful requests <span className="metric-dot" />
                </span>
                <strong>
                  {snapshot.availability.toFixed(1)}
                  <small>%</small>
                </strong>
                <div>
                  <small>{format(snapshot.success)} delivered</small>
                  <Sparkline snapshot={snapshot} kind="success" />
                </div>
              </div>
              <div className="metric">
                <span>
                  p95 response time <CircleHelp size={12} />
                </span>
                <strong>
                  {snapshot.p95}
                  <small>ms</small>
                </strong>
                <div>
                  <small>95% finish within this</small>
                  <Sparkline snapshot={snapshot} kind="latency" />
                </div>
              </div>
              <div className="metric">
                <span>
                  In flight + waiting <GitBranch size={12} />
                </span>
                <strong>
                  {format(snapshot.pending)}
                  <small>req</small>
                </strong>
                <div>
                  <small>{format(snapshot.failed)} failed overall</small>
                  <Sparkline snapshot={snapshot} kind="pending" />
                </div>
              </div>
            </div>
            <section className="throughput">
              <div className="panel-heading">
                <h3>Traffic over time</h3>
                <div>
                  <span>
                    <i className="legend-dot green" /> Delivered / s
                  </span>
                  <span>
                    <i className="legend-dot orange" /> Failed / s
                  </span>
                </div>
              </div>
              <Timeline snapshot={snapshot} />
            </section>
          </div>
        </div>
        <div className="below-grid">
          <section className="event-panel">
            <div className="panel-heading">
              <h3>
                <Terminal size={16} /> Event log
              </h3>
              <span className="mono">{snapshot.logs.length} EVENTS</span>
            </div>
            <div className="event-list" tabIndex={0} aria-label="Simulation event log">
              {[...snapshot.logs].reverse().map((log, i) => (
                <div className={`event ${log.type}`} key={`${log.at}-${i}`}>
                  <time>{seconds(log.at)}</time>
                  <span className="event-dot" />
                  <p>{log.message}</p>
                </div>
              ))}
            </div>
          </section>
          <section className="compare-panel">
            <div className="panel-heading">
              <h3>
                <GitBranch size={16} /> The same chaos. A different outcome.
              </h3>
            </div>
            <p>
              Run the full experiment with your settings and an unprotected baseline. Same traffic.
              Same seed. See the tradeoff.
            </p>
            <button
              className="compare-button"
              disabled={comparing}
              onClick={() => {
                setComparing(true)
                worker.current?.postMessage({ type: 'compare', config: snapshot.config })
              }}
            >
              {comparing ? 'Running both experiments…' : 'Compare strategies'}
              <ArrowRight size={16} />
            </button>
            <span className="compare-note">Runs 60 simulated seconds, plus time to drain.</span>
          </section>
        </div>
        {comparison && (
          <section className="comparison" aria-label="Strategy comparison">
            <div className="panel-heading">
              <h3>Your experiment, side by side</h3>
              <button className="text-button" onClick={download}>
                <ArrowDownToLine size={15} /> Export results
              </button>
            </div>
            <div className="comparison-table">
              <table>
                <thead>
                  <tr>
                    <th>Strategy</th>
                    <th>Delivered</th>
                    <th>Success rate</th>
                    <th>p95 latency</th>
                    <th>Attempts</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(comparison).map(([key, value]) => (
                    <tr key={key}>
                      <th>{key === 'baseline' ? 'No protection' : 'Your settings'}</th>
                      <td>{format(value.success)}</td>
                      <td>{value.availability.toFixed(2)}%</td>
                      <td>{value.p95} ms</td>
                      <td>{format(value.attempts)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              {comparison.protected.success >= comparison.baseline.success
                ? `${format(comparison.protected.success - comparison.baseline.success)} more requests delivered with your settings.`
                : `${format(comparison.baseline.success - comparison.protected.success)} fewer requests delivered with your settings.`}{' '}
              Latency is measured only for successful requests. Retries can improve delivery while
              increasing latency and work.
            </p>
          </section>
        )}
        <section className="under-hood">
          <div>
            <span className="section-index">02</span>
            <div>
              <h2>Not magic. Just systems.</h2>
              <p>
                A deterministic event engine, running in a background worker. <br />
                The same TypeScript powers the browser and a Node.js CLI.
              </p>
            </div>
          </div>
          <button className="text-button" onClick={() => setGuide(true)}>
            Read the field guide <ArrowUpRight size={16} />
          </button>
        </section>
        <footer>
          <a href="https://www.taylordorsett.com/">
            Built by Taylor Dorsett <ArrowUpRight size={13} />
          </a>
          <span>SIMULATED TRAFFIC. REAL TRADEOFFS.</span>
          <button className="text-button" onClick={download}>
            <ArrowDownToLine size={14} /> Export run
          </button>
        </footer>
      </main>
      <div role="status" className={`toast ${toast ? 'visible' : ''}`}>
        <Check size={16} />
        {toast}
      </div>
      <dialog
        ref={dialog}
        aria-labelledby="guide-title"
        onCancel={() => setGuide(false)}
        onClick={(e) => {
          if (e.target === dialog.current) setGuide(false)
        }}
      >
        <div className="guide">
          <button
            className="close-guide icon-button"
            aria-label="Close field guide"
            onClick={() => setGuide(false)}
          >
            <X size={20} />
          </button>
          <div className="eyebrow">RELAY / FIELD GUIDE</div>
          <h2 id="guide-title">Break it. Then explain it.</h2>
          <p>
            Relay is a small model of a service running in two regions. It is a place to test an
            idea before explaining it on a whiteboard.
          </p>
          <h3>A quick experiment</h3>
          <ol>
            <li>
              Keep the defaults and press <strong>Run experiment</strong>.
            </li>
            <li>At 15 seconds, east goes offline. Watch its circuit open.</li>
            <li>
              Press <strong>Compare strategies</strong> to see the same outage without protection.
            </li>
            <li>Try 240 requests per second. One healthy region cannot carry everything.</li>
          </ol>
          <h3>What the controls actually do</h3>
          <p>
            <strong>Least busy routing</strong> picks the region with the fewest active and queued
            requests. Round robin takes turns. Neither predicts a failure.
          </p>
          <p>
            <strong>Retries</strong> get two more attempts with exponential backoff and
            deterministic jitter. Each original request has a 1,800 ms deadline.
          </p>
          <p>
            <strong>Circuit breakers</strong> open after five consecutive failures. After three
            seconds, one probe tests recovery. A successful probe closes the circuit.
          </p>
          <h3>The model, honestly</h3>
          <p>
            Each region has 12 concurrent workers and 80 queue slots. Healthy service takes 70 to
            140 ms. An outage fails attempts after 260 ms. A slow region takes 900 ms. A spike
            triples the arrival rate.
          </p>
          <p>
            The experiment generates traffic for 60 seconds, then drains for up to 10 seconds.
            Availability counts settled original requests. p95 includes successful requests only.
            Timeline values are one second buckets. Path animations illustrate routing, not
            individual packets.
          </p>
          <p>
            This is a learning model, not a production capacity forecast. It does not model TCP,
            real cloud regions, shared databases, persistent connections, or correlated
            infrastructure failures. The traffic source is evenly spaced and the queues are bounded.
          </p>
          <h3>Reproduce it in Node</h3>
          <pre>
            npm install{'\n'}npm run simulate -- --fault outage --rate 120 --seed 42{'\n'}npm run
            simulate -- --json
          </pre>
          <p>
            Sharing saves your configuration and fault schedule in the URL. Reports export the
            current snapshot and any completed comparison. No accounts, API keys, or remote
            simulation servers.
          </p>
          <a className="guide-source" href="https://github.com/TaylorOD/relay">
            Explore the code <ArrowUpRight size={15} />
          </a>
        </div>
      </dialog>
    </>
  )
}
createRoot(document.getElementById('root')!).render(<App />)
