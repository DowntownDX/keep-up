import { VENTURE_COUNT, VENTURE_NAMES } from "../engine/config";
import { runBot, type BotReport } from "./bot";
import {
  checkArmsRace,
  checkPacing,
  type ArmsRaceCheck,
  type TargetCheck,
} from "./targets";

const runtime = globalThis as {
  process?: { argv: string[]; exitCode?: number };
};
const args = runtime.process?.argv.slice(2) ?? [];

function numberArg(name: string): number | null {
  const index = args.indexOf(name);
  const value = index >= 0 ? args[index + 1] : args.find((arg) => arg.startsWith(`${name}=`))?.split("=")[1];
  if (value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

const days = numberArg("--days") ?? 30;
const json = args.includes("--json");
const { report } = runBot(days);
const pacing = checkPacing(report.milestones);
const arms = checkArmsRace(report);
const passed = !report.sawNegativeResource && pacing.every((check) => check.pass) && arms.every((check) => check.pass);

if (json) {
  console.log(
    JSON.stringify(
      {
        passed,
        negativeResource: report.sawNegativeResource,
        report,
        pacing,
        arms,
      },
      null,
      2,
    ),
  );
} else {
  printReport(report, pacing, arms, passed);
}

if (!passed && runtime.process) runtime.process.exitCode = 1;

function printReport(
  bot: BotReport,
  pacingChecks: TargetCheck[],
  armsChecks: ArmsRaceCheck[],
  ok: boolean,
): void {
  console.log(
    `Keep Up sim — ${bot.elapsedSeconds === bot.requestedDays * 86_400 ? `${bot.requestedDays} days` : formatClock(bot.elapsedSeconds)}` +
      ` · ${bot.won ? "all ten ventures shipped" : "run ended"}`,
  );
  console.log("");
  console.log("Ventures");
  console.log("  #   Name                      Shipped     Edge  Tier  Gen");
  for (let index = 0; index < VENTURE_COUNT; index += 1) {
    const ship = bot.ventures[index];
    const name = VENTURE_NAMES[index].padEnd(24);
    if (ship) {
      console.log(
        `  ${String(index + 1).padStart(2)}  ${name}  ${formatClock(ship.atSeconds).padStart(9)}  ${String(
          ship.edge,
        ).padStart(4)}  ${String(ship.tier).padStart(4)}  ${String(ship.generation).padStart(3)}`,
      );
    } else {
      console.log(`  ${String(index + 1).padStart(2)}  ${name}  ${"—".padStart(9)}`);
    }
  }

  console.log("");
  console.log("Milestones");
  for (const check of pacingChecks) {
    const actual = check.actualSeconds === null ? "not reached" : formatClock(check.actualSeconds);
    console.log(
      `  ${check.label.padEnd(20)} ${actual.padStart(10)}   target ${targetText(check).padEnd(17)} ${
        check.pass ? "PASS" : "FAIL"
      }`,
    );
  }

  console.log("");
  console.log("Arms race");
  for (const check of armsChecks) {
    console.log(
      `  ${check.label.padEnd(40)} ${check.detail.padStart(6)}   ${check.pass ? "PASS" : "FAIL"}`,
    );
  }

  const timeAtMax = bot.timeAtEdge["1.5"] ?? 0;
  const maxShare = bot.elapsedSeconds > 0 ? ((timeAtMax / bot.elapsedSeconds) * 100).toFixed(0) : "0";
  console.log("");
  console.log(
    `Final: tier ${bot.finalTier}, generation ${bot.finalGeneration}, Edge ${bot.finalEdge}, ` +
      `time at max Edge ${maxShare}%`,
  );
  console.log(
    `Hires: ${bot.hires.map((hire) => `${hire.kind}@${formatClock(hire.atSeconds)}`).join(", ") || "none"}`,
  );
  console.log(
    `Resource check: ${bot.sawNegativeResource ? "FAIL — a resource went negative" : "PASS — no negative resources"}`,
  );
  console.log("");
  console.log(ok ? "Result: PASS" : "Result: FAIL");
}

function targetText(check: TargetCheck): string {
  if (check.minSeconds !== null && check.maxSeconds !== null) {
    return `${formatClock(check.minSeconds)}-${formatClock(check.maxSeconds)}`;
  }
  if (check.maxSeconds !== null) return `<= ${formatClock(check.maxSeconds)}`;
  if (check.minSeconds !== null) return `>= ${formatClock(check.minSeconds)}`;
  return "any";
}

function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  const rest = seconds % 60;
  const clock = `${pad(hours)}:${pad(minutes)}:${pad(rest)}`;
  return days > 0 ? `${days}d ${clock}` : clock;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}
