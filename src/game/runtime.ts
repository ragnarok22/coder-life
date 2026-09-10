import type { AnimationState, NpcState, Vec2 } from "./types";

// High-frequency simulation data stays outside React and the persistent game state.
export const runtime = {
  player: [-1.7, -2] as Vec2,
  yaw: 0,
  animation: "idle" as AnimationState,
  npcs: new Map<
    string,
    { position: Vec2; state: NpcState; destination: Vec2; heading: number }
  >(),
};
