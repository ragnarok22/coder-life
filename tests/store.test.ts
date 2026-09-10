import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useGame } from "../src/game/store";
import { initialGame } from "../src/game/rules";
import { runtime } from "../src/game/runtime";

vi.mock("../src/game/audio", () => ({
  audio: { unlock: vi.fn(), play: vi.fn(), configure: vi.fn() },
}));
describe("Day 1 integration", () => {
  beforeEach(() => {
    useGame.setState({
      game: initialGame(),
      screen: "playing",
      seeking: null,
      nearest: null,
      toast: null,
    });
    runtime.player = [-1.7, -2];
  });
  it("wakes, commutes with interruption, enters HR, reaches printer and works", () => {
    useGame.getState().interact();
    expect(useGame.getState().game.awake).toBe(true);
    useGame.setState({ nearest: "home-door" });
    useGame.getState().interact();
    expect(useGame.getState().game.location).toBe("commute");
    runtime.player = [0, 1];
    useGame.getState().tick(1);
    expect(useGame.getState().game.dialogue).toBe("commute");
    useGame.getState().choose(1);
    useGame.setState({ nearest: "office-door" });
    useGame.getState().interact();
    expect(useGame.getState().game.location).toBe("office");
    expect(useGame.getState().game.dialogue).toBe("hr");
    useGame.getState().choose(0);
    runtime.player = [0, 2];
    useGame.getState().tick(1);
    expect(useGame.getState().game.dialogue).toBe("printer");
    useGame.getState().choose(1);
    useGame.setState({ nearest: "desk" });
    useGame.getState().interact();
    expect(useGame.getState().game.working).toBe(true);
    expect(useGame.getState().game.stats.deskArrival).not.toBeNull();
    useGame.getState().tick(30);
    expect(useGame.getState().seeking).toBe("minute");
    expect(useGame.getState().game.productivity).toBeGreaterThan(0);
    useGame.getState().interrupt("minute");
    expect(useGame.getState().game.working).toBe(false);
    useGame.getState().choose(1);
    expect(useGame.getState().game.flags).toContain("manager-task");
  });
  it("pauses the clock and limits repeated coffee use", () => {
    useGame.setState({
      game: {
        ...initialGame(),
        awake: true,
        location: "office",
        flags: ["printer-intro"],
      },
      nearest: "coffee",
    });
    useGame.getState().interact();
    expect(useGame.getState().game.stats.coffees).toBe(1);
    useGame.getState().interact();
    expect(useGame.getState().game.stats.coffees).toBe(1);
    useGame.getState().pause();
    const minutes = useGame.getState().game.minutes;
    useGame.getState().tick(30);
    expect(useGame.getState().game.minutes).toBe(minutes);
  });
  it("saves a finished day and can continue at results", async () => {
    useGame.setState({
      game: {
        ...initialGame(),
        awake: true,
        working: true,
        location: "office",
        minutes: 1019,
        productivity: 99,
      },
    });
    useGame.getState().tick(2);
    expect(useGame.getState().screen).toBe("results");
    await useGame.getState().save();
    useGame.setState({ screen: "menu" });
    await useGame.getState().continueGame();
    expect(useGame.getState().screen).toBe("results");
    expect(useGame.getState().game.minutes).toBe(1020);
  });
});
