import { GuideCard } from "./GuideCard";
import { HirePanel } from "./HirePanel";
import { LedgerFeed } from "./LedgerFeed";
import { nextHint } from "./hints";
import { NextMove } from "./NextMove";
import { ReleaseCard } from "./ReleaseCard";
import { ResourceBar } from "./ResourceBar";
import { StampBook } from "./StampBook";
import { UpgradeCard } from "./UpgradeCard";
import { useEventLog } from "./useEventLog";
import { useGame } from "./useGame";
import { VentureCard } from "./VentureCard";
import { WelcomeBack } from "./WelcomeBack";
import { WorkerCard } from "./WorkerCard";

export function Game() {
  const {
    state,
    actionTick,
    resetToken,
    offline,
    saveError,
    dismissOffline,
    reset,
    assign,
    hire,
    active,
    automate,
    buyPrompt,
    buySkills,
    upgradeSubscription,
  } = useGame();
  const events = useEventLog(state, resetToken);

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

      {offline ? <WelcomeBack summary={offline} onDismiss={dismissOffline} /> : null}

      <ResourceBar state={state} actionTick={actionTick} />

      <main className="board">
        <div className="focus-row">
          <VentureCard state={state} />
          <NextMove hint={nextHint(state)} />
        </div>

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
                actionTick={actionTick}
                worker={worker}
                onAssign={assign}
                onActive={active}
                onAutomate={automate}
              />
            ))}
          </div>
          <LedgerFeed events={events} />
        </section>

        <aside className="side" aria-label="Releases, upgrades, hiring and stamps">
          <ReleaseCard state={state} onUpgrade={upgradeSubscription} />
          <UpgradeCard state={state} onBuyPrompt={buyPrompt} onBuySkills={buySkills} />
          <HirePanel state={state} onHire={hire} />
          <StampBook state={state} />
        </aside>
      </main>

      <GuideCard onReset={reset} />

      <footer className="footer">
        <span>Progress saves in this browser.</span>
        <span>Up to 8 hours of work is credited when you return.</span>
      </footer>
    </div>
  );
}
