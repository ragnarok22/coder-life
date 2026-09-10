import { describe, it, expect } from "vitest";
import {
  advance,
  applyEffects,
  coffeeEffects,
  initialGame,
} from "../src/game/rules";
import { getEncounter, randomEvents } from "../src/data/content";
import {
  openEncounter,
  resolveChoice,
  applyWorldEvent,
  requestSearch,
} from "../src/events/encounter-engine";
import { expireSearch } from "../src/events/event-director";
import { migrateGame } from "../src/game/save-migration";
import type { GameData } from "../src/game/types";

function start(seed = 37): GameData {
  return {
    ...advance({ ...initialGame(seed), awake: true }, 45, "walking"),
    location: "office",
    working: true,
  };
}
function choice(g: GameData, id: string, index: number) {
  const event = getEncounter(id)!;
  const earliest = Math.max(
    g.minutes,
    event.conditions.after ?? 0,
    g.cooldowns[id] ?? 0,
  );
  g = advance(g, earliest - g.minutes);
  if (event.category === "coding")
    g = advance(
      { ...g, working: true },
      Math.max(0, g.nextCodingAt - g.stats.workMinutes),
    );
  return resolveChoice(openEncounter(g, id), index).game;
}
function coffee(g: GameData) {
  g = advance(g, Math.max(0, (g.cooldowns.coffee ?? 0) - g.minutes));
  g = applyEffects(g, coffeeEffects(g.stats.coffees));
  return {
    ...g,
    coffeeUntil: g.minutes + 45,
    cooldowns: { ...g.cooldowns, coffee: g.minutes + 12 },
    stats: { ...g.stats, coffees: g.stats.coffees + 1 },
  };
}
function complete(g: GameData) {
  const result = advance({ ...g, dialogue: null }, 1020 - g.minutes);
  expect(result.finished).toBe(true);
  expect(() => migrateGame(result, 2)).not.toThrow();
  return result;
}
describe("reachable ending routes using real effects and complete time budgets", () => {
  it("Hero Employee rewards a mix of mentoring, support and focused code", () => {
    let g = start();
    for (const [id, index] of [
      ["intern-question", 0],
      ["intern-test", 0],
      ["printer", 0],
      ["install", 0],
      ["password", 0],
      ["wifi", 0],
      ["pairing", 0],
    ] as const)
      g = choice(g, id, index);
    g = applyWorldEvent(
      g,
      randomEvents.find((e) => e.id === "intern-patch")!,
    );
    g = coffee({ ...g, working: true });
    for (const id of [
      "auth-code",
      "test-code",
      "merge-code",
      "dependency-code",
    ])
      g = choice({ ...g, working: true }, id, 1);
    g = coffee(g);
    g = coffee(g);
    expect(complete({ ...g, working: true }).ending).toBe("hero");
  });
  it("careful focused work reaches the craftsperson ending", () => {
    let g = start();
    for (const id of [
      "auth-code",
      "test-code",
      "merge-code",
      "review-code",
      "legacy-code",
      "build-code",
    ]) {
      g = choice(g, id, 1);
      if (g.energy < 60) g = coffee(g);
    }
    expect(complete({ ...g, working: true }).ending).toBe("craftsperson");
  });
  it("support requests can consume a day and produce IT Support Technician", () => {
    let g = { ...start(), working: false };
    for (const id of [
      "printer",
      "install",
      "password",
      "wifi",
      "pdf",
      "excel",
      "monitor",
      "pdf-export",
      "phone-call",
    ])
      g = choice(g, id, 0);
    expect(complete(g).ending).toBe("it-support");
  });
  it("taking meetings can genuinely accumulate two hours before 17:00", () => {
    let g = advance(start(9), 30);
    for (const id of ["minute", "emergency-sync", "status", "minute"])
      g = choice(g, id, id === "status" ? 1 : 0);
    if (g.stats.time.meetings < 120) g = choice(g, "minute", 0);
    expect(complete(g).ending).toBe("meeting-survivor");
  });
  it("risky fixes followed by production trouble produce a debt-collector ending", () => {
    let g = start();
    for (const id of [
      "auth-code",
      "test-code",
      "merge-code",
      "review-code",
      "legacy-code",
      "dependency-code",
      "build-code",
    ])
      g = choice(g, id, 0);
    g = advance(g, Math.max(0, 660 - g.minutes));
    g = applyWorldEvent(
      g,
      randomEvents.find((e) => e.id === "production")!,
    );
    expect(complete(g).ending).toBe("debt-collector");
  });
  it("repeated coffee abuse can burn the player out without blocking the day", () => {
    let g = { ...start(), working: false };
    for (let i = 0; i < 11; i++) g = coffee(g);
    expect(complete(g).ending).toBe("burned-out");
  });
  it("four expired searches produce Office Ghost and preserve a valid time ledger", () => {
    let g = { ...start(), working: false };
    for (const id of ["printer", "hr-survey", "excel", "sales-promise"]) {
      g = requestSearch(g, id);
      g = advance(g, g.search!.expiresAt - g.minutes, "hiding");
      g = expireSearch(g, "bathroom");
    }
    expect(complete(g).ending).toBe("ghost");
  });
  it.each([
    [100, "productive"],
    [75, "somehow-productive"],
    [20, "still-employed"],
  ] as const)("choosing when to stop at %s%% reaches %s", (target, ending) => {
    let g = start();
    while (g.productivity < target && g.minutes < 1000) {
      g = advance(g, 1);
      if (g.energy < 40) g = coffee(g);
    }
    expect(complete({ ...g, working: false }).ending).toBe(ending);
  });
});
