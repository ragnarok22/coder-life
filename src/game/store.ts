import { create } from "zustand";
import {
  GAME_MINUTES_PER_SECOND,
  interruptions,
  randomEvents,
} from "../data/content";
import { objects } from "../data/world";
import {
  advance,
  applyEffects,
  coffeeEffects,
  initialGame,
  matches,
} from "./rules";
import { loadGame, resetSave, saveGame } from "./persistence";
import { audio } from "./audio";
import { runtime } from "./runtime";
import type { GameData, Preferences, Screen } from "./types";

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
      localStorage.getItem("coder-life:preferences") ?? "{}",
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
  screen: Screen;
  preferences: Preferences;
  nearest: string | null;
  toast: { title: string; message: string; id: number } | null;
  hasSave: boolean;
  saveStatus: "idle" | "saving" | "saved" | "error";
  saveError: string;
  revision: number;
  seeking: string | null;
  newGame: () => void;
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
  notify: (title: string, message: string) => void;
  save: () => Promise<void>;
  reset: () => Promise<void>;
  setPreferences: (p: Partial<Preferences>) => void;
}
function commit(game: GameData): Partial<Store> {
  return {
    game,
    ...(game.finished ? { screen: "results" as const, seeking: null } : {}),
  };
}
export const useGame = create<Store>((set, get) => ({
  game: initialGame(),
  screen: "menu",
  preferences: readPreferences(),
  nearest: null,
  toast: null,
  hasSave: false,
  saveStatus: "idle",
  saveError: "",
  revision: 0,
  seeking: null,
  newGame: () => {
    audio.unlock();
    const game = initialGame();
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
      set({ hasSave: !!(await loadGame()) });
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
        screen: game.finished ? "results" : "playing",
        revision: get().revision + 1,
        seeking: null,
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
    let game = advance(state.game, seconds * GAME_MINUTES_PER_SECOND);
    if (game.finished) {
      set(commit(game));
      void get().save();
      return;
    }
    if (game.dialogue || !game.awake) return;
    if (
      game.location === "commute" &&
      runtime.player[1] < 2 &&
      !game.flags.includes("commute")
    ) {
      set({ game: { ...game, flags: [...game.flags, "commute"] } });
      get().interrupt("commute");
      return;
    }
    if (game.location === "office") {
      if (!game.flags.includes("printer-intro") && runtime.player[1] < 3.5) {
        set({ game: { ...game, flags: [...game.flags, "printer-intro"] } });
        get().interrupt("printer");
        return;
      }
      if (
        game.stats.workMinutes >= 30 &&
        !game.flags.includes("first-manager")
      ) {
        game = { ...game, flags: [...game.flags, "first-manager"] };
        set({ seeking: "minute" });
        get().notify(
          "Incoming: “a minute”.",
          "Mark is looking for you. You can see him coming.",
        );
      }
      if (game.minutes >= 720 && !game.flags.includes("lunch")) {
        game = { ...game, flags: [...game.flags, "lunch"] };
        get().notify(
          "Lunch is a feature, not a bug.",
          "Find the kitchen. Food restores energy; coffee buys focus.",
        );
      }
      if (game.minutes >= game.nextEventAt) {
        game = {
          ...game,
          nextEventAt: game.minutes + (game.minutes > 780 ? 22 : 40),
        };
        if (!get().seeking) {
          const eligible = interruptions.filter(
            (i) =>
              i.id !== "commute" &&
              matches(game, i.conditions) &&
              game.minutes >= (game.cooldowns[i.id] ?? 0),
          );
          // Data-defined probability and previous decisions affect who asks next.
          const weighted = eligible.map((event) => ({
            event,
            weight:
              event.probability +
              (game.futureChance[event.npc] ?? 0) +
              Math.max(0, game.relations[event.npc] ?? 0) / 1000,
          }));
          const total = weighted.reduce((sum, entry) => sum + entry.weight, 0);
          let roll = Math.random() * Math.max(1, total);
          for (const entry of weighted) {
            roll -= entry.weight;
            if (roll <= 0) {
              set({ seeking: entry.event.id });
              break;
            }
          }
        }
        for (const event of randomEvents) {
          if (
            matches(game, event.conditions) &&
            game.minutes >= (game.cooldowns[event.id] ?? 0) &&
            Math.random() < event.probability
          ) {
            game = applyEffects(game, event.effects);
            game = {
              ...game,
              cooldowns: {
                ...game.cooldowns,
                [event.id]: game.minutes + event.cooldown,
                ...(event.id === "coffee-broken"
                  ? { coffee: game.minutes + 10 }
                  : {}),
              },
            };
            get().notify(event.title, event.message);
            break;
          }
        }
      }
    }
    set(commit(game));
  },
  interrupt: (id) => {
    const { game, screen } = get();
    if (screen !== "playing" || game.dialogue || game.finished) return;
    const i = interruptions.find((i) => i.id === id);
    if (!i) return;
    audio.play("dialogue");
    set({
      game: {
        ...game,
        working: false,
        dialogue: id,
        stats: { ...game.stats, interruptions: game.stats.interruptions + 1 },
      },
      seeking: null,
    });
  },
  choose: (index) => {
    const { game } = get();
    const i = interruptions.find((i) => i.id === game.dialogue),
      choice = i?.choices[index];
    if (!i || !choice) return;
    const updated = applyEffects(
      { ...game, dialogue: null },
      choice.effects,
      i.npc,
    );
    set(
      commit({
        ...updated,
        cooldowns: {
          ...updated.cooldowns,
          [i.id]: updated.minutes + i.cooldown,
        },
      }),
    );
    get().notify(i.name, choice.response);
    void get().save();
  },
  interact: () => {
    const { game, nearest, screen } = get();
    if (screen !== "playing" || game.dialogue || game.finished) return;
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
    let updated = applyEffects(game, effects);
    if (obj.kind === "coffee") {
      audio.play("coffee");
      updated = {
        ...updated,
        coffeeUntil: updated.minutes + 45,
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
        ? `Coffee #${updated.stats.coffees}. +${effects.energy} energy. Focus boosted for 45 minutes.`
        : `A little more human. ${effects.energy ? `+${effects.energy} energy.` : ""}`,
    );
    void get().save();
  },
  stopWorking: () => set({ game: { ...get().game, working: false } }),
  save: async () => {
    set({ saveStatus: "saving" });
    try {
      const game = {
        ...get().game,
        position: [...runtime.player] as [number, number],
      };
      await saveGame(game);
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
        "coder-life:preferences",
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
