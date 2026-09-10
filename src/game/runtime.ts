import type { AnimationState, NpcState, Vec2 } from "./types";

// High-frequency simulation data stays outside React and the persistent game state.
export const runtime = {
  player: [-1.7, -2] as Vec2,
  yaw: 0,
  animation: "idle" as AnimationState,
  speed: 0,
  playerHeight: 0.8,
  camera: {
    blocked: false,
    drawCalls: 0,
    triangles: 0,
    yaw: 0,
    pitch: 0.48,
    collided: false,
    target: [0, 0, 0],
    position: [0, 0, 0],
    desired: [0, 0, 0],
  },
  npcs: new Map<
    string,
    { position: Vec2; state: NpcState; destination: Vec2; heading: number }
  >(),
};
