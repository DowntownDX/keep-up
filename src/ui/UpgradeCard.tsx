import { useRef, useState, type KeyboardEvent } from "react";
import {
  PROMPT_BONUS_PER_LEVEL,
  SKILLS_BONUS_PER_LEVEL,
  TEAM_BONUS_PER_LEVEL,
} from "../engine/config";
import { promptCost, skillsCost } from "../engine/rates";
import type { GameState } from "../engine/state";
import { formatAmount, formatPercent } from "./format";

type TabId = "prompt" | "skills";

export interface UpgradeCardProps {
  state: GameState;
  onBuyPrompt: () => void;
  onBuySkills: () => void;
}

export function UpgradeCard({ state, onBuyPrompt, onBuySkills }: UpgradeCardProps) {
  const [tab, setTab] = useState<TabId>("prompt");
  const promptTab = useRef<HTMLButtonElement>(null);
  const skillsTab = useRef<HTMLButtonElement>(null);
  const promptCostNow = promptCost(state.promptLevel);
  const skillsCostNow = skillsCost(state.skillsLevel);

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
        <p className="upgrade-level">Level {state.promptLevel}</p>
        <p className="upgrade-effect">
          +{formatPercent(PROMPT_BONUS_PER_LEVEL)} to Followers, Know-how, Leads and build
          points per level.
        </p>
        <div className="upgrade-buy">
          <span>Next level: {formatAmount(promptCostNow)} Cash</span>
          <button
            type="button"
            className="buy-button"
            disabled={state.resources.cash < promptCostNow}
            aria-label={`Buy Prompt library level for ${formatAmount(promptCostNow)} Cash`}
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
        <p className="upgrade-level">Level {state.skillsLevel}</p>
        <p className="upgrade-effect">
          +{formatPercent(SKILLS_BONUS_PER_LEVEL)} to Cash, Followers, Leads and build
          points per level.
        </p>
        <p className="upgrade-note">
          Specialist levels above 1 also add {formatPercent(TEAM_BONUS_PER_LEVEL)} to their
          activity for everyone.
        </p>
        <div className="upgrade-buy">
          <span>Next level: {formatAmount(skillsCostNow)} Know-how</span>
          <button
            type="button"
            className="buy-button"
            disabled={state.resources.knowHow < skillsCostNow}
            aria-label={`Buy Skills level for ${formatAmount(skillsCostNow)} Know-how`}
            onClick={onBuySkills}
          >
            Buy level
          </button>
        </div>
      </div>
    </section>
  );
}
