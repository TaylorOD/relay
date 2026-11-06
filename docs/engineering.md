# how relay works

## The problem

Reliability patterns are easy to name and harder to reason about together. A retry can recover a request or make an overloaded queue worse. A circuit breaker can stop wasted work, but cannot make the remaining service bigger.

Relay makes those interactions visible and repeatable. The browser and Node CLI share one simulation implementation.

## Architecture

`React interface → Worker messages → Simulation → stable event heap`

`Node CLI → same Simulation → comparison report`

The engine does not read the clock, browser state, network, or random number generator. It owns simulated time. A binary min heap orders events by timestamp and then insertion sequence. Insertion and removal are O(log n). The UI asks the worker to advance simulated time and renders serializable snapshots. Playback speed changes the advance interval, not model behavior.

Service time and retry jitter use a stateless integer hash of the experiment seed, request ID, and a salt. Policy changes cannot consume random values in a different order and accidentally change unrelated service costs. Both sides of a comparison have the same offered traffic.

The worker sends updates at ten frames per wall clock second. SVG routing animations stay on the UI thread. A comparison runs both policies in the worker without blocking controls. A run has at most about 30,000 original requests at the supported bounds. Latency samples are exact and retained only for the current bounded run. This favors clarity over a streaming quantile sketch.

## Reading and changing the code

`main.tsx` mounts the page. `App.tsx` arranges the components. The components receive data and callbacks, while `useExperiment` owns run state and sends typed commands to the worker. The worker advances the simulation and returns snapshots. It does not render the interface.

The simulation folder has no React or browser dependencies. `config.ts` validates shared settings, `types.ts` describes the data, `event-queue.ts` owns event ordering, and `engine.ts` handles routing and request lifecycles. The Node CLI imports these same modules.

For a presentation change, start in the corresponding component and stylesheet. For a new fault, update the configuration allowlist, the engine behavior, and `scenarios.ts`, then extend the existing engine and browser cases. For a new worker command, update the message union first so TypeScript points out every affected caller.

Keep the model tests focused on behavior and invariants. A refactor should preserve complete simulation reports for the same input, not merely keep a few headline numbers close. Keep comments for decisions such as seeded noise, stable event ordering, and ignoring stale worker results. Use the docs for longer explanations.

## Request lifecycle

An original request gets an ID and arrival time. The router chooses an available region. It starts immediately if a worker is free, joins the bounded FIFO queue if there is room, or is rejected. Rejections and service failures may schedule a retry. A successful completion before the deadline settles the request. Otherwise the request eventually settles as failed. A retry keeps the original ID and arrival time.

Each region has 12 workers and 80 queue slots. Healthy service takes 70 to 140 ms. An outage fails attempts after 260 ms. The latency fault makes east take 900 ms. The surge fault triples arrivals for its fault window. In flight requests reaching an offline region also fail. Already started slow work keeps its assigned service duration after recovery.

There are at most two retries. Backoff is 100 ms and 200 ms plus up to 100 ms of seeded jitter. The original request deadline is 1,800 ms. Waiting and service time both count. The model does not cancel work at its deadline, so some work completes too late to count as delivered.

## Circuit states

Closed accepts traffic. Five consecutive service failures open the circuit and reroute queued work through the retry policy. Open refuses new assignments for three seconds. Half open admits one probe when no older work remains. A successful probe closes it. A failed probe opens it again.

Capacity rejection does not trip the circuit. A slow success resets the consecutive failure count even if the original request misses its deadline. This is intentional: this breaker detects service errors, not latency. The slow dependency scenario makes that limitation visible.

## Metrics

| Metric | Definition |
| --- | --- |
| Success rate | Successful original requests divided by settled original requests |
| p95 | Nearest rank 95th percentile of successful end to end latency |
| Pending | Generated minus successful minus failed |
| Attempts | Assignments to a region, including queue rejection |
| Throughput | Settled requests in each simulated one second bucket |
| Circuit trips | Transitions into open, including failed recovery probes |

Transient success rate can look good while requests are still waiting. Compare completed runs before drawing conclusions. p95 excludes failures, so lower p95 can coexist with worse delivery. The 60 second traffic period is followed by up to ten seconds for draining. The CLI advances through the full drain window. Interactive playback stops once all requests settle.

## Decisions and tradeoffs

1. A discrete event engine instead of one timer per request. It is reproducible, fast to compare, and independent of browser scheduling.
2. One shared TypeScript engine instead of separate browser and server versions. There is no translation layer that can drift.
3. A static app instead of a hosted backend. The project remains usable on free GitHub Pages. The Node CLI provides a headless interface without pretending Pages runs server code.
4. A fixed topology instead of a general diagram editor. The first version focuses on explaining behavior well. A future editor would need graph validation and an explicit service contract.
5. Exact latency samples instead of approximate quantiles. The run size is bounded. Larger experiments should use a histogram or quantile sketch and batch snapshots.
6. Two regional queues instead of a global queue. Routing strategy can change utilization and head of line waiting.

## Verification and release

Unit tests check all request accounting and queue bounds across 36 combinations, plus deterministic replay and recovery. Browser tests exercise the built site and real worker at desktop and phone sizes. They also run axe, check keyboard dismissal, and reject horizontal page overflow. Screenshots are manually inspected before publication.

The lockfile is committed. PRs run tests and a type checked production build. Production builds use the exact commit of a passing main workflow, then update `gh-pages` without deleting open previews. PR Preview Action v1.8.2 publishes each same repository PR into its own directory and removes it on close. Both publishers share a deployment queue and avoid force pushes. To roll back, revert the offending commit through a PR and let the same checks run.

Inputs from shared URLs are validated, enums are allowlisted, and numeric bounds are clamped. React escapes displayed strings. Reports are local JSON downloads. The app makes no application API calls and stores no user data. Fonts are loaded from Google Fonts with system fallbacks.

## What this does not prove

It is not a network emulator or capacity planning tool. It does not simulate TCP, retries from multiple layers, autoscaling, databases, persistent connections, correlated region failures, or real cloud costs. Traffic is evenly spaced rather than bursty within a rate interval. One fault window is supported per run. Inject now moves that window earlier and preserves it in shared settings.

The next useful extensions would be configurable service graphs, deadline cancellation, latency based circuit trips, and a load generator that can replay recorded arrival intervals. Each would need new invariants and tests before adding more controls.
