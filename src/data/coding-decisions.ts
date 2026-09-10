import type { Interruption } from "../game/types";

// Each incident shares the engine, but has its own setup, remedies and risk profile.
const situations = [
  {
    id: "auth-code",
    name: "BUG FOUND",
    dialogue:
      "The authentication flow accepts everyone. Very inclusive. Very bad.",
    quick: "Skip the broken check.",
    proper: "Repair the validation.",
    risk: "production",
    debt: 16,
  },
  {
    id: "test-code",
    name: "FAILING TEST",
    dialogue: "The test is red. The feature is green. One of them is lying.",
    quick: "Disable the flaky test.",
    proper: "Fix the behavior, keep the test.",
    risk: "deploy",
    debt: 13,
  },
  {
    id: "merge-code",
    name: "MERGE CONFLICT",
    dialogue: "Two branches. Three opinions. Four hundred conflict markers.",
    quick: "Accept all of mine.",
    proper: "Review both changes.",
    risk: "scope-regression",
    debt: 14,
  },
  {
    id: "dependency-code",
    name: "DEPENDENCY ISSUE",
    dialogue:
      "A tiny package now requires the entire internet. It also breaks the build.",
    quick: "Force install. Hope.",
    proper: "Pin and audit the dependency.",
    risk: "deploy",
    debt: 18,
  },
  {
    id: "review-code",
    name: "CODE REVIEW",
    dialogue: "“Small suggestion.” The comment contains a new architecture.",
    quick: "Approve without reading.",
    proper: "Address the useful feedback.",
    risk: "production",
    debt: 12,
  },
  {
    id: "production-code",
    name: "PRODUCTION ALERT",
    dialogue:
      "It worked locally. Production has a different interpretation of “worked”.",
    quick: "Hotfix the symptom.",
    proper: "Find the root cause.",
    risk: "production",
    debt: 17,
  },
  {
    id: "ambiguity-code",
    name: "FEATURE AMBIGUITY",
    dialogue:
      "The ticket says “make it intuitive”. The acceptance criteria say nothing.",
    quick: "Guess confidently.",
    proper: "Clarify the acceptance criteria.",
    risk: "scope-regression",
    debt: 10,
  },
  {
    id: "legacy-code",
    name: "LEGACY CODE",
    dialogue: "A comment says “temporary fix, 2014”. The fix has tenure.",
    quick: "Copy the workaround.",
    proper: "Refactor the smallest safe piece.",
    risk: "production",
    debt: 19,
  },
  {
    id: "build-code",
    name: "BUILD FAILURE",
    dialogue: "The build failed at 99%. An impressive commitment to suspense.",
    quick: "Skip the failing check.",
    proper: "Repair the pipeline.",
    risk: "deploy",
    debt: 15,
  },
] as const;
export const codingDecisions: Interruption[] = situations.map(
  (s): Interruption => ({
    id: s.id,
    name: s.name,
    npc: "system",
    category: "coding",
    dialogue: s.dialogue,
    probability: 1,
    cooldown: 70,
    conditions: { location: "office" },
    timeCategory: s.id === "production-code" ? "bugs" : "coding",
    choices: [
      {
        label: `Quick fix · ${s.quick}`,
        hint: "+10% task · debt ↑ · 15% delayed failure risk",
        effects: {
          taskProgress: 10,
          technicalDebt: s.debt,
          codeQuality: -9,
          counters: { quickFixes: 1 },
        },
        response: "Green now. A problem for Future You.",
        followUps: [{ eventId: s.risk, delay: [30, 65], probability: 0.15 }],
      },
      {
        label: `Proper fix · ${s.proper}`,
        hint: "−8 min · +5% task · quality ↑ · debt ↓",
        effects: {
          minutes: 8,
          taskProgress: 5,
          technicalDebt: -8,
          codeQuality: 8,
          reputation: 2,
          counters: { properFixes: 1, bugsResolved: 1 },
        },
        response: "A small, boring, correct solution. Beautiful.",
      },
      {
        label: "Ask the Senior Developer.",
        npc: "senior",
        hint: "−5 min · useful advice, or a very long explanation",
        effects: {
          minutes: 5,
          taskProgress: 6,
          codeQuality: 5,
          relationship: 4,
        },
        response: "Pat points at two lines. Two very important lines.",
        outcomes: [
          {
            probability: 0.3,
            effects: { minutes: 22, technicalDebt: -8, codeQuality: 8 },
            response:
              "You came for a fix. You stayed for a history of software architecture.",
          },
        ],
      },
      {
        label: "Ignore it for now.",
        hint: "Debt ↑ · the incident may return",
        effects: {
          technicalDebt: 7,
          codeQuality: -3,
          counters: { ignoredBugs: 1 },
        },
        response: "The bug adds itself to your future calendar.",
        followUps: [{ eventId: s.risk, delay: [35, 65], probability: 0.6 }],
      },
    ],
  }),
);
