import { isActivityUnlocked } from "../engine/actions";
import {
  ACTIVITIES,
  ACTIVE_CLICK_SECONDS,
  ACTIVITY_IDS,
  type ActivityId,
} from "../engine/config";
import type { GameState, Worker } from "../engine/state";
import { WORKER_LABELS, ACTIVITY_NAMES, specialtyText } from "./labels";

const ACTIVITY_ORDER: readonly ActivityId[] = ACTIVITY_IDS.filter(
  (activity) => ACTIVITIES[activity] !== undefined,
);

export interface WorkerCardProps {
  state: GameState;
  worker: Worker;
  onAssign: (workerId: string, activity: ActivityId) => void;
  onActive: (workerId: string) => void;
}

export function WorkerCard({ state, worker, onAssign, onActive }: WorkerCardProps) {
  const current = worker.activity;

  return (
    <article className="worker-card card" aria-labelledby={`worker-${worker.id}`}>
      <header className="worker-head">
        <div>
          <h3 id={`worker-${worker.id}`}>{WORKER_LABELS[worker.kind]}</h3>
          <p className="worker-bonus">{specialtyText(worker.kind)}</p>
        </div>
        <span className="worker-state">
          {current ? `Lv ${worker.skills[current].level}` : "Idle"}
        </span>
      </header>

      <div
        className="activities"
        role="group"
        aria-label={`Activities for ${WORKER_LABELS[worker.kind]}`}
      >
        {ACTIVITY_ORDER.map((activity) => {
          const config = ACTIVITIES[activity];
          const locked = !isActivityUnlocked(state, activity);
          return (
            <button
              key={activity}
              type="button"
              className={locked ? "activity activity-locked" : "activity"}
              aria-pressed={current === activity}
              disabled={locked}
              title={
                locked && config
                  ? `Opens after venture ${config.unlockVentures}`
                  : undefined
              }
              onClick={() => onAssign(worker.id, activity)}
            >
              <span>{ACTIVITY_NAMES[activity]}</span>
              <span className="activity-level">
                {locked && config
                  ? `After venture ${config.unlockVentures}`
                  : `Lv ${worker.skills[activity].level}`}
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="diy"
        disabled={!current}
        onClick={() => onActive(worker.id)}
      >
        Do it yourself · {ACTIVE_CLICK_SECONDS}s
      </button>
    </article>
  );
}
