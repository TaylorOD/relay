import { ChevronDown, CircleHelp, ShieldCheck, SlidersHorizontal } from 'lucide-react'
import type { Config } from '../simulation/types.ts'
import { scenarios } from '../scenarios.ts'

export function Controls({
  config,
  change,
}: {
  config: Config
  change: (changes: Partial<Config>) => void
}) {
  const scenario = scenarios[config.fault]
  return (
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
          onChange={(e) => change({ seed: Math.max(1, Math.min(999999, +e.target.value || 1)) })}
        />
      </div>
      <p className="reset-note">Changing a setting starts a fresh experiment.</p>
    </aside>
  )
}
