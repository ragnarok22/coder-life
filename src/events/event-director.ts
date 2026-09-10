import {
  codingDecisions,
  getEncounter,
  interruptions,
  npcs,
  randomEvents,
} from "../data/content";
import { BALANCE, pacingAt } from "../data/balance";
import { advance, applyEffects, matches } from "../game/rules";
import { randomInt, randomStream } from "../game/random";
import { unlockAchievements } from "../data/achievements";
import {
  applyWorldEvent,
  openEncounter,
  remember,
  requestSearch,
} from "./encounter-engine";
import type { GameData, TimeCategory, Vec2 } from "../game/types";

const npcsById = new Map(npcs.map((npc) => [npc.id, npc]));
const randomEventsById = new Map(
  randomEvents.map((event) => [event.id, event]),
);

function weightedPick<T>(
  pool: { item: T; weight: number }[],
  random: () => number,
): T | null {
  let roll = random() * pool.reduce((sum, x) => sum + x.weight, 0);
  for (const entry of pool) {
    roll -= entry.weight;
    if (roll < 0) return entry.item;
  }
  return null;
}
export function selectInterruption(game: GameData, random = Math.random) {
  const pool = [];
  for (const event of interruptions) {
    if (
      ["commute", "hr"].includes(event.id) ||
      event.followUpOnly ||
      !matches(game, event.conditions) ||
      game.minutes < (game.cooldowns[event.id] ?? 0) ||
      game.minutes < (game.cooldowns[`npc:${event.npc}`] ?? 0)
    )
      continue;
    const personality = npcsById.get(event.npc)?.personality;
    const relationship = game.relations[event.npc] ?? 0;
    const weight =
      event.probability *
      (personality?.frequency ?? 1) *
      (1 + (game.futureChance[event.npc] ?? 0)) *
      (1 +
        (Math.max(0, -relationship) / 50) * (personality?.hostility ?? 0.3)) *
      (event.npc === "manager" ? pacingAt(game.minutes).managerWeight : 1);
    pool.push({ item: event, weight });
  }
  return weightedPick(pool, random);
}
export function selectWorldEvent(game: GameData, random = Math.random) {
  const pool = randomEvents
    .filter(
      (e) =>
        !e.followUpOnly &&
        matches(game, e.conditions) &&
        game.minutes >= (game.cooldowns[e.id] ?? 0),
    )
    .map((e) => ({
      item: e,
      weight:
        e.probability *
        (["production", "deploy"].includes(e.id)
          ? 1 + game.technicalDebt / 20
          : 1),
    }));
  return weightedPick(pool, random);
}
export function expireSearch(game: GameData, zone?: string): GameData {
  if (!game.search) return game;
  const encounter = getEncounter(game.search.id),
    npc = encounter?.npc;
  let next = applyEffects(
    game,
    { relationship: BALANCE.relationship.evade },
    npc,
  );
  const streak = next.stats.evadeStreak + 1;
  next = {
    ...next,
    search: null,
    quietUntil: next.minutes + BALANCE.dialogueGrace,
    cooldowns: {
      ...next.cooldowns,
      [game.search.id]:
        next.minutes + (encounter?.cooldown ?? BALANCE.searchCooldown),
    },
    stats: {
      ...next.stats,
      evaded: next.stats.evaded + 1,
      evadeStreak: streak,
      longestEvadeStreak: Math.max(streak, next.stats.longestEvadeStreak),
      counters: {
        ...next.stats.counters,
        ...(npc === "manager" && zone === "bathroom"
          ? { bathroomEscapes: (next.stats.counters.bathroomEscapes ?? 0) + 1 }
          : {}),
      },
    },
  };
  return unlockAchievements(
    remember(
      next,
      "evaded",
      `${npcs.find((n) => n.id === npc)?.name ?? "They"} gave up. Your time is yours again.`,
    ),
  );
}
export interface DayContext {
  position: Vec2;
  activity?: TimeCategory;
  zone?: string;
}
/** One director owns the dialogue/search slots. Bounded queue + grace periods prevent event storms. */
export function tickDay(
  game: GameData,
  minutes: number,
  context: DayContext,
): GameData {
  let remaining = Math.min(Math.max(0, minutes), BALANCE.dayEnd - game.minutes);
  while (
    remaining > 0.000001 &&
    !game.finished &&
    !game.dialogue &&
    game.awake
  ) {
    const dt = Math.min(1, remaining);
    remaining -= dt;
    const wasHiding = game.hidingZone;
    game = advance(game, dt, context.activity ?? "other");
    if (game.finished) break;
    if (game.search && game.minutes >= game.search.expiresAt)
      game = expireSearch(game, wasHiding ?? context.zone);
    if (
      game.location === "commute" &&
      context.position[1] < 2 &&
      !game.flags.includes("commute")
    ) {
      game = openEncounter(
        { ...game, flags: [...game.flags, "commute"] },
        "commute",
      );
      continue;
    }
    if (game.location !== "office") continue;
    if (!game.flags.includes("printer-intro") && context.position[1] < 3.5) {
      game = openEncounter(
        { ...game, flags: [...game.flags, "printer-intro"] },
        "printer",
      );
      continue;
    }
    if (
      game.stats.workMinutes >= BALANCE.firstManagerWork &&
      !game.flags.includes("first-manager") &&
      !game.search
    ) {
      game = requestSearch(
        { ...game, flags: [...game.flags, "first-manager"] },
        "minute",
      );
    }
    if (game.minutes >= 780 && !game.flags.includes("lunch"))
      game = remember(
        { ...game, flags: [...game.flags, "lunch"] },
        "lunch-hint",
        "Lunch is a feature. The kitchen restores energy.",
      );
    if (
      game.minutes >= game.deadline &&
      game.productivity < 100 &&
      !game.flags.includes("missed-delivery")
    ) {
      game = applyEffects(game, {
        stress: 5,
        reputation: -5,
        flag: "missed-delivery",
      });
      game = remember(
        game,
        "delivery",
        "Delivery target missed. You still have until 17:00 to recover.",
      );
    }
    if (game.minutes < game.quietUntil || game.hidingZone) continue;
    game = {
      ...game,
      pendingEvents: game.pendingEvents.filter(
        (p) => p.expiresAt > game.minutes,
      ),
    };
    if (!game.search) {
      const due = game.pendingEvents.find(
        (p) =>
          p.at <= game.minutes &&
          game.minutes >= (game.cooldowns[p.eventId] ?? 0) &&
          (getEncounter(p.eventId)?.category !== "coding" || game.working),
      );
      if (due) {
        const encounter = getEncounter(due.eventId),
          event = randomEventsById.get(due.eventId);
        const needsDesk = encounter?.category === "coding";
        if (!needsDesk || game.working) {
          game = {
            ...game,
            pendingEvents: game.pendingEvents.filter((p) => p !== due),
          };
          if (!due.conditions || matches(game, due.conditions)) {
            if (event) game = applyWorldEvent(game, event);
            else if (encounter && matches(game, encounter.conditions))
              game = needsDesk
                ? openEncounter(game, encounter.id)
                : requestSearch(game, encounter.id);
          }
          continue;
        }
      }
    }
    const random = randomStream(game.randomState);
    if (
      game.working &&
      game.productivity < 100 &&
      game.stats.workMinutes >= game.nextCodingAt
    ) {
      const pool = codingDecisions.filter(
        (e) => game.minutes >= (game.cooldowns[e.id] ?? 0),
      );
      const selected =
        game.stats.codingDecisions === 0
          ? codingDecisions[0]
          : pool[Math.floor(random.next() * pool.length)];
      game = {
        ...game,
        randomState: random.state,
        nextCodingAt: game.stats.workMinutes + BALANCE.codingInterval[0],
      };
      if (selected) game = openEncounter(game, selected.id);
      continue;
    }
    if (game.minutes >= game.nextEventAt && !game.search) {
      const phase = pacingAt(game.minutes);
      game = {
        ...game,
        nextEventAt:
          game.minutes +
          randomInt(phase.interval, () => random.next()) /
            BALANCE.difficulty.interruptionFrequency,
      };
      if (
        random.next() <
        phase.eventChance * BALANCE.difficulty.eventProbability
      ) {
        if (random.next() < 0.32) {
          const event = selectWorldEvent(game, () => random.next());
          game = { ...game, randomState: random.state };
          if (event) game = applyWorldEvent(game, event);
        } else {
          const encounter = selectInterruption(game, () => random.next());
          if (encounter) game = requestSearch(game, encounter.id);
          game = { ...game, randomState: random.state };
        }
      } else game = { ...game, randomState: random.state };
    }
  }
  return game;
}
