# relay

Break things. See what holds.

Relay is a reliability playground. Send traffic through two service regions, take one offline, and see what happens when you add retries, change routing, or open a circuit breaker.

[Open the lab](https://www.taylordorsett.com/relay/) · [How it works](docs/engineering.md) · [Interview walkthrough](docs/walkthrough.md)

![Relay running an outage experiment](docs/screenshots/desktop.png)

## Try this first

1. Run the default experiment.
2. At 15 seconds, east goes offline. Watch the circuit open and traffic move west.
3. Compare strategies. Both runs get the same traffic, service costs, and fault schedule.
4. Increase traffic to 240 requests per second. There is no policy that creates unlimited capacity.

The default experiment delivers 6,064 of 7,200 requests without protection and 7,139 with the default protections. Successful request p95 rises from 138 ms to 847 ms. Retries recover requests, but they also add work and waiting. These are results from this model, not measurements of a production system.

## Run it locally

Node 24.12 or newer is required. Node 24 is used in CI.

```sh
npm ci
npm run dev
```

Open the printed URL with `/relay/` at the end.

The simulation also runs directly in Node. It uses the same TypeScript engine as the browser worker.

```sh
npm run simulate
npm run simulate -- --fault latency --rate 200 --seed 17
npm run simulate -- --fault surge --json
```

Use `node src/cli.ts --json > report.json` for a clean JSON file without npm's script header.

## What's here

React and TypeScript for the interface. SVG for the network and charts. A Web Worker for the simulation. A stable binary heap for event scheduling. Node's test runner for the model. Playwright and axe for browser checks. Vite for a static production build.

Three fault scenarios, two routing policies, bounded queues, retries with jitter, a circuit breaker state machine, seeded experiments, shareable URLs, JSON reports, a comparison view, and a field guide.

No AI, accounts, API keys, paid services, or backend to keep alive. GitHub Pages serves the app. Node is used for the CLI, tests, and build. GitHub Pages does not run a Node server.

## Checks

```sh
npm test
npm run build
npx playwright install chromium
npm run test:browser
```

Engine tests cover determinism, playback independence, recovery, saturation, input validation, reproducible fault injection, and request accounting across 36 scenario and policy combinations. Browser tests cover the real worker, controls, comparison results, sharing, exports, keyboard dismissal, overflow, and serious accessibility violations on desktop and phone sizes.

GitHub Actions checks PRs. A successful main branch check starts deployment. A failed check does not publish. Screenshots are in `docs/screenshots/`. To refresh them, run a production preview on port 4173, then `node scripts/capture.mjs`.

## Limits

This is an educational model. Requests arrive at fixed intervals. Each region has 12 concurrent workers and an 80 request queue. The model omits real networking, connection pools, databases, and cloud infrastructure. Its animation illustrates routing rather than individual packets. See the engineering notes before using the numbers in a presentation.

MIT license.
