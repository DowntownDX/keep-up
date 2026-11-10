import { MODEL_COUNT } from "../engine/config";
import { creditRate } from "../engine/rates";
import {
  canUpgradeSubscription,
  edgeMultiplier,
  latestGeneration,
  nextRelease,
  releaseTime,
  subscriptionUpgradeCost,
} from "../engine/releases";
import type { GameState } from "../engine/state";
import { formatAmount, formatDuration } from "./format";

const MAX_NEWS = 3;

export interface ReleaseCardProps {
  state: GameState;
  onUpgrade: () => void;
}

export function ReleaseCard({ state, onUpgrade }: ReleaseCardProps) {
  const generation = latestGeneration(state);
  const edge = edgeMultiplier(state);
  const next = nextRelease(state);
  const cost = subscriptionUpgradeCost(state.subscriptionTier);
  const upgradable = canUpgradeSubscription(state);
  const news: number[] = [];
  for (let released = generation; released >= 2 && news.length < MAX_NEWS; released -= 1) {
    news.push(released);
  }

  return (
    <section className="card release" aria-labelledby="release-title">
      <div className="release-head">
        <div>
          <h2 id="release-title" className="release-title">
            The arms race
          </h2>
          <p className="release-generation">
            Generation <strong>{generation}</strong> of {MODEL_COUNT}
          </p>
        </div>
        <span className="edge-badge" data-edge={edge} aria-label={`Edge multiplier ${formatAmount(edge)}`}>
          Edge ×{formatAmount(edge)}
        </span>
      </div>

      <dl className="release-stats">
        <div>
          <dt>Subscription</dt>
          <dd>Tier {state.subscriptionTier} of {MODEL_COUNT}</dd>
        </div>
        <div>
          <dt>Credits trickle</dt>
          <dd data-credits-rate={creditRate(state)}>{formatAmount(creditRate(state))}/s</dd>
        </div>
      </dl>

      <p className="release-note">
        Edge multiplies all Cash you earn. A new generation does nothing until you
        upgrade to it.
      </p>

      <p className="release-next">
        {next
          ? `Generation ${next.generation} in ${formatDuration(next.atSeconds - state.elapsedSeconds)}`
          : "All ten generations are out."}
      </p>

      <ol className="timeline" aria-label="Model release timeline">
        {Array.from({ length: MODEL_COUNT }, (_, index) => {
          const released = index + 1;
          const yours = released === state.subscriptionTier;
          const stateName = yours ? "yours" : released <= generation ? "released" : "future";
          return (
            <li
              key={released}
              data-state={stateName}
              aria-current={yours ? "true" : undefined}
              title={
                yours
                  ? `Generation ${released}, your subscription`
                  : released <= generation
                    ? `Generation ${released}, released`
                    : `Generation ${released}, not released`
              }
            >
              {released}
            </li>
          );
        })}
      </ol>

      <div className="release-buy">
        <span>{cost === null ? "Top tier" : `Next tier: ${formatAmount(cost)} Cash`}</span>
        <button
          type="button"
          className="buy-button"
          disabled={!upgradable}
          aria-label={
            cost === null
              ? "Upgrade subscription"
              : `Upgrade subscription to tier ${state.subscriptionTier + 1} for ${formatAmount(cost)} Cash`
          }
          onClick={onUpgrade}
        >
          Upgrade subscription
        </button>
      </div>

      <div className="release-news">
        <h3 className="release-news-title">Release news</h3>
        <ul className="news-list">
          {news.length === 0 ? (
            <li>
              <strong>Generation 1 is the current model.</strong>
              <span className="news-time">start</span>
            </li>
          ) : (
            news.map((released) => (
              <li key={released}>
                <strong>Generation {released} is live.</strong>
                <span className="news-time">
                  {formatDuration(state.elapsedSeconds - releaseTime(released))} ago
                </span>
              </li>
            ))
          )}
        </ul>
      </div>
    </section>
  );
}
