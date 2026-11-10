import { formatAmount, formatDuration } from "./format";
import { RESOURCE_LABELS } from "./labels";
import type { OfflineSummary } from "./storage";

export interface WelcomeBackProps {
  summary: OfflineSummary;
  onDismiss: () => void;
}

export function WelcomeBack({ summary, onDismiss }: WelcomeBackProps) {
  const gains = summary.gains
    .map((gain) => `${RESOURCE_LABELS[gain.resource]} +${formatAmount(gain.amount)}`)
    .join(" · ");
  const ships = summary.venturesShipped;

  return (
    <section className="card welcome" role="status" aria-labelledby="welcome-title">
      <div>
        <p className="kicker">While you were away</p>
        <h2 id="welcome-title">{formatDuration(summary.elapsedSeconds)} of work</h2>
        <p className="welcome-gains">
          {gains || "The team was idle, so nothing changed."}
          {ships > 0 ? ` · ${ships} venture${ships === 1 ? "" : "s"} shipped` : ""}
        </p>
        {summary.capped ? (
          <p className="welcome-note">Time away is capped at eight hours.</p>
        ) : null}
      </div>
      <button
        type="button"
        className="dismiss-button"
        aria-label="Dismiss welcome-back summary"
        onClick={onDismiss}
      >
        Dismiss
      </button>
    </section>
  );
}
