import { bounds, obstacles } from "../data/world";
import type { Location, Vec2 } from "../game/types";
import { BALANCE } from "../data/balance";

const CELL = 0.65;
export function walkable(p: Vec2, location: Location, radius = 0.35) {
  const { w, d } = bounds[location];
  if (Math.abs(p[0]) > w / 2 - radius || Math.abs(p[1]) > d / 2 - radius)
    return false;
  return !obstacles[location].some(
    (o) =>
      Math.abs(p[0] - o.x) < o.w / 2 + radius &&
      Math.abs(p[1] - o.z) < o.d / 2 + radius,
  );
}
export function lineOfSight(
  a: Vec2,
  b: Vec2,
  location: Location,
  radius = 0.05,
) {
  const steps = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.2);
  for (let i = 1; i <= steps; i++)
    if (
      !walkable(
        [
          a[0] + ((b[0] - a[0]) * i) / steps,
          a[1] + ((b[1] - a[1]) * i) / steps,
        ],
        location,
        radius,
      )
    )
      return false;
  return true;
}
export function canSee(a: Vec2, heading: number, b: Vec2, location: Location) {
  const dx = b[0] - a[0],
    dz = b[1] - a[1],
    distance = Math.hypot(dx, dz);
  if (distance > BALANCE.sightDistance) return false;
  const facing =
    distance < 1.8 ||
    (Math.sin(heading) * dx + Math.cos(heading) * dz) / distance > 0.25;
  return facing && lineOfSight(a, b, location);
}
// A* over a clearance-aware grid, generated from the same obstacles as Rapier.
// Goals are dynamic; paths are never hard-coded and diagonal corner cutting is disallowed.
export function findPath(start: Vec2, goal: Vec2, location: Location): Vec2[] {
  if (!walkable(goal, location)) return [];
  if (lineOfSight(start, goal, location, 0.36)) return [goal];
  const key = (x: number, z: number) => `${x},${z}`;
  const sx = Math.round(start[0] / CELL),
    sz = Math.round(start[1] / CELL);
  const gx = Math.round(goal[0] / CELL),
    gz = Math.round(goal[1] / CELL);
  type Node = { x: number; z: number; g: number; f: number; parent?: Node };
  const open: Node[] = [{ x: sx, z: sz, g: 0, f: 0 }],
    seen = new Map<string, number>();
  let limit = 2500;
  while (open.length && limit-- > 0) {
    open.sort((a, b) => a.f - b.f);
    const current = open.shift()!;
    if (
      Math.hypot(current.x - gx, current.z - gz) < 1.5 &&
      lineOfSight([current.x * CELL, current.z * CELL], goal, location, 0.36)
    ) {
      const path: Vec2[] = [goal];
      let node: Node | undefined = current;
      while (node?.parent) {
        path.unshift([node.x * CELL, node.z * CELL]);
        node = node.parent;
      }
      return path;
    }
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [-1, 1],
      [1, -1],
      [-1, -1],
    ]) {
      const x = current.x + dx,
        z = current.z + dz;
      if (!walkable([x * CELL, z * CELL], location)) continue;
      if (
        dx &&
        dz &&
        (!walkable([(current.x + dx) * CELL, current.z * CELL], location) ||
          !walkable([current.x * CELL, (current.z + dz) * CELL], location))
      )
        continue;
      const g = current.g + Math.hypot(dx, dz),
        k = key(x, z);
      if ((seen.get(k) ?? Infinity) <= g) continue;
      seen.set(k, g);
      open.push({
        x,
        z,
        g,
        f: g + Math.hypot(gx - x, gz - z),
        parent: current,
      });
    }
  }
  return [];
}
