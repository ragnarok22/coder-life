import { describe, it, expect } from "vitest";
import { bounds, objects, obstacles } from "../src/data/world";
import {
  officeAreas,
  officeNpcHomes,
  officePatrol,
  OFFICE_ENTRANCE,
} from "../src/data/office-layout";
import { findPath, walkable, nearestWalkable } from "../src/ai/navigation";
describe("expanded office", () => {
  it("increases floor area by 30–50% and keeps every room and interaction reachable", () => {
    const ratio = (bounds.office.w * bounds.office.d) / (24 * 18);
    expect(ratio).toBeGreaterThanOrEqual(1.3);
    expect(ratio).toBeLessThanOrEqual(1.5);
    const targets = [
      ...officeAreas.map((a) => ({ id: a.id, position: a.arrival })),
      ...objects.filter((o) => o.location === "office"),
      ...Object.entries(officeNpcHomes).map(([id, h]) => ({
        id,
        position: h.position,
      })),
      ...officePatrol.map((position, i) => ({ id: `patrol-${i}`, position })),
    ];
    for (const target of targets) {
      expect(walkable(target.position, "office"), target.id).toBe(true);
      expect(
        findPath(OFFICE_ENTRANCE, target.position, "office").length,
        target.id,
      ).toBeGreaterThan(0);
    }
  });
  it("has a route from the developers to coffee even with the central approach blocked", () => {
    const original = findPath([-6, 3.4], [9.5, 3.4], "office");
    expect(original.length).toBeGreaterThan(0);
    obstacles.office.push({ x: 0, z: 2, w: 1, d: 5, h: 3 });
    try {
      const alternative = findPath([-6, 3.4], [9.5, 3.4], "office");
      expect(alternative.length).toBeGreaterThan(0);
      expect(alternative).not.toEqual(original);
    } finally {
      obstacles.office.pop();
    }
  });
  it("recovers old saves that land inside newly added furniture", () => {
    const moved = nearestWalkable([-4, -8.3], "office");
    expect(walkable(moved, "office")).toBe(true);
    expect(moved).not.toEqual([-4, -8.3]);
  });
});
