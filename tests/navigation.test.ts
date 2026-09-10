import { describe, it, expect } from "vitest";
import { canSee, findPath, lineOfSight, walkable } from "../src/ai/navigation";
import { objects } from "../src/data/world";
import type { Vec2 } from "../src/game/types";

describe("clearance-aware navigation", () => {
  it("routes around desks without walking through furniture", () => {
    const start: Vec2 = [-6, -5],
      goal: Vec2 = [-6, 0];
    expect(lineOfSight(start, goal, "office")).toBe(false);
    const path = findPath(start, goal, "office");
    expect(path.length).toBeGreaterThan(1);
    for (const p of path) expect(walkable(p, "office")).toBe(true);
    expect(path.at(-1)).toEqual(goal);
  });
  it("all important interactable destinations are reachable from the entrance", () => {
    for (const object of objects.filter((o) => o.location === "office")) {
      const path = findPath([0, 7.2], object.position, "office");
      expect(path.length, object.id).toBeGreaterThan(0);
    }
  });
  it("does not see through meeting room walls or out of field of view", () => {
    expect(canSee([8, 0], Math.PI, [8, -4], "office")).toBe(false);
    expect(canSee([0, 0], 0, [0, -4], "office")).toBe(false);
    expect(canSee([0, 0], 0, [0, 4], "office")).toBe(true);
    expect(canSee([0, 0], 0, [0, 8], "office")).toBe(false);
  });
  it("rejects blocked and off-map goals", () => {
    expect(findPath([0, 0], [-6, -3], "office")).toEqual([]);
    expect(findPath([0, 0], [20, 20], "office")).toEqual([]);
  });
});
