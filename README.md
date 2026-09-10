# Coder-Life

[![License: MIT](https://img.shields.io/badge/License-MIT-426b50)](LICENSE)
[![Contributions welcome](https://img.shields.io/badge/Contributions-welcome-ce784c)](CONTRIBUTING.md)
[![Contributor Covenant 2.1](https://img.shields.io/badge/Contributor_Covenant-2.1-426b50)](CODE_OF_CONDUCT.md)
[![React 19](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript 6](https://img.shields.io/badge/TypeScript-6-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

**Write code. Drink coffee. Survive “a quick question.”**

A free, open-source, low-poly, third-person browser game about a developer's first Monday. Everything runs on the device: physics, NPC navigation, decisions, time, audio and saves. The production build is a set of static files.

Explore the source on [GitHub](https://github.com/ragnarok22/coder-life). Coder-Life is released under the [MIT License](LICENSE).

## Community

Everyone is welcome to help improve the game, whether through bug reports, gameplay feedback, documentation, code, or art.

- **[Contributing guide](CONTRIBUTING.md):** Set up your environment, follow the development conventions, run the relevant checks, and submit a pull request.
- **[Code of Conduct](CODE_OF_CONDUCT.md):** Read our community standards and learn how to report concerns privately. We follow Contributor Covenant 2.1.
- **[Issues](https://github.com/ragnarok22/coder-life/issues):** Report a bug, suggest an improvement, or find something to work on.

## Milestone: Day 1 Gameplay Polish

The existing house, commute and office now support replayable Mondays: 33 NPC encounters (including chained encounters), 9 coding incidents, 16 random-event candidates plus 6 chain-only events, 19 achievements and 10 day endings. Manager, HR, Accountant, Sales, Coworker, Intern, Senior Developer and Receptionist have individual personalities; Facilities remains part of the office too.

- **Invest in people:** teach Excel to reduce repeat requests, mentor Jamie to receive help later, or befriend Casey for five minutes of advance warning about the manager. Relationships are shown as trust bands in conversations and the day journal.
- **Protect your time:** NPCs use sight and remembered locations, visit known landmarks and give up after a personality-dependent timeout. Hide in the bathroom, kitchen or an unoccupied meeting room for seven game minutes. Moving behind walls or changing aisles also works. Hiding pauses your work, consumes time, has a cooldown and can be ended early with E.
- **Choose how to code:** handle bugs, tests, conflicts, dependencies, reviews, production alerts, ambiguity, legacy code and broken builds. Quick fixes trade task progress for debt and future risk; proper fixes cost time and improve quality. Senior advice can help or become a long architecture conversation.
- **Feel the consequences:** scope adds real tasks and preserves earned progress; Sales can bring an earlier delivery target. Missing that target affects reputation, but the day always continues to 17:00. Production and build trouble become more likely with high debt. Completing tasks improves reputation and reduces stress.
- **Discover a different Monday:** each new run gets a stored random seed. Schedules have small per-NPC variations, meeting durations vary, event pools depend on the clock, trust and prior choices, and positive events provide relief. The last hour adds visible deadline pressure without multiplying every event rate.
- **Keep a record:** the pause menu and main menu open the journal, with relationships, event history, achievements, discovered endings and best score. The results screen accounts for every game minute across eleven categories and highlights the largest time sink.

Five decision-dependent chains are included, with additional variations:

| First decision             | Possible consequence                                        | A way to stop it                                     |
| -------------------------- | ----------------------------------------------------------- | ---------------------------------------------------- |
| Ignore the printer         | Attempted repair → breakdown → manager intervention         | Repair it or book actual support                     |
| Accept Sales' promise      | Scope approved → extra task → earlier delivery → regression | Negotiate scope or get client confirmation           |
| Ignore the internet outage | Sales panic → emergency meeting                             | Fix the router; an outage can also cancel a meeting  |
| Postpone HR's survey       | Reminder → mandatory time-management training               | Complete the survey or request the recording         |
| Mentor the intern twice    | Trust grows → Jamie fixes a small task                      | This is a beneficial chain; invest time to unlock it |

The director allows one dialogue and one NPC search at a time, limits pending consequences to four, deduplicates follow-ups, respects cooldowns and grace periods, and expires incompatible or late events. NPC courtesy steering and non-blocking sensor colliders prevent characters from trapping the player in narrow passages.

## Run

Use **Node.js 22.18+ or 24+** and **pnpm**. For the full fork-and-clone workflow, see [Set up your environment](CONTRIBUTING.md#set-up-your-environment).

```sh
pnpm install
pnpm dev
```

Open the local URL printed by Vite. Node is only used for development/build tooling; gameplay has no server or API.

```sh
pnpm build        # Type-check and generate dist/
pnpm preview      # Inspect the static production build locally
```

Deploy the contents of `dist/` to any static host. Relative asset paths support subdirectories. All fonts, JavaScript and Rapier WASM are bundled locally. There are no runtime CDN assets, accounts or remote databases.

### Search engines and link previews

Set `SITE_URL` to the public homepage URL before building. Bare domains such as `coder-life.ragnarok22.dev` default to HTTPS; explicit `http://` or `https://` URLs keep their protocol. Include the path if the game is hosted in a subdirectory. You can copy `.env.example` to `.env.production.local`, or set the environment variable in your hosting provider's build settings.

```sh
SITE_URL=https://your-domain.com/coder-life/ pnpm build
```

Use your actual deployment URL in place of the example. The build generates a canonical link, Open Graph and Twitter metadata, VideoGame JSON-LD, `robots.txt`, and a single-page `sitemap.xml`. The share image is `public/social-preview.png` (1200 × 630); its editable source is `public/social-preview.svg`. Metadata copy lives in `src/data/site.ts`.

`pnpm build` also prerenders the real menu into `dist/index.html`, so its content is readable without JavaScript. React replaces this static menu with the interactive game on startup; the 3D scene stays lazy-loaded. JavaScript and WebGL are required to play. The build script uses Node's native TypeScript support (Node 22.18+ or 24+).

Without `SITE_URL`, local builds still work but omit canonical URLs, absolute social image URLs, and the sitemap. A build warning reminds you to configure it for deployment. For subdirectory hosting, merge the generated sitemap directive into the host's **origin-root** `/robots.txt`; crawlers only discover robots rules there. After deployment, submit the sitemap URL to Google Search Console and Bing Webmaster Tools.

## Play Day 1

1. Start a **New game**, then press **E** to wake up at 08:00.
2. Walk through the house. Breakfast is optional. The green dot on the map marks the exit.
3. Walk to the office; a neighbor needs help on the way.
4. Survive HR and the printer request. Accepting costs time; refusing can affect stress, relationships and future requests.
5. Find the gold-topped desk with the **YOUR DESK** floor marker. Press **E** to work.
6. After 30 minutes of actual work, the manager comes looking for you. Watch for the orange `!` above incoming NPCs. Moving behind walls breaks line of sight.
7. Use the coffee machine, lunch, water or a quiet break to manage your energy and stress.
8. Reach **100% work** before **17:00**, then get your end-of-day score. Time continues after completing your tasks until the end of the workday.

The clock advances at **half a game minute per real second**: eighteen real minutes with no direct time costs, usually **12–18 minutes** including time-consuming choices and reading decisions. Decisions, pause menus and hidden tabs pause the clock; hiding does not. `src/data/balance.ts` centralizes time scale, work speed, resource rates, difficulty multipliers, pacing bands, search persistence, coffee and hiding. Content-specific effect values remain in their data definitions.

### Controls

| Input             | Action                             |
| ----------------- | ---------------------------------- |
| WASD / arrow keys | Camera-relative movement           |
| Shift             | Move faster (energy affects speed) |
| Mouse drag        | Rotate third-person camera         |
| Scroll            | Limited camera zoom                |
| E                 | Interact, get up or leave the desk |
| Escape            | Pause / resume                     |

Touch devices have on-screen movement and interaction buttons. Keyboard/mouse is the primary experience. Input bindings are abstracted in `src/game/input.ts`.

## Saves and settings

- **IndexedDB** database `coder-life`, store `saves`: one versioned save with current day, position, progress, clock, resources, active dialogue, event flags/cooldowns, decisions, relationships, statistics and achievements.
- The **version-2** envelope also stores the RNG state, pending chains, active search timeout, hiding, debt, quality, reputation and career profile. Version-1 saves migrate on load. Invalid metrics or an inconsistent time ledger are rejected without automatically overwriting the old save.
- Autosaves every 15 seconds, after important decisions and transitions, on pause and at day end. The pause menu also has **Save game**.
- **Continue** restores the last saved day, or its results if completed. Working is stopped on load so the player can reorient themselves.
- **Restart day**, **New game**, and **Settings → Reset progress** provide explicit reset controls.
- New/restarted Mondays reset that day's relationships and resources, while achievements, discovered endings, best score and the last twelve completed-run summaries persist. Historical summaries include statistics and relationships. Reset progress explicitly clears the whole local profile.
- **localStorage** contains only small preferences: audio levels, graphics and mouse sensitivity.
- Browser storage can fail (for example, quotas or privacy settings); failures are shown rather than silently claiming success. Saves are per origin and browser profile.

## Architecture

All source filenames use **kebab-case**. Use an intermediate filename for case-only renames on macOS.

```text
src/
  ai/navigation.ts        Clearance-aware A*, visibility and collision-aware paths
  ai/npc-brain.ts         Seeded schedules, short-term memory, pursuit, courtesy steering
  data/content.ts         Day, career, NPC schedules, interruptions, random events
  data/balance.ts         Normal difficulty, time scale, resources and pacing bands
  data/personalities.ts   Per-role behavior and schedules
  data/polish-content.ts  Additional NPC encounters and positive/negative event chains
  data/coding-decisions.ts  Interactive coding incidents
  data/achievements.ts   Data-driven unlock conditions
  data/endings.ts        Ordered day-evaluation rules
  data/zones.ts          Privacy and occupancy for existing office areas
  data/world.ts           Shared world bounds, obstacles and interactable objects
  entities/               Rapier player controller, NPC brains, character/animation adapter
  events/                 Single director, generic choices, outcomes and delayed consequences
  game/                   Pure rules, Zustand orchestration, input, audio, persistence
  rendering/              3D worlds, menu diorama, reusable props and lighting
  ui/                     Menus, HUD, map, work panel, dialogue and results
```

### Adding content

- **Interruption:** add an `Interruption` in `src/data/polish-content.ts` (aggregated by `content.ts`): NPC, conditions, probability, cooldown, short dialogue and choices. Choices use generic effects for time, resources, relationships, productivity, quality, debt, reputation, tasks, flags and future interruption likelihood. `duration` supplies random bounds; `outcomes` supplies conditional/probabilistic variants; `followUps` schedules another known encounter/event. `npc` on a choice overrides the target of relationship effects.
- **NPC:** add a definition with appearance, desk, spawn and goal-based schedule. Navigation is calculated dynamically from the obstacle layout.
- **Object:** add a `WorldObject` in `src/data/world.ts`, its visual geometry in the world renderer, and an obstacle when needed. Existing object kinds use generic effects/cooldowns.
- **Event:** add a data entry with time/progress conditions, probability, cooldown and effects.
- **Coding incident:** add a definition in `coding-decisions.ts`. `taskProgress` is a percentage of one task; `productivity` affects overall daily progress. Both use the same choice engine.
- **Ending/achievement:** add a data rule in `endings.ts` or `achievements.ts`. Endings use the first matching rule; place specific results before general fallbacks. Achievement IDs are stable local-save identifiers.
- **Further days:** the day and career definitions include roles and difficulty metadata. Only Day 1 is playable in this vertical slice.

### Navigation and physics

Rapier's kinematic character controller handles gravity, sliding, collisions, ground snapping and steps up to 0.3 units. Camera obstruction uses physics raycasts. NPCs use A* on a 0.65-unit grid with radius clearance, diagonal corner-cut prevention and local separation. Rendering and navigation share obstacle definitions. NPCs know their workplace landmarks, but only learn the player's current position through distance, field of view and line-of-sight detection.

### Models and audio

The current art uses local procedural placeholder geometry. `src/entities/character.tsx` accepts a local `modelUrl` GLB and maps `idle`, `walk`, `run`, `sit`, `typing` and `talk` clips through Drei. No finished external character assets are required. For replacement assets, prefer low-poly, Meshopt-compressed GLBs with embedded textures; keep all decoder/assets local and verify clip names.

`src/game/audio.ts` provides a Web Audio mixer and synthesized placeholder cues for steps, typing, notifications, doors, coffee, dialogue and printers, plus a quiet ambient chord. Audio is unlocked after user interaction. Real audio samples can replace cues behind the same interface.

### Performance

The 3D views are lazy-loaded. Floor tiles are instanced; transient player/NPC state is updated outside React. Game rules/HUD update four times per second; the map updates independently. Three graphic presets control resolution and shadows. There is one shadow-casting light per scene. Rapier's bundled WASM is the largest lazy asset. The 60 FPS target depends on hardware and graphics settings; use Low for constrained devices.

Three.js core and WebGL rendering use separate cached chunks. The GLB loader and animation adapter load only when a character has a `modelUrl`. Vite serves Rapier's WASM as a hashed local `.wasm` asset when gameplay starts, rather than embedding it as base64 in JavaScript. `src/rendering/rapier.ts` adapts the native WASM package to React Three Rapier's `init()` API; keep the pinned `@dimforge/rapier3d` version aligned with `@react-three/rapier`'s compat dependency when upgrading. Production tests enforce a 500 kB minified JavaScript chunk budget and verify that the menu does not request physics or GLB assets.

## Checks

```sh
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm test:coverage
pnpm test:e2e
pnpm test:seo
```

Unit/integration tests cover day rules, decisions, resource bounds, end-of-day scoring, A* reachability, visibility, IndexedDB and the Day 1 flow. Playwright uses an isolated Chrome instance to drive the real keyboard/controller from home to office, verify working and manager interception, save/reload, and check results. It also captures desktop/mobile screenshots. The remainder of the day is accelerated in the test harness by calling the same game rules, not by modifying production pacing.

Playwright expects Google Chrome (`channel: 'chrome'`). Install it, or change `playwright.config.ts` to bundled Chromium and run `pnpm exec playwright install chromium`.

### Development tools

Press **F2** in a running development game to open the playground. It changes time, stress, energy, debt, quality, reputation, NPC relationships, teleports to existing interactables, triggers encounters/world events, completes a task or finishes the day. Time edits reconcile the time ledger so developer saves remain valid. Changes affect the current local save; use a fresh run when testing. The module is behind `import.meta.env.DEV` and is excluded from production bundles.

### Replay and balance verification

```sh
pnpm test tests/replay-simulation.test.ts --reporter=verbose --disableConsoleIntercept
pnpm test tests/ending-routes.test.ts
pnpm test:e2e e2e/gameplay-polish.spec.ts
```

The seeded simulation suite completes 24 normal runs, 48 runs across six strategies, and a repeated-seed comparison. It checks variation, final time, resource bounds, queue capacity, complete time accounting and save validity. Ten targeted routes reach every ending using real gameplay effects and costs. Browser tests exercise the actual character controller, manager approach, coding decisions, bathroom evasion, developer tools, achievements, journal, save/reload and results. Simulated playtime estimates include six seconds per decision for reading; actual duration depends on the player.

`pnpm test:seo` builds and serves production output on port 4187 with an example canonical URL. It checks the JavaScript-disabled landing page, metadata, sitemap, social image, and interactive desktop/mobile startup. Run `pnpm build` with your real `SITE_URL` afterward before deploying.
