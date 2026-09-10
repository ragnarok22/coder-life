import { create } from "zustand";
import {
  GAME_MINUTES_PER_SECOND,
  getEncounter,
  interruptions,
  randomEvents,
} from "../data/content";
import { BALANCE } from "../data/balance";
import { zoneAt, meetingOccupied } from "../data/zones";
import { achievements, unlockAchievements } from "../data/achievements";
import { objects } from "../data/world";
import { tickDay } from "../events/event-director";
import {
  openEncounter,
  resolveChoice,
  applyWorldEvent,
} from "../events/encounter-engine";
import { applyEffects, coffeeEffects, initialGame, matches } from "./rules";
import { loadGame, resetSave, saveGame } from "./persistence";
import { audio } from "./audio";
import { runtime } from "./runtime";
import { initialProfile, recordProgress } from "./profile";
import type { CareerProfile, GameData, Preferences, Screen } from "./types";
import { createMembershipIndex } from "./membership-index";

const profileAchievementMembership = createMembershipIndex<string>();
const runAchievementMembership = createMembershipIndex<string>();

const defaultPrefs: Preferences = {
  master: 0.6,
  music: 0.25,
  effects: 0.6,
  sensitivity: 1,
  quality: "high",
};
function readPreferences(): Preferences {
  try {
    const p = JSON.parse(
      localStorage.getItem("coder-life:preferences:v1") ??
        localStorage.getItem("coder-life:preferences") ??
        "{}",
    );
    const result = { ...defaultPrefs };
    for (const k of ["master", "music", "effects", "sensitivity"] as const)
      if (Number.isFinite(p[k]))
        result[k] = Math.max(0, Math.min(k === "sensitivity" ? 2 : 1, p[k]));
    if (["low", "medium", "high"].includes(p.quality))
      result.quality = p.quality;
    return result;
  } catch {
    return defaultPrefs;
  }
}
interface Store {
  game: GameData;
  profile: CareerProfile;
  screen: Screen;
  preferences: Preferences;
  nearest: string | null;
  toast: { title: string; message: string; id: number } | null;
  hasSave: boolean;
  saveStatus: "idle" | "saving" | "saved" | "error";
  saveError: string;
  revision: number;
  seeking: string | null;
  newGame: (seed?: number) => void;
  continueGame: () => Promise<void>;
  checkSave: () => Promise<void>;
  pause: () => void;
  resume: () => void;
  menu: () => void;
  tick: (seconds: number) => void;
  interact: () => void;
  choose: (index: number) => void;
  interrupt: (id: string) => void;
  stopWorking: () => void;
  hide: () => void;
  stopHiding: () => void;
  triggerEvent: (id: string) => void;
  notify: (title: string, message: string) => void;
  save: () => Promise<void>;
  reset: () => Promise<void>;
  setPreferences: (p: Partial<Preferences>) => void;
}
function commit(game: GameData): Partial<Store> {
  game = unlockAchievements(game);
  return {
    game,
    seeking: game.search?.id ?? null,
    profile: recordProgress(useGame.getState().profile, game),
    ...(game.finished ? { screen: "results" as const, seeking: null } : {}),
  };
}
export const useGame = create<Store>((set, get) => ({
  game: initialGame(),
  profile: initialProfile(),
  screen: "menu",
  preferences: readPreferences(),
  nearest: null,
  toast: null,
  hasSave: false,
  saveStatus: "idle",
  saveError: "",
  revision: 0,
  seeking: null,
  newGame: (seed) => {
    audio.unlock();
    const game = initialGame(
      seed ?? (Date.now() ^ Math.floor(Math.random() * 4294967296)) >>> 0,
    );
    game.runId += `-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    runtime.player = [...game.position];
    runtime.npcs.clear();
    set({
      game,
      screen: "playing",
      nearest: null,
      seeking: null,
      revision: get().revision + 1,
      toast: null,
    });
    void get().save();
  },
  checkSave: async () => {
    try {
      const saved = await loadGame();
      set({ hasSave: !!saved, profile: saved?.profile ?? initialProfile() });
    } catch (e) {
      set({ saveError: String(e), saveStatus: "error" });
    }
  },
  continueGame: async () => {
    try {
      const save = await loadGame();
      if (!save) {
        set({ hasSave: false });
        return;
      }
      audio.unlock();
      const game = { ...initialGame(), ...save.game, working: false };
      runtime.player = [...game.position];
      runtime.npcs.clear();
      set({
        game,
        profile: save.profile,
        screen: game.finished ? "results" : "playing",
        revision: get().revision + 1,
        seeking: game.search?.id ?? null,
        nearest: null,
        toast: null,
      });
    } catch (e) {
      set({ saveStatus: "error", saveError: String(e) });
    }
  },
  pause: () => {
    if (get().screen === "playing") {
      set({ screen: "paused" });
      void get().save();
    }
  },
  resume: () => {
    audio.unlock();
    set({ screen: "playing" });
  },
  menu: () => {
    void get().save();
    set({ screen: "menu", nearest: null });
  },
  notify: (title, message) => {
    audio.play("notification");
    set({ toast: { title, message, id: Date.now() } });
  },
  tick: (seconds) => {
    const state = get();
    if (state.screen !== "playing") return;
    const game = tickDay(state.game, seconds * GAME_MINUTES_PER_SECOND, {
      position: runtime.player,
      activity:
        runtime.animation === "walk" || runtime.animation === "run"
          ? "walking"
          : "other",
      zone: zoneAt(runtime.player, state.game.location)?.id,
    });
    set(commit(game));
    const latest = game.history.at(-1);
    if (latest && latest !== state.game.history.at(-1)) {
      const event = randomEvents.find((e) => e.id === latest.id);
      const friend =
        latest.id.startsWith("search:") &&
        getEncounter(game.search?.id ?? null)?.npc === "manager" &&
        (game.relations.coworker ?? 0) >= BALANCE.goodRelationship;
      get().notify(
        friend ? "Casey: “Heads up. Mark’s coming.”" : latest.title,
        friend
          ? "Casey buys you five minutes. Hide, refuel, or keep coding."
          : (event?.message ??
              (latest.id === "evaded"
                ? "You protected your time. Their trust took a small hit."
                : "Your choices change what happens next.")),
      );
    }
    if (game.finished || game.dialogue !== state.game.dialogue)
      void get().save();
  },
  interrupt: (id) => {
    const { game, screen } = get();
    if (screen !== "playing" || game.dialogue || game.finished) return;
    const i = getEncounter(id);
    if (!i) return;
    audio.play("dialogue");
    set(commit(openEncounter(game, id)));
    void get().save();
  },
  choose: (index) => {
    const { game } = get();
    if (get().screen !== "playing") return;
    const result = resolveChoice(game, index);
    if (result.game === game) return;
    set(commit(result.game));
    const profileAchievements = profileAchievementMembership(
      get().profile.achievements,
    );
    const previousAchievements = runAchievementMembership(game.achievements);
    const unlocked = result.game.achievements.find(
      (id) => !profileAchievements.has(id) || !previousAchievements.has(id),
    );
    get().notify(
      result.title,
      result.message +
        (unlocked
          ? ` Unlocked: ${achievements.find((a) => a.id === unlocked)?.title ?? unlocked}.`
          : ""),
    );
    void get().save();
  },
  interact: () => {
    const { game, nearest, screen } = get();
    if (screen !== "playing" || game.dialogue || game.finished) return;
    if (game.hidingZone) {
      get().stopHiding();
      return;
    }
    if (game.working) {
      get().stopWorking();
      return;
    }
    if (!game.awake) {
      set({ game: { ...game, awake: true, flags: ["awake"] } });
      get().notify(
        "Monday has entered the chat.",
        "WASD to move. Drag the mouse to look. E to interact.",
      );
      return;
    }
    if (nearest?.startsWith("npc:")) {
      const id = nearest.slice(4);
      const i = interruptions.find(
        (i) =>
          i.npc === id &&
          !i.followUpOnly &&
          i.id !== "hr" &&
          matches(game, i.conditions) &&
          game.minutes >= (game.cooldowns[i.id] ?? 0),
      );
      if (i) get().interrupt(i.id);
      else
        get().notify(
          "A rare peaceful moment.",
          "They’re busy. You should probably be busy too.",
        );
      return;
    }
    const obj = objects.find(
      (o) => o.id === nearest && o.location === game.location,
    );
    if (!obj) return;
    if (obj.hideZone) {
      get().hide();
      return;
    }
    if (game.minutes < (game.cooldowns[obj.id] ?? 0)) {
      get().notify(
        "Give it a minute.",
        "This will be available again soon. Try getting some work done.",
      );
      return;
    }
    if (obj.kind === "exit") {
      const location = game.location === "home" ? "commute" : "office";
      const position: [number, number] =
        location === "commute" ? [0, 7] : [0, 7.2];
      runtime.player = position;
      runtime.npcs.clear();
      audio.play("door");
      set({
        game: { ...game, location, position, working: false },
        nearest: null,
        revision: get().revision + 1,
      });
      if (location === "office") get().interrupt("hr");
      else
        get().notify(
          "The commute",
          "A short walk. What could possibly interrupt it?",
        );
      void get().save();
      return;
    }
    if (obj.kind === "desk") {
      audio.play("keyboard");
      set({
        game: {
          ...game,
          working: true,
          stats: {
            ...game.stats,
            deskArrival: game.stats.deskArrival ?? game.minutes,
          },
        },
      });
      return;
    }
    if (obj.kind === "printer") {
      audio.play("printer");
      get().interrupt("printer");
      return;
    }
    if (obj.kind === "inspect" || obj.kind === "bed") {
      get().notify(
        obj.label,
        obj.description ??
          "You have a perfectly good bed. And unfortunately, a job.",
      );
      return;
    }
    const effects =
      obj.kind === "coffee"
        ? coffeeEffects(game.stats.coffees)
        : (obj.effects ?? {});
    let updated = applyEffects(
      game,
      effects,
      undefined,
      obj.kind === "coffee" || obj.kind === "food"
        ? "coffee"
        : obj.kind === "rest"
          ? "other"
          : "social",
    );
    if (obj.kind === "coffee") {
      audio.play("coffee");
      updated = {
        ...updated,
        coffeeUntil: updated.minutes + BALANCE.coffeeDuration,
        stats: { ...updated.stats, coffees: updated.stats.coffees + 1 },
      };
    }
    set(
      commit({
        ...updated,
        cooldowns: {
          ...updated.cooldowns,
          [obj.id]: updated.minutes + (obj.cooldown ?? 0),
        },
      }),
    );
    get().notify(
      obj.kind === "coffee" ? "Java successfully installed." : obj.label,
      obj.kind === "coffee"
        ? `Coffee #${updated.stats.coffees}. +${effects.energy} energy. ${updated.stats.coffees >= 5 ? "You can now hear colors. Stress has opinions." : "Focus boosted for 45 minutes."}`
        : `A little more human. ${effects.energy ? `+${effects.energy} energy.` : ""}`,
    );
    void get().save();
  },
  stopWorking: () => set({ game: { ...get().game, working: false } }),
  hide: () => {
    const { game, screen } = get(),
      zone = zoneAt(runtime.player, game.location);
    if (
      screen !== "playing" ||
      game.dialogue ||
      game.finished ||
      game.hidingZone
    )
      return;
    if (!zone?.hide) {
      get().notify(
        "Step inside a quiet zone.",
        "The bathroom, kitchen and empty meeting room can help.",
      );
      return;
    }
    if (
      (zone.id === "meeting-room" && meetingOccupied(game.minutes)) ||
      game.minutes < (game.cooldowns.hide ?? 0)
    ) {
      get().notify(
        "Not a good hiding spot right now.",
        "Try another room, or come back after a little actual work.",
      );
      return;
    }
    const next = applyEffects(game, {
      stress: BALANCE.hideStress,
      counters: { hideAttempts: 1 },
    });
    set(
      commit({
        ...next,
        working: false,
        hidingZone: zone.id,
        hiddenUntil: game.minutes + BALANCE.hideMinutes,
        cooldowns: {
          ...next.cooldowns,
          hide: game.minutes + BALANCE.hideMinutes + BALANCE.hideCooldown,
        },
      }),
    );
    get().notify(
      "Strategic disappearance.",
      `Seven minutes in the ${zone.name.toLowerCase()}. E to leave early. The clock keeps moving.`,
    );
  },
  stopHiding: () =>
    set({ game: { ...get().game, hidingZone: null, hiddenUntil: 0 } }),
  triggerEvent: (id) => {
    const event = randomEvents.find((e) => e.id === id);
    if (event) set(commit(applyWorldEvent(get().game, event)));
  },
  save: async () => {
    set({ saveStatus: "saving" });
    try {
      const game = {
        ...get().game,
        position: [...runtime.player] as [number, number],
      };
      await saveGame(game, get().profile);
      set({ hasSave: true, saveStatus: "saved", saveError: "" });
    } catch (e) {
      set({
        saveStatus: "error",
        saveError: `Could not save locally. ${String(e)}`,
      });
    }
  },
  reset: async () => {
    try {
      await resetSave();
      set({
        hasSave: false,
        game: initialGame(),
        profile: initialProfile(),
        screen: "menu",
        saveStatus: "idle",
        saveError: "",
      });
    } catch (e) {
      set({ saveStatus: "error", saveError: String(e) });
    }
  },
  setPreferences: (p) => {
    const preferences = { ...get().preferences, ...p };
    set({ preferences });
    audio.configure(preferences);
    try {
      localStorage.setItem(
        "coder-life:preferences:v1",
        JSON.stringify(preferences),
      );
    } catch {
      get().notify(
        "Preferences are temporary.",
        "Browser storage is unavailable.",
      );
    }
  },
}));
