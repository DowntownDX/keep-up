import {
  ACTIVITY_IDS,
  STARTING_RESOURCES,
  STARTING_SUBSCRIPTION_TIER,
  type ActivityId,
  type ResourceId,
  type WorkerKind,
} from "./config";

export interface Skill {
  level: number;
  /** Progress toward the next level, in seconds of work. */
  xp: number;
}

export interface Worker {
  id: string;
  kind: WorkerKind;
  activity: ActivityId | null;
  /** One skill per activity, kept when the worker switches activities. */
  skills: Record<ActivityId, Skill>;
}

export interface GameState {
  resources: Record<ResourceId, number>;
  workers: Worker[];
  subscriptionTier: number;
  nextAgentNumber: number;
  /** Fraction of a tick carried into the next step. */
  pendingSeconds: number;
  /** Ventures shipped so far; equal to the index of the current venture. */
  venturesShipped: number;
  /** Build points put toward the current venture. */
  ventureProgress: number;
  /** Levels bought in the Prompt library. */
  promptLevel: number;
  /** Levels bought in the Skills system. */
  skillsLevel: number;
}

export function createWorker(id: string, kind: WorkerKind): Worker {
  const skills = {} as Record<ActivityId, Skill>;
  for (const activity of ACTIVITY_IDS) {
    skills[activity] = { level: 1, xp: 0 };
  }
  return { id, kind, activity: null, skills };
}

export function createInitialState(): GameState {
  return {
    resources: { ...STARTING_RESOURCES },
    workers: [createWorker("you", "you")],
    subscriptionTier: STARTING_SUBSCRIPTION_TIER,
    nextAgentNumber: 1,
    pendingSeconds: 0,
    venturesShipped: 0,
    ventureProgress: 0,
    promptLevel: 0,
    skillsLevel: 0,
  };
}
