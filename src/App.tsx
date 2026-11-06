import { useState } from 'react'
import {
  ArrowDownToLine,
  ArrowUpRight,
  BookOpen,
  Check,
  Code2,
  GitBranch,
  Link2,
  Radio,
} from 'lucide-react'
import { useExperiment } from './hooks/useExperiment.ts'
import { Controls } from './components/Controls.tsx'
import { Workspace } from './components/Workspace.tsx'
import { EventLog } from './components/EventLog.tsx'
import { ComparePrompt } from './components/ComparePrompt.tsx'
import { Comparison } from './components/Comparison.tsx'
import { FieldGuide } from './components/FieldGuide.tsx'

export function App() {
  const [guide, setGuide] = useState(false)
  const {
    config,
    snapshot,
    running,
    speed,
    comparison,
    comparing,
    toast,
    reset,
    change,
    toggle,
    inject,
    share,
    download,
    changeSpeed,
    compare,
  } = useExperiment()
  return (
    <>
      <a className="skip-link" href="#playground">
        Skip to playground
      </a>
      <header className="header">
        <a className="brand" href={import.meta.env.BASE_URL}>
          <span className="brand-mark">
            <GitBranch size={23} strokeWidth={2.4} />
          </span>
          relay<span className="brand-tag">SYSTEMS PLAYGROUND</span>
        </a>
        <nav aria-label="Main navigation">
          <button className="text-button" onClick={() => setGuide(true)}>
            <BookOpen size={16} /> Field guide
          </button>
          <a
            className="source-link"
            href="https://github.com/TaylorOD/relay"
            target="_blank"
            rel="noreferrer"
          >
            <Code2 size={17} /> Source <ArrowUpRight size={14} />
          </a>
        </nav>
      </header>
      <main>
        <section className="intro">
          <div>
            <div className="eyebrow">
              <span /> A SMALL LAB FOR BIG WHAT IFS
            </div>
            <h1>
              Break things.
              <br className="mobile-break" /> <span>See what holds.</span>
            </h1>
            <p>
              A hands on playground for resilient systems. Send traffic, cause a little chaos,
              <br className="desktop-break" /> and discover what keeps a service standing.
            </p>
          </div>
          <div className="intro-note">
            <span className="orbit">
              <Radio size={28} />
            </span>
            <p>
              Real simulation.
              <br />
              Zero production incidents.
            </p>
            <span className="note-number">LAB NO. 001</span>
          </div>
        </section>
        <div className="lab-heading" id="playground">
          <div>
            <span className="section-index">01</span>
            <h2>The experiment</h2>
            <span className="local-label">
              <span /> RUNS IN YOUR BROWSER
            </span>
          </div>
          <button className="text-button share" onClick={share}>
            <Link2 size={15} /> Share setup
          </button>
        </div>
        <div className="lab-layout">
          <Controls config={config} change={change} />
          <Workspace
            snapshot={snapshot}
            running={running}
            speed={speed}
            changeSpeed={changeSpeed}
            reset={reset}
            toggle={toggle}
            inject={inject}
          />
        </div>
        <div className="below-grid">
          <EventLog snapshot={snapshot} />
          <ComparePrompt comparing={comparing} compare={compare} />
        </div>
        {comparison && <Comparison comparison={comparison} download={download} />}
        <section className="under-hood">
          <div>
            <span className="section-index">02</span>
            <div>
              <h2>Not magic. Just systems.</h2>
              <p>
                A deterministic event engine, running in a background worker. <br />
                The same TypeScript powers the browser and a Node.js CLI.
              </p>
            </div>
          </div>
          <button className="text-button" onClick={() => setGuide(true)}>
            Read the field guide <ArrowUpRight size={16} />
          </button>
        </section>
        <footer>
          <a href="https://www.taylordorsett.com/">
            Built by Taylor Dorsett <ArrowUpRight size={13} />
          </a>
          <span>SIMULATED TRAFFIC. REAL TRADEOFFS.</span>
          <button className="text-button" onClick={download}>
            <ArrowDownToLine size={14} /> Export run
          </button>
        </footer>
      </main>
      <div role="status" className={`toast ${toast ? 'visible' : ''}`}>
        <Check size={16} />
        {toast}
      </div>
      <FieldGuide open={guide} onClose={() => setGuide(false)} />
    </>
  )
}
