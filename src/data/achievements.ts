import type { GameData } from "../game/types";
export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  test: (g: GameData) => boolean;
}
const count = (g: GameData, key: string) => g.stats.counters[key] ?? 0;
export const achievements: AchievementDefinition[] = [
  {
    id: "reboot",
    title: "Have You Tried Turning It Off And On Again?",
    description: "Solve three basic IT problems.",
    test: (g) => count(g, "basicFixes") >= 3,
  },
  {
    id: "printer-tech",
    title: "Printer Technician",
    description: "Fix the printer three times. Somehow.",
    test: (g) => count(g, "printerFixes") >= 3,
  },
  {
    id: "meeting-survivor",
    title: "Meeting Survivor",
    description: "Spend two hours in meetings.",
    test: (g) => g.stats.time.meetings >= 120,
  },
  {
    id: "coffee-driven",
    title: "Coffee Driven Development",
    description: "Consume five coffees in one day.",
    test: (g) => g.stats.coffees >= 5,
  },
  {
    id: "productive",
    title: "Actually Productive",
    description: "Finish the day at 100% productivity.",
    test: (g) => g.finished && g.productivity >= 100,
  },
  {
    id: "bathroom-escape",
    title: "Bathroom Escape Artist",
    description: "Make the manager give up while you hide in the bathroom.",
    test: (g) => count(g, "bathroomEscapes") >= 1,
  },
  {
    id: "scope-creep",
    title: "Scope Creep",
    description: "Receive three additional tasks.",
    test: (g) => count(g, "scopeChanges") >= 3,
  },
  {
    id: "my-machine",
    title: "Works On My Machine",
    description: "Choose a risky quick fix.",
    test: (g) => count(g, "quickFixes") >= 1,
  },
  {
    id: "stack-overflow",
    title: "Stack Overflow Senior",
    description: "Ship five quick fixes.",
    test: (g) => count(g, "quickFixes") >= 5,
  },
  {
    id: "zero-coding",
    title: "Zero Coding Day",
    description: "Finish with less than 30 minutes of actual coding.",
    test: (g) => g.finished && g.stats.workMinutes < 30,
  },
  {
    id: "office-ghost",
    title: "Office Ghost",
    description: "Evade three requests in a row.",
    test: (g) => g.stats.longestEvadeStreak >= 3,
  },
  {
    id: "people-pleaser",
    title: "People Pleaser",
    description: "Help ten people in one day.",
    test: (g) => g.stats.helped >= 10,
  },
  {
    id: "not-my-job",
    title: "Not My Job",
    description: "Decline eight requests.",
    test: (g) => g.stats.rejected >= 8,
  },
  {
    id: "small-change",
    title: "One More Small Change",
    description: "Accept scope changes from the manager twice.",
    test: (g) => count(g, "managerChanges") >= 2,
  },
  {
    id: "production-down",
    title: "Production Is Down",
    description: "Experience a production failure.",
    test: (g) => count(g, "productionBugs") >= 1,
  },
  {
    id: "mentor",
    title: "Return On Internvestment",
    description: "Teach Jamie twice and receive their help.",
    test: (g) => count(g, "internHelp") >= 1,
  },
  {
    id: "clean-code",
    title: "Boring Is Beautiful",
    description: "Finish with 85+ quality and at most 15 debt.",
    test: (g) => g.finished && g.codeQuality >= 85 && g.technicalDebt <= 15,
  },
  {
    id: "silver-lining",
    title: "Something Went Right",
    description: "Experience three positive events.",
    test: (g) => count(g, "positiveEvents") >= 3,
  },
  {
    id: "survivor",
    title: "First Day Survivor",
    description: "Reach 17:00. That is enough.",
    test: (g) => g.finished,
  },
];
export function unlockAchievements(g: GameData): GameData {
  const newly = achievements
    .filter((a) => !g.achievements.includes(a.id) && a.test(g))
    .map((a) => a.id);
  return newly.length
    ? { ...g, achievements: [...g.achievements, ...newly] }
    : g;
}
