import type { GameData } from "../game/types";
export interface EndingDefinition {
  id: string;
  title: string;
  quote: string;
  description: string;
  test: (g: GameData) => boolean;
}
/** First match wins; specific endings precede broad productivity fallbacks. */
export const endings: EndingDefinition[] = [
  {
    id: "burned-out",
    title: "Burned Out",
    quote: "Tomorrow is another day. Unfortunately.",
    description:
      "You reached at least 95 stress. Protecting yourself is also work.",
    test: (g) => g.stats.maxStress >= 95,
  },
  {
    id: "hero",
    title: "Hero Employee",
    quote: "Suspiciously competent.",
    description:
      "95% work, six people helped, and a reputation of at least 65.",
    test: (g) =>
      g.productivity >= 95 && g.stats.helped >= 6 && g.reputation >= 65,
  },
  {
    id: "craftsperson",
    title: "The Code Craftsperson",
    quote: "Future You sends their regards.",
    description: "85% work, 85 quality, and no more than 15 technical debt.",
    test: (g) =>
      g.productivity >= 85 && g.codeQuality >= 85 && g.technicalDebt <= 15,
  },
  {
    id: "ghost",
    title: "Office Ghost",
    quote: "People are starting to wonder if you work here.",
    description:
      "Evade at least four requests and handle fewer than eight interruptions.",
    test: (g) => g.stats.evaded >= 4 && g.stats.interruptions < 8,
  },
  {
    id: "it-support",
    title: "IT Support Technician",
    quote: "Nobody knows what your actual job is anymore.",
    description: "At least 90 minutes of IT support and six people helped.",
    test: (g) => g.stats.time.ITSupport >= 90 && g.stats.helped >= 6,
  },
  {
    id: "meeting-survivor",
    title: "Meeting Survivor",
    quote: "You attended everything. Congratulations?",
    description: "You survived at least two hours of meetings.",
    test: (g) => g.stats.time.meetings >= 120,
  },
  {
    id: "debt-collector",
    title: "The Technical Debt Collector",
    quote: "You shipped a problem with a release number.",
    description: "65+ debt and at least one production failure.",
    test: (g) =>
      g.technicalDebt >= 65 && (g.stats.counters.productionBugs ?? 0) >= 1,
  },
  {
    id: "productive",
    title: "Productive Day",
    quote: "You actually got work done.",
    description: "At least 90% productivity. Against the odds.",
    test: (g) => g.productivity >= 90,
  },
  {
    id: "somehow-productive",
    title: "Somehow Productive",
    quote: "Not all the work. Definitely some of the work.",
    description: "At least 65% productivity, despite Monday.",
    test: (g) => g.productivity >= 65,
  },
  {
    id: "still-employed",
    title: "Somehow Still Employed",
    quote: "Manager not impressed. Browser still employed.",
    description: "The day ended. Your to-do list did not.",
    test: () => true,
  },
];
export const evaluateEnding = (g: GameData) => endings.find((e) => e.test(g))!;
