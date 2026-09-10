import "fake-indexeddb/auto";
import { describe, expect, it, vi } from "vitest";
import { achievements, unlockAchievements } from "../src/data/achievements";
import { tickDay } from "../src/events/event-director";
import { advance, applyEffects, initialGame, matches } from "../src/game/rules";
import { initialProfile } from "../src/game/profile";
import { useGame } from "../src/game/store";
import { createMembershipIndex } from "../src/game/membership-index";

vi.mock("../src/game/audio", () => ({
  audio: { unlock: vi.fn(), play: vi.fn(), configure: vi.fn() },
}));

// Count actual collection reads, not wall-clock timing or a particular implementation.
function observed<T>(values: T[]) {
  let reads = 0;
  const array = new Proxy(values, {
    get(target, key, receiver) {
      if (typeof key === "string" && /^\d+$/.test(key)) reads++;
      return Reflect.get(target, key, receiver);
    },
  });
  return {
    array,
    get reads() {
      return reads;
    },
  };
}

describe("repeated membership lookups", () => {
  it("preserves SameValueZero membership and original duplicate values", () => {
    const index = createMembershipIndex<number>();
    const values = [NaN, 0, -0, 2, 2];
    const membership = index(values);
    expect(membership.has(NaN)).toBe(true);
    expect(membership.has(0)).toBe(true);
    expect(membership.has(-0)).toBe(true);
    expect(membership.has(3)).toBe(false);
    expect(values).toEqual([NaN, 0, -0, 2, 2]);
    expect(index([3]).has(2)).toBe(false);
    expect(index(values)).toBe(membership);
  });
  it("indexes the stable earned-ID collection once across repeated unlock checks", () => {
    const earned = observed(achievements.map((a) => a.id));
    const game = { ...initialGame(), achievements: earned.array };
    for (let i = 0; i < 20; i++) expect(unlockAchievements(game)).toBe(game);
    expect(earned.reads).toBeLessThanOrEqual(earned.array.length);
  });

  it("reuses flags across clock ticks without repeating linear scans", () => {
    const flags = observed([
      "awake",
      "commute",
      "printer-intro",
      "first-manager",
      "lunch",
    ]);
    let game = advance(
      { ...initialGame(), awake: true, location: "office", working: true },
      320,
    );
    game = { ...game, working: false, flags: flags.array, nextEventAt: 1020 };
    for (let i = 0; i < 20; i++)
      game = tickDay(game, 0.125, { position: [0, 4] });
    expect(game.minutes).toBe(802.5);
    expect(game.flags).toBe(flags.array);
    expect(flags.reads).toBeLessThanOrEqual(flags.array.length);
  });

  it("preserves empty and duplicate condition semantics and refreshes replaced snapshots", () => {
    const flags = observed(["ready", "ready", "reviewed"]);
    const game = { ...initialGame(), flags: flags.array };
    for (let i = 0; i < 10; i++) {
      expect(matches(game, { flags: ["ready", "reviewed", "ready"] })).toBe(
        true,
      );
    }
    expect(flags.reads).toBeLessThanOrEqual(flags.array.length);
    expect(
      matches({ ...game, flags: ["ready"] }, { flags: ["reviewed"] }),
    ).toBe(false);
    expect(matches(game, { flags: [] })).toBe(true);
    expect(matches(game, { flags: ["reviewed"] })).toBe(true);
    expect(flags.array).toEqual(["ready", "ready", "reviewed"]);
  });

  it("clears flags in one pass while preserving insertion order and removal precedence", () => {
    const clear = observed(["remove", "absent"]);
    const game = {
      ...initialGame(),
      flags: ["first", "remove", "first", "last"],
    };
    const next = applyEffects(game, {
      flags: ["added", "remove"],
      clearFlags: clear.array,
    });
    expect(clear.reads).toBeLessThanOrEqual(clear.array.length);
    expect(next.flags).toEqual(["first", "last", "added"]);
    expect(game.flags).toEqual(["first", "remove", "first", "last"]);
  });

  it("indexes stable cancellation IDs once, retaining queue order, duplicate survivors and objects", () => {
    const cancel = observed(["cancel", "absent"]);
    const pendingEvents = ["keep", "cancel", "keep", "other"].map(
      (eventId) => ({
        eventId,
        at: 600,
        expiresAt: 700,
        source: "membership-test",
      }),
    );
    const game = { ...initialGame(), pendingEvents };
    for (let i = 0; i < 10; i++) {
      const next = applyEffects(game, { cancelFollowUps: cancel.array });
      expect(next.pendingEvents).toEqual([
        pendingEvents[0],
        pendingEvents[2],
        pendingEvents[3],
      ]);
      expect(next.pendingEvents[0]).toBe(pendingEvents[0]);
    }
    expect(cancel.reads).toBeLessThanOrEqual(cancel.array.length);
    expect(applyEffects(game, {}).pendingEvents).toEqual(pendingEvents);
    expect(applyEffects(game, { cancelFollowUps: [] }).pendingEvents).toEqual(
      pendingEvents,
    );
  });

  it("announces the first newly unlocked achievement after merging the career profile", () => {
    const earned = observed(
      achievements.filter((a) => a.id !== "my-machine").map((a) => a.id),
    );
    useGame.setState({
      game: {
        ...initialGame(),
        achievements: earned.array,
        dialogue: "auth-code",
      },
      profile: initialProfile(),
      screen: "playing",
      toast: null,
    });
    useGame.getState().choose(0);
    // One index for unlock evaluation, one append-copy, and at most one notification index.
    expect(earned.reads).toBeLessThanOrEqual(earned.array.length * 3);
    expect(useGame.getState().toast?.message).toContain(
      "Unlocked: Works On My Machine.",
    );
    expect(useGame.getState().profile.achievements).toContain("my-machine");
  });
});
