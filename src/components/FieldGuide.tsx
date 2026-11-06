import { ArrowUpRight, X } from 'lucide-react'
import { useEffect, useRef } from 'react'

export function FieldGuide({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (open) dialog.current?.showModal()
    else dialog.current?.close()
  }, [open])
  return (
    <dialog
      ref={dialog}
      aria-labelledby="guide-title"
      onCancel={() => onClose()}
      onClick={(e) => {
        if (e.target === dialog.current) onClose()
      }}
    >
      <div className="guide">
        <button
          className="close-guide icon-button"
          aria-label="Close field guide"
          onClick={() => onClose()}
        >
          <X size={20} />
        </button>
        <div className="eyebrow">RELAY / FIELD GUIDE</div>
        <h2 id="guide-title">Break it. Then explain it.</h2>
        <p>
          Imagine a shopping app loading a product page. Relay models its backend running in two
          regions, so you can see what happens when one copy fails.
        </p>
        <h3>Put names to the boxes</h3>
        <dl className="stack-glossary">
          <dt>React frontend</dt>
          <dd>The page in the customer's browser. It sends a request for product data.</dd>
          <dt>NGINX load balancer</dt>
          <dd>The traffic router. It chooses which backend copy receives that request.</dd>
          <dt>Node.js API servers</dt>
          <dd>
            Two copies of the same backend, one east and one west. Each handles product requests.
          </dd>
          <dt>Redis cache</dt>
          <dd>
            A place behind the API to keep frequently used data ready without querying the database
            every time.
          </dd>
          <dt>PostgreSQL database</dt>
          <dd>The persistent store for the product catalog behind the API.</dd>
        </dl>
        <p>
          These names illustrate a familiar stack. Relay simulates requests and API workers rather
          than running those servers. Redis and PostgreSQL are context only: cache behavior and
          database queries are outside this model.
        </p>
        <h3>A quick experiment</h3>
        <ol>
          <li>
            Keep the defaults and press <strong>Run experiment</strong>.
          </li>
          <li>At 15 seconds, the east Node.js API goes offline. Watch its circuit open.</li>
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
          <strong>Retries</strong> get two more attempts with exponential backoff and deterministic
          jitter. Each original request has a 1,800 ms deadline.
        </p>
        <p>
          <strong>Circuit breakers</strong> open after five consecutive failures. After three
          seconds, one probe tests recovery. A successful probe closes the circuit.
        </p>
        <h3>The model, honestly</h3>
        <p>
          Each region has 12 concurrent workers and 80 queue slots. Healthy service takes 70 to 140
          ms. An outage fails attempts after 260 ms. A slow region takes 900 ms. A spike triples the
          arrival rate.
        </p>
        <p>
          The experiment generates traffic for 60 seconds, then drains for up to 10 seconds.
          Availability counts settled original requests. p95 includes successful requests only.
          Timeline values are one second buckets. Path animations illustrate routing, not individual
          packets.
        </p>
        <p>
          This is a learning model, not a production capacity forecast. It does not model TCP, real
          cloud regions, shared databases, persistent connections, or correlated infrastructure
          failures. The traffic source is evenly spaced and the queues are bounded.
        </p>
        <h3>Reproduce it in Node</h3>
        <pre tabIndex={0}>
          npm install{'\n'}npm run simulate -- --fault outage --rate 120 --seed 42{'\n'}npm run
          simulate -- --json
        </pre>
        <p>
          Sharing saves your configuration and fault schedule in the URL. Reports export the current
          snapshot and any completed comparison. No accounts, API keys, or remote simulation
          servers.
        </p>
        <a className="guide-source" href="https://github.com/TaylorOD/relay">
          Explore the code <ArrowUpRight size={15} />
        </a>
      </div>
    </dialog>
  )
}
