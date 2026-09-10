import { npcSeed, randomStream } from "../game/random";
export const HAIR_STYLES = [
  "short",
  "medium",
  "long",
  "ponytail",
  "bun",
  "curly",
  "afro",
  "bald",
  "buzz",
  "messy",
  "side-part",
] as const;
export type HairStyle = (typeof HAIR_STYLES)[number];
export type Accessory =
  | "glasses"
  | "round-glasses"
  | "headphones"
  | "watch"
  | "lanyard"
  | "cap"
  | "earrings"
  | "backpack"
  | "coffee-cup"
  | "tablet";
export type BodyVariant =
  "slim" | "average" | "broad" | "tall-ish" | "short-ish";
export const BODY_SCALES: Record<BodyVariant, [number, number, number]> = {
  slim: [0.9, 1, 0.92],
  average: [1, 1, 1],
  broad: [1.14, 1.03, 1.08],
  "tall-ish": [0.96, 1.12, 1],
  "short-ish": [1, 0.92, 1],
};
export const OUTFIT_PALETTES = {
  neutral: {
    shirt: "#d7c9ac",
    pants: "#596469",
    shoes: "#ece6d4",
    jacket: "#6e7f75",
    accent: "#b98d54",
  },
  corporate: {
    shirt: "#eadcc4",
    pants: "#424f55",
    shoes: "#4a453b",
    jacket: "#b87751",
    accent: "#d5b769",
  },
  casual: {
    shirt: "#719b82",
    pants: "#536c79",
    shoes: "#f0e5cc",
    jacket: "#455967",
    accent: "#d6a75c",
  },
  bright: {
    shirt: "#d78f6b",
    pants: "#657386",
    shoes: "#ece6da",
    jacket: "#658faa",
    accent: "#e2bc64",
  },
  pastel: {
    shirt: "#eddfd0",
    pants: "#727d85",
    shoes: "#e8d8c0",
    jacket: "#bd8d9b",
    accent: "#9ab39a",
  },
  dark: {
    shirt: "#bd6b7d",
    pants: "#424655",
    shoes: "#cd8b5d",
    jacket: "#333e4c",
    accent: "#d5b868",
  },
  eccentric: {
    shirt: "#edd4b4",
    pants: "#64607b",
    shoes: "#d8b866",
    jacket: "#498e8d",
    accent: "#e1b16d",
  },
} as const;
export type PaletteName = keyof typeof OUTFIT_PALETTES;
export interface NpcAppearance {
  presentation: "masculine" | "feminine" | "androgynous";
  body: BodyVariant;
  skinTone: string;
  hair: HairStyle;
  hairColor: string;
  outfit: "casual" | "office-casual" | "blazer" | "creative";
  palette: PaletteName;
  accessories: readonly Accessory[];
  visualTag?: "manager" | "rockstar" | "visionary";
  shirtColor?: string;
  pantsColor?: string;
  shoes?: "sneakers" | "loafers" | "boots";
}
const base: NpcAppearance = {
  presentation: "androgynous",
  body: "average",
  skinTone: "#d9aa85",
  hair: "short",
  hairColor: "#3c302b",
  outfit: "casual",
  palette: "casual",
  accessories: [],
  shoes: "sneakers",
};
export const PLAYER_APPEARANCE: NpcAppearance = {
  ...base,
  presentation: "masculine",
  skinTone: "#e9b78e",
  hair: "messy",
  accessories: ["glasses"],
};
export const importantAppearances: Record<string, NpcAppearance> = {
  manager: {
    ...base,
    presentation: "masculine",
    body: "broad",
    skinTone: "#e9bc92",
    hair: "side-part",
    hairColor: "#654238",
    outfit: "blazer",
    palette: "corporate",
    accessories: ["tablet"],
    visualTag: "manager",
    shoes: "loafers",
  },
  hr: {
    ...base,
    presentation: "feminine",
    body: "short-ish",
    skinTone: "#dba080",
    hair: "bun",
    hairColor: "#9b5035",
    outfit: "blazer",
    palette: "pastel",
    accessories: [],
    shoes: "loafers",
  },
  accountant: {
    ...base,
    presentation: "masculine",
    body: "average",
    skinTone: "#c48b61",
    hair: "bald",
    hairColor: "#756e62",
    outfit: "office-casual",
    palette: "neutral",
    shirtColor: "#d0ae63",
    accessories: ["round-glasses"],
    shoes: "loafers",
  },
  sales: {
    ...base,
    presentation: "feminine",
    body: "tall-ish",
    skinTone: "#996442",
    hair: "medium",
    hairColor: "#312c2b",
    outfit: "creative",
    palette: "bright",
    shirtColor: "#809bbf",
    accessories: ["earrings"],
  },
  coworker: {
    ...base,
    skinTone: "#e4b798",
    hair: "curly",
    hairColor: "#6b4230",
    palette: "casual",
    accessories: ["watch"],
  },
  intern: {
    ...base,
    presentation: "feminine",
    body: "slim",
    skinTone: "#9f6b50",
    hair: "ponytail",
    hairColor: "#292b29",
    palette: "bright",
    accessories: ["backpack"],
  },
  senior: {
    ...base,
    presentation: "masculine",
    skinTone: "#e0b994",
    hair: "buzz",
    hairColor: "#a4a395",
    outfit: "office-casual",
    palette: "neutral",
    shirtColor: "#7d9aab",
    accessories: ["glasses", "lanyard"],
  },
  receptionist: {
    ...base,
    presentation: "feminine",
    skinTone: "#895b45",
    hair: "long",
    hairColor: "#3c2e29",
    outfit: "office-casual",
    palette: "pastel",
    shirtColor: "#8eaaa2",
    accessories: ["earrings", "lanyard"],
  },
  "rockstar-developer": {
    ...base,
    body: "slim",
    skinTone: "#e3b794",
    hair: "long",
    hairColor: "#66516f",
    outfit: "blazer",
    palette: "dark",
    accessories: ["headphones", "coffee-cup"],
    visualTag: "rockstar",
    shoes: "boots",
  },
  "corporate-visionary": {
    ...base,
    presentation: "masculine",
    body: "tall-ish",
    skinTone: "#bd8c67",
    hair: "side-part",
    hairColor: "#2e373b",
    outfit: "blazer",
    palette: "eccentric",
    accessories: ["round-glasses", "tablet"],
    visualTag: "visionary",
    shoes: "loafers",
  },
};
const skins = [
  "#f0c9aa",
  "#dbaa83",
  "#bf8a61",
  "#9e6d4c",
  "#79513e",
  "#d7a895",
];
const hairColors = [
  "#282b2b",
  "#48342b",
  "#795137",
  "#cbb47d",
  "#ab5c3c",
  "#a1a39b",
  "#676b91",
  "#9b6882",
];
export function generateAppearance(seed: number, id: string): NpcAppearance {
  const random = randomStream(npcSeed(seed, id));
  const pick = <T>(values: readonly T[]) =>
    values[Math.floor(random.next() * values.length)];
  const hair = pick(HAIR_STYLES);
  const accessory = pick<Accessory>([
    "glasses",
    "round-glasses",
    "watch",
    "lanyard",
    "cap",
    "earrings",
    "backpack",
  ]);
  return {
    ...base,
    presentation: pick(["masculine", "feminine", "androgynous"] as const),
    body: pick(Object.keys(BODY_SCALES) as BodyVariant[]),
    skinTone: pick(skins),
    hair,
    hairColor: pick(hairColors),
    outfit: pick(["casual", "office-casual", "creative"] as const),
    palette: pick(Object.keys(OUTFIT_PALETTES) as PaletteName[]),
    accessories:
      random.next() < 0.5
        ? [
            accessory === "cap" && ["bun", "afro"].includes(hair)
              ? "watch"
              : accessory,
          ]
        : [],
  };
}
export const appearanceSignature = (a: NpcAppearance) =>
  `${a.hair}/${a.hairColor}/${a.shirtColor ?? OUTFIT_PALETTES[a.palette].shirt}/${a.outfit}`;
export function officeAppearances(
  ids: string[],
  seed: number,
): Record<string, NpcAppearance> {
  const result: Record<string, NpcAppearance> = {},
    used = new Set(
      Object.values(importantAppearances).map(appearanceSignature),
    );
  for (const id of ids) {
    if (importantAppearances[id]) {
      result[id] = importantAppearances[id];
      continue;
    }
    let appearance = generateAppearance(seed, id);
    for (
      let attempt = 1;
      used.has(appearanceSignature(appearance)) && attempt < 20;
      attempt++
    )
      appearance = generateAppearance(seed + attempt, id);
    result[id] = appearance;
    used.add(appearanceSignature(appearance));
  }
  return result;
}
