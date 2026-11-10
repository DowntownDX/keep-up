// Pacing targets from the build plan. The CLI and tests share this table.

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export interface PacingTarget {
  id: string;
  label: string;
  minSeconds: number | null;
  maxSeconds: number | null;
}

export const PACING_TARGETS: readonly PacingTarget[] = [
  { id: "firstAgent", label: "First agent", minSeconds: null, maxSeconds: 2 * MINUTE },
  { id: "venture1", label: "Venture 1", minSeconds: 3 * MINUTE, maxSeconds: 5 * MINUTE },
  { id: "venture2", label: "Venture 2", minSeconds: 15 * MINUTE, maxSeconds: 20 * MINUTE },
  { id: "venture3", label: "Venture 3", minSeconds: 50 * MINUTE, maxSeconds: 75 * MINUTE },
  { id: "venture5", label: "Venture 5", minSeconds: null, maxSeconds: 24 * HOUR },
  { id: "firstGate", label: "First Follower gate", minSeconds: 24 * HOUR, maxSeconds: 48 * HOUR },
  { id: "venture10", label: "Venture 10", minSeconds: 14 * DAY, maxSeconds: 21 * DAY },
];

export interface TargetCheck extends PacingTarget {
  actualSeconds: number | null;
  pass: boolean;
}

export function checkPacing(milestones: Record<string, number | null>): TargetCheck[] {
  return PACING_TARGETS.map((target) => {
    const actualSeconds = milestones[target.id] ?? null;
    const pass =
      actualSeconds !== null &&
      (target.minSeconds === null || actualSeconds >= target.minSeconds) &&
      (target.maxSeconds === null || actualSeconds <= target.maxSeconds);
    return { ...target, actualSeconds, pass };
  });
}

export interface ArmsRaceReport {
  elapsedSeconds: number;
  lastReleaseSeconds: number;
  fallBehindEpisodes: number;
  finalEdge: number;
  distinctEdgeValues: number;
  maxEdgeSecondsBeforeLastRelease: number;
}

export interface ArmsRaceCheck {
  label: string;
  pass: boolean;
  detail: string;
}

export function checkArmsRace(report: ArmsRaceReport): ArmsRaceCheck[] {
  const beforeLastRelease = Math.min(report.elapsedSeconds, report.lastReleaseSeconds);
  const maxEdgeShare =
    beforeLastRelease > 0 ? report.maxEdgeSecondsBeforeLastRelease / beforeLastRelease : 1;

  return [
    {
      label: "Fall-behind episodes >= 2",
      pass: report.fallBehindEpisodes >= 2,
      detail: `${report.fallBehindEpisodes}`,
    },
    {
      label: "Final Edge is 1.5",
      pass: report.finalEdge === 1.5,
      detail: `${report.finalEdge}`,
    },
    {
      label: "At least three Edge values seen",
      pass: report.distinctEdgeValues >= 3,
      detail: `${report.distinctEdgeValues}`,
    },
    {
      label: "Max Edge under 80% before generation 10",
      pass: maxEdgeShare < 0.8,
      detail: `${(maxEdgeShare * 100).toFixed(0)}%`,
    },
  ];
}
