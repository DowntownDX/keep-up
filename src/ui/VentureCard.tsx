import { useEffect, useRef, useState } from "react";
import { VENTURE_COUNT, VENTURE_NAMES } from "../engine/config";
import { cashGain } from "../engine/releases";
import type { GameState } from "../engine/state";
import {
  buildPointsRequired,
  currentVentureIndex,
  followersRequired,
  hasWon,
  isVentureGated,
  passiveCashRate,
  ventureIncome,
} from "../engine/ventures";
import { ventureEta } from "./forecast";
import { formatAmount, formatDuration, formatPercent } from "./format";

export function VentureCard({ state }: { state: GameState }) {
  const index = currentVentureIndex(state);
  const eta = ventureEta(state);
  const previousShipped = useRef(state.venturesShipped);
  const [shipped, setShipped] = useState(false);

  useEffect(() => {
    const previous = previousShipped.current;
    previousShipped.current = state.venturesShipped;
    if (state.venturesShipped <= previous) {
      setShipped(false);
      return;
    }
    setShipped(true);
    const timer = window.setTimeout(() => setShipped(false), 1_200);
    return () => window.clearTimeout(timer);
  }, [state.venturesShipped]);

  if (index === null) {
    return (
      <section className="card venture" aria-labelledby="venture-title">
        {shipped ? <span className="ship-stamp" role="status">SHIPPED</span> : null}
        <p className="venture-index">Venture {VENTURE_COUNT} of {VENTURE_COUNT}</p>
        <h2 id="venture-title">All ten shipped</h2>
        <p className="win">
          The portfolio pays the bills. Your income no longer depends on the day job.
        </p>
      </section>
    );
  }

  const required = buildPointsRequired(index);
  const progress = Math.min(state.ventureProgress, required);
  const fraction = required > 0 ? progress / required : 0;
  const gated = isVentureGated(state);
  const followersNeeded = followersRequired(index);

  return (
    <section className="card venture" aria-labelledby="venture-title">
      {shipped ? <span className="ship-stamp" role="status">SHIPPED</span> : null}
      <div className="venture-head">
        <div>
          <p className="venture-index">
            Venture {index + 1} of {VENTURE_COUNT}
          </p>
          <h2 id="venture-title">{VENTURE_NAMES[index]}</h2>
        </div>
        <span className="venture-count">{state.venturesShipped} shipped</span>
      </div>

      {gated ? (
        <p className="gate">
          Needs {formatAmount(followersNeeded)} Followers to launch. You have{" "}
          {formatAmount(state.resources.followers)}.
        </p>
      ) : null}

      <div
        className="progress"
        role="progressbar"
        aria-label={`${VENTURE_NAMES[index]} progress`}
        aria-valuemin={0}
        aria-valuemax={required}
        aria-valuenow={progress}
      >
        <span className="progress-fill" style={{ width: `${fraction * 100}%` }} />
      </div>
      <p className="progress-text">
        <span>
          {formatAmount(progress)} / {formatAmount(required)} build points
        </span>
        <span>{formatPercent(fraction)}</span>
      </p>

      {!gated ? (
        <p className="venture-eta">
          {eta === null
            ? "No ETA yet"
            : `About ${formatDuration(Math.max(1, Math.ceil(eta.seconds)))} to ship`}
        </p>
      ) : null}

      <dl className="venture-stats">
        <div>
          <dt>Passive income</dt>
          <dd>{formatAmount(passiveCashRate(state))} Cash/s</dd>
        </div>
        <div>
          <dt>Next ship adds</dt>
          <dd>+{formatAmount(cashGain(state, ventureIncome(index)))} Cash/s</dd>
        </div>
      </dl>

      {hasWon(state) ? <p className="win">Every venture has shipped.</p> : null}
    </section>
  );
}
