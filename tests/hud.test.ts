import "fake-indexeddb/auto";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Hud } from "../src/ui/hud";
import { useGame } from "../src/game/store";
import { initialGame } from "../src/game/rules";
import { runtime } from "../src/game/runtime";
import { BALANCE } from "../src/data/balance";
import type { GameData } from "../src/game/types";

vi.mock("../src/game/audio", () => ({
  audio: { unlock: vi.fn(), play: vi.fn(), configure: vi.fn() },
}));
vi.mock("../src/game/store", async (importOriginal) => {
  const { useGame } =
    await importOriginal<typeof import("../src/game/store")>();
  return {
    // Render the arranged client state instead of Zustand's initial SSR snapshot.
    useGame: Object.assign(
      (selector: (state: ReturnType<typeof useGame.getState>) => unknown) =>
        selector(useGame.getState()),
      useGame,
    ),
  };
});

function renderHud(
  patch: Partial<GameData> = {},
  nearest: string | null = null,
) {
  useGame.setState({ game: { ...initialGame(), ...patch }, nearest });
  return renderToStaticMarkup(createElement(Hud));
}

describe("HUD render branches", () => {
  beforeEach(() => {
    useGame.setState({ screen: "playing", toast: null, saveStatus: "idle" });
    runtime.player = [-1.7, -2];
  });

  it.each<[Partial<GameData>, string]>([
    [{}, "GET OUT OF BED"],
    [{ awake: true, productivity: 100 }, "GET TO WORK"],
    [{ awake: true, location: "commute", energy: 10 }, "WALK TO THE OFFICE"],
    [
      { awake: true, location: "office", productivity: 100, working: true },
      "SURVIVE UNTIL 17:00",
    ],
    [
      { awake: true, location: "office", working: true, energy: 10 },
      "SHIP SOMETHING. ANYTHING.",
    ],
    [{ awake: true, location: "office", energy: 24 }, "REFUEL AT THE KITCHEN"],
    [{ awake: true, location: "office", energy: 25 }, "REACH YOUR DESK"],
    [
      {
        awake: true,
        location: "office",
        productivity: 100,
        hidingZone: "bathroom",
        hiddenUntil: BALANCE.dayStart + 7,
      },
      "LAY LOW · 7 MIN",
    ],
  ])("preserves objective priority for %j", (game, objective) => {
    expect(renderHud(game)).toContain(`<strong>${objective}</strong>`);
  });

  it("keeps coffee and deadline feedback alongside the objective", () => {
    const html = renderHud({
      awake: true,
      location: "office",
      coffeeUntil: BALANCE.dayStart + 5,
      deadline: BALANCE.dayStart + 30,
    });
    expect(html).toContain("Java boost · 5 min");
    expect(html).toContain("Delivery 08:30 · 30 min left.");
    expect(html).toContain("deadline-pressure");
    expect(
      renderHud({ awake: true, location: "office", productivity: 100 }),
    ).not.toContain("deadline-note");
  });

  it("prioritizes hiding and waking over nearby interactions", () => {
    const hiding = renderHud(
      {
        awake: true,
        location: "office",
        hidingZone: "bathroom",
        hiddenUntil: BALANCE.dayStart + 7,
      },
      "npc:manager",
    );
    expect(hiding).toContain("Leave hiding spot");
    expect(hiding).not.toContain("Talk to Mark");
    const sleeping = renderHud({}, "home-door");
    expect(sleeping).toContain("Get up");
    expect(sleeping).not.toContain("Leave for work");
  });

  it("shows the nearby object, NPC or exploration prompt", () => {
    expect(renderHud({ awake: true }, "home-door")).toContain("Leave for work");
    expect(
      renderHud({ awake: true, location: "office" }, "npc:manager"),
    ).toContain("Talk to Mark");
    expect(renderHud({ awake: true })).toContain('class="explore-hint"');
  });

  it.each([
    [
      "commute",
      "Your neighbor",
      "Also not your job",
      "AN UNSCHEDULED SIDE QUEST",
    ],
    ["auth-code", "Your code", "Engineering", "A DECISION FOR FUTURE YOU"],
    ["minute", "Mark", "Manager", "THIS COULD HAVE BEEN AN EMAIL"],
  ])(
    "renders the speaker and category for %s",
    (dialogue, name, role, category) => {
      const html = renderHud({ dialogue });
      expect(html).toContain(name);
      expect(html).toContain(role);
      expect(html).toContain(category);
      expect(html).not.toContain('class="interaction-prompt"');
      expect(html).not.toContain('class="minimap"');
    },
  );

  it.each([
    [BALANCE.goodRelationship, "has your back"],
    [BALANCE.hostileRelationship, "strained"],
    [0, "getting to know you"],
  ])("renders the relationship hint for trust %s", (trust, hint) => {
    expect(
      renderHud({ dialogue: "minute", relations: { manager: trust } }),
    ).toContain(hint);
  });
});
