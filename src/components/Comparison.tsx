import { ArrowDownToLine } from 'lucide-react'
import type { ComparisonResult } from '../simulation/types.ts'
import { format } from '../format.ts'

export function Comparison({
  comparison,
  download,
}: {
  comparison: ComparisonResult
  download: () => void
}) {
  return (
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
  )
}
