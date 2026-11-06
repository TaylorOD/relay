# talking through relay

## The short version

I built a reliability simulator where you can break a service and watch how the system responds. It runs in the browser, but the simulation is a separate TypeScript engine that also runs in Node. I wanted something where I could explain the behavior and reproduce the numbers.

## A two minute demo

1. Open Relay and run the default scenario at 4× speed.
2. Point out the two regions and the routing policy. At 15 simulated seconds, east goes down.
3. Show the circuit opening, the west queue growing, and latency rising.
4. Compare strategies. The default protected run delivers 7,139 requests versus 6,064 without protection. Successful p95 latency goes up from 138 ms to 847 ms.
5. Explain the tradeoff. More delivered requests does not mean less work or lower latency.
6. Switch to a traffic spike at 300 requests per second. Show that retries cannot fix insufficient capacity.

## Questions worth being ready for

**Why not use real HTTP requests?**

That would test a particular machine and network. This project is about controlled experiments. A deterministic model lets me change one policy and keep the workload the same. A real load test would be a separate validation step.

**Why a Web Worker?**

The engine can process thousands of events during a comparison. Keeping it off the main thread lets the interface stay responsive. Node imports the engine directly because it does not need the browser message boundary.

**How do you know the numbers are correct?**

I test conservation of requests, concurrency and queue limits, identical runs with the same seed, and the same results at different playback intervals. Browser tests check that the worker results reach the interface. Those tests support the implementation. They do not make the simplified model a production forecast.

**What would you change at a larger scale?**

The event queue already uses a heap. I would replace exact latency storage and sorting with a bounded histogram, batch updates more aggressively, and benchmark bigger runs before claiming a scale limit.

**What's a surprising result?**

A slow success does not open this error based circuit breaker. That is intentional. The slow dependency scenario shows why a latency based policy can matter. Another is that the baseline can show better p95 because failed requests are excluded from successful latency.

## Resume draft

Built Relay, an interactive reliability lab with React, TypeScript, Web Workers, and a shared Node.js simulation engine. Implemented deterministic event scheduling, bounded queues, retry backoff, and circuit breaker recovery, with automated model and browser tests and GitHub Pages deployment.

Read the engine and run the tests before using this in an interview. The best part of the demo is being able to explain why the result changes.
