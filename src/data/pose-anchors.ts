import type { Vec2 } from "../game/types";

/** Furniture geometry and attached character poses share these measurements. */
export const CHAIR_POSE = {
  deskOffset: 1.16,
  cushionCenter: 0.54,
  cushionThickness: 0.16,
  seatHeight: 0.62,
  exitOffset: 0.95,
  hipHeight: 0.56,
  kneeOffset: 0.225,
  seatedHipAngle: -1.05,
  typingArmAngle: -1.48,
} as const;

export const HOME_BED = {
  center: [-3.6, -2.7] as Vec2,
  frame: { centerY: 0.3, size: [2.3, 0.6, 3.4] as [number, number, number] },
  mattress: {
    centerY: 0.67,
    size: [2.2, 0.2, 3.3] as [number, number, number],
  },
  blanket: {
    centerY: 0.81,
    z: -2.15,
    size: [2.23, 0.14, 2.1] as [number, number, number],
  },
  pillow: {
    centerY: 0.86,
    z: -3.83,
    size: [1.6, 0.22, 0.7] as [number, number, number],
  },
  // A supine body, with its head at the pillow and its back on the bedding.
  sleepOrigin: [-3.6, 1.11, -2.35] as [number, number, number],
  sleepLookAt: [-3.6, 1.25, -3.1] as [number, number, number],
  wakePosition: [-1.7, -2] as Vec2,
} as const;

export function chairPose(desk: { position: Vec2; rotation: number }) {
  const back: Vec2 = [Math.sin(desk.rotation), Math.cos(desk.rotation)];
  const position: Vec2 = [
    desk.position[0] + back[0] * CHAIR_POSE.deskOffset,
    desk.position[1] + back[1] * CHAIR_POSE.deskOffset,
  ];
  return {
    position,
    heading: desk.rotation + Math.PI,
    seatHeight: CHAIR_POSE.seatHeight,
    exitPosition: [
      position[0] + back[0] * CHAIR_POSE.exitOffset,
      position[1] + back[1] * CHAIR_POSE.exitOffset,
    ] as Vec2,
  };
}
