# Repository instructions

## Commands and verification

- Use pnpm. The build runs TypeScript directly via `node scripts/build.ts`; use Node 22.18+ or 24+.
- `pnpm build` runs `tsc -b`, Vite, then menu prerendering. Calling Vite's build directly skips prerendering.
- Checks: `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test:coverage`. Typechecking covers `src/`, `scripts/`, and `vite.config.ts`, but not tests or Playwright/Vitest configs.
- Focused unit test: `pnpm test tests/store.test.ts -t "pauses the clock"`. Vitest discovers only `tests/**/*.test.ts`; coverage is limited to rules, store, persistence, navigation, and event-director.
- Unit tests run in Node. Storage tests import `fake-indexeddb/auto`; store tests mock audio and reset both Zustand state and `runtime.player` (see `tests/store.test.ts`).
- Both Playwright suites require installed Google Chrome (`channel: "chrome"`). `pnpm test:e2e` starts/reuses Vite on port 5173 and excludes SEO tests. Focus a test with `pnpm test:e2e e2e/game.spec.ts -g "mobile menu"`.
- Gameplay E2E imports the active store through Vite's `/src/game/store.ts` resource URL to accelerate the remaining day; it depends on the dev server. Keep acceleration in the test rather than changing production pacing.
- `pnpm test:seo` builds production output and serves it on port 4187, which must be free. It overwrites `dist/` using `SITE_URL=https://example.com/coder-life/`; rebuild with the real URL before deployment.

## Build and browser boundaries

- Gameplay is entirely client-side; deployment consists of static `dist/` files. Keep runtime assets local, including fonts and Rapier WASM.
- `src/prerender.ts` renders the real `MainMenu` in Node. Keep its render/import path safe without browser globals and retain `<!--app-html-->` in `index.html`. `src/main.tsx` uses `createRoot` to replace the static markup, not hydrate it.
- Preserve lazy loading of `GameScene` in `src/app.tsx` and `MenuScene` in `src/ui/main-menu.tsx`.
- SEO copy lives in `src/data/site.ts`; `scripts/seo.ts` generates metadata and crawl files. Configure the full homepage URL (including any subdirectory) via `SITE_URL` or `.env.production.local`; Vite explicitly loads the `SITE_` prefix. Missing `SITE_URL` omits canonical/social URLs and the sitemap.
- Vite uses `base: "./"` for subdirectory hosting. For deployment there, merge the generated sitemap directive into the host's origin-root `/robots.txt` (see README).

## Simulation conventions

- `src/game/rules.ts` owns pure game transitions; `store.ts` orchestrates events, UI state, audio, and saves. High-frequency player/NPC state belongs in `src/game/runtime.ts`, outside React and persistent game state. `use-game-loop.ts` ticks rules every 250 ms; physics runs at 1/60 second.
- World/save `Vec2` coordinates are `[x, z]`, not `[x, y]`. `src/data/world.ts` supplies shared navigation obstacles and physics geometry; object changes may also need visuals in `src/rendering/world.tsx`.
- Content, NPC schedules, interruptions, and pacing belong in `src/data/content.ts`; eligibility and weighted selection live in `src/events/event-director.ts`. Only Day 1 is playable.
- Saves use IndexedDB `coder-life` / `saves` / `current`, with a version-1 envelope validated in `src/game/persistence.ts`. Preferences use localStorage. Continue deliberately clears `working`; location/revision changes remount physics.
- Source filenames use kebab-case. Use an intermediate filename for case-only renames on macOS.
