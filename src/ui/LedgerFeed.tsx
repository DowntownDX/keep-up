import type { FeedEvent } from "./events";
import { formatDuration } from "./format";

export function LedgerFeed({ events }: { events: FeedEvent[] }) {
  return (
    <section className="card ledger" aria-labelledby="ledger-title">
      <div className="section-head">
        <h2 id="ledger-title">Ledger</h2>
        <p>{events.length === 0 ? "Empty" : `${events.length} entries`}</p>
      </div>
      {events.length === 0 ? (
        <p className="ledger-empty">Nothing recorded yet.</p>
      ) : (
        <ol className="ledger-list">
          {events.map((event) => (
            <li key={event.id} className="ledger-entry" data-kind={event.kind}>
              <span className="ledger-time">{formatDuration(event.atSeconds)}</span>
              <span>{event.text}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
