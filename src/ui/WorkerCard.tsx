import {
  ACTIVITIES,
  ACTIVE_CLICK_SECONDS,
  ACTIVITY_IDS,
  type ActivityId,
} from "../engine/config";
import type { Worker } from "../engine/state";
import { WORKER_LABELS, ACTIVITY_NAMES, specialtyText } from "./labels";

const IMPLEMENTED: readonly ActivityId[] = ACTIVITY_IDS.filter(
  (activity) => ACTIVITIES[activity] !== undefined,
);

export interface WorkerCardProps {
  worker: Worker;
  onAssign: (workerId: string, activity: ActivityId) => void;
  onActive: (workerId: string) => void;
}

export function WorkerCard({ worker, onAssign, onActive }: WorkerCardProps) {
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

      <div className="activities" role="group" aria-label={`Activities for ${WORKER_LABELS[worker.kind]}`}>
        {IMPLEMENTED.map((activity) => (
          <button
            key={activity}
            type="button"
            className="activity"
            aria-pressed={current === activity}
            onClick={() => onAssign(worker.id, activity)}
          >
            <span>{ACTIVITY_NAMES[activity]}</span>
            <span className="activity-level">Lv {worker.skills[activity].level}</span>
          </button>
        ))}
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
