import { interruptions, randomEvents } from "../data/content";
import { matches } from "../game/rules";
import type { GameData } from "../game/types";

/** Weighted selection keeps probability and future decisions in content data. */
export function selectInterruption(game: GameData, random = Math.random) {
  const weighted = interruptions
    .filter(
      (event) =>
        event.id !== "commute" &&
        matches(game, event.conditions) &&
        game.minutes >= (game.cooldowns[event.id] ?? 0),
    )
    .map((event) => ({
      event,
      weight:
        event.probability +
        (game.futureChance[event.npc] ?? 0) +
        Math.max(0, game.relations[event.npc] ?? 0) / 1000,
    }));
  const total = weighted.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = random() * Math.max(1, total);
  for (const entry of weighted) {
    roll -= entry.weight;
    if (roll <= 0) return entry.event;
  }
  return null;
}
export function selectWorldEvent(game: GameData, random = Math.random) {
  return (
    randomEvents.find(
      (event) =>
        matches(game, event.conditions) &&
        game.minutes >= (game.cooldowns[event.id] ?? 0) &&
        random() < event.probability,
    ) ?? null
  );
}
