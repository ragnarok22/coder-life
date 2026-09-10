export type Vec2 = [number, number];
export type Location = "home" | "commute" | "office";
export type Screen = "menu" | "playing" | "paused" | "results";
export type AnimationState =
  "idle" | "walk" | "run" | "sit" | "typing" | "talk";
export type NpcState =
  | "idle"
  | "walking"
  | "working"
  | "talking"
  | "waiting"
  | "lookingForPlayer"
  | "usingObject";
export interface Effects {
  minutes?: number;
  stress?: number;
  energy?: number;
  relationship?: number;
  productivity?: number;
  helped?: number;
  rejected?: number;
  meeting?: number;
  flag?: string;
  futureChance?: number;
}
export interface Choice {
  label: string;
  hint: string;
  effects: Effects;
  response: string;
}
export interface Conditions {
  after?: number;
  before?: number;
  location?: Location;
  minWork?: number;
  flag?: string;
  minProgress?: number;
}
export interface Interruption {
  id: string;
  name: string;
  category: "support" | "meeting" | "social" | "work";
  npc: string;
  dialogue: string;
  choices: Choice[];
  conditions: Conditions;
  probability: number;
  cooldown: number;
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
}
export interface Preferences {
  master: number;
  music: number;
  effects: number;
  sensitivity: number;
  quality: "low" | "medium" | "high";
}
