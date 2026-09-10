import { describe, it, expect } from "vitest";
import {
  selectInterruption,
  selectWorldEvent,
  tickDay,
} from "../src/events/event-director";
import { initialGame } from "../src/game/rules";
import { interruptions, randomEvents } from "../src/data/content";
describe("data-driven event director", () => {
  it("does not select office interruptions at home", () =>
    expect(selectInterruption(initialGame(), () => 0)).toBeNull());
  it("honors cooldowns and keeps tutorials out of the random pool", () => {
    const game = {
      ...initialGame(),
      location: "office" as const,
      minutes: 600,
    };
    const event = selectInterruption(game, () => 0.01)!;
    expect(event.id).not.toBe("hr");
    expect(event.followUpOnly).not.toBe(true);
    const blocked = {
      ...game,
      cooldowns: Object.fromEntries(interruptions.map((e) => [e.id, 1200])),
    };
    expect(selectInterruption(blocked, () => 0.5)).toBeNull();
  });
  it("world events require time, location, progress and expired cooldowns", () => {
    expect(selectWorldEvent(initialGame(), () => 0)).toBeNull();
    const game = {
      ...initialGame(),
      location: "office" as const,
      minutes: 680,
      productivity: 25,
    };
    expect(selectWorldEvent(game, () => 0)?.id).toBe("production");
    expect(
      selectWorldEvent(
        {
          ...game,
          cooldowns: Object.fromEntries(randomEvents.map((e) => [e.id, 1200])),
        },
        () => 0,
      ),
    ).toBeNull();
  });
  it("the director respects pause-for-choice and does not stack incompatible dialogues", () => {
    const g = {
      ...initialGame(),
      awake: true,
      location: "office" as const,
      dialogue: "hr",
    };
    expect(tickDay(g, 100, { position: [0, 0] })).toBe(g);
  });
});
