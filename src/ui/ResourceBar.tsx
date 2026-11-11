import { useEffect, useState } from "react";
import { RESOURCE_IDS, type ResourceId } from "../engine/config";
import { resourceNetRates } from "../engine/rates";
import type { GameState } from "../engine/state";
import { formatAmount, formatRate } from "./format";
import { RESOURCE_LABELS } from "./labels";
import type { ActionTick } from "./useGame";

const RESOURCE_ORDER: readonly ResourceId[] = RESOURCE_IDS;
const FLASH_MS = 300;

export function ResourceBar({
  state,
  actionTick,
}: {
  state: GameState;
  actionTick: ActionTick | null;
}) {
  const rates = resourceNetRates(state);
  const [flashing, setFlashing] = useState(false);

  useEffect(() => {
    if (!actionTick) {
      setFlashing(false);
      return;
    }
    setFlashing(true);
    const timer = window.setTimeout(() => setFlashing(false), FLASH_MS);
    return () => window.clearTimeout(timer);
  }, [actionTick]);

  return (
    <section className="resources" aria-label="Resources">
      <div
        key={actionTick?.id ?? "idle"}
        className={flashing ? "resource-row is-flashing" : "resource-row"}
      >
        {RESOURCE_ORDER.map((id) => (
          <div className="resource" key={id} data-resource={id}>
            <span className="resource-label">{RESOURCE_LABELS[id]}</span>
            <strong className="resource-value">{formatAmount(state.resources[id])}</strong>
            <span className="resource-rate">{formatRate(rates[id])}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
