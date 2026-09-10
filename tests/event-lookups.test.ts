import { describe, expect, it } from "vitest";
import { npcs, randomEvents } from "../src/data/content";
import { scheduleFollowUps } from "../src/events/encounter-engine";
import { selectInterruption, tickDay } from "../src/events/event-director";
import { advance, initialGame } from "../src/game/rules";
import type { GameData } from "../src/game/types";

// Count catalog work rather than asserting a particular lookup implementation
// or relying on noisy wall-clock timing. Always restore the shared content.
function countIdReads<T>(items: { id: string }[], run: () => T) {
  let reads = 0;
  const descriptors = items.map((item) =>
    Object.getOwnPropertyDescriptor(item, "id")!,
  );
  items.forEach((item, index) => {
    Object.defineProperty(item, "id", {
      configurable: true,
      enumerable: true,
      get: () => {
        reads++;
        return descriptors[index].value;
      },
    });
  });
  try {
    const result = run();
    return { result, reads };
  } finally {
    items.forEach((item, index) =>
      Object.defineProperty(item, "id", descriptors[index]),
    );
  }
}

function office(): GameData {
  return advance(
    {
      ...initialGame(),
      awake: true,
      location: "office",
      flags: ["awake", "commute", "printer-intro", "first-manager"],
      nextEventAt: 1020,
      relations: { accountant: 20, coworker: 20 },
    },
    120,
    "other",
  );
}

describe("event catalog lookup costs", () => {
  it("uses unique stable IDs for NPCs and world events", () => {
    for (const catalog of [npcs, randomEvents]) {
      const ids = catalog.map((item) => item.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("selects an interruption without rescanning the NPC catalog per candidate", () => {
    const game = office();
    const { result, reads } = countIdReads(npcs, () =>
      selectInterruption(game, () => 0),
    );
    expect(result?.id).toBe("printer");
    expect(reads).toBeLessThanOrEqual(npcs.length);
  });

  it("schedules known follow-ups and skips unknown IDs within one catalog pass", () => {
    const game = office();
    const { result, reads } = countIdReads(randomEvents, () =>
      scheduleFollowUps(
        game,
        [
          "printer-disaster",
          "intern-patch",
          "expenses-cleared",
          "missing-event",
        ].map((eventId) => ({ eventId, delay: [5, 5] as const })),
        "lookup-test",
      ),
    );
    expect(result.pendingEvents.map((event) => event.eventId)).toEqual([
      "printer-disaster",
      "intern-patch",
      "expenses-cleared",
    ]);
    expect(result.pendingEvents.every((event) => event.at === 605)).toBe(true);
    expect(reads).toBeLessThanOrEqual(randomEvents.length);
  });

  it("processes due world events without rescanning the catalog per event", () => {
    const ids = ["expenses-cleared", "coworker-coffee"];
    const game = {
      ...office(),
      pendingEvents: ids.map((eventId) => ({
        eventId,
        at: 600,
        expiresAt: 700,
        source: "lookup-test",
      })),
    };
    const { result, reads } = countIdReads(randomEvents, () =>
      tickDay(game, 12, { position: [0, 4] }),
    );
    expect(result.pendingEvents).toEqual([]);
    expect(result.history.map((event) => event.id)).toEqual(ids);
    expect(result.stats.counters.positiveEvents).toBe(2);
    // Applying each result also reads its ID for history, cooldowns and source.
    expect(reads).toBeLessThanOrEqual(randomEvents.length + ids.length * 4);
  });
});
