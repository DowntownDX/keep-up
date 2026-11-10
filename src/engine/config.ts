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
  /**
   * Base activity units per second. For Client work the unit is a Lead handled,
   * not Cash.
   */
  basePerSecond: number;
  /** Ventures that must ship before the activity can be assigned. */
  unlockVentures: number;
}

/** Activities that exist in the engine so far. Later phases add entries. */
export const ACTIVITIES: Partial<Record<ActivityId, ActivityConfig>> = {
  dayJob: { label: "Day job tasks", resource: "cash", basePerSecond: 0.5, unlockVentures: 0 },
  content: { label: "Make content", resource: "followers", basePerSecond: 1, unlockVentures: 0 },
  learn: { label: "Learn", resource: "knowHow", basePerSecond: 0.2, unlockVentures: 0 },
  findClients: {
    label: "Find clients",
    resource: "leads",
    basePerSecond: 0.1,
    unlockVentures: 1,
  },
  clientWork: {
    label: "Client work",
    resource: "cash",
    basePerSecond: 0.2,
    unlockVentures: 1,
  },
  build: { label: "Build venture", resource: null, basePerSecond: 1, unlockVentures: 0 },
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

export const AGENT_SEAT_COSTS: readonly number[] = [40, 400, 4_000, 40_000, 400_000];
export const MAX_AGENTS = AGENT_KINDS.length;

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

/** The engine advances in whole ticks of this length; step() carries the remainder. */
export const TICK_SECONDS = 1;

/** Work applied by one Do it yourself click. */
export const ACTIVE_CLICK_SECONDS = 1.5;

export const VENTURE_NAMES = [
  "Prompt pack",
  "Newsletter",
  "Template shop",
  "Faceless video channel",
  "Online course",
  "Browser extension",
  "Mobile app",
  "Micro SaaS",
  "Automation agency",
  "Product portfolio",
] as const;
export const VENTURE_COUNT = VENTURE_NAMES.length;

export const BUILD_POINTS_BASE = 60;
export const BUILD_POINTS_GROWTH = 5;
export const BUILD_CREDITS_PER_POINT = 1;
export const BUILD_KNOWHOW_PER_POINT = 0.2;

export const VENTURE_INCOME_BASE = 0.5;
export const VENTURE_INCOME_GROWTH = 3;

export const CLIENT_CREDITS_PER_LEAD = 5;
export const CLIENT_CASH_PER_LEAD = 8;

export const PROMPT_BASE_COST = 25;
export const PROMPT_COST_GROWTH = 1.5;
export const PROMPT_BONUS_PER_LEVEL = 0.08;

export const SKILLS_BASE_COST = 10;
export const SKILLS_COST_GROWTH = 1.6;
export const SKILLS_BONUS_PER_LEVEL = 0.1;

export const TEAM_BONUS_PER_LEVEL = 0.005;

export const AUTOMATION_FRACTION = 0.5;
export const FUNNEL_FOLLOWERS_PER_LEAD = 2_000;
export const FOLLOWER_GATE_START_INDEX = 5;
export const FOLLOWER_GATE_BASE = 5_000;
export const FOLLOWER_GATE_GROWTH = 6;

export const SYSTEMS = [
  "promptLibrary",
  "skills",
  "automations",
  "audienceFunnel",
  "teamBonuses",
] as const;
export type SystemId = (typeof SYSTEMS)[number];

/** Ventures that must ship before a system turns on. Zero means available at start. */
export const SYSTEM_UNLOCK_VENTURES: Record<SystemId, number> = {
  promptLibrary: 0,
  teamBonuses: 0,
  skills: 1,
  automations: 2,
  audienceFunnel: 3,
};

/** Agents keep working for this long while the game is closed. */
export const OFFLINE_CAP_SECONDS = 8 * 60 * 60;
