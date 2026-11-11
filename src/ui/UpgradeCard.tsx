import { useRef, useState, type KeyboardEvent } from "react";
import {
  PROMPT_BONUS_PER_LEVEL,
  SKILLS_BONUS_PER_LEVEL,
  TEAM_BONUS_PER_LEVEL,
} from "../engine/config";
import type { GameState } from "../engine/state";
import { promptForecast, skillsForecast } from "./forecast";
import { formatAmount, formatBonus, formatDuration, formatPercent } from "./format";

type TabId = "prompt" | "skills";

export interface UpgradeCardProps {
  state: GameState;
  onBuyPrompt: () => void;
  onBuySkills: () => void;
}

function affordLabel(seconds: number | null): string {
  if (seconds === null) return "No income yet";
  if (seconds <= 0) return "Affordable now";
  return `About ${formatDuration(Math.max(1, Math.ceil(seconds)))}`;
}

export function UpgradeCard({ state, onBuyPrompt, onBuySkills }: UpgradeCardProps) {
  const [tab, setTab] = useState<TabId>("prompt");
  const promptTab = useRef<HTMLButtonElement>(null);
  const skillsTab = useRef<HTMLButtonElement>(null);
  const prompt = promptForecast(state);
  const skills = skillsForecast(state);

  function selectTab(next: TabId) {
    setTab(next);
    (next === "prompt" ? promptTab : skillsTab).current?.focus();
  }

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      selectTab(tab === "prompt" ? "skills" : "prompt");
    }
  }

  return (
    <section className="card upgrade-card" aria-labelledby="upgrade-title">
      <h2 id="upgrade-title" className="upgrade-title">
        Upgrades
      </h2>

      <div className="tabs" role="tablist" aria-label="Upgrades">
        <button
          ref={promptTab}
          id="tab-prompt"
          type="button"
          role="tab"
          className="tab"
          aria-selected={tab === "prompt"}
          aria-controls="panel-prompt"
          tabIndex={tab === "prompt" ? 0 : -1}
          onKeyDown={onTabKeyDown}
          onClick={() => setTab("prompt")}
        >
          Prompt library
        </button>
        <button
          ref={skillsTab}
          id="tab-skills"
          type="button"
          role="tab"
          className="tab"
          aria-selected={tab === "skills"}
          aria-controls="panel-skills"
          tabIndex={tab === "skills" ? 0 : -1}
          onKeyDown={onTabKeyDown}
          onClick={() => setTab("skills")}
        >
          Skills
        </button>
      </div>

      <div
        id="panel-prompt"
        role="tabpanel"
        aria-labelledby="tab-prompt"
        className="upgrade-panel"
        hidden={tab !== "prompt"}
      >
        <p className="upgrade-level">Level {prompt.level}</p>
        <p className="upgrade-preview">
          Now +{formatBonus(prompt.now)} → next +{formatBonus(prompt.next)}
        </p>
        <p className="upgrade-effect">
          +{formatPercent(PROMPT_BONUS_PER_LEVEL)} to Followers, Know-how, Leads and build
          points per level.
        </p>
        <div className="upgrade-buy">
          <div className="upgrade-cost">
            <span>Next level: {formatAmount(prompt.cost)} Cash</span>
            <span className="upgrade-eta">{affordLabel(prompt.seconds)}</span>
          </div>
          <button
            type="button"
            className="buy-button"
            disabled={state.resources.cash < prompt.cost}
            aria-label={`Buy Prompt library level for ${formatAmount(prompt.cost)} Cash`}
            onClick={onBuyPrompt}
          >
            Buy level
          </button>
        </div>
      </div>

      <div
        id="panel-skills"
        role="tabpanel"
        aria-labelledby="tab-skills"
        className="upgrade-panel"
        hidden={tab !== "skills"}
      >
        <p className="upgrade-level">Level {skills.level}</p>
        <p className="upgrade-preview">
          Now +{formatBonus(skills.now)} → next +{formatBonus(skills.next)}
        </p>
        <p className="upgrade-effect">
          +{formatPercent(SKILLS_BONUS_PER_LEVEL)} to Cash, Followers, Leads and build
          points per level.
        </p>
        <p className="upgrade-note">
          Specialist levels above 1 also add {formatPercent(TEAM_BONUS_PER_LEVEL)} to their
          activity for everyone.
        </p>
        <div className="upgrade-buy">
          <div className="upgrade-cost">
            <span>Next level: {formatAmount(skills.cost)} Know-how</span>
            <span className="upgrade-eta">{affordLabel(skills.seconds)}</span>
          </div>
          <button
            type="button"
            className="buy-button"
            disabled={state.resources.knowHow < skills.cost}
            aria-label={`Buy Skills level for ${formatAmount(skills.cost)} Know-how`}
            onClick={onBuySkills}
          >
            Buy level
          </button>
        </div>
      </div>
    </section>
  );
}
