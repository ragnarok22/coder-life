import { describe, it, expect } from "vitest";
import { BALANCE, TIME_CATEGORIES } from "../src/data/balance";
import {
  encounters,
  interruptions,
  codingDecisions,
  randomEvents,
  npcs,
  getEncounter,
} from "../src/data/content";
import { achievements, unlockAchievements } from "../src/data/achievements";
import { endings, evaluateEnding } from "../src/data/endings";
import { advance, applyEffects, initialGame } from "../src/game/rules";
import {
  openEncounter,
  resolveChoice,
  scheduleFollowUps,
  requestSearch,
  applyWorldEvent,
} from "../src/events/encounter-engine";
import { expireSearch, tickDay } from "../src/events/event-director";
import { recordProgress, initialProfile } from "../src/game/profile";
import { migrateGame } from "../src/game/save-migration";
import type { GameData } from "../src/game/types";

const office = (seed = 1): GameData => ({
  ...initialGame(seed),
  awake: true,
  location: "office",
  position: [-6, 3.4],
  flags: ["awake", "commute", "printer-intro", "first-manager"],
});
const choose = (g: GameData, id: string, index: number) =>
  resolveChoice(openEncounter(g, id), index).game;
describe("Gameplay Polish content contracts", () => {
  it("ships distinct personalities, 20+ interruptions, 8+ coding decisions, 10+ world events, 15+ achievements and 8+ endings", () => {
    expect(
      interruptions.filter((i) => !i.followUpOnly).length,
    ).toBeGreaterThanOrEqual(20);
    expect(codingDecisions.length).toBeGreaterThanOrEqual(8);
    expect(
      randomEvents.filter((e) => !e.followUpOnly).length,
    ).toBeGreaterThanOrEqual(10);
    expect(achievements.length).toBeGreaterThanOrEqual(15);
    expect(endings.length).toBeGreaterThanOrEqual(8);
    for (const id of [
      "manager",
      "hr",
      "accountant",
      "sales",
      "coworker",
      "intern",
      "senior",
      "receptionist",
    ])
      expect(npcs.find((n) => n.id === id)?.personality).toBeDefined();
    expect(
      new Set(npcs.map((n) => JSON.stringify(n.schedule))).size,
    ).toBeGreaterThanOrEqual(6);
  });
  it("every follow-up and world-event decision resolves to known data and no ids collide", () => {
    const ids = [...encounters, ...randomEvents].map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const e of encounters)
      for (const c of e.choices)
        for (const f of [
          ...(c.followUps ?? []),
          ...(c.outcomes?.flatMap((o) => o.followUps ?? []) ?? []),
        ])
          expect(ids).toContain(f.eventId);
    for (const e of randomEvents) {
      for (const f of e.followUps ?? []) expect(ids).toContain(f.eventId);
      if (e.decision) expect(getEncounter(e.decision)).toBeDefined();
    }
  });
});
describe("choices have persistent consequences", () => {
  it("task completion rewards reputation once, even after a regression and repair", () => {
    const completed = applyEffects(office(), { taskProgress: 100 });
    expect(completed.productivity).toBe(25);
    expect(completed.reputation).toBe(53);
    const repaired = applyEffects(
      applyEffects(completed, { productivity: -5 }),
      { taskProgress: 20 },
    );
    expect(repaired.productivity).toBe(25);
    expect(repaired.reputation).toBe(53);
  });
  it("cancelled scope restores earned progress without exceeding 100%", () => {
    const scoped = applyEffects(
      { ...office(), productivity: 100 },
      { addTask: "Cancelled feature" },
    );
    expect(scoped.productivity).toBe(80);
    const cancelled = applyEffects(scoped, { removeTask: "Cancelled feature" });
    expect(cancelled.extraTasks).toHaveLength(0);
    expect(cancelled.productivity).toBe(100);
  });
  it("teaching Excel improves trust and lowers future requests", () => {
    const g = choose(office(), "excel", 1);
    expect(g.relations.accountant).toBe(10);
    expect(g.futureChance.accountant).toBeLessThan(0);
    expect(g.stats.time.ITSupport).toBe(18);
  });
  it("mentoring twice enables a useful intern patch", () => {
    let g = choose(office(), "intern-question", 0);
    g = choose(g, "intern-test", 0);
    expect(g.relations.intern).toBe(20);
    expect(g.stats.counters.mentored).toBe(2);
    const next = applyWorldEvent(
      g,
      randomEvents.find((e) => e.id === "intern-patch")!,
    );
    expect(next.productivity).toBeGreaterThan(g.productivity);
    expect(next.achievements).toContain("mentor");
  });
  it("risky coding increases debt, proper fixes improve quality, and asking the senior has variable durations", () => {
    const quick = choose(office(), "auth-code", 0),
      proper = choose(office(), "auth-code", 1);
    expect(quick.technicalDebt).toBeGreaterThan(proper.technicalDebt);
    expect(proper.codeQuality).toBeGreaterThan(quick.codeQuality);
    expect(quick.achievements).toContain("my-machine");
    expect(proper.stats.time.coding).toBe(8);
    const durations = new Set(
      Array.from(
        { length: 20 },
        (_, i) => choose(office(i + 1), "auth-code", 2).minutes,
      ),
    );
    expect(durations.size).toBe(2);
  });
  it("extra scope preserves earned work, increases task count and keeps delivery deadlines within Day 1", () => {
    const next = applyEffects(
      { ...office(), productivity: 50 },
      { addTask: "More scope", deadline: -100 },
    );
    expect(next.productivity).toBe(40);
    expect(next.extraTasks).toHaveLength(1);
    expect(next.deadline).toBe(960);
  });
  it("a friendly coworker buys five extra minutes of warning", () => {
    const g = office(),
      normal = requestSearch(g, "minute"),
      friendly = requestSearch({ ...g, relations: { coworker: 20 } }, "minute");
    expect(friendly.search!.startedAt - normal.search!.startedAt).toBe(5);
  });
});
describe("five decision-dependent chains", () => {
  it("early risky fixes remain scheduled until their production-event time window opens", () => {
    const game = scheduleFollowUps(
      office(),
      [{ eventId: "production", delay: [20, 30] }],
      "early-fix",
    );
    expect(game.pendingEvents[0].at).toBe(660);
  });
  it("follow-ups and world events honor cooldowns as well as their queue limit", () => {
    const game = {
      ...office(),
      minutes: 680,
      productivity: 40,
      cooldowns: { production: 730 },
    };
    expect(
      scheduleFollowUps(
        game,
        [{ eventId: "production", delay: [5, 10] }],
        "test",
      ).pendingEvents[0].at,
    ).toBe(730);
    expect(
      applyWorldEvent(
        game,
        randomEvents.find((e) => e.id === "production")!,
      ),
    ).toBe(game);
  });
  it.each([
    ["printer", 1, "printer-disaster"],
    ["sales-promise", 0, "scope-approved"],
    ["internet-choice", 1, "sales-offline"],
    ["hr-survey", 1, "hr-reminder"],
    ["intern-question", 0, "intern-patch"],
  ])("%s schedules %s", (id, index, next) => {
    expect(
      choose(office(), String(id), Number(index)).pendingEvents.map(
        (p) => p.eventId,
      ),
    ).toContain(next);
  });
  it("printer repair prevents escalation, and an ignored printer leads to the manager", () => {
    const ignored = choose(office(), "printer", 1);
    const repaired = choose(ignored, "printer", 0);
    expect(
      repaired.pendingEvents.some((p) => p.eventId === "printer-disaster"),
    ).toBe(false);
    const disaster = applyWorldEvent(
      ignored,
      randomEvents.find((e) => e.id === "printer-disaster")!,
    );
    expect(
      disaster.pendingEvents.some((p) => p.eventId === "manager-printer"),
    ).toBe(true);
  });
  it("the queue is bounded, deduplicated, and never spills into another day", () => {
    let g = office();
    for (let i = 0; i < 20; i++)
      g = scheduleFollowUps(
        g,
        randomEvents.map((e) => ({ eventId: e.id, delay: [5, 10] as const })),
        `test-${i}`,
      );
    expect(g.pendingEvents.length).toBeLessThanOrEqual(BALANCE.queueLimit);
    expect(new Set(g.pendingEvents.map((p) => p.eventId)).size).toBe(
      g.pendingEvents.length,
    );
    expect(
      scheduleFollowUps(
        { ...g, minutes: 1019, pendingEvents: [] },
        [{ eventId: "production", delay: [10, 20] }],
        "late",
      ).pendingEvents,
    ).toEqual([]);
  });
});
describe("evasion, time accounting and end-of-day invariants", () => {
  it("hiding costs real game time and expires without blocking input forever", () => {
    const g = {
      ...office(),
      hiddenUntil: 487,
      hidingZone: "bathroom",
      working: false,
    };
    const next = advance(g, 10, "walking");
    expect(next.hidingZone).toBeNull();
    expect(next.stats.time.hiding).toBe(7);
    expect(next.stats.time.walking).toBe(3);
  });
  it("a searching manager gives up, updates trust and unlocks bathroom escape", () => {
    const next = expireSearch(requestSearch(office(), "minute"), "bathroom");
    expect(next.search).toBeNull();
    expect(next.stats.evaded).toBe(1);
    expect(next.relations.manager).toBe(-2);
    expect(next.achievements).toContain("bathroom-escape");
  });
  it("accounts for every minute once and stops exactly at 17:00", () => {
    let g = advance(office(), 45, "walking");
    g = choose(g, "minute", 0);
    g = applyEffects(g, { minutes: 5, energy: 20 }, undefined, "coffee");
    g = advance({ ...g, working: true }, 1000);
    expect(g.finished).toBe(true);
    expect(g.minutes).toBe(1020);
    expect(
      TIME_CATEGORIES.reduce((sum, c) => sum + g.stats.time[c], 0),
    ).toBeCloseTo(540);
    expect(g.stats.workMinutes + g.stats.wastedMinutes).toBeCloseTo(540);
    expect(g.pendingEvents).toHaveLength(0);
    expect(() => migrateGame(g, 2)).not.toThrow();
  });
  it("all ten endings have reachable non-overlapping evaluation fixtures", () => {
    const g = office();
    const examples: Record<string, GameData> = {
      "burned-out": { ...g, stats: { ...g.stats, maxStress: 98 } },
      hero: {
        ...g,
        productivity: 100,
        reputation: 80,
        stats: { ...g.stats, helped: 6 },
      },
      craftsperson: { ...g, productivity: 90, codeQuality: 90 },
      ghost: { ...g, stats: { ...g.stats, evaded: 5 } },
      "it-support": {
        ...g,
        stats: {
          ...g.stats,
          helped: 8,
          time: { ...g.stats.time, ITSupport: 120 },
        },
      },
      "meeting-survivor": {
        ...g,
        stats: { ...g.stats, time: { ...g.stats.time, meetings: 130 } },
      },
      "debt-collector": {
        ...g,
        technicalDebt: 80,
        stats: { ...g.stats, counters: { productionBugs: 2 } },
      },
      productive: { ...g, productivity: 100 },
      "somehow-productive": { ...g, productivity: 75 },
      "still-employed": g,
    };
    for (const ending of endings)
      expect(evaluateEnding(examples[ending.id]).id).toBe(ending.id);
  });
  it("all achievement conditions can unlock and the profile survives replay without double-counting results", () => {
    let g = advance(
      { ...office(), codeQuality: 90, technicalDebt: 0, productivity: 100 },
      540,
    );
    g = unlockAchievements({
      ...g,
      stats: {
        ...g.stats,
        helped: 12,
        rejected: 10,
        coffees: 5,
        longestEvadeStreak: 4,
        workMinutes: 0,
        time: { ...g.stats.time, meetings: 150 },
        counters: {
          basicFixes: 4,
          printerFixes: 3,
          bathroomEscapes: 1,
          scopeChanges: 3,
          quickFixes: 5,
          managerChanges: 2,
          productionBugs: 1,
          internHelp: 1,
          positiveEvents: 3,
        },
      },
    });
    expect(g.achievements).toHaveLength(achievements.length);
    const profile = recordProgress(initialProfile(), g);
    expect(profile.completedRuns).toBe(1);
    expect(recordProgress(profile, g).completedRuns).toBe(1);
    expect(recordProgress(profile, office(2)).achievements).toEqual(
      profile.achievements,
    );
  });
  it("delayed incompatible coding events expire when the player never visits the desk", () => {
    let g = scheduleFollowUps(
      office(),
      [{ eventId: "auth-code", delay: [1, 1] }],
      "test",
    );
    g = tickDay(g, 540, { position: [3, 5.8], zone: "bathroom" });
    while (g.dialogue) {
      g = resolveChoice(g, 1).game;
      g = tickDay(g, 540, { position: [3, 5.8], zone: "bathroom" });
    }
    expect(g.finished).toBe(true);
    expect(g.pendingEvents).toHaveLength(0);
  });
});
