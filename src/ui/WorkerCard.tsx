import { useEffect, useRef, useState } from "react";
import { isActivityUnlocked } from "../engine/actions";
import {
  ACTIVITIES,
  ACTIVE_CLICK_SECONDS,
  ACTIVITY_IDS,
  type ActivityId,
} from "../engine/config";
import type { GameState, Worker } from "../engine/state";
import {
  followersRequired,
  hasWon,
  isSystemUnlocked,
  isVentureGated,
} from "../engine/ventures";
import { formatAmount } from "./format";
import { WORKER_LABELS, WORKER_MARKS, ACTIVITY_NAMES, specialtyText } from "./labels";
import { workerOutput, workerStalled, workerStarved } from "./output";
import type { ActionTick } from "./useGame";

const ACTIVITY_ORDER: readonly ActivityId[] = ACTIVITY_IDS.filter(
  (activity) => ACTIVITIES[activity] !== undefined,
);

export interface WorkerCardProps {
  state: GameState;
  actionTick: ActionTick | null;
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

function starvedReason(state: GameState, activity: ActivityId | null): string {
  if (activity === "build") {
    if (hasWon(state)) return "All ventures shipped";
    const credits = state.resources.credits <= 0;
    const knowHow = state.resources.knowHow <= 0;
    if (credits && knowHow) return "Needs Credits and Know-how";
    return credits ? "Needs Credits" : "Needs Know-how";
  }
  const leads = state.resources.leads <= 0;
  const credits = state.resources.credits <= 0;
  if (leads && credits) return "Needs Leads and Credits";
  return leads ? "Needs Leads" : "Needs Credits";
}

export function WorkerCard({
  state,
  actionTick,
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
  const starved = workerStarved(state, worker);
  const blockedReason = !current
    ? "Pick an activity first"
    : currentBlocked
      ? `Needs ${formatAmount(followersNeeded)} Followers`
      : starved
        ? starvedReason(state, current)
        : null;
  const canWork = Boolean(current) && blockedReason === null;
  const buildBlocked = current === "build" && (currentBlocked || hasWon(state));
  const stalled = workerStalled(state, worker);
  const liveState = !current
    ? "idle"
    : buildBlocked || stalled
      ? "blocked"
      : "working";
  const output = workerOutput(state, worker);
  const liveText =
    liveState === "idle"
      ? "Waiting for a task"
      : liveState === "blocked"
        ? currentBlocked
          ? `Needs ${formatAmount(followersNeeded)} Followers`
          : current === "build" && hasWon(state)
            ? "All ventures shipped"
            : starvedReason(state, current)
        : output
          ? `+${formatAmount(output.value)} ${output.unit}`
          : "Working";
  const [worked, setWorked] = useState(false);
  const [stampId, setStampId] = useState(0);
  const stampTimer = useRef<number | null>(null);

  useEffect(() => {
    if (
      !actionTick ||
      actionTick.kind !== "active" ||
      actionTick.workerId !== worker.id
    ) {
      return;
    }
    setWorked(true);
    setStampId((id) => id + 1);
    if (stampTimer.current) window.clearTimeout(stampTimer.current);
    stampTimer.current = window.setTimeout(() => setWorked(false), 800);
  }, [actionTick, worker.id]);

  useEffect(
    () => () => {
      if (stampTimer.current) window.clearTimeout(stampTimer.current);
    },
    [],
  );

  return (
    <article className="worker-card card" aria-labelledby={`worker-${worker.id}`}>
      <header className="worker-head">
        <div className="worker-identity">
          <span className="agent-mark" data-kind={worker.kind} aria-hidden="true">
            {WORKER_MARKS[worker.kind]}
          </span>
          <div>
            <h3 id={`worker-${worker.id}`}>{WORKER_LABELS[worker.kind]}</h3>
            <p className="worker-bonus">{specialtyText(worker.kind)}</p>
          </div>
        </div>
        <span
          key={worked ? stampId : "idle"}
          className={worked ? "worker-state is-worked" : "worker-state"}
        >
          {worked
            ? "WORKED"
            : current
              ? `Lv ${worker.skills[current].level}`
              : "Idle"}
        </span>
        <span className="sr-only" role="status">
          {worked ? `${WORKER_LABELS[worker.kind]} worked` : ""}
        </span>
      </header>

      <p className="worker-live" data-state={liveState}>
        <span className="worker-dot" aria-hidden="true" />
        <span>{liveText}</span>
      </p>

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
        disabled={!canWork}
        title={blockedReason ?? undefined}
        aria-label={
          blockedReason ? `Do it yourself: ${blockedReason}` : undefined
        }
        onClick={() => {
          if (!canWork) return;
          onActive(worker.id);
        }}
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
