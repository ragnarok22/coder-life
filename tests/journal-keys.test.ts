import "fake-indexeddb/auto";
import {
  createElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Journal } from "../src/ui/journal";
import { useGame } from "../src/game/store";
import { initialGame } from "../src/game/rules";
import { initialProfile } from "../src/game/profile";
import { remember } from "../src/events/encounter-engine";
import { BALANCE } from "../src/data/balance";
import type { GameData } from "../src/game/types";

const modal = vi.hoisted(() => ({ children: null as ReactNode }));
vi.mock("../src/ui/modal", () => ({
  Modal: ({ children }: { children: ReactNode }) => {
    modal.children = children;
    return null;
  },
}));
vi.mock("../src/game/audio", () => ({
  audio: { unlock: vi.fn(), play: vi.fn(), configure: vi.fn() },
}));
vi.mock("../src/game/store", async (importOriginal) => {
  const { useGame } =
    await importOriginal<typeof import("../src/game/store")>();
  return {
    useGame: Object.assign(
      (selector: (state: ReturnType<typeof useGame.getState>) => unknown) =>
        selector(useGame.getState()),
      useGame,
    ),
  };
});

function elements(node: ReactNode): ReactElement<{ children?: ReactNode }>[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!isValidElement<{ children?: ReactNode }>(node)) return [];
  return [node, ...elements(node.props.children)];
}

function rowKeys(game: GameData) {
  useGame.setState({ game, profile: initialProfile() });
  renderToStaticMarkup(createElement(Journal, { onClose: () => undefined }));
  const rows = elements(modal.children).filter(
    (element) => element.type === "li",
  );
  const entries = game.history.slice(-12);
  expect(rows).toHaveLength(entries.length);
  expect(rows.every((row) => row.key !== null)).toBe(true);
  expect(new Set(rows.map((row) => row.key)).size).toBe(rows.length);
  return new Map(entries.map((entry, index) => [entry, rows[index].key]));
}

function repeatedHistory(length: number) {
  let game = initialGame();
  for (let i = 0; i < length; i++) {
    game = remember(game, "repeat", "The same event", "The same choice");
    Object.freeze(game.history.at(-1));
  }
  return game;
}

describe("journal row identity", () => {
  it.each([12, BALANCE.eventHistoryLimit])(
    "retains keys for repeated same-minute events when a %i-entry history advances",
    (length) => {
      const game = repeatedHistory(length);
      const before = rowKeys(game);
      const next = remember(
        game,
        "repeat",
        "The same event",
        "The same choice",
      );
      const after = rowKeys(next);
      for (const entry of next.history.slice(-12, -1)) {
        expect(after.get(entry)).toBe(before.get(entry));
      }
      expect([...before.values()]).not.toContain(
        after.get(next.history.at(-1)!),
      );
    },
  );

  it("keeps each entry's key when history is reordered or filtered", () => {
    const game = repeatedHistory(4);
    const before = rowKeys(game);
    const history = [game.history[3], game.history[1], game.history[0]];
    const after = rowKeys({ ...game, history });
    for (const entry of history)
      expect(after.get(entry)).toBe(before.get(entry));
  });
});
