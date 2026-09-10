import type { Location, Vec2 } from "../game/types";
import { officeAreas } from "./office-layout";
export const zones = [
  {
    id: "bathroom",
    name: "Bathroom",
    x: 2.85,
    z: 5.7,
    w: 4.3,
    d: 3,
    hide: true,
    entryChance: 0.03,
    description: "Private, not productive. Hiding costs seven minutes.",
  },
  {
    id: "meeting-room",
    name: "Meeting room",
    x: 9.7,
    z: -6,
    w: 8.3,
    d: 7.7,
    hide: true,
    entryChance: 0.45,
    description: "Blend in until somebody books the room.",
  },
  {
    id: "kitchen",
    name: "Kitchen",
    x: 10.65,
    z: 5,
    w: 8,
    d: 8.8,
    hide: true,
    entryChance: 0.55,
    description: "A coffee cup is a reasonable disguise.",
  },
  {
    id: "desk",
    name: "Your desk",
    x: -6,
    z: 3.4,
    w: 3.4,
    d: 2.2,
    hide: false,
    entryChance: 1,
    description: "The first place everybody looks.",
  },
  ...officeAreas
    .filter((a) => ["small-meeting", "utility", "lounge"].includes(a.id))
    .map((a) => ({
      ...a,
      hide: true,
      entryChance: a.id === "utility" ? 0.1 : 0.45,
      description: "A short pause, with another route back to work.",
    })),
] as const;
export function zoneAt(position: Vec2, location: Location) {
  return location === "office"
    ? zones.find(
        (z) =>
          Math.abs(position[0] - z.x) <= z.w / 2 &&
          Math.abs(position[1] - z.z) <= z.d / 2,
      )
    : undefined;
}
export const meetingOccupied = (minutes: number) =>
  (minutes >= 600 && minutes < 660) || (minutes >= 840 && minutes < 870);
