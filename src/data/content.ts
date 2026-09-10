import type { Interruption, NpcDefinition, WorldEvent } from "../game/types";
import { BALANCE } from "./balance";
import { withPersonality } from "./personalities";
import { extraInterruptions, polishEvents } from "./polish-content";
import { codingDecisions } from "./coding-decisions";
import { importantAppearances, OUTFIT_PALETTES } from "./appearances";
import { officeNpcHomes } from "./office-layout";

export const DAY = {
  id: 1,
  title: "Hello, real world.",
  role: "Junior Developer",
  start: BALANCE.dayStart,
  end: BALANCE.dayEnd,
  target: 100,
  difficulty: 1,
  tasks: [
    "Fix the authentication bug",
    "Untangle the legacy code",
    "Write the missing tests",
    "Ship it. Cross fingers.",
  ],
};
// Eighteen uninterrupted real minutes; decisions consume part of the game-day directly.
export const GAME_MINUTES_PER_SECOND = BALANCE.timeScale;
export const CAREER = [
  { day: 1, role: "Junior Developer", meetingMultiplier: 1 },
  { day: 5, role: "Developer", meetingMultiplier: 1.2 },
  { day: 15, role: "Senior Developer", meetingMultiplier: 1.7 },
  { day: 30, role: "Tech Lead", meetingMultiplier: 2.8 },
];
const schedule: NpcDefinition["schedule"] = [
  { at: 480, goal: "desk" },
  { at: 540, goal: "coffee" },
  { at: 555, goal: "wander" },
  { at: 570, goal: "player" },
  { at: 600, goal: "meeting" },
  { at: 660, goal: "desk" },
  { at: 720, goal: "coffee" },
  { at: 780, goal: "wander" },
  { at: 840, goal: "player" },
  { at: 930, goal: "desk" },
];
const baseNpcs: NpcDefinition[] = [
  {
    id: "manager",
    name: "Mark",
    role: "Manager",
    color: "#c98456",
    skin: "#e9bc92",
    hair: "#654238",
    position: [3, -6.5],
    desk: [3, -6.5],
    interactions: ["minute", "tiny-change"],
    schedule,
  },
  {
    id: "hr",
    name: "Hannah",
    role: "Human Resources",
    color: "#cb8398",
    skin: "#e4b18b",
    hair: "#794d33",
    position: [-2, 6],
    desk: [-8, 7],
    interactions: ["hr"],
    schedule,
  },
  {
    id: "accountant",
    name: "Alan",
    role: "Accountant",
    color: "#e1b858",
    skin: "#dba37c",
    hair: "#665447",
    position: [-2, -4.5],
    desk: [-2, -4.5],
    interactions: ["excel", "install"],
    schedule,
  },
  {
    id: "sales",
    name: "Sam",
    role: "Sales",
    color: "#838cbe",
    skin: "#bb8060",
    hair: "#342e2b",
    position: [-6, -4.5],
    desk: [-6, -4.5],
    interactions: ["printer"],
    schedule,
  },
  {
    id: "receptionist",
    name: "Robin",
    role: "Receptionist",
    color: "#76aaa3",
    skin: "#b77752",
    hair: "#382d26",
    position: [-9, 7.5],
    desk: [-9, 7.5],
    interactions: ["password"],
    schedule,
  },
  {
    id: "coworker",
    name: "Casey",
    role: "Developer",
    color: "#719a79",
    skin: "#e1b59c",
    hair: "#4b352d",
    position: [-2, 0.5],
    desk: [-2, 0.5],
    interactions: ["monitor"],
    schedule,
  },
  {
    id: "intern",
    name: "Jamie",
    role: "Intern",
    color: "#dd936c",
    skin: "#9f6b50",
    hair: "#292b29",
    position: [1, 2],
    desk: [1, 2],
    interactions: ["wifi"],
    schedule,
  },
  {
    id: "cleaner",
    name: "Parker",
    role: "Facilities",
    color: "#709bb3",
    skin: "#efc7a6",
    hair: "#a4a09a",
    position: [7, 5],
    desk: [7, 5],
    interactions: ["pdf"],
    schedule,
  },
];
export const npcs: NpcDefinition[] = [
  ...baseNpcs,
  {
    id: "senior",
    name: "Pat",
    role: "Senior Developer",
    color: "#728ca0",
    skin: "#e3b894",
    hair: "#9d9a88",
    position: [1, -2],
    desk: [1, -2],
    interactions: ["architecture", "senior-review"],
    schedule,
  },
  {
    id: "rockstar-developer",
    name: "Jules",
    role: "Rockstar Developer",
    color: "#333e4c",
    skin: "#e3b794",
    hair: "#66516f",
    position: [-10, -0.1],
    desk: [-10, -0.1],
    interactions: [],
    schedule: [
      { at: 480, goal: "desk" },
      { at: 670, goal: "coffee" },
      { at: 700, goal: "desk" },
      { at: 810, goal: "wander" },
      { at: 850, goal: "desk" },
    ],
    ambient: true,
  },
  {
    id: "corporate-visionary",
    name: "Sterling",
    role: "Corporate Visionary",
    color: "#498e8d",
    skin: "#bd8c67",
    hair: "#2e373b",
    position: [11.6, -3.3],
    desk: [11.6, -3.3],
    interactions: [],
    schedule: [
      { at: 480, goal: "desk" },
      { at: 570, goal: "wander" },
      { at: 600, goal: "meeting" },
      { at: 780, goal: "coffee" },
      { at: 830, goal: "meeting" },
    ],
    ambient: true,
  },
  {
    id: "office-analyst",
    name: "Alex",
    role: "Analyst",
    color: "#8c9eb3",
    skin: "#ad7e5d",
    hair: "#44362d",
    position: [-4, -6.9],
    desk: [-4, -6.9],
    interactions: [],
    schedule: [
      { at: 480, goal: "wander" },
      { at: 550, goal: "desk" },
      { at: 700, goal: "coffee" },
      { at: 770, goal: "wander" },
      { at: 850, goal: "desk" },
    ],
    ambient: true,
  },
].map((definition) => {
  const npc = withPersonality(definition as NpcDefinition),
    home = officeNpcHomes[npc.id],
    appearance = importantAppearances[npc.id];
  return {
    ...npc,
    ...(home
      ? {
          position: npc.id === "hr" ? npc.position : home.position,
          desk: home.position,
          workHeading: home.heading,
          seated: home.seated,
        }
      : {}),
    appearance,
    ...(appearance
      ? {
          color:
            appearance.outfit === "blazer"
              ? OUTFIT_PALETTES[appearance.palette].jacket
              : (appearance.shirtColor ??
                OUTFIT_PALETTES[appearance.palette].shirt),
        }
      : {}),
    personality: npc.personality ?? {
      description:
        npc.id === "rockstar-developer"
          ? "Ten times the monitors. At least twice the confidence."
          : npc.id === "corporate-visionary"
            ? "Aligning AI-powered synergy since before the first coffee."
            : "Busy looking like everything is under control.",
      frequency: 0.5,
      persistence: 0.7,
      speed: 0.95,
      bathroomRespect: 1,
      hostility: 0.1,
    },
  };
});
const baseInterruptions: Interruption[] = [
  {
    id: "commute",
    name: "Tech support, everywhere",
    category: "support",
    npc: "neighbor",
    dialogue: "You work with computers, right? My Wi-Fi has only three bars.",
    probability: 1,
    cooldown: 999,
    conditions: { location: "commute" },
    choices: [
      {
        label: "Have you tried turning it off?",
        hint: "−8 min · +2 stress",
        effects: { minutes: 8, stress: 2, helped: 1 },
        response: "You rebooted a router. And your expectations.",
      },
      {
        label: "Sorry, I’m late for work.",
        hint: "+3 stress",
        effects: { stress: 3, rejected: 1 },
        response: "The Wi-Fi will have to find its own purpose.",
      },
    ],
  },
  {
    id: "hr",
    name: "A warm welcome",
    category: "social",
    npc: "hr",
    dialogue:
      "Welcome! Quick question: if you were a spreadsheet, what kind of spreadsheet would you be?",
    probability: 0.04,
    cooldown: 160,
    conditions: { location: "office" },
    choices: [
      {
        label: "One with boundaries.",
        hint: "−5 min · +2 relationship",
        effects: { minutes: 5, relationship: 2, helped: 1 },
        response: "Hannah writes “culture fit” in a spreadsheet.",
      },
      {
        label: "An unsaved one.",
        hint: "−2 min · −2 stress",
        effects: { minutes: 2, stress: -2 },
        response: "Honestly? Same.",
      },
    ],
  },
  {
    id: "printer",
    name: "PC LOAD LETTER",
    category: "support",
    npc: "accountant",
    dialogue:
      "The printer’s broken. I need these 200 slides for our paperless initiative.",
    probability: 0.14,
    cooldown: 90,
    conditions: { location: "office" },
    choices: [
      {
        label: "Okay, I’ll take a look.",
        hint: "−15 min · +2 stress · +6 relationship",
        effects: {
          minutes: 15,
          stress: 2,
          relationship: 6,
          helped: 1,
          flag: "printer-fixed",
          counters: { printerFixes: 1, basicFixes: 1 },
          cancelFollowUps: ["printer-disaster", "manager-printer"],
        },
        response: "There was no paper. There is now less time.",
      },
      {
        label: "Try the actual support team.",
        hint: "−2 relationship · may return",
        effects: { relationship: -2, rejected: 1, futureChance: 0.12 },
        response: "“But you ARE a computer person.” Alan may return.",
        followUps: [
          {
            eventId: "printer-disaster",
            delay: [20, 35],
            conditions: { notFlag: "printer-fixed" },
          },
        ],
      },
      {
        label: "Is it turned on?",
        hint: "−2 min · sometimes that really is the problem",
        effects: { minutes: 2 },
        response: "It is on. The problem is still a problem.",
        outcomes: [
          {
            probability: 0.55,
            effects: {
              relationship: 3,
              helped: 1,
              flag: "printer-fixed",
              counters: { printerFixes: 1, basicFixes: 1 },
            },
            response: "It was off. You are briefly a wizard.",
          },
        ],
        followUps: [
          {
            eventId: "printer-disaster",
            delay: [20, 35],
            probability: 0.6,
            conditions: { notFlag: "printer-fixed" },
          },
        ],
      },
    ],
  },
  {
    id: "minute",
    name: "The quick sync",
    category: "meeting",
    npc: "manager",
    dialogue: "Do you have a minute? Just a quick five-minute sync. Promise.",
    probability: 0.14,
    cooldown: 90,
    conditions: { location: "office", minWork: 30 },
    choices: [
      {
        label: "Sure. Five minutes.",
        hint: "Actually −15–45 min · +9 stress · new task",
        duration: [15, 45],
        effects: {
          stress: 9,
          energy: -8,
          meeting: 1,
          flag: "manager-task",
          addTask: "Mark’s tiny change",
          counters: { scopeChanges: 1, managerChanges: 1 },
          relationship: 2,
        },
        response:
          "“Let’s schedule a follow-up.” New task: fix his tiny change.",
      },
      {
        label: "Can you put it in a ticket?",
        hint: "+5 stress · −3 relationship · new task",
        effects: {
          stress: 5,
          relationship: -3,
          rejected: 1,
          flag: "manager-task",
          addTask: "The thing in Mark’s ticket",
          counters: { scopeChanges: 1, managerChanges: 1 },
        },
        response:
          "He puts “the thing we discussed” in a ticket. New task added.",
      },
    ],
  },
  ...[
    [
      "excel",
      "A formula for disaster",
      "accountant",
      "Can you look at my Excel? It says #VALUE! I feel judged.",
      15,
    ],
    [
      "install",
      "Installation artist",
      "accountant",
      "Can you install this app? It’s only seventeen toolbars.",
      15,
    ],
    [
      "password",
      "Forgot password, found you",
      "receptionist",
      "I forgot my password. Can you just tell me what it is?",
      10,
    ],
    [
      "monitor",
      "A dark moment",
      "coworker",
      "My monitor isn’t working. …There’s an on button?",
      8,
    ],
    [
      "wifi",
      "Wireless, hopeless",
      "intern",
      "The internet is down. Or this website. Or my laptop. Help?",
      12,
    ],
    [
      "pdf",
      "Portable despair format",
      "cleaner",
      "How do I turn this into a PDF? Please don’t say “print”.",
      10,
    ],
    [
      "tiny-change",
      "Famous last words",
      "manager",
      "It’s just a tiny change. Can we make the entire thing different?",
      30,
    ],
  ].map(([id, name, npc, dialogue, duration]): Interruption => ({
    id: String(id),
    name: String(name),
    npc: String(npc),
    dialogue: String(dialogue),
    category: "support",
    probability: 0.11,
    cooldown: 80,
    conditions: { location: "office", after: 555 },
    choices: [
      {
        label: "Sure, let me help.",
        hint: `−${duration} min · +3 stress · +3 relationship`,
        effects: {
          minutes: Number(duration),
          stress: 3,
          energy: -3,
          relationship: 3,
          helped: 1,
        },
        response: "Another satisfied customer. Still not your job.",
      },
      {
        label: "I’m in the middle of something.",
        hint: "+4 stress · −2 relationship",
        effects: { stress: 4, relationship: -2, rejected: 1 },
        response: "You protected your focus. It feels strangely illegal.",
      },
      {
        label: "Ask IT?",
        hint: "−1 relationship · may return",
        effects: { relationship: -1, futureChance: 0.08, rejected: 1 },
        response: "They leave. For now.",
      },
    ],
  })),
];
const baseEvents: WorldEvent[] = [
  {
    id: "production",
    title: "It worked on my machine.",
    message: "Production bug! The server is having a Monday.",
    conditions: { after: 660, minProgress: 20 },
    probability: 0.17,
    cooldown: 150,
    effects: {
      stress: 8,
      productivity: -4,
      reputation: -5,
      counters: { productionBugs: 1 },
    },
    followUps: [{ eventId: "production-code", delay: [5, 12] }],
  },
  {
    id: "cake",
    title: "Someone’s birthday. Again.",
    message: "Free cake in the kitchen. Your energy approves.",
    conditions: { after: 720, before: 840 },
    probability: 0.25,
    cooldown: 300,
    effects: {},
    decision: "birthday",
    positive: true,
  },
  {
    id: "deploy",
    title: "Deploy failed successfully.",
    message: "A missing semicolon. An impressive blast radius.",
    conditions: { after: 840, minProgress: 50 },
    probability: 0.13,
    cooldown: 120,
    effects: {
      stress: 7,
      productivity: -3,
      reputation: -3,
      counters: { buildFailures: 1 },
    },
  },
  {
    id: "coffee-broken",
    title: "Critical infrastructure down.",
    message: "Coffee machine rebooting. Give it ten minutes.",
    conditions: { after: 780 },
    probability: 0.09,
    cooldown: 160,
    effects: { stress: 3, cooldowns: { coffee: 10 } },
  },
];
export const interruptions: Interruption[] = [
  ...baseInterruptions.map((i) => {
    if (i.id === "printer")
      return { ...i, onStart: { clearFlags: ["printer-fixed"] } };
    if (i.id === "tiny-change")
      return {
        ...i,
        category: "management" as const,
        choices: i.choices.map((c, n) =>
          n === 0
            ? {
                ...c,
                effects: {
                  ...c.effects,
                  addTask: "One more small change",
                  counters: { scopeChanges: 1, managerChanges: 1 },
                },
              }
            : c,
        ),
      };
    if (i.id === "excel")
      return extraInterruptions.find((e) => e.id === "excel-teach")
        ? {
            ...extraInterruptions.find((e) => e.id === "excel-teach")!,
            id: "excel",
          }
        : i;
    return i;
  }),
  ...extraInterruptions.filter((i) => i.id !== "excel-teach"),
];
export const randomEvents: WorldEvent[] = [
  ...baseEvents.map((e) => ({
    ...e,
    conditions: { location: "office" as const, ...e.conditions },
  })),
  ...polishEvents,
];
export const encounters = [...interruptions, ...codingDecisions];
export const getEncounter = (id: string | null) =>
  encounters.find((e) => e.id === id);
export { codingDecisions };
