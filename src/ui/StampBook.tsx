import type { GameState } from "../engine/state";
import { STAMPS } from "./stamps";

export function StampBook({ state }: { state: GameState }) {
  const earned = STAMPS.filter((stamp) => stamp.earned(state)).length;

  return (
    <section className="card stamps" aria-labelledby="stamps-title">
      <div className="section-head">
        <h2 id="stamps-title">Stamps</h2>
        <p>
          {earned} of {STAMPS.length}
        </p>
      </div>
      <ul className="stamp-grid">
        {STAMPS.map((stamp) => {
          const isEarned = stamp.earned(state);
          return (
            <li
              key={stamp.id}
              className={isEarned ? "stamp is-earned" : "stamp"}
              data-earned={isEarned}
            >
              <span className="stamp-mark" aria-hidden="true">
                {isEarned ? "★" : "○"}
              </span>
              <span>{stamp.label}</span>
              <span className="sr-only">{isEarned ? "earned" : "locked"}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
