import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: [
        "src/game/rules.ts",
        "src/game/store.ts",
        "src/game/persistence.ts",
        "src/ai/navigation.ts",
        "src/events/event-director.ts",
        "src/events/encounter-engine.ts",
        "src/ai/npc-brain.ts",
        "src/game/save-migration.ts",
        "src/game/profile.ts",
        "src/game/locomotion.ts",
        "src/game/player-presentation.ts",
        "src/data/pose-anchors.ts",
        "src/rendering/camera-rig.ts",
        "src/data/appearances.ts",
      ],
      reporter: ["text", "html"],
    },
  },
});
