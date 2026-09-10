import "fake-indexeddb/auto";
import { beforeEach, describe, it, expect } from "vitest";
import { loadGame, saveGame, resetSave } from "../src/game/persistence";
import { advance, initialGame } from "../src/game/rules";
import { initialProfile, recordProgress } from "../src/game/profile";
import { migrateGame } from "../src/game/save-migration";
import {
  requestSearch,
  scheduleFollowUps,
} from "../src/events/encounter-engine";
import { tickDay } from "../src/events/event-director";
import type { GameData } from "../src/game/types";

describe("versioned saves and cross-run progress", () => {
  beforeEach(async () => {
    await resetSave();
  });
  it("upgrades an original version-1 day without losing trust, time or achievements", async () => {
    const old = {
      ...initialGame(),
      minutes: 700,
      relations: { accountant: 20 },
      achievements: ["First day survivor"],
      stats: {
        workMinutes: 100,
        wastedMinutes: 50,
        interruptions: 3,
        helped: 2,
        rejected: 1,
        meetings: 1,
        coffees: 2,
        maxStress: 40,
        deskArrival: 520,
      },
    };
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("coder-life", 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("saves", "readwrite");
      tx.objectStore("saves").put(
        { version: 1, savedAt: Date.now(), game: old },
        "current",
      );
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    const migrated = (await loadGame())!.game;
    expect(migrated.relations.accountant).toBe(20);
    expect(migrated.stats.time.coding).toBe(100);
    expect(migrated.stats.time.other).toBe(120);
    expect(migrated.achievements).toContain("survivor");
    await saveGame(migrated);
    expect((await loadGame())?.version).toBe(2);
  });
  it("preserves queue, active search, RNG and extended metrics across reload", async () => {
    let g: GameData = {
      ...advance({ ...initialGame(567), awake: true }, 60),
      location: "office",
      technicalDebt: 44,
      codeQuality: 72,
      reputation: 61,
    };
    g = requestSearch(g, "minute");
    g = scheduleFollowUps(
      g,
      [{ eventId: "scope-regression", delay: [15, 30] }],
      "test",
    );
    await saveGame(g);
    const restored = (await loadGame())!.game;
    expect(restored).toEqual(g);
    expect(tickDay(restored, 5, { position: [0, 0] })).toEqual(
      tickDay(g, 5, { position: [0, 0] }),
    );
  });
  it("retains achievements, endings, historical relationships and best score across a new run", async () => {
    const completed = advance(
      {
        ...initialGame(10),
        awake: true,
        productivity: 100,
        relations: { intern: 20 },
      },
      540,
    );
    const profile = recordProgress(initialProfile(), completed);
    await saveGame(initialGame(20), profile);
    const restored = await loadGame();
    expect(restored!.profile.achievements).toContain("productive");
    expect(restored!.profile.bestScore).toBeGreaterThan(0);
    expect(restored!.profile.endings).toContain("productive");
    expect(restored!.profile.history[0].relations.intern).toBe(20);
    await resetSave();
    expect(await loadGame()).toBeNull();
  });
  it("rejects damaged time budgets and metrics without replacing an existing save", async () => {
    const valid = initialGame(77);
    await saveGame(valid);
    expect(() => migrateGame({ ...valid, minutes: 700 }, 2)).toThrow();
    expect(() => migrateGame({ ...valid, technicalDebt: NaN }, 2)).toThrow();
    expect((await loadGame())!.game.seed).toBe(77);
  });
});
