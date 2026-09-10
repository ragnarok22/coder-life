import { BALANCE } from "../data/balance";
import { getEncounter, npcs, randomEvents } from "../data/content";
import { applyEffects, matches } from "../game/rules";
import { randomInt, randomStream } from "../game/random";
import type {
  FollowUp,
  GameData,
  Interruption,
  TimeCategory,
  WorldEvent,
} from "../game/types";

const categories: Record<Interruption["category"], TimeCategory> = {
  support: "ITSupport",
  meeting: "meetings",
  social: "social",
  work: "helpingCoworkers",
  hr: "HR",
  client: "helpingCoworkers",
  coding: "coding",
  management: "meetings",
  office: "other",
};
export function remember(
  game: GameData,
  id: string,
  title: string,
  choice?: string,
): GameData {
  return {
    ...game,
    history: [...game.history, { at: game.minutes, id, title, choice }].slice(
      -BALANCE.eventHistoryLimit,
    ),
  };
}
export function scheduleFollowUps(
  game: GameData,
  followUps: FollowUp[] = [],
  source: string,
): GameData {
  if (game.finished) return game;
  const random = randomStream(game.randomState),
    pending = [...game.pendingEvents];
  for (const next of followUps) {
    if (
      random.next() >= (next.probability ?? 1) ||
      pending.some((p) => p.eventId === next.eventId) ||
      pending.length >= BALANCE.queueLimit
    )
      continue;
    const target =
      getEncounter(next.eventId) ??
      randomEvents.find((e) => e.id === next.eventId);
    if (!target) continue;
    const at = Math.max(
      game.minutes + randomInt(next.delay, () => random.next()),
      game.cooldowns[next.eventId] ?? 0,
      target.conditions.after ?? 0,
      next.conditions?.after ?? 0,
    );
    if (at >= BALANCE.dayEnd) continue;
    pending.push({
      eventId: next.eventId,
      at,
      expiresAt: Math.min(BALANCE.dayEnd, at + BALANCE.followUpExpiry),
      conditions: next.conditions,
      source,
    });
  }
  return {
    ...game,
    pendingEvents: pending.sort((a, b) => a.at - b.at),
    randomState: random.state,
  };
}
export function requestSearch(game: GameData, id: string): GameData {
  const event = getEncounter(id),
    npc = npcs.find((n) => n.id === event?.npc);
  if (
    !event ||
    !npc ||
    game.finished ||
    game.search ||
    game.minutes < (game.cooldowns[`npc:${npc.id}`] ?? 0)
  )
    return game;
  const duration =
    BALANCE.searchTimeout *
    (npc.personality?.persistence ?? 1) *
    BALANCE.difficulty.npcPersistence;
  const warning =
    npc.id === "manager" &&
    (game.relations.coworker ?? 0) >= BALANCE.goodRelationship
      ? 5
      : 0;
  return remember(
    {
      ...game,
      search: {
        id,
        startedAt: game.minutes + warning,
        expiresAt: game.minutes + warning + duration,
      },
    },
    `search:${id}`,
    `${npc.name} is looking for you.`,
  );
}
export function openEncounter(game: GameData, id: string): GameData {
  const encounter = getEncounter(id);
  if (!encounter || game.finished || game.dialogue) return game;
  const coding = encounter.category === "coding";
  if (encounter.onStart) game = applyEffects(game, encounter.onStart);
  return remember(
    {
      ...game,
      dialogue: id,
      working: coding ? game.working : false,
      search: coding ? game.search : null,
      hidingZone: null,
      stats: {
        ...game.stats,
        interruptions: game.stats.interruptions + (coding ? 0 : 1),
        evadeStreak: coding ? game.stats.evadeStreak : 0,
      },
    },
    id,
    encounter.name,
  );
}
export function resolveChoice(game: GameData, index: number) {
  const encounter = getEncounter(game.dialogue),
    choice = encounter?.choices[index];
  if (
    !encounter ||
    !choice ||
    (choice.conditions && !matches(game, choice.conditions))
  )
    return { game, message: "", title: "" };
  const random = randomStream(game.randomState),
    category = encounter.timeCategory ?? categories[encounter.category];
  const target = choice.npc ?? encounter.npc;
  const npc = target === "system" ? undefined : target;
  const minutes = choice.duration
    ? randomInt(choice.duration, () => random.next()) *
      (encounter.category === "meeting"
        ? BALANCE.difficulty.meetingDuration
        : 1)
    : choice.effects.minutes;
  let updated = applyEffects(
    { ...game, dialogue: null },
    { ...choice.effects, ...(minutes === undefined ? {} : { minutes }) },
    npc,
    category,
  );
  let response = choice.response;
  const followUps = [...(choice.followUps ?? [])];
  let roll = random.next();
  for (const outcome of choice.outcomes ?? []) {
    if (outcome.conditions && !matches(game, outcome.conditions)) continue;
    roll -= outcome.probability;
    if (roll < 0) {
      updated = applyEffects(updated, outcome.effects, npc, category);
      response = outcome.response;
      followUps.push(...(outcome.followUps ?? []));
      break;
    }
  }
  const coding = encounter.category === "coding";
  updated = {
    ...updated,
    randomState: random.state,
    quietUntil: updated.minutes + BALANCE.dialogueGrace,
    nextCodingAt: coding
      ? updated.stats.workMinutes +
        randomInt(BALANCE.codingInterval, () => random.next())
      : updated.nextCodingAt,
    cooldowns: {
      ...updated.cooldowns,
      [encounter.id]: updated.minutes + encounter.cooldown,
    },
    stats: {
      ...updated.stats,
      codingDecisions: updated.stats.codingDecisions + (coding ? 1 : 0),
    },
  };
  updated.randomState = random.state;
  updated = scheduleFollowUps(updated, followUps, encounter.id);
  updated = remember(
    updated,
    `choice:${encounter.id}`,
    encounter.name,
    choice.label,
  );
  const deltas: string[] = [];
  const elapsed = updated.minutes - game.minutes;
  if (elapsed) deltas.push(`−${Math.round(elapsed)} MIN`);
  const work = updated.productivity - game.productivity;
  if (Math.abs(work) >= 0.5)
    deltas.push(`${work > 0 ? "+" : ""}${Math.round(work)}% WORK`);
  if (npc && updated.relations[npc] !== game.relations[npc]) {
    const d = (updated.relations[npc] ?? 0) - (game.relations[npc] ?? 0);
    if (d) deltas.push(`${d > 0 ? "+" : ""}${d} TRUST`);
  }
  if (updated.technicalDebt !== game.technicalDebt)
    deltas.push(
      `${updated.technicalDebt > game.technicalDebt ? "+" : ""}${updated.technicalDebt - game.technicalDebt} DEBT`,
    );
  if (Math.abs(updated.stress - game.stress) >= 1)
    deltas.push(
      `${updated.stress > game.stress ? "+" : ""}${Math.round(updated.stress - game.stress)} STRESS`,
    );
  return {
    game: updated,
    title: encounter.name,
    message: `${deltas.slice(0, 3).join(" · ")}${deltas.length ? " — " : ""}${response}`,
  };
}
export function applyWorldEvent(game: GameData, event: WorldEvent): GameData {
  if (
    game.finished ||
    game.dialogue ||
    game.minutes < (game.cooldowns[event.id] ?? 0) ||
    !matches(game, event.conditions)
  )
    return game;
  game = remember(game, event.id, event.title);
  game = applyEffects(
    game,
    event.effects,
    undefined,
    event.effects.timeCategory ?? "other",
  );
  game = {
    ...game,
    cooldowns: { ...game.cooldowns, [event.id]: game.minutes + event.cooldown },
    quietUntil: game.minutes + BALANCE.dialogueGrace,
  };
  game = scheduleFollowUps(game, event.followUps, event.id);
  if (event.decision && !game.finished) {
    const encounter = getEncounter(event.decision);
    game =
      encounter?.category === "meeting"
        ? requestSearch(game, event.decision)
        : openEncounter(game, event.decision);
  }
  return game;
}
