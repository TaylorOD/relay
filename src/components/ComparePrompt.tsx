import { ArrowRight, GitBranch } from 'lucide-react'

export function ComparePrompt({ comparing, compare }: { comparing: boolean; compare: () => void }) {
  return (
    <section className="compare-panel">
      <div className="panel-heading">
        <h3>
          <GitBranch size={16} /> The same chaos. A different outcome.
        </h3>
      </div>
      <p>
        Run the full experiment with your settings and an unprotected baseline. Same traffic. Same
        seed. See the tradeoff.
      </p>
      <button className="compare-button" disabled={comparing} onClick={compare}>
        {comparing ? 'Running both experiments…' : 'Compare strategies'}
        <ArrowRight size={16} />
      </button>
      <span className="compare-note">Runs 60 simulated seconds, plus time to drain.</span>
    </section>
  )
}
