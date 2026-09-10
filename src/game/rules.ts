import { DAY } from "../data/content";
import type { Conditions, Effects, GameData } from "./types";

export const clamp = (n: number, min = 0, max = 100) =>
  Math.min(max, Math.max(min, n));
export const clock = (minutes: number) =>
  `${Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(minutes % 60)
    .toString()
    .padStart(2, "0")}`;
export const initialGame = (): GameData => ({
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
  },
  achievements: [],
  coffeeUntil: 0,
  nextEventAt: 550,
  dialogue: null,
  finished: false,
});
export function matches(g: GameData, c: Conditions) {
  return (
    (!c.location || g.location === c.location) &&
    g.minutes >= (c.after ?? 0) &&
    g.minutes <= (c.before ?? 1440) &&
    g.stats.workMinutes >= (c.minWork ?? 0) &&
    g.productivity >= (c.minProgress ?? 0) &&
    (!c.flag || g.flags.includes(c.flag))
  );
}
export function finish(g: GameData): GameData {
  if (g.minutes < DAY.end) return g;
  const achievements = new Set(g.achievements);
  achievements.add("First day survivor");
  if (g.productivity >= DAY.target)
    achievements.add("Actually shipped something");
  if (g.stats.coffees >= 4) achievements.add("Powered by Java");
  if (g.stats.helped >= 5) achievements.add("Unofficial IT department");
  return {
    ...g,
    minutes: DAY.end,
    working: false,
    dialogue: null,
    finished: true,
    achievements: [...achievements],
  };
}
export function applyEffects(g: GameData, e: Effects, npc?: string): GameData {
  const elapsed = Math.min(e.minutes ?? 0, DAY.end - g.minutes);
  const stress = clamp(g.stress + (e.stress ?? 0));
  return finish({
    ...g,
    minutes: g.minutes + elapsed,
    stress,
    energy: clamp(g.energy + (e.energy ?? 0)),
    productivity: clamp(g.productivity + (e.productivity ?? 0)),
    flags: e.flag ? [...new Set([...g.flags, e.flag])] : g.flags,
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
            0,
            0.5,
          ),
        }
      : g.futureChance,
    stats: {
      ...g.stats,
      wastedMinutes: g.stats.wastedMinutes + elapsed,
      helped: g.stats.helped + (e.helped ?? 0),
      rejected: g.stats.rejected + (e.rejected ?? 0),
      meetings: g.stats.meetings + (e.meeting ?? 0),
      maxStress: Math.max(g.stats.maxStress, stress),
    },
  });
}
export function advance(g: GameData, minutes: number): GameData {
  if (g.finished || g.dialogue || !g.awake) return g;
  const dt = Math.max(0, Math.min(minutes, DAY.end - g.minutes));
  const efficiency =
    (0.5 + g.energy / 200) *
    (1 - g.stress / 180) *
    (g.coffeeUntil > g.minutes ? 1.2 : 1);
  const stress = clamp(
    g.stress +
      dt * (g.working ? (g.energy < 25 ? 0.15 : 0.065) : 0.012) +
      (g.minutes > 960 && g.productivity < 90 ? dt * 0.12 : 0),
  );
  return finish({
    ...g,
    minutes: g.minutes + dt,
    energy: clamp(g.energy - dt * (g.working ? 0.12 : 0.055)),
    stress,
    productivity: clamp(
      g.productivity + (g.working ? dt * 0.62 * efficiency : 0),
    ),
    stats: {
      ...g.stats,
      workMinutes: g.stats.workMinutes + (g.working ? dt : 0),
      maxStress: Math.max(g.stats.maxStress, stress),
    },
  });
}
export function coffeeEffects(count: number): Effects {
  return {
    minutes: 5,
    energy: Math.max(5, 20 - count * 5),
    stress: count < 2 ? -5 : count === 2 ? 5 : 15,
  };
}
export const score = (g: GameData) =>
  Math.max(
    0,
    Math.round(
      g.productivity * 10 +
        g.stats.helped * 15 -
        g.stats.wastedMinutes * 0.5 -
        g.stats.maxStress * 2,
    ),
  );
export const tasksComplete = (g: GameData) =>
  Math.min(4, Math.floor(g.productivity / 25));
