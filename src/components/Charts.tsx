import type { Snapshot } from '../simulation/types.ts'

export function Sparkline({
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

export function Timeline({ snapshot }: { snapshot: Snapshot }) {
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
