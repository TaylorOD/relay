import { Terminal } from 'lucide-react'
import type { Snapshot } from '../simulation/types.ts'
import { seconds } from '../format.ts'

export function EventLog({ snapshot }: { snapshot: Snapshot }) {
  return (
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
  )
}
