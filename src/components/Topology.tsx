import type { Snapshot } from '../simulation/types.ts'
import { format } from '../format.ts'

export function Topology({ snapshot, running }: { snapshot: Snapshot; running: boolean }) {
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
