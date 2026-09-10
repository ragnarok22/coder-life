import { DAY, getEncounter } from "../data/content";
import { BALANCE, TIME_CATEGORIES } from "../data/balance";
import { unlockAchievements } from "../data/achievements";
import { evaluateEnding } from "../data/endings";
import type { Conditions, Effects, GameData, TimeCategory } from "./types";

export const clamp = (n: number, min = 0, max = 100) =>
  Math.min(max, Math.max(min, n));
export const clock = (m: number) =>
  `${Math.floor(m / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(m % 60)
    .toString()
    .padStart(2, "0")}`;
export const duration = (minutes: number) =>
  `${Math.floor(Math.round(minutes) / 60)}h ${Math.round(minutes) % 60}m`;
function rewardTasks(g: GameData): GameData {
  const completed = Math.floor(
      (g.productivity * (DAY.tasks.length + g.extraTasks.length)) / 100,
    ),
    previous = g.stats.counters.tasksFinished ?? 0;
  if (completed <= previous) return g;
  return {
    ...g,
    reputation: clamp(
      g.reputation + (completed - previous) * BALANCE.taskReputation,
    ),
    stress: clamp(g.stress - (completed - previous) * BALANCE.taskStressRelief),
    stats: {
      ...g.stats,
      counters: { ...g.stats.counters, tasksFinished: completed },
    },
  };
}
export const initialGame = (seed = 1): GameData => ({
  day: 1,
  location: "home",
  position: [-1.7, -2],
  minutes: DAY.start,
  energy: 78,
  stress: 5,
  productivity: 0,
  awake: false,
  working: false,
  flags: [],
  relations: {},
  cooldowns: {},
  futureChance: {},
  stats: {
    workMinutes: 0,
    wastedMinutes: 0,
    interruptions: 0,
    helped: 0,
    rejected: 0,
    meetings: 0,
    coffees: 0,
    maxStress: 5,
    deskArrival: null,
    time: Object.fromEntries(TIME_CATEGORIES.map((c) => [c, 0])) as Record<
      TimeCategory,
      number
    >,
    counters: {},
    evaded: 0,
    evadeStreak: 0,
    longestEvadeStreak: 0,
    codingDecisions: 0,
  },
  achievements: [],
  coffeeUntil: 0,
  nextEventAt: 550,
  dialogue: null,
  finished: false,
  seed: seed >>> 0,
  randomState: seed >>> 0,
  runId: `day-1-${seed >>> 0}`,
  technicalDebt: 0,
  codeQuality: 65,
  reputation: 50,
  extraTasks: [],
  deadline: DAY.end,
  ending: null,
  pendingEvents: [],
  history: [],
  nextCodingAt: BALANCE.firstCodingWork,
  quietUntil: 0,
  hiddenUntil: 0,
  hidingZone: null,
  search: null,
});
export function matches(g: GameData, c: Conditions) {
  return (
    (!c.location || g.location === c.location) &&
    g.minutes >= (c.after ?? 0) &&
    g.minutes <= (c.before ?? 1440) &&
    g.stats.workMinutes >= (c.minWork ?? 0) &&
    g.productivity >= (c.minProgress ?? 0) &&
    g.productivity <= (c.maxProgress ?? 100) &&
    (!c.flag || g.flags.includes(c.flag)) &&
    (!c.notFlag || !g.flags.includes(c.notFlag)) &&
    (!c.flags || c.flags.every((f) => g.flags.includes(f))) &&
    g.technicalDebt >= (c.minDebt ?? 0) &&
    g.technicalDebt <= (c.maxDebt ?? 100) &&
    g.codeQuality >= (c.minQuality ?? 0) &&
    (!c.relationship ||
      ((g.relations[c.relationship.npc] ?? 0) >= (c.relationship.min ?? -100) &&
        (g.relations[c.relationship.npc] ?? 0) <=
          (c.relationship.max ?? 100))) &&
    (!c.counter || (g.stats.counters[c.counter.id] ?? 0) >= c.counter.min) &&
    (c.working === undefined || g.working === c.working)
  );
}
export function finish(g: GameData): GameData {
  if (g.minutes < DAY.end) return g;
  const completed: GameData = {
    ...g,
    minutes: DAY.end,
    working: false,
    dialogue: null,
    finished: true,
    pendingEvents: [],
    search: null,
    hidingZone: null,
    hiddenUntil: 0,
  };
  return unlockAchievements({
    ...completed,
    ending: evaluateEnding(completed).id,
  });
}
export function applyEffects(
  g: GameData,
  e: Effects,
  npc?: string,
  category: TimeCategory = "other",
): GameData {
  if (g.finished) return g;
  const elapsed = Math.max(0, Math.min(e.minutes ?? 0, DAY.end - g.minutes));
  const stress = clamp(
    g.stress + (e.stress ?? 0) * BALANCE.difficulty.stressGain,
  );
  const timeCategory = e.timeCategory ?? (e.meeting ? "meetings" : category);
  const remainingTasks = e.removeTask
    ? g.extraTasks.filter((name) => name !== e.removeTask)
    : g.extraTasks;
  const extraTasks =
    e.addTask && remainingTasks.length < BALANCE.maxExtraTasks
      ? [...remainingTasks, e.addTask]
      : remainingTasks;
  const taskRatio =
    (DAY.tasks.length + g.extraTasks.length) /
    (DAY.tasks.length + extraTasks.length);
  const counters = { ...g.stats.counters };
  for (const [key, value] of Object.entries(e.counters ?? {}))
    counters[key] = (counters[key] ?? 0) + value;
  const cooldowns = { ...g.cooldowns };
  for (const [key, minutes] of Object.entries(e.cooldowns ?? {}))
    cooldowns[key] = g.minutes + elapsed + minutes;
  return unlockAchievements(
    finish(
      rewardTasks({
        ...g,
        minutes: g.minutes + elapsed,
        stress,
        energy: clamp(g.energy + (e.energy ?? 0)),
        productivity: clamp(
          (g.productivity +
            (e.productivity ?? 0) +
            (e.taskProgress ?? 0) / (DAY.tasks.length + g.extraTasks.length)) *
            taskRatio,
        ),
        technicalDebt: clamp(g.technicalDebt + (e.technicalDebt ?? 0)),
        codeQuality: clamp(g.codeQuality + (e.codeQuality ?? 0)),
        reputation: clamp(
          g.reputation +
            (e.reputation ?? 0) +
            (e.helped ?? 0) -
            (e.rejected ?? 0) * 0.25,
        ),
        extraTasks,
        deadline: clamp(
          g.deadline + (e.deadline ?? 0),
          BALANCE.earliestDeadline,
          DAY.end,
        ),
        flags: [
          ...new Set([
            ...g.flags,
            ...(e.flag ? [e.flag] : []),
            ...(e.flags ?? []),
          ]),
        ].filter((f) => !e.clearFlags?.includes(f)),
        cooldowns,
        pendingEvents: g.pendingEvents.filter(
          (p) => !e.cancelFollowUps?.includes(p.eventId),
        ),
        search:
          e.cancelSearch ||
          (e.cancelNpc &&
            getEncounter(g.search?.id ?? null)?.npc === e.cancelNpc)
            ? null
            : g.search,
        relations: npc
          ? {
              ...g.relations,
              [npc]: clamp(
                (g.relations[npc] ?? 0) + (e.relationship ?? 0),
                -100,
                100,
              ),
            }
          : g.relations,
        futureChance: npc
          ? {
              ...g.futureChance,
              [npc]: clamp(
                (g.futureChance[npc] ?? 0) + (e.futureChance ?? 0),
                -0.8,
                0.5,
              ),
            }
          : g.futureChance,
        stats: {
          ...g.stats,
          workMinutes:
            g.stats.workMinutes + (timeCategory === "coding" ? elapsed : 0),
          wastedMinutes:
            g.stats.wastedMinutes + (timeCategory === "coding" ? 0 : elapsed),
          time: {
            ...g.stats.time,
            [timeCategory]: g.stats.time[timeCategory] + elapsed,
          },
          counters,
          helped: g.stats.helped + (e.helped ?? 0),
          rejected: g.stats.rejected + (e.rejected ?? 0),
          meetings: g.stats.meetings + (e.meeting ?? 0),
          maxStress: Math.max(g.stats.maxStress, stress),
        },
      }),
    ),
  );
}
export function advance(
  g: GameData,
  minutes: number,
  activity: TimeCategory = "other",
): GameData {
  if (g.finished || g.dialogue || !g.awake) return g;
  let remaining = Math.max(0, Math.min(minutes, DAY.end - g.minutes));
  // Integrate bounded steps so coffee/energy/hiding behave identically in simulations and gameplay.
  while (remaining > 0.000001) {
    const hideBoundary =
      g.hiddenUntil > g.minutes ? g.hiddenUntil - g.minutes : Infinity;
    const dt = Math.min(1, remaining, hideBoundary);
    g = advanceStep(g, dt, activity);
    remaining -= dt;
  }
  return unlockAchievements(finish(g));
}
function advanceStep(
  g: GameData,
  dt: number,
  activity: TimeCategory,
): GameData {
  const hiding = g.hidingZone && g.hiddenUntil > g.minutes;
  const working = g.working && !hiding;
  const category = hiding ? "hiding" : working ? "coding" : activity;
  const efficiency =
    ((0.5 + g.energy / 200) *
      (1 - g.stress / 180) *
      (g.coffeeUntil > g.minutes ? 1.2 : 1) *
      DAY.tasks.length) /
    (DAY.tasks.length + g.extraTasks.length);
  const stress = clamp(
    g.stress +
      dt *
        (working
          ? g.energy < 25
            ? BALANCE.stress.exhausted
            : BALANCE.stress.working
          : BALANCE.stress.idle) +
      (g.minutes > g.deadline - 60 && g.productivity < 90
        ? dt * BALANCE.stress.deadline
        : 0),
  );
  return rewardTasks({
    ...g,
    minutes: g.minutes + dt,
    energy: clamp(
      g.energy - dt * (working ? BALANCE.energy.working : BALANCE.energy.idle),
    ),
    stress,
    productivity: clamp(
      g.productivity +
        (working
          ? dt *
            BALANCE.baseWorkSpeed *
            BALANCE.difficulty.workSpeed *
            efficiency
          : 0),
    ),
    hidingZone: g.minutes + dt >= g.hiddenUntil ? null : g.hidingZone,
    stats: {
      ...g.stats,
      workMinutes: g.stats.workMinutes + (working ? dt : 0),
      wastedMinutes: g.stats.wastedMinutes + (category === "coding" ? 0 : dt),
      time: { ...g.stats.time, [category]: g.stats.time[category] + dt },
      maxStress: Math.max(g.stats.maxStress, stress),
    },
  });
}
export function coffeeEffects(count: number): Effects {
  return {
    minutes: BALANCE.coffeeMinutes,
    timeCategory: "coffee",
    ...BALANCE.coffeeEffects[Math.min(count, BALANCE.coffeeEffects.length - 1)],
  };
}
export const score = (g: GameData) =>
  Math.max(
    0,
    Math.round(
      g.productivity * 10 +
        g.codeQuality * 2 -
        g.technicalDebt * 2 +
        (g.reputation - 50) * 3 +
        g.stats.helped * 15 -
        g.stats.wastedMinutes * 0.5 -
        g.stats.maxStress * 2,
    ),
  );
export const tasksComplete = (g: GameData) =>
  Math.min(
    DAY.tasks.length + g.extraTasks.length,
    Math.floor(
      (g.productivity * (DAY.tasks.length + g.extraTasks.length)) / 100,
    ),
  );
export const taskNames = (g: GameData) => [...DAY.tasks, ...g.extraTasks];
