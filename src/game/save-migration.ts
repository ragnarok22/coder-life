import { BALANCE, TIME_CATEGORIES } from "../data/balance";
import { getEncounter, randomEvents } from "../data/content";
import { zones } from "../data/zones";
import { clamp, finish, initialGame } from "./rules";
import { initialProfile, recordProgress } from "./profile";
import type {
  CareerProfile,
  Conditions,
  GameData,
  Stats,
  TimeCategory,
} from "./types";

const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const finite = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);
const strings = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === "string");
const numbers = (v: unknown): v is Record<string, number> =>
  record(v) && Object.values(v).every(finite);
function invalid(): never {
  throw new Error(
    "This save is incompatible or damaged. Your existing save has not been overwritten.",
  );
}
function conditions(v: unknown): v is Conditions {
  if (!record(v)) return false;
  for (const key of [
    "after",
    "before",
    "minWork",
    "minProgress",
    "maxProgress",
    "minDebt",
    "maxDebt",
    "minQuality",
  ])
    if (v[key] !== undefined && !finite(v[key])) return false;
  if (v.flags !== undefined && !strings(v.flags)) return false;
  if (
    v.relationship !== undefined &&
    (!record(v.relationship) ||
      typeof v.relationship.npc !== "string" ||
      (v.relationship.min !== undefined && !finite(v.relationship.min)) ||
      (v.relationship.max !== undefined && !finite(v.relationship.max)))
  )
    return false;
  if (
    v.counter !== undefined &&
    (!record(v.counter) ||
      typeof v.counter.id !== "string" ||
      !finite(v.counter.min))
  )
    return false;
  return true;
}
function migrateStats(value: unknown, elapsed: number, legacy: boolean): Stats {
  if (!record(value)) return invalid();
  const base = initialGame().stats;
  const result = { ...base };
  for (const key of [
    "workMinutes",
    "wastedMinutes",
    "interruptions",
    "helped",
    "rejected",
    "meetings",
    "coffees",
    "maxStress",
    "evaded",
    "evadeStreak",
    "longestEvadeStreak",
    "codingDecisions",
  ] as const) {
    if (value[key] !== undefined) {
      if (!finite(value[key]) || value[key] < 0) return invalid();
      result[key] = value[key];
    }
  }
  if (
    value.deskArrival !== null &&
    value.deskArrival !== undefined &&
    !finite(value.deskArrival)
  )
    return invalid();
  result.deskArrival =
    typeof value.deskArrival === "number"
      ? clamp(value.deskArrival, BALANCE.dayStart, BALANCE.dayEnd)
      : null;
  if (legacy) {
    result.workMinutes = Math.min(elapsed, result.workMinutes);
    result.wastedMinutes = elapsed - result.workMinutes;
    result.time = {
      ...base.time,
      coding: result.workMinutes,
      other: result.wastedMinutes,
    };
  } else {
    const time = value.time;
    if (
      !numbers(time) ||
      !TIME_CATEGORIES.every((k) => finite(time[k]) && time[k] >= 0)
    )
      return invalid();
    result.time = Object.fromEntries(
      TIME_CATEGORIES.map((k) => [k, time[k]]),
    ) as Record<TimeCategory, number>;
    if (
      Math.abs(
        Object.values(result.time).reduce((a, b) => a + b, 0) - elapsed,
      ) > 0.1
    )
      return invalid();
    if (!numbers(value.counters)) return invalid();
    result.counters = value.counters;
    result.workMinutes = result.time.coding;
    result.wastedMinutes = elapsed - result.workMinutes;
  }
  return result;
}
export function migrateGame(value: unknown, version: number): GameData {
  if (
    !record(value) ||
    !finite(value.minutes) ||
    value.minutes < BALANCE.dayStart ||
    value.minutes > BALANCE.dayEnd ||
    !["home", "commute", "office"].includes(String(value.location)) ||
    !Array.isArray(value.position) ||
    value.position.length !== 2 ||
    !value.position.every(finite)
  )
    return invalid();
  for (const key of ["energy", "stress", "productivity"])
    if (!finite(value[key])) return invalid();
  const base = initialGame(finite(value.seed) ? value.seed : 1);
  const safe = Object.fromEntries(
    (Object.keys(base) as (keyof GameData)[]).map((k) => [
      k,
      value[k] ?? base[k],
    ]),
  );
  const g = { ...base, ...safe } as GameData;
  g.minutes = value.minutes;
  g.energy = clamp(g.energy);
  g.stress = clamp(g.stress);
  g.productivity = clamp(g.productivity);
  if (
    !strings(g.flags) ||
    !strings(g.achievements) ||
    !strings(g.extraTasks) ||
    !numbers(g.relations) ||
    !numbers(g.cooldowns) ||
    !numbers(g.futureChance)
  )
    return invalid();
  for (const key of [
    "technicalDebt",
    "codeQuality",
    "reputation",
    "seed",
    "randomState",
    "deadline",
    "nextCodingAt",
    "quietUntil",
    "hiddenUntil",
    "nextEventAt",
    "coffeeUntil",
  ] as const)
    if (!finite(g[key])) return invalid();
  if (
    typeof g.awake !== "boolean" ||
    typeof g.working !== "boolean" ||
    typeof g.finished !== "boolean" ||
    typeof g.runId !== "string"
  )
    return invalid();
  g.stats = migrateStats(
    value.stats,
    g.minutes - BALANCE.dayStart,
    version === 1,
  );
  g.relations = Object.fromEntries(
    Object.entries(g.relations).map(([k, v]) => [k, clamp(v, -100, 100)]),
  );
  g.technicalDebt = clamp(g.technicalDebt);
  g.codeQuality = clamp(g.codeQuality);
  g.reputation = clamp(g.reputation);
  g.deadline = clamp(g.deadline, BALANCE.earliestDeadline, BALANCE.dayEnd);
  g.extraTasks = g.extraTasks.slice(0, BALANCE.maxExtraTasks);
  g.dialogue = getEncounter(g.dialogue)?.id ?? null;
  if (
    g.search &&
    (!record(g.search) ||
      typeof g.search.id !== "string" ||
      !getEncounter(g.search.id) ||
      !finite(g.search.startedAt) ||
      !finite(g.search.expiresAt))
  )
    g.search = null;
  g.hidingZone = zones.some((z) => z.id === g.hidingZone) ? g.hidingZone : null;
  if (!Array.isArray(g.pendingEvents)) return invalid();
  g.pendingEvents = g.pendingEvents
    .filter(
      (p) =>
        record(p) &&
        typeof p.eventId === "string" &&
        (getEncounter(p.eventId) ||
          randomEvents.some((e) => e.id === p.eventId)) &&
        finite(p.at) &&
        finite(p.expiresAt) &&
        p.expiresAt > g.minutes &&
        (p.conditions === undefined || conditions(p.conditions)),
    )
    .slice(0, BALANCE.queueLimit);
  if (!Array.isArray(g.history)) return invalid();
  g.history = g.history
    .filter(
      (h) =>
        record(h) &&
        finite(h.at) &&
        typeof h.id === "string" &&
        typeof h.title === "string" &&
        (h.choice === undefined || typeof h.choice === "string"),
    )
    .slice(-BALANCE.eventHistoryLimit);
  const legacyAchievements: Record<string, string> = {
    "First day survivor": "survivor",
    "Actually shipped something": "productive",
    "Powered by Java": "coffee-driven",
    "Unofficial IT department": "people-pleaser",
  };
  g.achievements = g.achievements.map((a) => legacyAchievements[a] ?? a);
  return g.minutes >= BALANCE.dayEnd
    ? finish(g)
    : { ...g, finished: false, ending: null };
}
export function migrateProfile(value: unknown, game: GameData): CareerProfile {
  if (value === undefined) return recordProgress(initialProfile(), game);
  if (
    !record(value) ||
    !strings(value.achievements) ||
    !strings(value.endings) ||
    !finite(value.bestScore) ||
    !finite(value.completedRuns) ||
    !Array.isArray(value.history)
  )
    return invalid();
  const history: CareerProfile["history"] = [];
  for (const h of value.history.slice(0, BALANCE.runHistoryLimit)) {
    if (
      !record(h) ||
      typeof h.id !== "string" ||
      typeof h.ending !== "string" ||
      !finite(h.score) ||
      !finite(h.seed) ||
      !finite(h.productivity) ||
      !finite(h.quality) ||
      !finite(h.debt) ||
      !finite(h.reputation) ||
      !numbers(h.relations)
    )
      return invalid();
    history.push({
      id: h.id,
      ending: h.ending,
      score: h.score,
      seed: h.seed,
      productivity: h.productivity,
      quality: h.quality,
      debt: h.debt,
      reputation: h.reputation,
      relations: h.relations,
      stats: migrateStats(h.stats, BALANCE.dayEnd - BALANCE.dayStart, false),
    });
  }
  return recordProgress(
    {
      achievements: value.achievements,
      endings: value.endings,
      bestScore: value.bestScore,
      completedRuns: value.completedRuns,
      history,
    },
    game,
  );
}
