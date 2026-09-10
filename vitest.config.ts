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
      ],
      reporter: ["text", "html"],
    },
  },
});
