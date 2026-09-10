import { Vector3 } from "three";
import { THIRD_PERSON_CAMERA as C } from "../data/presentation";
import { angleDifference, damp } from "../game/locomotion";
export type CameraSweep = (
  origin: Vector3,
  direction: Vector3,
  distance: number,
) => number | null;
export function createCameraRig() {
  return {
    target: new Vector3(),
    position: new Vector3(),
    desired: new Vector3(),
    direction: new Vector3(),
    scratch: new Vector3(),
    yaw: 0,
    pitch: C.pitch as number,
    zoom: C.distance as number,
    distance: C.distance as number,
    confined: 0,
    initialized: false,
    collided: false,
  };
}
export type CameraRig = ReturnType<typeof createCameraRig>;
function direction(rig: CameraRig, pitch: number) {
  rig.direction.set(
    Math.sin(rig.yaw) * Math.cos(pitch),
    Math.sin(pitch),
    Math.cos(rig.yaw) * Math.cos(pitch),
  );
}
export function updateCameraRig(
  r: CameraRig,
  lookTarget: Vector3,
  input: { yaw: number; pitch: number; zoom: number },
  seconds: number,
  sweep: CameraSweep,
  dialogue = false,
) {
  const dt = Math.min(seconds, 0.05);
  if (!r.initialized) {
    r.target.copy(lookTarget);
    r.yaw = input.yaw;
    r.pitch = input.pitch;
    r.zoom = input.zoom;
  }
  r.yaw +=
    angleDifference(r.yaw, input.yaw) *
    (1 - Math.exp(-C.rotationSmoothing * dt));
  r.pitch = damp(
    r.pitch,
    Math.max(C.minPitch, Math.min(C.maxPitch, input.pitch)),
    C.rotationSmoothing,
    dt,
  );
  r.zoom = damp(
    r.zoom,
    Math.max(C.minDistance, Math.min(C.maxDistance, input.zoom)) *
      (dialogue ? C.dialogueDistance : 1),
    C.distanceRecovery,
    dt,
  );
  r.target.lerp(lookTarget, 1 - Math.exp(-C.targetSmoothing * dt));
  r.scratch.copy(r.target).sub(lookTarget);
  const lag = r.scratch.length();
  if (lag > 0.001) {
    r.scratch.divideScalar(lag);
    const hit = sweep(lookTarget, r.scratch, lag);
    if (hit !== null)
      r.target
        .copy(lookTarget)
        .addScaledVector(r.scratch, Math.max(0, hit - C.collisionMargin));
  }
  direction(r, r.pitch);
  const baseHit = sweep(r.target, r.direction, r.zoom);
  let lift = 0;
  if (baseHit !== null && baseHit < C.closeDistance) {
    for (const pitch of C.confinedAngles) {
      const elevated = Math.max(r.pitch, pitch);
      direction(r, elevated);
      const clearance = sweep(r.target, r.direction, r.zoom);
      lift = elevated - r.pitch;
      if (clearance === null || clearance >= C.closeDistance) break;
    }
  }
  r.confined = damp(r.confined, lift, C.confinedBlend, dt);
  direction(r, r.pitch + r.confined);
  const hit = sweep(r.target, r.direction, r.zoom);
  const safe = hit === null ? r.zoom : Math.max(0.05, hit - C.collisionMargin);
  // Contraction follows the continuously swept surface; recovery is deliberately slower.
  r.distance = Math.min(safe, damp(r.distance, safe, C.distanceRecovery, dt));
  r.desired.copy(r.target).addScaledVector(r.direction, r.distance);
  if (!r.initialized) r.position.copy(r.desired);
  else r.position.lerp(r.desired, 1 - Math.exp(-C.positionSmoothing * dt));
  // Smoothing around a corner must never put the final camera behind that corner.
  r.scratch.copy(r.position).sub(r.target);
  const actual = r.scratch.length();
  if (actual > 0.001) {
    r.scratch.divideScalar(actual);
    const finalHit = sweep(r.target, r.scratch, actual);
    if (finalHit !== null)
      r.position
        .copy(r.target)
        .addScaledVector(
          r.scratch,
          Math.max(0.02, finalHit - C.collisionMargin),
        );
  }
  r.collided = hit !== null || baseHit !== null;
  r.initialized = true;
  return r;
}
