import type { Location, Vec2 } from "../game/types";
export const zones = [
  {
    id: "bathroom",
    name: "Bathroom",
    x: 2.6,
    z: 5.7,
    w: 4.4,
    d: 2.8,
    hide: true,
    entryChance: 0.03,
    description: "Private, not productive. Hiding costs seven minutes.",
  },
  {
    id: "meeting-room",
    name: "Meeting room",
    x: 8.5,
    z: -5.4,
    w: 6,
    d: 6.4,
    hide: true,
    entryChance: 0.45,
    description: "Blend in until somebody books the room.",
  },
  {
    id: "kitchen",
    name: "Kitchen",
    x: 8.7,
    z: 5.3,
    w: 5.8,
    d: 6.8,
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
