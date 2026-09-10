import { describe, expect, it } from "vitest";
import {
  advance,
  applyEffects,
  clock,
  coffeeEffects,
  initialGame,
  matches,
  score,
  tasksComplete,
} from "../src/game/rules";
import { interruptions } from "../src/data/content";
import { resolveChoice } from "../src/events/encounter-engine";

describe("day simulation", () => {
  it("starts at home at 08:00 and does not run while asleep", () => {
    const g = initialGame();
    expect(g.location).toBe("home");
    expect(clock(g.minutes)).toBe("08:00");
    expect(advance(g, 40)).toBe(g);
  });
  it("pauses for decisions, but work consumes time and energy", () => {
    const g = { ...initialGame(), awake: true, working: true };
    expect(advance({ ...g, dialogue: "hr" }, 10).minutes).toBe(480);
    const next = advance(g, 30);
    expect(next.minutes).toBe(510);
    expect(next.productivity).toBeGreaterThan(0);
    expect(next.energy).toBeLessThan(g.energy);
    expect(next.stats.workMinutes).toBe(30);
  });
  it("makes exhausted, stressed developers less productive; coffee temporarily boosts output", () => {
    const g = { ...initialGame(), awake: true, working: true };
    expect(
      advance({ ...g, energy: 10, stress: 90 }, 15).productivity,
    ).toBeLessThan(advance(g, 15).productivity);
    expect(
      advance({ ...g, coffeeUntil: 550 }, 15).productivity,
    ).toBeGreaterThan(advance(g, 15).productivity);
  });
  it("a five minute meeting has a variable real cost and carries its future consequences", () => {
    const meeting = interruptions.find((i) => i.id === "minute")!;
    const next = resolveChoice(
      { ...initialGame(), dialogue: meeting.id },
      0,
    ).game;
    expect(next.minutes).toBeGreaterThanOrEqual(495);
    expect(next.minutes).toBeLessThanOrEqual(525);
    expect(next.stats.meetings).toBe(1);
    expect(next.flags).toContain("manager-task");
    expect(next.relations.manager).toBe(2);
    expect(next.stats.time.meetings).toBe(next.minutes - 480);
    expect(next.extraTasks).toHaveLength(1);
  });
  it("coffee has diminishing returns and a stress cost for abuse", () => {
    expect([0, 1, 2, 3, 4].map((n) => coffeeEffects(n).energy)).toEqual([
      20, 15, 10, 5, 3,
    ]);
    expect(coffeeEffects(0).stress).toBe(-5);
    expect(coffeeEffects(3).stress).toBe(8);
  });
  it("clamps resources, relationships and day-end time", () => {
    const next = applyEffects(
      { ...initialGame(), minutes: 1015 },
      { minutes: 35, energy: 200, stress: 200, relationship: -200 },
      "manager",
    );
    expect(next.minutes).toBe(1020);
    expect(next.energy).toBe(100);
    expect(next.stress).toBe(100);
    expect(next.relations.manager).toBe(-100);
    expect(next.stats.wastedMinutes).toBe(5);
    expect(next.finished).toBe(true);
    expect(next.working).toBe(false);
  });
  it("ends work precisely at 17:00 and scores a completed day", () => {
    let g = {
      ...initialGame(),
      awake: true,
      working: true,
      productivity: 90,
      minutes: 980,
      energy: 100,
      stress: 0,
    };
    g = advance(g, 90);
    expect(g.minutes).toBe(1020);
    expect(g.stats.workMinutes).toBe(40);
    expect(g.productivity).toBe(100);
    expect(g.finished).toBe(true);
    expect(tasksComplete(g)).toBe(4);
    expect(g.achievements).toContain("productive");
    expect(score(g)).toBeGreaterThan(900);
    expect(advance(g, 10)).toBe(g);
  });
  it("checks event gates independently", () => {
    const g = initialGame();
    expect(matches(g, { location: "office" })).toBe(false);
    expect(matches(g, { after: 600 })).toBe(false);
    expect(matches(g, { before: 470 })).toBe(false);
    expect(matches(g, { minWork: 30 })).toBe(false);
    expect(matches(g, { minProgress: 20 })).toBe(false);
    expect(matches(g, { flag: "lunch" })).toBe(false);
    expect(matches(g, { location: "home", after: 480, before: 500 })).toBe(
      true,
    );
  });
});
