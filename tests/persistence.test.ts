import "fake-indexeddb/auto";
import { beforeEach, describe, it, expect } from "vitest";
import { loadGame, saveGame, resetSave } from "../src/game/persistence";
import { initialGame, advance } from "../src/game/rules";

describe("local IndexedDB saves", () => {
  beforeEach(async () => {
    await resetSave();
  });
  it("returns null for a new player", async () => {
    expect(await loadGame()).toBeNull();
  });
  it("round-trips game data, decisions, position and relationships", async () => {
    const game = {
      ...advance({ ...initialGame(), awake: true }, 270),
      position: [-6, 0.6] as [number, number],
      relations: { manager: -3 },
      flags: ["manager-task"],
      dialogue: "excel",
    };
    await saveGame(game);
    const loaded = await loadGame();
    expect(loaded?.version).toBe(2);
    expect(loaded?.game).toEqual(game);
    expect(loaded?.savedAt).toBeGreaterThan(0);
  });
  it("manual save replaces the previous snapshot and reset deletes it", async () => {
    await saveGame(initialGame());
    await saveGame(advance({ ...initialGame(), awake: true }, 420));
    expect((await loadGame())?.game.minutes).toBe(900);
    await resetSave();
    expect(await loadGame()).toBeNull();
  });
});
