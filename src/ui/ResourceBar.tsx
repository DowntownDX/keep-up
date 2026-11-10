import { RESOURCE_IDS, type ResourceId } from "../engine/config";
import { resourceNetRates } from "../engine/rates";
import type { GameState } from "../engine/state";
import { formatAmount, formatRate } from "./format";
import { RESOURCE_LABELS } from "./labels";

const RESOURCE_ORDER: readonly ResourceId[] = RESOURCE_IDS;

export function ResourceBar({ state }: { state: GameState }) {
  const rates = resourceNetRates(state);

  return (
    <section className="resources" aria-label="Resources">
      {RESOURCE_ORDER.map((id) => (
        <div className="resource" key={id} data-resource={id}>
          <span className="resource-label">{RESOURCE_LABELS[id]}</span>
          <strong className="resource-value">{formatAmount(state.resources[id])}</strong>
          <span className="resource-rate">{formatRate(rates[id])}</span>
        </div>
      ))}
    </section>
  );
}
