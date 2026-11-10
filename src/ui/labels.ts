import {
  SPECIALTY_ACTIVITIES,
  type ActivityId,
  type ResourceId,
  type WorkerKind,
} from "../engine/config";

export const RESOURCE_LABELS: Record<ResourceId, string> = {
  cash: "Cash",
  followers: "Followers",
  leads: "Leads",
  knowHow: "Know-how",
  credits: "Credits",
};

export const WORKER_LABELS: Record<WorkerKind, string> = {
  you: "You",
  assistant: "Assistant agent",
  creator: "Creator agent",
  scout: "Scout agent",
  tutor: "Tutor agent",
  builder: "Builder agent",
};

export const ACTIVITY_NAMES: Record<ActivityId, string> = {
  dayJob: "Day job tasks",
  content: "Make content",
  learn: "Learn",
  findClients: "Find clients",
  clientWork: "Client work",
  build: "Build venture",
};

export function specialtyText(kind: WorkerKind): string {
  if (kind === "you") return "1.2x at every activity";
  const activities = SPECIALTY_ACTIVITIES[kind].map((activity) => ACTIVITY_NAMES[activity]);
  return `1.6x at ${activities.join(" and ")}`;
}
