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
import {
  clearStoredGame,
  loadStoredGameWithReport,
  saveStoredGame,
  type OfflineSummary,
} from "./storage";

const AUTOSAVE_MS = 5_000;

export type ActionKind =
  | "assign"
  | "hire"
  | "active"
  | "automate"
  | "buyPrompt"
  | "buySkills"
  | "subscription";

export interface ActionTick {
  id: number;
  kind: ActionKind;
  workerId?: string;
}

function readInitialGame(): { state: GameState; summary: OfflineSummary | null } {
  if (typeof window === "undefined") return { state: createInitialState(), summary: null };
  try {
    return loadStoredGameWithReport(window.localStorage, Date.now());
  } catch {
    return { state: createInitialState(), summary: null };
  }
}

export interface GameController {
  state: GameState;
  actionTick: ActionTick | null;
  resetToken: number;
  offline: OfflineSummary | null;
  saveError: boolean;
  dismissOffline: () => void;
  reset: () => void;
  assign: (workerId: string, activity: ActivityId | null) => void;
  hire: (kind: AgentKind) => void;
  active: (workerId: string) => void;
  automate: (workerId: string) => void;
  buyPrompt: () => void;
  buySkills: () => void;
  upgradeSubscription: () => void;
}

export function useGame(): GameController {
  const [initial] = useState(readInitialGame);
  const [state, setState] = useState<GameState>(initial.state);
  const [offline, setOffline] = useState<OfflineSummary | null>(initial.summary);
  const [saveError, setSaveError] = useState(false);
  const [actionTick, setActionTick] = useState<ActionTick | null>(null);
  const [resetToken, setResetToken] = useState(0);
  const nextTick = useRef(0);
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

  const markAction = useCallback((kind: ActionKind, workerId?: string) => {
    nextTick.current += 1;
    setActionTick({ id: nextTick.current, kind, workerId });
  }, []);

  const assign = useCallback(
    (workerId: string, activity: ActivityId | null) => {
      const worker = stateRef.current.workers.find((candidate) => candidate.id === workerId);
      if (worker?.activity === activity) return;
      mutate((draft) => assignActivity(draft, workerId, activity));
      markAction("assign", workerId);
    },
    [mutate, markAction],
  );

  const hire = useCallback(
    (kind: AgentKind) => {
      mutate((draft) => addAgent(draft, kind));
      markAction("hire");
    },
    [mutate, markAction],
  );

  const active = useCallback(
    (workerId: string) => {
      mutate((draft) => doItYourself(draft, workerId));
      markAction("active", workerId);
    },
    [mutate, markAction],
  );

  const automate = useCallback(
    (workerId: string) => {
      mutate((draft) => recordAutomation(draft, workerId));
      markAction("automate", workerId);
    },
    [mutate, markAction],
  );

  const buyPromptLevel = useCallback(() => {
    mutate((draft) => buyPrompt(draft));
    markAction("buyPrompt");
  }, [mutate, markAction]);
  const buySkillsLevel = useCallback(() => {
    mutate((draft) => buySkills(draft));
    markAction("buySkills");
  }, [mutate, markAction]);
  const upgrade = useCallback(() => {
    mutate((draft) => upgradeSubscription(draft));
    markAction("subscription");
  }, [mutate, markAction]);

  const dismissOffline = useCallback(() => {
    setOffline(null);
  }, []);

  const reset = useCallback(() => {
    try {
      clearStoredGame(window.localStorage);
    } catch {
      // A failed clear still starts a fresh game; the next autosave replaces it.
    }
    setState(createInitialState());
    setActionTick(null);
    setResetToken((current) => current + 1);
    setOffline(null);
    setSaveError(false);
  }, []);

  return {
    state,
    actionTick,
    resetToken,
    offline,
    saveError,
    dismissOffline,
    reset,
    assign,
    hire,
    active,
    automate,
    buyPrompt: buyPromptLevel,
    buySkills: buySkillsLevel,
    upgradeSubscription: upgrade,
  };
}
