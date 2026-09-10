import { describe, it, expect } from "vitest";
import { Vector3 } from "three";
import {
  createLocomotion,
  stepLocomotion,
  turnToward,
  angleDifference,
} from "../src/game/locomotion";
import { createCameraRig, updateCameraRig } from "../src/rendering/camera-rig";
import {
  PLAYER_MOTION as M,
  THIRD_PERSON_CAMERA as C,
} from "../src/data/presentation";

describe("responsive camera-relative locomotion", () => {
  it("accelerates, brakes quickly, and does not exceed the configured walking speed", () => {
    const s = createLocomotion();
    stepLocomotion(s, 0, -1, 0, false, 100, 1 / 60);
    expect(Math.abs(s.z)).toBeGreaterThan(0);
    expect(Math.abs(s.z)).toBeLessThan(M.walkSpeed);
    for (let i = 0; i < 60; i++)
      stepLocomotion(s, 0, -1, 0, false, 100, 1 / 60);
    expect(Math.hypot(s.x, s.z)).toBeCloseTo(M.walkSpeed);
    for (let i = 0; i < 12; i++) stepLocomotion(s, 0, 0, 0, false, 100, 1 / 60);
    expect(s.x).toBe(0);
    expect(s.z).toBe(0);
  });
  it("uses camera yaw, normalizes diagonals and transitions through a reversal", () => {
    const s = createLocomotion();
    for (let i = 0; i < 60; i++)
      stepLocomotion(s, 0, -1, Math.PI / 2, true, 100, 1 / 60);
    expect(s.x).toBeCloseTo(-M.runSpeed);
    expect(s.z).toBeCloseTo(0);
    stepLocomotion(s, 0, 1, Math.PI / 2, true, 100, 1 / 60);
    expect(s.x).toBeLessThan(0);
    for (let i = 0; i < 60; i++)
      stepLocomotion(s, 1, -1, 0, false, 100, 1 / 60);
    expect(Math.hypot(s.x, s.z)).toBeCloseTo(M.walkSpeed);
  });
  it("turns progressively through 90 and 180 degrees using the shortest angular path", () => {
    const step = turnToward(0, Math.PI, M.reversalRotationSpeed, 1 / 60);
    expect(step).toBeGreaterThan(0);
    expect(step).toBeLessThan(0.2);
    expect(
      Math.abs(
        angleDifference(
          3.1,
          turnToward(3.1, -3.1, M.walkRotationSpeed, 1 / 60),
        ),
      ),
    ).toBeLessThan(0.1);
  });
  it("keeps movement consistent across frame rates", () => {
    const a = createLocomotion(),
      b = createLocomotion();
    for (let i = 0; i < 60; i++) stepLocomotion(a, 1, 0, 0.3, true, 70, 1 / 60);
    for (let i = 0; i < 30; i++) stepLocomotion(b, 1, 0, 0.3, true, 70, 1 / 30);
    expect(a.x).toBeCloseTo(b.x);
    expect(a.z).toBeCloseTo(b.z);
  });
});

// Independent analytic sphere-vs-box sweep, including the camera's near-plane padding.
function boxSweep(min: Vector3, max: Vector3) {
  return (origin: Vector3, direction: Vector3, distance: number) => {
    let entry = 0,
      exit = distance;
    for (const axis of ["x", "y", "z"] as const) {
      const lo = min[axis] - C.collisionRadius,
        hi = max[axis] + C.collisionRadius;
      if (Math.abs(direction[axis]) < 1e-9) {
        if (origin[axis] < lo || origin[axis] > hi) return null;
        continue;
      }
      const a = (lo - origin[axis]) / direction[axis],
        b = (hi - origin[axis]) / direction[axis];
      entry = Math.max(entry, Math.min(a, b));
      exit = Math.min(exit, Math.max(a, b));
      if (entry > exit) return null;
    }
    return entry <= distance && exit >= 0 ? entry : null;
  };
}
describe("third-person camera rig", () => {
  it("smooths target, yaw, pitch and zoom independently without losing the shoulder target", () => {
    const r = createCameraRig(),
      target = new Vector3(0, C.lookHeight, 0),
      input = { yaw: 0, pitch: C.pitch, zoom: C.distance };
    updateCameraRig(r, target, input, 1 / 60, () => null);
    target.x = 1;
    updateCameraRig(
      r,
      target,
      { yaw: Math.PI / 2, pitch: 0.8, zoom: 8 },
      1 / 60,
      () => null,
    );
    expect(r.target.x).toBeGreaterThan(0);
    expect(r.target.x).toBeLessThan(1);
    expect(r.target.y).toBe(C.lookHeight);
    expect(r.yaw).toBeGreaterThan(0);
    expect(r.yaw).toBeLessThan(Math.PI / 2);
    expect(r.zoom).toBeLessThan(8);
  });
  it("contracts for an obstacle and recovers progressively when it disappears", () => {
    const r = createCameraRig(),
      target = new Vector3(0, C.lookHeight, 0),
      input = { yaw: 0, pitch: 0.3, zoom: 6 };
    const wall = boxSweep(new Vector3(-4, 0, 2.5), new Vector3(4, 3, 2.7));
    for (let i = 0; i < 90; i++)
      updateCameraRig(r, target, input, 1 / 60, wall);
    const contracted = r.distance;
    expect(contracted).toBeLessThan(6);
    updateCameraRig(r, target, input, 1 / 60, () => null);
    expect(r.distance).toBeGreaterThan(contracted);
    expect(r.distance).toBeLessThan(6);
  });
  it("keeps a padded camera outside a close wall while retaining a usable view of the avatar", () => {
    const r = createCameraRig(),
      target = new Vector3(0, C.lookHeight, 2.57),
      input = { yaw: 0, pitch: 0.2, zoom: 6 };
    const wall = boxSweep(new Vector3(-4, 0, 2.9), new Vector3(4, 3, 3.1));
    for (let i = 0; i < 150; i++)
      updateCameraRig(r, target, input, 1 / 60, wall);
    const direction = r.position.clone().sub(r.target).normalize();
    expect(
      wall(r.target, direction, r.position.distanceTo(r.target)),
    ).toBeNull();
    expect(r.position.distanceTo(r.target)).toBeGreaterThan(1.2);
  });
});
