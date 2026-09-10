import { describe, it, expect } from "vitest";
import {
  HAIR_STYLES,
  importantAppearances,
  officeAppearances,
  appearanceSignature,
  generateAppearance,
  BODY_SCALES,
} from "../src/data/appearances";
import { npcs } from "../src/data/content";
import { OFFICE_PRESENTATION } from "../src/data/presentation";
describe("modular office cast", () => {
  it("supports all eleven requested hairstyles and a moderate 12-person population", () => {
    expect(HAIR_STYLES).toHaveLength(11);
    expect(npcs.length).toBe(OFFICE_PRESENTATION.npcCount);
    expect(npcs.length).toBeGreaterThanOrEqual(8);
    expect(npcs.length).toBeLessThanOrEqual(15);
  });
  it("keeps important silhouettes fixed while procedural staff vary reproducibly", () => {
    const ids = npcs.map((n) => n.id),
      a = officeAppearances(ids, 1),
      b = officeAppearances(ids, 25);
    for (const id of Object.keys(importantAppearances))
      expect(a[id]).toEqual(b[id]);
    expect(generateAppearance(3, "cleaner")).toEqual(
      generateAppearance(3, "cleaner"),
    );
    expect(a.cleaner).not.toEqual(b.cleaner);
    expect(new Set(Object.values(a).map(appearanceSignature)).size).toBe(
      ids.length,
    );
  });
  it("has visibly varied presentation, skin, outfit and silhouette in the default scene", () => {
    const cast = Object.values(
      officeAppearances(
        npcs.map((n) => n.id),
        8,
      ),
    );
    expect(new Set(cast.map((a) => a.presentation)).size).toBe(3);
    expect(new Set(cast.map((a) => a.skinTone)).size).toBeGreaterThanOrEqual(5);
    expect(new Set(cast.map((a) => a.hair)).size).toBeGreaterThanOrEqual(7);
    expect(new Set(cast.map((a) => a.outfit)).size).toBeGreaterThanOrEqual(3);
    expect(cast.some((a) => a.accessories.length === 0)).toBe(true);
    for (const scale of Object.values(BODY_SCALES))
      for (const axis of scale) {
        expect(axis).toBeGreaterThanOrEqual(0.85);
        expect(axis).toBeLessThanOrEqual(1.2);
      }
  });
  it("gives the manager and both eccentrics distinct visual signatures", () => {
    const manager = importantAppearances.manager,
      rockstar = importantAppearances["rockstar-developer"],
      visionary = importantAppearances["corporate-visionary"];
    expect(manager.body).toBe("broad");
    expect(rockstar.accessories).toContain("headphones");
    expect(visionary.accessories).toContain("tablet");
    expect(
      new Set([manager, rockstar, visionary].map(appearanceSignature)).size,
    ).toBe(3);
  });
});
