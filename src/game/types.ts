import type { NpcAppearance } from "../data/appearances";
export type Vec2 = [number, number];
export type Location = "home" | "commute" | "office";
export type Screen = "menu" | "playing" | "paused" | "results";
export type AnimationState =
  "idle" | "walk" | "run" | "sit" | "typing" | "talk" | "sleep";
export type NpcState =
  | "idle"
  | "walking"
  | "working"
  | "talking"
  | "waiting"
  | "lookingForPlayer"
  | "approachingPlayer"
  | "waitingForPlayer"
  | "gaveUp"
  | "usingObject";
export interface AnimationSample {
  animation: AnimationState;
  speed: number;
  active?: boolean;
  seated?: boolean;
  seatHeight?: number;
  gesture?: "coffee" | "chat" | null;
}
export interface Effects {
  minutes?: number;
  stress?: number;
  energy?: number;
  relationship?: number;
  productivity?: number;
  taskProgress?: number;
  helped?: number;
  rejected?: number;
  meeting?: number;
  flag?: string;
  futureChance?: number;
  technicalDebt?: number;
  codeQuality?: number;
  reputation?: number;
  addTask?: string;
  removeTask?: string;
  deadline?: number;
  flags?: string[];
  clearFlags?: string[];
  counters?: Record<string, number>;
  timeCategory?: TimeCategory;
  cooldowns?: Record<string, number>;
  cancelSearch?: boolean;
  cancelNpc?: string;
  cancelFollowUps?: string[];
}
export type TimeCategory =
  | "coding"
  | "meetings"
  | "helpingCoworkers"
  | "ITSupport"
  | "walking"
  | "hiding"
  | "coffee"
  | "social"
  | "bugs"
  | "HR"
  | "other";
export interface FollowUp {
  eventId: string;
  delay: readonly [number, number];
  probability?: number;
  conditions?: Conditions;
}
export interface ScheduledEvent {
  eventId: string;
  at: number;
  expiresAt: number;
  conditions?: Conditions;
  source: string;
}
export interface Choice {
  npc?: string;
  label: string;
  hint: string;
  effects: Effects;
  response: string;
  duration?: readonly [number, number];
  followUps?: FollowUp[];
  outcomes?: {
    probability: number;
    effects: Effects;
    response: string;
    followUps?: FollowUp[];
    conditions?: Conditions;
  }[];
  conditions?: Conditions;
}
export interface Conditions {
  after?: number;
  before?: number;
  location?: Location;
  minWork?: number;
  flag?: string;
  minProgress?: number;
  maxProgress?: number;
  notFlag?: string;
  flags?: string[];
  relationship?: { npc: string; min?: number; max?: number };
  minDebt?: number;
  maxDebt?: number;
  minQuality?: number;
  counter?: { id: string; min: number };
  working?: boolean;
}
export interface Interruption {
  id: string;
  name: string;
  category:
    | "support"
    | "meeting"
    | "social"
    | "work"
    | "hr"
    | "client"
    | "coding"
    | "management"
    | "office";
  npc: string;
  dialogue: string;
  choices: Choice[];
  conditions: Conditions;
  probability: number;
  cooldown: number;
  followUpOnly?: boolean;
  timeCategory?: TimeCategory;
  tags?: string[];
  onStart?: Effects;
}
export interface WorldEvent {
  id: string;
  title: string;
  message: string;
  conditions: Conditions;
  probability: number;
  cooldown: number;
  effects: Effects;
  followUps?: FollowUp[];
  followUpOnly?: boolean;
  decision?: string;
  positive?: boolean;
}
export interface NpcDefinition {
  id: string;
  name: string;
  role: string;
  color: string;
  skin: string;
  hair: string;
  position: Vec2;
  desk: Vec2;
  interactions: string[];
  appearance?: NpcAppearance;
  workHeading?: number;
  seated?: boolean;
  ambient?: boolean;
  personality?: {
    description: string;
    persistence: number;
    frequency: number;
    speed: number;
    bathroomRespect: number;
    hostility: number;
  };
  schedule: {
    at: number;
    goal: "desk" | "coffee" | "wander" | "player" | "meeting";
  }[];
}
export interface WorldObject {
  id: string;
  label: string;
  action: string;
  position: Vec2;
  location: Location;
  kind:
    | "bed"
    | "exit"
    | "desk"
    | "coffee"
    | "food"
    | "rest"
    | "printer"
    | "water"
    | "meeting"
    | "inspect";
  effects?: Effects;
  cooldown?: number;
  description?: string;
  hideZone?: string;
}
export interface Obstacle {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
}
export interface Stats {
  workMinutes: number;
  wastedMinutes: number;
  interruptions: number;
  helped: number;
  rejected: number;
  meetings: number;
  coffees: number;
  maxStress: number;
  deskArrival: number | null;
  time: Record<TimeCategory, number>;
  counters: Record<string, number>;
  evaded: number;
  evadeStreak: number;
  longestEvadeStreak: number;
  codingDecisions: number;
}
export interface GameData {
  day: number;
  location: Location;
  position: Vec2;
  minutes: number;
  energy: number;
  stress: number;
  productivity: number;
  awake: boolean;
  working: boolean;
  flags: string[];
  relations: Record<string, number>;
  cooldowns: Record<string, number>;
  futureChance: Record<string, number>;
  stats: Stats;
  achievements: string[];
  coffeeUntil: number;
  nextEventAt: number;
  dialogue: string | null;
  finished: boolean;
  seed: number;
  randomState: number;
  runId: string;
  technicalDebt: number;
  codeQuality: number;
  reputation: number;
  extraTasks: string[];
  deadline: number;
  ending: string | null;
  pendingEvents: ScheduledEvent[];
  history: { at: number; id: string; title: string; choice?: string }[];
  nextCodingAt: number;
  quietUntil: number;
  hiddenUntil: number;
  hidingZone: string | null;
  search: { id: string; startedAt: number; expiresAt: number } | null;
}
export interface RunSummary {
  id: string;
  seed: number;
  score: number;
  ending: string;
  productivity: number;
  stats: Stats;
  relations: Record<string, number>;
  quality: number;
  debt: number;
  reputation: number;
}
export interface CareerProfile {
  achievements: string[];
  endings: string[];
  bestScore: number;
  completedRuns: number;
  history: RunSummary[];
}
export interface Preferences {
  master: number;
  music: number;
  effects: number;
  sensitivity: number;
  quality: "low" | "medium" | "high";
}
