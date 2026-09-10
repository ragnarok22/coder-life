import type { Obstacle, Vec2 } from "../game/types";

export const OFFICE_SIZE = { w: 30, d: 20 };
export const OFFICE_ENTRANCE: Vec2 = [0, 7.2];
export interface OfficeDesk {
  id: string;
  position: Vec2;
  rotation: number;
  variant: "standard" | "developer" | "rockstar" | "manager" | "tidy";
  player?: boolean;
}
export const officeDesks: OfficeDesk[] = [
  {
    id: "sales-desk",
    position: [-6, -3],
    rotation: Math.PI,
    variant: "standard",
  },
  {
    id: "intern-desk",
    position: [-2, -3],
    rotation: Math.PI,
    variant: "developer",
  },
  {
    id: "player-desk",
    position: [-6, 2],
    rotation: 0,
    variant: "developer",
    player: true,
  },
  {
    id: "shared-desk",
    position: [-2, 2],
    rotation: Math.PI,
    variant: "developer",
  },
  {
    id: "manager-desk",
    position: [3, -5],
    rotation: Math.PI,
    variant: "manager",
  },
  {
    id: "rockstar-desk",
    position: [-10, -1.3],
    rotation: 0,
    variant: "rockstar",
  },
  {
    id: "senior-desk",
    position: [-9, -8.2],
    rotation: 0,
    variant: "developer",
  },
  { id: "hr-desk", position: [-12.5, 2.5], rotation: 0, variant: "tidy" },
  {
    id: "accounting-desk",
    position: [-12.5, 6.4],
    rotation: 0,
    variant: "tidy",
  },
];
export interface OfficeArea {
  id: string;
  name: string;
  x: number;
  z: number;
  w: number;
  d: number;
  floor: string;
  accent: string;
  arrival: Vec2;
}
export const officeAreas: OfficeArea[] = [
  {
    id: "bathroom",
    name: "Bathroom",
    x: 2.85,
    z: 5.7,
    w: 4.3,
    d: 3,
    floor: "#d7e1dc",
    accent: "#86a9a4",
    arrival: [3, 5.8],
  },
  {
    id: "meeting-room",
    name: "Main meeting room",
    x: 9.7,
    z: -6,
    w: 8.3,
    d: 7.7,
    floor: "#b9cfc5",
    accent: "#5e9187",
    arrival: [6.8, -2.8],
  },
  {
    id: "small-meeting",
    name: "The five-minute room",
    x: -4,
    z: -8.15,
    w: 6.2,
    d: 3.5,
    floor: "#ded4b6",
    accent: "#ba955c",
    arrival: [-4, -6.9],
  },
  {
    id: "manager-office",
    name: "Manager’s office",
    x: 3,
    z: -7.3,
    w: 4.8,
    d: 5.1,
    floor: "#c8b38f",
    accent: "#9b7352",
    arrival: [3, -6.3],
  },
  {
    id: "utility",
    name: "Utility / server room",
    x: -12.75,
    z: -7.65,
    w: 4.1,
    d: 4.3,
    floor: "#bbc8ca",
    accent: "#628a98",
    arrival: [-12.5, -6.8],
  },
  {
    id: "copy-area",
    name: "Print & copy",
    x: -11.55,
    z: -4.55,
    w: 6,
    d: 2.3,
    floor: "#dfd9bb",
    accent: "#c3a567",
    arrival: [-9.5, -5.5],
  },
  {
    id: "hr-accounting",
    name: "People & paperwork",
    x: -12.7,
    z: 4.55,
    w: 4.25,
    d: 8.2,
    floor: "#d4dbbc",
    accent: "#9aab70",
    arrival: [-12.5, 4],
  },
  {
    id: "developers",
    name: "Engineering",
    x: -6.1,
    z: -0.4,
    w: 10.6,
    d: 8.6,
    floor: "#c3d3bf",
    accent: "#709475",
    arrival: [-6, 3.4],
  },
  {
    id: "kitchen",
    name: "Kitchen & coffee",
    x: 10.65,
    z: 5,
    w: 8,
    d: 8.8,
    floor: "#e4d2ad",
    accent: "#c99755",
    arrival: [9.5, 3.4],
  },
  {
    id: "reception",
    name: "Reception",
    x: -7.3,
    z: 7.2,
    w: 6.3,
    d: 5.2,
    floor: "#d8d9bf",
    accent: "#7b9a85",
    arrival: [-8.5, 4.7],
  },
  {
    id: "lounge",
    name: "The decompression zone",
    x: -2.3,
    z: 8.45,
    w: 4.4,
    d: 2.7,
    floor: "#dbbd9c",
    accent: "#b88261",
    arrival: [-2.4, 7.4],
  },
];
export interface OfficePartition extends Obstacle {
  id: string;
  color: string;
  glass?: boolean;
}
// Two approaches to the east wing; a north loop through the small meeting room;
// a west aisle around the developers, and a south route behind reception/WC.
export const officePartitions: OfficePartition[] = [
  {
    id: "meeting-west-north",
    x: 5.5,
    z: -8.65,
    w: 0.2,
    d: 2.7,
    h: 2.8,
    color: "#78988a",
    glass: true,
  },
  {
    id: "meeting-west-south",
    x: 5.5,
    z: -3.9,
    w: 0.2,
    d: 2.6,
    h: 2.8,
    color: "#78988a",
    glass: true,
  },
  {
    id: "meeting-front",
    x: 10.5,
    z: -1.8,
    w: 7,
    d: 0.2,
    h: 2.8,
    color: "#78988a",
    glass: true,
  },
  {
    id: "manager-west",
    x: 0.5,
    z: -8.5,
    w: 0.2,
    d: 2.7,
    h: 2.8,
    color: "#b5bc9f",
  },
  {
    id: "manager-front",
    x: 4,
    z: -3.8,
    w: 3,
    d: 0.2,
    h: 2.5,
    color: "#baab8e",
  },
  {
    id: "small-meeting-front",
    x: -3.8,
    z: -6.25,
    w: 3.7,
    d: 0.18,
    h: 2.3,
    color: "#b1ac8b",
    glass: true,
  },
  {
    id: "utility-east",
    x: -11.5,
    z: -8.1,
    w: 0.2,
    d: 3.8,
    h: 2.7,
    color: "#a1b4b4",
  },
  { id: "bathroom-east", x: 5, z: 5.7, w: 0.2, d: 3, h: 2.5, color: "#bdcfc7" },
  {
    id: "bathroom-south",
    x: 2.85,
    z: 7.2,
    w: 4.3,
    d: 0.2,
    h: 2.5,
    color: "#bdcfc7",
  },
  {
    id: "bathroom-west",
    x: 0.7,
    z: 5.7,
    w: 0.2,
    d: 3,
    h: 2.5,
    color: "#bdcfc7",
  },
  {
    id: "bathroom-door-left",
    x: 1.45,
    z: 4.2,
    w: 1.5,
    d: 0.2,
    h: 2.5,
    color: "#bdcfc7",
  },
  {
    id: "bathroom-door-right",
    x: 4.45,
    z: 4.2,
    w: 1.1,
    d: 0.2,
    h: 2.5,
    color: "#bdcfc7",
  },
];
export const officeFurniture: (Obstacle & { id: string })[] = [
  ...officeDesks.flatMap((d) => {
    const sign = d.rotation === 0 ? 1 : -1;
    const monitors = [
      {
        id: `monitor-${d.id}`,
        x: d.position[0] - 0.18 * sign,
        z: d.position[1] - 0.32 * sign,
        w: 1.2,
        d: 0.2,
        h: 2.14,
      },
    ];
    if (d.variant === "developer" || d.variant === "rockstar")
      monitors.push({
        id: `monitor-side-${d.id}`,
        x: d.position[0] + 0.96 * sign,
        z: d.position[1] - 0.27 * sign,
        w: 0.78,
        d: 0.3,
        h: 1.98,
      });
    if (d.variant === "rockstar")
      monitors.push({
        id: `monitor-left-${d.id}`,
        x: d.position[0] - 1.18 * sign,
        z: d.position[1] - 0.25 * sign,
        w: 0.78,
        d: 0.3,
        h: 1.98,
      });
    return monitors;
  }),
  ...officeDesks.map((d) => ({
    id: d.id,
    x: d.position[0],
    z: d.position[1],
    w: d.variant === "manager" ? 3.2 : 2.8,
    d: 1.3,
    h: 1.12,
  })),
  { id: "meeting-table", x: 9, z: -4.5, w: 4.5, d: 2, h: 1 },
  { id: "small-meeting-table", x: -4, z: -8.3, w: 3, d: 1.1, h: 1 },
  { id: "coffee-counter", x: 9.9, z: 2.2, w: 2.65, d: 1.1, h: 2.35 },
  { id: "kitchen-counter", x: 13.5, z: 4, w: 1.1, d: 3.1, h: 1.3 },
  { id: "fridge", x: 10, z: 6, w: 1.5, d: 1, h: 2 },
  { id: "reception", x: -8.5, z: 6, w: 3.6, d: 1.6, h: 1.4 },
  { id: "printer", x: -10.5, z: -5.5, w: 1.2, d: 1.2, h: 1.3 },
  { id: "server-rack", x: -14, z: -8.3, w: 1.2, d: 1.5, h: 2.3 },
  { id: "utility-storage", x: -12.9, z: -9.35, w: 1.4, d: 0.8, h: 1.8 },
  { id: "lounge-sofa", x: -2.5, z: 9, w: 3.2, d: 1.1, h: 1.15 },
  { id: "kitchen-table", x: 12.7, z: 7.5, w: 1.8, d: 1.5, h: 1 },
  { id: "water", x: -11.1, z: 1, w: 0.65, d: 0.6, h: 1.85 },
];
export const officeSteps: Obstacle[] = [
  { x: -13.2, z: -5.6, w: 2.4, d: 0.8, h: 0.16 },
];
export const officePatrol: Vec2[] = [
  [-6, 3.4],
  [0, 0],
  [-9, -3.8],
  [7.3, 3.8],
  [6.3, -2.7],
  [0, 8.2],
  [-12.5, 4],
  [-4, -6.9],
  [3, -6.3],
];
export const officeNpcHomes: Record<
  string,
  { position: Vec2; heading: number; seated?: boolean }
> = {
  manager: { position: [3, -6.3], heading: 0, seated: true },
  hr: { position: [-12.5, 3.7], heading: Math.PI, seated: true },
  accountant: { position: [-12.5, 7.6], heading: Math.PI, seated: true },
  sales: { position: [-6, -4.2], heading: 0, seated: true },
  coworker: { position: [-2, 0.8], heading: 0, seated: true },
  intern: { position: [-2, -4.2], heading: 0, seated: true },
  senior: { position: [-9, -7], heading: Math.PI, seated: true },
  receptionist: { position: [-8.5, 7.4], heading: Math.PI, seated: true },
  "rockstar-developer": {
    position: [-10, -0.1],
    heading: Math.PI,
    seated: true,
  },
  "corporate-visionary": { position: [12.1, -3.3], heading: -1.1 },
  "office-analyst": { position: [-4, -6.9], heading: Math.PI },
};
