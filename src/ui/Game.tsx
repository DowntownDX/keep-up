import { HirePanel } from "./HirePanel";
import { ResourceBar } from "./ResourceBar";
import { UpgradeCard } from "./UpgradeCard";
import { useGame } from "./useGame";
import { VentureCard } from "./VentureCard";
import { WorkerCard } from "./WorkerCard";

export function Game() {
  const { state, saveError, assign, hire, active, automate, buyPrompt, buySkills } = useGame();

  return (
    <div className="shell">
      <header className="masthead">
        <div>
          <p className="kicker">A regular person, five agents, ten ventures.</p>
          <h1>Keep Up</h1>
        </div>
        <p className={saveError ? "status status-error" : "status"} role="status">
          {saveError ? "Save failed" : "Saved locally"}
        </p>
      </header>

      <ResourceBar state={state} />

      <main className="board">
        <section className="crew" aria-labelledby="crew-title">
          <div className="section-head">
            <h2 id="crew-title">Crew</h2>
            <p>{state.workers.length} of 6 on the team</p>
          </div>
          <div className="worker-grid">
            {state.workers.map((worker) => (
              <WorkerCard
                key={worker.id}
                state={state}
                worker={worker}
                onAssign={assign}
                onActive={active}
                onAutomate={automate}
              />
            ))}
          </div>
        </section>

        <aside className="side" aria-label="Venture, upgrades and hiring">
          <VentureCard state={state} />
          <UpgradeCard state={state} onBuyPrompt={buyPrompt} onBuySkills={buySkills} />
          <HirePanel state={state} onHire={hire} />
        </aside>
      </main>

      <footer className="footer">
        <span>Progress saves in this browser.</span>
        <span>Up to 8 hours of work is credited when you return.</span>
      </footer>
    </div>
  );
}
