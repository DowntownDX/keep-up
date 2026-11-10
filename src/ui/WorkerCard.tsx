import { isActivityUnlocked } from "../engine/actions";
import {
  ACTIVITIES,
  ACTIVE_CLICK_SECONDS,
  ACTIVITY_IDS,
  type ActivityId,
} from "../engine/config";
import type { GameState, Worker } from "../engine/state";
import { followersRequired, isSystemUnlocked, isVentureGated } from "../engine/ventures";
import { formatAmount } from "./format";
import { WORKER_LABELS, ACTIVITY_NAMES, specialtyText } from "./labels";

const ACTIVITY_ORDER: readonly ActivityId[] = ACTIVITY_IDS.filter(
  (activity) => ACTIVITIES[activity] !== undefined,
);

export interface WorkerCardProps {
  state: GameState;
  worker: Worker;
  onAssign: (workerId: string, activity: ActivityId) => void;
  onActive: (workerId: string) => void;
  onAutomate: (workerId: string) => void;
}

function automationRateLabel(activity: ActivityId, rate: number): string {
  if (activity === "clientWork") return `${formatAmount(rate)} Leads/s`;
  if (activity === "build") return `${formatAmount(rate)} points/s`;
  return `${formatAmount(rate)}/s`;
}

export function WorkerCard({
  state,
  worker,
  onAssign,
  onActive,
  onAutomate,
}: WorkerCardProps) {
  const current = worker.activity;
  const isAgent = worker.kind !== "you";
  const automationsUnlocked = isSystemUnlocked(state, "automations");
  const gated = isVentureGated(state);
  const followersNeeded = followersRequired(state.venturesShipped);
  const currentBlocked = current === "build" && gated;

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
          const blockedByGate = activity === "build" && gated;
          const locked = !isActivityUnlocked(state, activity) || blockedByGate;
          return (
            <button
              key={activity}
              type="button"
              className={locked ? "activity activity-locked" : "activity"}
              aria-pressed={current === activity}
              disabled={locked}
              title={
                blockedByGate
                  ? `Needs ${formatAmount(followersNeeded)} Followers`
                  : locked && config
                    ? `Opens after venture ${config.unlockVentures}`
                    : undefined
              }
              onClick={() => onAssign(worker.id, activity)}
            >
              <span>{ACTIVITY_NAMES[activity]}</span>
              <span className="activity-level">
                {blockedByGate
                  ? `Needs ${formatAmount(followersNeeded)} Followers`
                  : locked && config
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
        disabled={!current || currentBlocked}
        onClick={() => onActive(worker.id)}
      >
        Do it yourself · {ACTIVE_CLICK_SECONDS}s
      </button>

      {isAgent ? (
        <div className="automation">
          <button
            type="button"
            className="automation-button"
            disabled={!automationsUnlocked || !current}
            onClick={() => onAutomate(worker.id)}
          >
            {worker.automation ? "Update automation" : "Record automation"}
          </button>
          <p className="automation-note">
            {worker.automation
              ? `Automates ${ACTIVITY_NAMES[worker.automation.activity]} at ${automationRateLabel(
                  worker.automation.activity,
                  worker.automation.rate,
                )}`
              : automationsUnlocked
                ? "Snapshots 50% of the current activity, fixed forever."
                : "Unlocks after venture 2."}
          </p>
        </div>
      ) : null}
    </article>
  );
}
