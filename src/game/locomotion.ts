import { PLAYER_MOTION as M } from "../data/presentation";
export interface Locomotion {
  x: number;
  z: number;
  heading: number;
  vertical: number;
}
export const createLocomotion = (): Locomotion => ({
  x: 0,
  z: 0,
  heading: 0,
  vertical: 0,
});
export const damp = (from: number, to: number, rate: number, dt: number) =>
  from + (to - from) * (1 - Math.exp(-rate * dt));
export const angleDifference = (from: number, to: number) =>
  Math.atan2(Math.sin(to - from), Math.cos(to - from));
export function turnToward(
  from: number,
  to: number,
  speed: number,
  dt: number,
) {
  const d = angleDifference(from, to);
  return from + Math.sign(d) * Math.min(Math.abs(d), speed * dt);
}
export function stepLocomotion(
  state: Locomotion,
  x: number,
  z: number,
  yaw: number,
  running: boolean,
  energy: number,
  dt: number,
) {
  const length = Math.hypot(x, z),
    speed =
      (running ? M.runSpeed : M.walkSpeed) * (0.72 + (0.28 * energy) / 100);
  if (length > 1) {
    x /= length;
    z /= length;
  }
  const targetX = (x * Math.cos(yaw) + z * Math.sin(yaw)) * speed,
    targetZ = (z * Math.cos(yaw) - x * Math.sin(yaw)) * speed;
  const dx = targetX - state.x,
    dz = targetZ - state.z,
    distance = Math.hypot(dx, dz);
  const reversing = state.x * targetX + state.z * targetZ < 0;
  const change =
    (length === 0 || reversing ? M.deceleration : M.acceleration) * dt;
  if (distance <= change) {
    state.x = targetX;
    state.z = targetZ;
  } else {
    state.x += (dx / distance) * change;
    state.z += (dz / distance) * change;
  }
  return state;
}
