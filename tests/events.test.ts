import { describe, it, expect } from "vitest";
import {
  selectInterruption,
  selectWorldEvent,
} from "../src/events/event-director";
import { initialGame } from "../src/game/rules";

describe("data-driven event director", () => {
  it("does not select office interruptions at home", () => {
    expect(selectInterruption(initialGame(), () => 0)).toBeNull();
  });
  it("honors cooldowns and allows a quiet period", () => {
    const game = { ...initialGame(), location: "office" as const };
    expect(selectInterruption(game, () => 0.01)?.id).toBe("hr");
    expect(
      selectInterruption({ ...game, cooldowns: { hr: 600 } }, () => 0.01)?.id,
    ).toBe("printer");
    expect(selectInterruption(game, () => 0.99)).toBeNull();
  });
  it("world events require both timing and progress", () => {
    expect(selectWorldEvent(initialGame(), () => 0)).toBeNull();
    expect(
      selectWorldEvent(
        { ...initialGame(), minutes: 680, productivity: 25 },
        () => 0,
      )?.id,
    ).toBe("production");
    expect(
      selectWorldEvent(
        {
          ...initialGame(),
          minutes: 680,
          productivity: 25,
          cooldowns: { production: 800 },
        },
        () => 0,
      ),
    ).toBeNull();
    expect(
      selectWorldEvent(
        { ...initialGame(), minutes: 680, productivity: 25 },
        () => 1,
      ),
    ).toBeNull();
  });
});
