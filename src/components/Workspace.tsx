import { CircleHelp, GitBranch, Pause, Play, RotateCcw, Zap } from 'lucide-react'
import type { Snapshot } from '../simulation/types.ts'
import { scenarios } from '../scenarios.ts'
import { format, seconds } from '../format.ts'
import { Topology } from './Topology.tsx'
import { Sparkline, Timeline } from './Charts.tsx'

export function Workspace({
  snapshot,
  running,
  speed,
  changeSpeed,
  reset,
  toggle,
  inject,
}: {
  snapshot: Snapshot
  running: boolean
  speed: number
  changeSpeed: (speed: number) => void
  reset: () => void
  toggle: () => void
  inject: () => void
}) {
  const scenario = scenarios[snapshot.config.fault]
  return (
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
          <select id="speed" value={speed} onChange={(e) => changeSpeed(+e.target.value)}>
            <option value="1">1×</option>
            <option value="2">2×</option>
            <option value="4">4×</option>
          </select>
          <button className="icon-button" onClick={() => reset()} aria-label="Reset experiment">
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
  )
}
