import "fake-indexeddb/auto";
import { describe, it, expect, vi } from "vitest";
import { playerAnimation } from "../src/game/player-presentation";
import { initialGame } from "../src/game/rules";
import { CHAIR_POSE, HOME_BED, chairPose } from "../src/data/pose-anchors";
import { playerChairPose } from "../src/data/office-layout";
import { walkable } from "../src/ai/navigation";
import { useGame } from "../src/game/store";
import { runtime } from "../src/game/runtime";
import { initialProfile } from "../src/game/profile";

vi.mock("../src/game/audio", () => ({
  audio: { unlock: vi.fn(), play: vi.fn(), configure: vi.fn() },
}));
describe("player presentation and furniture anchors", () => {
  it("prioritizes sleep and dialogue over stale locomotion samples", () => {
    const game = initialGame();
    expect(playerAnimation(game, "playing", 5, true)).toBe("sleep");
    expect(
      playerAnimation(
        { ...game, awake: true, working: true, dialogue: "minute" },
        "playing",
        5,
        true,
      ),
    ).toBe("talk");
    expect(playerAnimation({ ...game, awake: true }, "paused", 5, true)).toBe(
      "idle",
    );
    expect(playerAnimation({ ...game, awake: true }, "playing", 0, true)).toBe(
      "idle",
    );
    expect(
      playerAnimation(
        { ...game, awake: true, working: true },
        "playing",
        0,
        false,
      ),
    ).toBe("typing");
  });
  it("places chair poses on their cushions and rotates their offsets with the desk", () => {
    expect(CHAIR_POSE.seatHeight).toBeCloseTo(
      CHAIR_POSE.cushionCenter + CHAIR_POSE.cushionThickness / 2,
    );
    expect(playerChairPose.position).toEqual([-6, 3.16]);
    const rotated = chairPose({ position: [2, 3], rotation: Math.PI / 2 });
    expect(rotated.position[0]).toBeCloseTo(3.16);
    expect(rotated.position[1]).toBeCloseTo(3);
    expect(walkable(playerChairPose.position, "office")).toBe(true);
    expect(walkable(playerChairPose.exitPosition, "office")).toBe(true);
  });
  it("aligns the sleeping head with the pillow and keeps the wake-up point clear", () => {
    expect(HOME_BED.sleepOrigin[0]).toBe(HOME_BED.center[0]);
    expect(HOME_BED.sleepOrigin[2] - 1.48).toBeCloseTo(HOME_BED.pillow.z);
    expect(walkable(HOME_BED.wakePosition, "home")).toBe(true);
    expect(initialGame().position).toEqual(HOME_BED.wakePosition);
  });
  it.each([true, false])(
    "continues a chair save beside the chair (working=%s)",
    async (working) => {
      runtime.player = [...playerChairPose.position];
      useGame.setState({
        game: {
          ...initialGame(),
          location: "office",
          awake: true,
          working,
          dialogue: working ? null : "minute",
          position: [...playerChairPose.position],
        },
        profile: initialProfile(),
        screen: "playing",
      });
      await useGame.getState().save();
      useGame.setState({ screen: "menu" });
      await useGame.getState().continueGame();
      const game = useGame.getState().game;
      expect(game.working).toBe(false);
      expect(game.position).toEqual(playerChairPose.exitPosition);
      expect(game.minutes).toBe(480);
    },
  );
});
