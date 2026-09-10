import { describe, it, expect } from "vitest";
import { createBrain, stepBrain, visibleToNpc } from "../src/ai/npc-brain";
import { npcs } from "../src/data/content";
import { initialGame } from "../src/game/rules";
import { requestSearch } from "../src/events/encounter-engine";
import { walkable } from "../src/ai/navigation";
import type { Vec2 } from "../src/game/types";
const manager = npcs.find((n) => n.id === "manager")!;
describe("NPC pursuit and courtesy", () => {
  it("an approaching NPC waits through the post-decision grace period", () => {
    const brain = createBrain(manager, 4),
      player: Vec2 = [-6, 3.4];
    brain.position = [-6, 4.4];
    brain.heading = Math.PI;
    const game = requestSearch(
      { ...initialGame(), awake: true, location: "office", quietUntil: 485 },
      "minute",
    );
    expect(stepBrain(brain, manager, game, player, 0.1)).toBe(false);
    expect(brain.state).toBe("waitingForPlayer");
    game.minutes = 486;
    expect(stepBrain(brain, manager, game, player, 0.1)).toBe(true);
  });
  it("the manager physically navigates from his desk to the player", () => {
    const brain = createBrain(manager, 4),
      player: Vec2 = [-6, 3.4];
    const game = requestSearch(
      { ...initialGame(4), awake: true, location: "office" },
      "minute",
    );
    let found = false;
    for (let i = 0; i < 600 && !found; i++) {
      game.minutes += 0.05;
      found = stepBrain(brain, manager, game, player, 0.1);
      expect(walkable(brain.position, "office")).toBe(true);
    }
    expect(found).toBe(true);
    expect(
      Math.hypot(brain.position[0] - player[0], brain.position[1] - player[1]),
    ).toBeLessThan(1.7);
  });
  it("does not track a player through walls or magically discover the bathroom", () => {
    const brain = createBrain(manager, 4);
    brain.position = [0, 0];
    brain.heading = 0;
    const game = {
      ...initialGame(),
      awake: true,
      location: "office" as const,
      hidingZone: "bathroom",
      hiddenUntil: 500,
    };
    expect(visibleToNpc(brain, game, [3, 5.8])).toBe(false);
    const searching = requestSearch(game, "minute");
    stepBrain(brain, manager, searching, [3, 5.8], 0.1);
    expect(brain.lastSeen).toBeNull();
    expect(brain.destination).not.toEqual([3, 5.8]);
  });
  it("yields to the player and has different schedules for different seeds", () => {
    const npc = npcs.find((n) => n.id === "coworker")!,
      brain = createBrain(npc, 1);
    const original = [...brain.position] as Vec2,
      player: Vec2 = [original[0] - 0.4, original[1]];
    stepBrain(brain, npc, { ...initialGame(), awake: true }, player, 0.1);
    expect(brain.state).toBe("waitingForPlayer");
    expect(
      Math.hypot(brain.position[0] - player[0], brain.position[1] - player[1]),
    ).toBeGreaterThan(0.4);
    expect(createBrain(npc, 1).offset).not.toBe(createBrain(npc, 2).offset);
  });
  it("forgets the last known position after losing sight", () => {
    const brain = createBrain(manager, 3);
    brain.lastSeen = [-8, 0];
    brain.lastSeenAt = 480;
    const game = requestSearch(
      {
        ...initialGame(),
        awake: true,
        minutes: 500,
        hidingZone: "bathroom",
        hiddenUntil: 520,
      },
      "minute",
    );
    stepBrain(brain, manager, game, [3, 5.8], 0.1);
    expect(brain.destination).toEqual([-6, 3.4]);
  });
});
