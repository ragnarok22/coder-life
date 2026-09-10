import { describe, it, expect } from "vitest";
import { tickDay } from "../src/events/event-director";
import { openEncounter, resolveChoice } from "../src/events/encounter-engine";
import {
  advance,
  applyEffects,
  coffeeEffects,
  initialGame,
} from "../src/game/rules";
import { getEncounter } from "../src/data/content";
import { BALANCE, TIME_CATEGORIES } from "../src/data/balance";
import { migrateGame } from "../src/game/save-migration";
import type { GameData, Vec2 } from "../src/game/types";

type Strategy =
  "balanced" | "quick" | "quality" | "helpful" | "meetings" | "ghost";
export function simulateDay(seed: number, strategy: Strategy) {
  let g: GameData = {
    ...advance({ ...initialGame(seed), awake: true }, 45, "walking"),
    location: "office",
    position: [-6, 3.4],
    flags: ["awake", "commute", "printer-intro"],
    working: true,
  };
  let ticks = 0,
    choices = 0,
    maxQueue = 0,
    steps = 0;
  const history: string[] = [];
  while (!g.finished && steps++ < 2000) {
    maxQueue = Math.max(maxQueue, g.pendingEvents.length);
    if (g.dialogue) {
      const event = getEncounter(g.dialogue)!;
      expect(event).toBeDefined();
      let response = 0;
      if (event.category === "coding")
        response =
          strategy === "quality" ||
          (strategy === "balanced" && g.technicalDebt > 25)
            ? 1
            : 0;
      else if (strategy === "ghost")
        response = Math.min(1, event.choices.length - 1);
      else if (event.id === "excel" && strategy === "balanced") response = 1;
      else if (event.npc === "manager" && strategy === "balanced") response = 1;
      else if (
        strategy === "quality" &&
        ["support", "social", "hr"].includes(event.category)
      )
        response = Math.min(1, event.choices.length - 1);
      history.push(`${event.id}:${response}`);
      choices++;
      g = resolveChoice(g, response).game;
      continue;
    }
    const position: Vec2 = strategy === "ghost" ? [3, 5.8] : [-6, 3.4];
    if (
      g.search &&
      strategy !== "ghost" &&
      g.minutes - g.search.startedAt >= 5
    ) {
      g = openEncounter(g, g.search.id);
      continue;
    }
    if (strategy !== "ghost") {
      if (
        ["balanced", "quality", "helpful"].includes(strategy) &&
        g.energy < 40 &&
        g.minutes > (g.cooldowns.coffee ?? 0)
      ) {
        g = applyEffects(g, coffeeEffects(g.stats.coffees));
        g = {
          ...g,
          coffeeUntil: g.minutes + 45,
          cooldowns: { ...g.cooldowns, coffee: g.minutes + 12 },
          stats: { ...g.stats, coffees: g.stats.coffees + 1 },
        };
        continue;
      }
      if (
        g.minutes >= 780 &&
        !g.flags.includes("sim-lunch") &&
        strategy !== "quick"
      ) {
        g = applyEffects(
          g,
          { minutes: 20, energy: 30, stress: -12, flag: "sim-lunch" },
          undefined,
          "coffee",
        );
        continue;
      }
      g = { ...g, working: true };
    } else g = { ...g, working: false };
    const before = g.minutes;
    g = tickDay(g, 1, {
      position,
      activity: strategy === "ghost" ? "hiding" : "other",
      zone: strategy === "ghost" ? "bathroom" : "desk",
    });
    ticks += g.minutes - before;
    expect(g.pendingEvents.length).toBeLessThanOrEqual(BALANCE.queueLimit);
    expect(g.productivity).toBeGreaterThanOrEqual(0);
    expect(g.productivity).toBeLessThanOrEqual(100);
  }
  expect(steps).toBeLessThan(2000);
  expect(g.finished).toBe(true);
  expect(g.dialogue).toBeNull();
  expect(g.search).toBeNull();
  expect(g.minutes).toBe(1020);
  expect(TIME_CATEGORIES.reduce((n, c) => n + g.stats.time[c], 0)).toBeCloseTo(
    540,
    5,
  );
  expect(() => migrateGame(g, 2)).not.toThrow();
  return {
    game: g,
    history,
    estimatedMinutes: (ticks / BALANCE.timeScale + choices * 6) / 60,
    maxQueue,
  };
}
describe("repeated full Day 1 simulations", () => {
  it("24 normal runs vary meaningfully, stay bounded and finish with valid saves", () => {
    const runs = Array.from({ length: 24 }, (_, i) =>
      simulateDay(1200 + i, "balanced"),
    );
    const signatures = new Set(runs.map((r) => r.history.join("|")));
    expect(signatures.size).toBeGreaterThan(20);
    const durations = runs.map((r) => r.estimatedMinutes),
      progress = runs.map((r) => r.game.productivity);
    expect(durations.reduce((a, b) => a + b, 0) / runs.length).toBeGreaterThan(
      10,
    );
    expect(durations.reduce((a, b) => a + b, 0) / runs.length).toBeLessThan(20);
    expect(progress.some((p) => p >= 90)).toBe(true);
    console.info(
      "NORMAL DAY BALANCE",
      JSON.stringify({
        runs: runs.length,
        unique: signatures.size,
        minMinutes: Math.min(...durations).toFixed(1),
        maxMinutes: Math.max(...durations).toFixed(1),
        meanWork: (progress.reduce((a, b) => a + b, 0) / runs.length).toFixed(
          1,
        ),
        endings: [...new Set(runs.map((r) => r.game.ending))],
        maxQueue: Math.max(...runs.map((r) => r.maxQueue)),
      }),
    );
  });
  it("multiple strategies can finish, discover different endings and make tradeoffs matter", () => {
    const strategies: Strategy[] = [
      "balanced",
      "quick",
      "quality",
      "helpful",
      "meetings",
      "ghost",
    ];
    const runs = strategies.flatMap((strategy) =>
      Array.from({ length: 8 }, (_, i) => ({
        strategy,
        ...simulateDay(80 + i, strategy),
      })),
    );
    expect(new Set(runs.map((r) => r.game.ending)).size).toBeGreaterThanOrEqual(
      4,
    );
    const quick = runs.filter((r) => r.strategy === "quick"),
      proper = runs.filter((r) => r.strategy === "quality");
    expect(quick.reduce((n, r) => n + r.game.technicalDebt, 0)).toBeGreaterThan(
      proper.reduce((n, r) => n + r.game.technicalDebt, 0),
    );
    expect(
      runs
        .filter((r) => r.strategy === "ghost")
        .every((r) => r.game.stats.evaded > 0),
    ).toBe(true);
    console.info(
      "STRATEGY ENDINGS",
      JSON.stringify([...new Set(runs.map((r) => r.game.ending))]),
    );
  });
  it("a saved seeded run continues deterministically", () => {
    const a = simulateDay(997, "balanced"),
      b = simulateDay(997, "balanced");
    expect(a.history).toEqual(b.history);
    expect(a.game.stats).toEqual(b.game.stats);
  });
});
