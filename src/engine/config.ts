// Every balance number in the game lives here. No magic numbers elsewhere.

export const RESOURCE_IDS = ["cash", "followers", "leads", "knowHow", "credits"] as const;
export type ResourceId = (typeof RESOURCE_IDS)[number];

export const ACTIVITY_IDS = [
  "dayJob",
  "content",
  "learn",
  "findClients",
  "clientWork",
  "build",
] as const;
export type ActivityId = (typeof ACTIVITY_IDS)[number];

export interface ActivityConfig {
  label: string;
  /** Resource the activity produces. Null for activities with special effects. */
  resource: ResourceId | null;
  basePerSecond: number;
}

/** Activities that exist in the engine so far. Later phases add entries. */
export const ACTIVITIES: Partial<Record<ActivityId, ActivityConfig>> = {
  dayJob: { label: "Day job tasks", resource: "cash", basePerSecond: 0.5 },
  content: { label: "Make content", resource: "followers", basePerSecond: 1 },
  learn: { label: "Learn", resource: "knowHow", basePerSecond: 0.2 },
};

export const WORKER_KINDS = [
  "you",
  "assistant",
  "creator",
  "scout",
  "tutor",
  "builder",
] as const;
export type WorkerKind = (typeof WORKER_KINDS)[number];
export type AgentKind = Exclude<WorkerKind, "you">;

export const AGENT_KINDS: readonly AgentKind[] = [
  "assistant",
  "creator",
  "scout",
  "tutor",
  "builder",
];

export const YOU_MULTIPLIER = 1.2;
export const SPECIALTY_MULTIPLIER = 1.6;

/** Activities each agent kind is a specialist at. */
export const SPECIALTY_ACTIVITIES: Record<AgentKind, readonly ActivityId[]> = {
  assistant: ["dayJob", "clientWork"],
  creator: ["content"],
  scout: ["findClients"],
  tutor: ["learn"],
  builder: ["build"],
};

export const SKILL_BONUS_PER_LEVEL = 0.12;
export const XP_BASE_SECONDS = 15;
export const XP_GROWTH = 1.25;

export const MAX_AGENTS = 5;
export const AGENT_SEAT_COSTS: readonly number[] = [40, 400, 4_000, 40_000, 400_000];

export const STARTING_RESOURCES: Record<ResourceId, number> = {
  cash: 15,
  followers: 0,
  leads: 0,
  knowHow: 5,
  credits: 20,
};

export const CREDITS_BASE_PER_SECOND = 1;
export const SUBSCRIPTION_TRICKLE_GROWTH = 1.5;
export const STARTING_SUBSCRIPTION_TIER = 1;

/** The engine integrates in fixed ticks so long and short steps agree. */
export const TICK_SECONDS = 1;
