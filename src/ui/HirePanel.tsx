import { nextAgentCost } from "../engine/actions";
import { AGENT_KINDS, type AgentKind } from "../engine/config";
import type { GameState } from "../engine/state";
import { formatAmount } from "./format";
import { specialtyText, WORKER_LABELS } from "./labels";

export interface HirePanelProps {
  state: GameState;
  onHire: (kind: AgentKind) => void;
}

export function HirePanel({ state, onHire }: HirePanelProps) {
  const cost = nextAgentCost(state);

  return (
    <section className="card hire" aria-labelledby="hire-title">
      <div className="section-head">
        <h2 id="hire-title">Hire</h2>
        <p>{cost === null ? "Team full" : `${formatAmount(cost)} Cash for the next seat`}</p>
      </div>

      <ul className="hire-list">
        {AGENT_KINDS.map((kind) => {
          const owned = state.workers.some((worker) => worker.kind === kind);
          const disabled = owned || cost === null || state.resources.cash < cost;
          const actionLabel = owned
            ? `${WORKER_LABELS[kind]} already hired`
            : cost === null
              ? "Team full"
              : `Hire ${WORKER_LABELS[kind]} for ${formatAmount(cost)} Cash`;

          return (
            <li key={kind}>
              <div>
                <span className="hire-name">{WORKER_LABELS[kind]}</span>
                <span className="hire-bonus">{specialtyText(kind)}</span>
              </div>
              <button
                type="button"
                className="hire-button"
                disabled={disabled}
                aria-label={actionLabel}
                onClick={() => onHire(kind)}
              >
                {owned ? "Hired" : cost === null ? "Full" : `${formatAmount(cost)} Cash`}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
