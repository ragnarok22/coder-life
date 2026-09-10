import type { NpcDefinition } from "../game/types";
const personalities: Record<
  string,
  NonNullable<NpcDefinition["personality"]>
> = {
  manager: {
    description: "Turns five minutes into a calendar hostage situation.",
    persistence: 1.5,
    frequency: 1.5,
    speed: 1.1,
    bathroomRespect: 0.98,
    hostility: 0.7,
  },
  hr: {
    description: "Mandatory fun, optional productivity.",
    persistence: 1.2,
    frequency: 1.15,
    speed: 0.95,
    bathroomRespect: 1,
    hostility: 0.3,
  },
  accountant: {
    description: "Excel is a personality. Teaching pays dividends.",
    persistence: 1.3,
    frequency: 1.2,
    speed: 0.9,
    bathroomRespect: 0.97,
    hostility: 1.3,
  },
  sales: {
    description: "Sells tomorrow’s features yesterday.",
    persistence: 1,
    frequency: 1.1,
    speed: 1.2,
    bathroomRespect: 0.9,
    hostility: 0.7,
  },
  coworker: {
    description: "A coffee buddy. An early warning system.",
    persistence: 0.75,
    frequency: 0.8,
    speed: 1,
    bathroomRespect: 1,
    hostility: 0.1,
  },
  intern: {
    description: "Invest a little time now. Get a teammate later.",
    persistence: 0.8,
    frequency: 1,
    speed: 1.05,
    bathroomRespect: 1,
    hostility: 0.1,
  },
  senior: {
    description: "Can fix anything. Can discuss it for an hour.",
    persistence: 0.65,
    frequency: 0.7,
    speed: 0.9,
    bathroomRespect: 1,
    hostility: 0.1,
  },
  receptionist: {
    description: "Your calendar’s firewall. Occasionally a revolving door.",
    persistence: 0.8,
    frequency: 0.8,
    speed: 1,
    bathroomRespect: 1,
    hostility: 0.3,
  },
  cleaner: {
    description: "Knows which room is actually quiet.",
    persistence: 0.6,
    frequency: 0.5,
    speed: 0.9,
    bathroomRespect: 1,
    hostility: 0.1,
  },
};
export function withPersonality(npc: NpcDefinition): NpcDefinition {
  const schedules: Record<string, NpcDefinition["schedule"]> = {
    manager: [
      { at: 480, goal: "desk" },
      { at: 545, goal: "player" },
      { at: 610, goal: "meeting" },
      { at: 680, goal: "player" },
      { at: 755, goal: "coffee" },
      { at: 840, goal: "player" },
      { at: 940, goal: "wander" },
    ],
    hr: [
      { at: 480, goal: "desk" },
      { at: 575, goal: "wander" },
      { at: 650, goal: "player" },
      { at: 740, goal: "coffee" },
      { at: 825, goal: "meeting" },
      { at: 915, goal: "desk" },
    ],
    accountant: [
      { at: 480, goal: "desk" },
      { at: 560, goal: "player" },
      { at: 630, goal: "desk" },
      { at: 750, goal: "coffee" },
      { at: 815, goal: "player" },
      { at: 900, goal: "desk" },
    ],
    sales: [
      { at: 480, goal: "desk" },
      { at: 580, goal: "meeting" },
      { at: 675, goal: "wander" },
      { at: 785, goal: "coffee" },
      { at: 855, goal: "player" },
      { at: 970, goal: "meeting" },
    ],
    senior: [
      { at: 480, goal: "desk" },
      { at: 610, goal: "coffee" },
      { at: 680, goal: "desk" },
      { at: 810, goal: "wander" },
      { at: 900, goal: "desk" },
    ],
    receptionist: [
      { at: 480, goal: "desk" },
      { at: 625, goal: "wander" },
      { at: 760, goal: "coffee" },
      { at: 800, goal: "desk" },
      { at: 920, goal: "wander" },
    ],
  };
  return {
    ...npc,
    personality: personalities[npc.id],
    schedule: schedules[npc.id] ?? npc.schedule,
  };
}
