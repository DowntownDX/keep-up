import { useCallback, useEffect, useRef, useState } from "react";
import {
  addAgent,
  assignActivity,
  buyPrompt,
  buySkills,
  doItYourself,
  upgradeSubscription,
} from "../engine/actions";
import { recordAutomation } from "../engine/automations";
import type { ActivityId, AgentKind } from "../engine/config";
import { createInitialState, type GameState } from "../engine/state";
import { stepOffline } from "../engine/step";
import { loadStoredGame, saveStoredGame } from "./storage";

const AUTOSAVE_MS = 5_000;

function readInitialState(): GameState {
  if (typeof window === "undefined") return createInitialState();
  try {
    return loadStoredGame(window.localStorage, Date.now());
  } catch {
    return createInitialState();
  }
}

export interface GameController {
  state: GameState;
  saveError: boolean;
  assign: (workerId: string, activity: ActivityId | null) => void;
  hire: (kind: AgentKind) => void;
  active: (workerId: string) => void;
  automate: (workerId: string) => void;
  buyPrompt: () => void;
  buySkills: () => void;
  upgradeSubscription: () => void;
}

export function useGame(): GameController {
  const [state, setState] = useState<GameState>(readInitialState);
  const [saveError, setSaveError] = useState(false);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const persist = useCallback((current: GameState) => {
    try {
      const ok = saveStoredGame(window.localStorage, current, Date.now());
      setSaveError(!ok);
    } catch {
      setSaveError(true);
    }
  }, []);

  useEffect(() => {
    persist(stateRef.current);
    const autosave = window.setInterval(() => persist(stateRef.current), AUTOSAVE_MS);
    const onPageHide = () => persist(stateRef.current);
    const onVisibility = () => {
      if (document.visibilityState === "hidden") persist(stateRef.current);
    };

    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(autosave);
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [persist]);

  useEffect(() => {
    let last = performance.now();
    const clock = window.setInterval(() => {
      const now = performance.now();
      const elapsed = (now - last) / 1000;
      last = now;
      if (elapsed <= 0) return;

      setState((previous) => {
        const next = structuredClone(previous);
        stepOffline(next, elapsed);
        return next;
      });
    }, 1_000);
    return () => window.clearInterval(clock);
  }, []);

  const mutate = useCallback((change: (draft: GameState) => boolean) => {
    setState((previous) => {
      const next = structuredClone(previous);
      return change(next) ? next : previous;
    });
  }, []);

  const assign = useCallback(
    (workerId: string, activity: ActivityId | null) => {
      mutate((draft) => assignActivity(draft, workerId, activity));
    },
    [mutate],
  );

  const hire = useCallback(
    (kind: AgentKind) => {
      mutate((draft) => addAgent(draft, kind));
    },
    [mutate],
  );

  const active = useCallback(
    (workerId: string) => {
      mutate((draft) => doItYourself(draft, workerId));
    },
    [mutate],
  );

  const automate = useCallback(
    (workerId: string) => {
      mutate((draft) => recordAutomation(draft, workerId));
    },
    [mutate],
  );

  const buyPromptLevel = useCallback(() => {
    mutate((draft) => buyPrompt(draft));
  }, [mutate]);
  const buySkillsLevel = useCallback(() => {
    mutate((draft) => buySkills(draft));
  }, [mutate]);
  const upgrade = useCallback(() => {
    mutate((draft) => upgradeSubscription(draft));
  }, [mutate]);

  return {
    state,
    saveError,
    assign,
    hire,
    active,
    automate,
    buyPrompt: buyPromptLevel,
    buySkills: buySkillsLevel,
    upgradeSubscription: upgrade,
  };
}
